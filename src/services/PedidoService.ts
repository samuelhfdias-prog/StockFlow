import { Prisma, type PrismaClient } from '../generated/prisma/client';
import { prisma } from '../database/prisma';
import { AppError } from '../errors/AppError';
import { PedidoRepository } from '../repositories/PedidoRepository';
import type { CriarPedidoInput } from '../schemas/pedido.schema';

type AlertaReposicao = {
  sku: string;
  nome: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  nomeFantasia: string;
  prazoEntrega: number;
};

export class PedidoService {
  constructor(
    private readonly prismaClient: PrismaClient = prisma,
    private readonly pedidoRepository: Pick<PedidoRepository, 'findByIdWithClienteAndItens'> = new PedidoRepository(),
  ) {}

  async criarPedido(dados: CriarPedidoInput) {
    return this.prismaClient.$transaction(async (tx) => {
      const cliente = await tx.cliente.findUnique({
        where: { id: dados.clienteId },
      });

      if (!cliente) {
        throw new AppError('Cliente não encontrado.', 404);
      }

      if (cliente.ativo !== true) {
        throw new AppError('Cliente inativo para operações comerciais', 403);
      }

      const quantidadesPorProduto = new Map<number, number>();

      for (const item of dados.itens) {
        const quantidadeAtual = quantidadesPorProduto.get(item.produtoId) ?? 0;
        const quantidadeTotal = quantidadeAtual + item.quantidade;

        if (!Number.isSafeInteger(quantidadeTotal) || quantidadeTotal > 2_147_483_647) {
          throw new AppError('A quantidade total de um produto excede o limite permitido.', 400);
        }

        quantidadesPorProduto.set(item.produtoId, quantidadeTotal);
      }

      const produtos = await tx.produto.findMany({
        where: { id: { in: [...quantidadesPorProduto.keys()] } },
        include: {
          fornecedor: {
            select: {
              nomeFantasia: true,
              prazoEntrega: true,
            },
          },
        },
      });
      const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));
      const buscarProduto = (produtoId: number) => {
        const produto = produtosPorId.get(produtoId);

        if (!produto) {
          throw new AppError(`Produto de ID ${produtoId} não encontrado.`, 404);
        }

        return produto;
      };

      for (const produtoId of quantidadesPorProduto.keys()) {
        buscarProduto(produtoId);
      }

      for (const [produtoId, quantidade] of quantidadesPorProduto) {
        const produto = buscarProduto(produtoId);

        if (produto.estoqueAtual < quantidade) {
          throw new AppError(`SKU ${produto.sku} não possui estoque suficiente.`, 422);
        }
      }

      const totalUnidades = dados.itens.reduce((total, item) => total + BigInt(item.quantidade), 0n);
      const valorBruto = dados.itens.reduce((total, item) => {
        const produto = buscarProduto(item.produtoId);
        return total.add(new Prisma.Decimal(produto.precoVenda).mul(item.quantidade));
      }, new Prisma.Decimal(0));

      const taxaDesconto = totalUnidades >= 30n || valorBruto.greaterThan(7000)
        ? new Prisma.Decimal('0.10')
        : totalUnidades >= 10n || valorBruto.greaterThan(2500)
          ? new Prisma.Decimal('0.05')
          : new Prisma.Decimal(0);
      const valorDesconto = valorBruto
        .mul(taxaDesconto)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      const valorLiquido = valorBruto.minus(valorDesconto);

      if (valorLiquido.greaterThan(cliente.limiteCredito)) {
        throw new AppError('Crédito Insuficiente para aprovar o pedido', 422);
      }

      for (const [produtoId, quantidade] of [...quantidadesPorProduto].sort(([idA], [idB]) => idA - idB)) {
        const produto = buscarProduto(produtoId);
        const baixa = await tx.produto.updateMany({
          where: {
            id: produtoId,
            estoqueAtual: { gte: quantidade },
          },
          data: { estoqueAtual: { decrement: quantidade } },
        });

        if (baixa.count !== 1) {
          throw new AppError(`SKU ${produto.sku} não possui estoque suficiente.`, 422);
        }
      }

      const debitoCredito = await tx.cliente.updateMany({
        where: {
          id: cliente.id,
          ativo: true,
          limiteCredito: { gte: valorLiquido },
        },
        data: { limiteCredito: { decrement: valorLiquido } },
      });

      if (debitoCredito.count !== 1) {
        throw new AppError('Crédito Insuficiente para aprovar o pedido', 422);
      }

      const pedido = await tx.pedido.create({
        data: {
          clienteId: cliente.id,
          status: 'APROVADO',
          valorBruto,
          valorDesconto,
          valorLiquido,
          itensPedido: {
            create: dados.itens.map((item) => {
              const produto = buscarProduto(item.produtoId);
              return {
                produtoId: produto.id,
                quantidade: item.quantidade,
                precoUnitario: produto.precoVenda,
                subtotal: new Prisma.Decimal(produto.precoVenda).mul(item.quantidade),
              };
            }),
          },
        },
        select: {
          id: true,
          status: true,
          criadoEm: true,
          valorBruto: true,
          valorDesconto: true,
          valorLiquido: true,
        },
      });

      const produtosAtualizados = await tx.produto.findMany({
        where: { id: { in: [...quantidadesPorProduto.keys()] } },
        include: {
          fornecedor: {
            select: {
              nomeFantasia: true,
              prazoEntrega: true,
            },
          },
        },
      });
      const produtosAtualizadosPorId = new Map(produtosAtualizados.map((produto) => [produto.id, produto]));
      const alertasReposicao: AlertaReposicao[] = [];

      for (const produtoId of quantidadesPorProduto.keys()) {
        const produto = produtosAtualizadosPorId.get(produtoId);

        if (!produto) {
          throw new AppError(`Produto de ID ${produtoId} não encontrado.`, 404);
        }

        if (produto.estoqueAtual <= produto.estoqueMinimo) {
          alertasReposicao.push({
            sku: produto.sku,
            nome: produto.nome,
            estoqueAtual: produto.estoqueAtual,
            estoqueMinimo: produto.estoqueMinimo,
            nomeFantasia: produto.fornecedor.nomeFantasia,
            prazoEntrega: produto.fornecedor.prazoEntrega,
          });
        }
      }

      return {
        pedido,
        alertasReposicao,
      };
    });
  }

  async buscarPorId(id: string) {
    const pedidoId = Number(id);

    if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
      throw new AppError('O ID do pedido deve ser um número inteiro positivo.', 400);
    }

    const pedido = await this.pedidoRepository.findByIdWithClienteAndItens(pedidoId);

    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404);
    }

    return pedido;
  }

  async cancelarPedido(id: string) {
    const pedidoId = Number(id);

    if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
      throw new AppError('O ID do pedido deve ser um número inteiro positivo.', 400);
    }

    return this.prismaClient.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: {
          itensPedido: {
            select: {
              produtoId: true,
              quantidade: true,
            },
          },
        },
      });

      if (!pedido) {
        throw new AppError('Pedido não encontrado.', 404);
      }

      if (pedido.status !== 'APROVADO') {
        throw new AppError('Somente pedidos aprovados podem ser cancelados.', 409);
      }

      const cancelamento = await tx.pedido.updateMany({
        where: { id: pedidoId, status: 'APROVADO' },
        data: { status: 'CANCELADO' },
      });

      if (cancelamento.count !== 1) {
        throw new AppError('Somente pedidos aprovados podem ser cancelados.', 409);
      }

      const quantidadesPorProduto = new Map<number, number>();

      for (const item of pedido.itensPedido) {
        quantidadesPorProduto.set(
          item.produtoId,
          (quantidadesPorProduto.get(item.produtoId) ?? 0) + item.quantidade,
        );
      }

      for (const [produtoId, quantidade] of [...quantidadesPorProduto].sort(([idA], [idB]) => idA - idB)) {
        const restock = await tx.produto.updateMany({
          where: { id: produtoId },
          data: { estoqueAtual: { increment: quantidade } },
        });

        if (restock.count !== 1) {
          throw new AppError('Produto do pedido não encontrado durante o estorno.', 404);
        }
      }

      await tx.cliente.update({
        where: { id: pedido.clienteId },
        data: { limiteCredito: { increment: pedido.valorLiquido } },
      });

      const pedidoAtualizado = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: { itensPedido: true },
      });

      if (!pedidoAtualizado) {
        throw new AppError('Pedido não encontrado.', 404);
      }

      return {
        pedido: pedidoAtualizado,
        estorno: {
          creditoRestaurado: pedido.valorLiquido,
          itensEstornados: pedido.itensPedido.length,
        },
      };
    });
  }
}
