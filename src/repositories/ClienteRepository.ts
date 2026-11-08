import { prisma } from '../database/prisma';
import type { Cliente } from '../generated/prisma/client';
import type { CriarClienteInput } from '../schemas/cliente.schema';

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
}
