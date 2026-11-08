import { prisma } from '../database/prisma';
import type { Cliente, Prisma } from '../generated/prisma/client';
import type { AtualizarClienteInput, CriarClienteInput } from '../schemas/cliente.schema';
import type { ListarClientesFiltros } from '../schemas/cliente.schema';

type NovoCliente = Pick<CriarClienteInput, 'razaoSocial' | 'cnpj' | 'email' | 'telefone' | 'limiteCredito'>;

export class ClienteRepository {
  findByCnpj(cnpj: string): Promise<Cliente | null> {
    return prisma.cliente.findUnique({ where: { cnpj } });
  }

  findByEmail(email: string): Promise<Cliente | null> {
    return prisma.cliente.findUnique({ where: { email } });
  }

  create(data: NovoCliente): Promise<Cliente> {
    return prisma.cliente.create({ data });
  }

  findById(id: number): Promise<Cliente | null> {
    return prisma.cliente.findUnique({ where: { id } });
  }

  update(id: number, dados: AtualizarClienteInput): Promise<Cliente> {
    return prisma.cliente.update({
      where: { id },
      data: dados,
    });
  }

  findAll(filtros: ListarClientesFiltros): Promise<Cliente[]> {
    const where: Prisma.ClienteWhereInput = {};

    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    if (filtros.razaoSocial !== undefined) {
      where.razaoSocial = { contains: filtros.razaoSocial };
    }

    return prisma.cliente.findMany({
      where,
      orderBy: { razaoSocial: 'asc' },
    });
  }

  findByIdWithPedidos(id: number) {
    return prisma.cliente.findUnique({
      where: { id },
      include: {
        pedidos: {
          select: {
            id: true,
            status: true,
            valorLiquido: true,
            criadoEm: true,
          },
          orderBy: { criadoEm: 'desc' },
        },
      },
    });
  }
}
