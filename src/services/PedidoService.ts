import { Prisma, type PrismaClient } from '../generated/prisma/client';
import { prisma } from '../database/prisma';
import { AppError } from '../errors/AppError';
import { PedidoRepository } from '../repositories/PedidoRepository';
import { listarPedidosQuerySchema, type CriarPedidoInput } from '../schemas/pedido.schema';

type AlertaReposicao = {
  sku: string;
  nome: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  nomeFantasia: string;
  prazoEntrega: number;
};

// Pedidos com muitos itens precisam de mais tempo que os 5 segundos padrão do Prisma.
const OPCOES_TRANSACAO = { maxWait: 5_000, timeout: 15_000 };
const LIMITE_QUANTIDADE_PRODUTO = 2_147_483_647;

export const calcularDesconto = (totalUnidades: number, valorBruto: Prisma.Decimal) => {
  const taxa = totalUnidades >= 30 || valorBruto.greaterThan(7000)
    ? new Prisma.Decimal('0.10')
    : totalUnidades >= 10 || valorBruto.greaterThan(2500)
      ? new Prisma.Decimal('0.05')
      : new Prisma.Decimal(0);
  const valorDesconto = valorBruto.mul(taxa).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  return { taxa, valorDesconto, valorLiquido: valorBruto.minus(valorDesconto) };
};

const somarQuantidadesPorProduto = (itens: CriarPedidoInput['itens']) => {
  const quantidadesPorProduto = new Map<number, number>();

  for (const item of itens) {
    const quantidadeTotal = (quantidadesPorProduto.get(item.produtoId) ?? 0) + item.quantidade;

    if (quantidadeTotal > LIMITE_QUANTIDADE_PRODUTO) {
      throw new AppError('A quantidade total de um produto excede o limite permitido.', 400);
    }

    quantidadesPorProduto.set(item.produtoId, quantidadeTotal);
  }

  return quantidadesPorProduto;
};

const lerIdDoPedido = (id: string) => {
  const pedidoId = Number(id);

  if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
    throw new AppError('O ID do pedido deve ser um número inteiro positivo.', 400);
  }

  return pedidoId;
};

export class PedidoService {
  constructor(
    private readonly prismaClient: PrismaClient = prisma,
    private readonly pedidoRepository: Pick<
      PedidoRepository,
      | 'findAll'
      | 'findByIdWithClienteAndItens'
      | 'buscarCliente'
      | 'buscarProdutosComFornecedor'
      | 'baixarEstoque'
      | 'debitarCredito'
      | 'criarAprovado'
      | 'buscarParaCancelamento'
      | 'marcarComoCancelado'
      | 'devolverEstoque'
      | 'devolverCredito'
      | 'buscarComItens'
    > = new PedidoRepository(),
  ) {}

