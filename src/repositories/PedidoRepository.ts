import { prisma } from '../database/prisma';
import type { ListarPedidosFiltros } from '../schemas/pedido.schema';

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
}
