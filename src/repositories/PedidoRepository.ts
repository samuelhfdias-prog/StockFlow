import { prisma } from '../database/prisma';
import type { Prisma } from '../generated/prisma/client';
import type { ListarPedidosFiltros } from '../schemas/pedido.schema';

type NovoPedido = {
  clienteId: number;
  valorBruto: Prisma.Decimal;
  valorDesconto: Prisma.Decimal;
  valorLiquido: Prisma.Decimal;
  itens: Array<{
    produtoId: number;
    quantidade: number;
    precoUnitario: Prisma.Decimal;
    subtotal: Prisma.Decimal;
  }>;
};

export class PedidoRepository {
  findAll(filtros: ListarPedidosFiltros) {
    return prisma.pedido.findMany({
      where: {
        ...(filtros.status === undefined ? {} : { status: filtros.status }),
        ...(filtros.clienteId === undefined ? {} : { clienteId: filtros.clienteId }),
      },
      include: {
        cliente: {
          select: {
            id: true,
            razaoSocial: true,
            cnpj: true,
          },
        },
        itensPedido: {
          include: {
            produto: {
              select: {
                sku: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  findByIdWithClienteAndItens(id: number) {
    return prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            razaoSocial: true,
            cnpj: true,
            email: true,
            limiteCredito: true,
          },
        },
        itensPedido: {
          include: {
            produto: {
              select: {
                sku: true,
                nome: true,
              },
            },
          },
        },
      },
    });
  }

  // Os métodos abaixo recebem o `tx` da transação aberta pelo PedidoService,
  // assim toda leitura e escrita dos endpoints 18 e 20 acontece no mesmo escopo atômico.

  buscarCliente(tx: Prisma.TransactionClient, id: number) {
    return tx.cliente.findUnique({ where: { id } });
  }

  buscarProdutosComFornecedor(tx: Prisma.TransactionClient, ids: number[]) {
    return tx.produto.findMany({
      where: { id: { in: ids } },
      include: {
        fornecedor: {
          select: {
            nomeFantasia: true,
            prazoEntrega: true,
          },
        },
      },
    });
  }

  baixarEstoque(tx: Prisma.TransactionClient, produtoId: number, quantidade: number) {
    return tx.produto.updateMany({
      where: { id: produtoId, estoqueAtual: { gte: quantidade } },
      data: { estoqueAtual: { decrement: quantidade } },
    });
  }

  debitarCredito(tx: Prisma.TransactionClient, clienteId: number, valor: Prisma.Decimal) {
    return tx.cliente.updateMany({
      where: { id: clienteId, ativo: true, limiteCredito: { gte: valor } },
      data: { limiteCredito: { decrement: valor } },
    });
  }

  criarAprovado(tx: Prisma.TransactionClient, dados: NovoPedido) {
    return tx.pedido.create({
      data: {
        clienteId: dados.clienteId,
        status: 'APROVADO',
        valorBruto: dados.valorBruto,
        valorDesconto: dados.valorDesconto,
        valorLiquido: dados.valorLiquido,
        itensPedido: { create: dados.itens },
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
  }

  buscarParaCancelamento(tx: Prisma.TransactionClient, id: number) {
    return tx.pedido.findUnique({
      where: { id },
      include: {
        itensPedido: {
          select: {
            produtoId: true,
            quantidade: true,
          },
        },
      },
    });
  }

  // O filtro por status impede que duas requisições simultâneas estornem o mesmo pedido.
  marcarComoCancelado(tx: Prisma.TransactionClient, id: number) {
    return tx.pedido.updateMany({
      where: { id, status: 'APROVADO' },
      data: { status: 'CANCELADO' },
    });
  }

  devolverEstoque(tx: Prisma.TransactionClient, produtoId: number, quantidade: number) {
    return tx.produto.updateMany({
      where: { id: produtoId },
      data: { estoqueAtual: { increment: quantidade } },
    });
  }

  devolverCredito(tx: Prisma.TransactionClient, clienteId: number, valor: Prisma.Decimal) {
    return tx.cliente.update({
      where: { id: clienteId },
      data: { limiteCredito: { increment: valor } },
    });
  }

  buscarComItens(tx: Prisma.TransactionClient, id: number) {
    return tx.pedido.findUnique({
      where: { id },
      include: { itensPedido: true },
    });
  }
}