  async criarPedido(dados: CriarPedidoInput) {
    return this.prismaClient.$transaction(async (tx) => {
      const cliente = await this.pedidoRepository.buscarCliente(tx, dados.clienteId);

      if (!cliente) {
        throw new AppError('Cliente não encontrado.', 404);
      }

      if (cliente.ativo !== true) {
        throw new AppError('Cliente inativo para operações comerciais', 403);
      }

      const quantidadesPorProduto = somarQuantidadesPorProduto(dados.itens);
      const idsProdutos = [...quantidadesPorProduto.keys()].sort((idA, idB) => idA - idB);
      const produtos = await this.pedidoRepository.buscarProdutosComFornecedor(tx, idsProdutos);
      const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));
      const buscarProduto = (produtoId: number) => {
        const produto = produtosPorId.get(produtoId);

        if (!produto) {
          throw new AppError(`Produto de ID ${produtoId} não encontrado.`, 404);
        }

        return produto;
      };

      for (const produtoId of idsProdutos) {
        buscarProduto(produtoId);
      }

      for (const [produtoId, quantidade] of quantidadesPorProduto) {
        const produto = buscarProduto(produtoId);

        if (produto.estoqueAtual < quantidade) {
          throw new AppError(`SKU ${produto.sku} não possui estoque suficiente.`, 422);
        }
      }

      const itensPedido = dados.itens.map((item) => {
        const produto = buscarProduto(item.produtoId);

        return {
          produtoId: produto.id,
          quantidade: item.quantidade,
          precoUnitario: produto.precoVenda,
          subtotal: new Prisma.Decimal(produto.precoVenda).mul(item.quantidade),
        };
      });
      const totalUnidades = [...quantidadesPorProduto.values()].reduce((total, quantidade) => total + quantidade, 0);
      const valorBruto = itensPedido.reduce((total, item) => total.add(item.subtotal), new Prisma.Decimal(0));
      const { valorDesconto, valorLiquido } = calcularDesconto(totalUnidades, valorBruto);

      if (valorLiquido.greaterThan(cliente.limiteCredito)) {
        throw new AppError('Crédito Insuficiente para aprovar o pedido', 422);
      }

      // A ordem crescente de IDs evita deadlock entre pedidos concorrentes que disputam os mesmos produtos.
      for (const [produtoId, quantidade] of [...quantidadesPorProduto].sort(([idA], [idB]) => idA - idB)) {
        const baixa = await this.pedidoRepository.baixarEstoque(tx, produtoId, quantidade);

        if (baixa.count !== 1) {
          throw new AppError(`SKU ${buscarProduto(produtoId).sku} não possui estoque suficiente.`, 422);
        }
      }

      const debitoCredito = await this.pedidoRepository.debitarCredito(tx, cliente.id, valorLiquido);

      if (debitoCredito.count !== 1) {
        throw new AppError('Crédito Insuficiente para aprovar o pedido', 422);
      }

      const pedido = await this.pedidoRepository.criarAprovado(tx, {
        clienteId: cliente.id,
        valorBruto,
        valorDesconto,
        valorLiquido,
        itens: itensPedido,
      });

      const produtosAtualizados = await this.pedidoRepository.buscarProdutosComFornecedor(tx, idsProdutos);
      const alertasReposicao: AlertaReposicao[] = produtosAtualizados
        .filter((produto) => produto.estoqueAtual <= produto.estoqueMinimo)
        .map((produto) => ({
          sku: produto.sku,
          nome: produto.nome,
          estoqueAtual: produto.estoqueAtual,
          estoqueMinimo: produto.estoqueMinimo,
          nomeFantasia: produto.fornecedor.nomeFantasia,
          prazoEntrega: produto.fornecedor.prazoEntrega,
        }));

      return { pedido, alertasReposicao };
    }, OPCOES_TRANSACAO);
  }

  async listar(query: { status?: unknown; clienteId?: unknown }) {
    const filtros = listarPedidosQuerySchema.safeParse(query);

    if (!filtros.success) {
      throw new AppError('Filtros de consulta de pedidos inválidos.', 400);
    }

    return this.pedidoRepository.findAll(filtros.data);
  }

  async buscarPorId(id: string) {
    const pedido = await this.pedidoRepository.findByIdWithClienteAndItens(lerIdDoPedido(id));

    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404);
    }

    return pedido;
  }

  async cancelarPedido(id: string) {
    const pedidoId = lerIdDoPedido(id);

    return this.prismaClient.$transaction(async (tx) => {
      const pedido = await this.pedidoRepository.buscarParaCancelamento(tx, pedidoId);

      if (!pedido) {
        throw new AppError('Pedido não encontrado.', 404);
      }

      if (pedido.status !== 'APROVADO') {
        throw new AppError('Somente pedidos aprovados podem ser cancelados.', 409);
      }

      const cancelamento = await this.pedidoRepository.marcarComoCancelado(tx, pedidoId);

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
        const devolucao = await this.pedidoRepository.devolverEstoque(tx, produtoId, quantidade);

        if (devolucao.count !== 1) {
          throw new AppError('Produto do pedido não encontrado durante o estorno.', 404);
        }
      }

      await this.pedidoRepository.devolverCredito(tx, pedido.clienteId, pedido.valorLiquido);

      const pedidoAtualizado = await this.pedidoRepository.buscarComItens(tx, pedidoId);

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
    }, OPCOES_TRANSACAO);
  }
}
