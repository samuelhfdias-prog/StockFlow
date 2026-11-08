import { prisma } from '../database/prisma';

export class PedidoRepository {
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
