import { prisma } from '../database/prisma';
import type { Fornecedor } from '../generated/prisma/client';
import type { CriarFornecedorInput } from '../schemas/fornecedor.schema';

type NovoFornecedor = Pick<CriarFornecedorInput, 'nomeFantasia' | 'cnpj' | 'emailContato' | 'prazoEntrega'>;

export class FornecedorRepository {
  findByCnpj(cnpj: string): Promise<Fornecedor | null> {
    return prisma.fornecedor.findUnique({ where: { cnpj } });
  }

  create(data: NovoFornecedor): Promise<Fornecedor> {
    return prisma.fornecedor.create({
      data: { ...data, ativo: true },
    });
  }
}
