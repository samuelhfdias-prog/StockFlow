import { prisma } from '../database/prisma';
import type { Fornecedor } from '../generated/prisma/client';
import type { AtualizarFornecedorInput, CriarFornecedorInput } from '../schemas/fornecedor.schema';

type NovoFornecedor = Pick<CriarFornecedorInput, 'nomeFantasia' | 'cnpj' | 'emailContato' | 'prazoEntrega'>;

export class FornecedorRepository {
  findByCnpj(cnpj: string): Promise<Fornecedor | null> {
    return prisma.fornecedor.findUnique({ where: { cnpj } });
  }

  findById(id: number): Promise<Fornecedor | null> {
    return prisma.fornecedor.findUnique({ where: { id } });
  }

  create(data: NovoFornecedor): Promise<Fornecedor> {
    return prisma.fornecedor.create({
      data: { ...data, ativo: true },
    });
  }

  update(id: number, data: AtualizarFornecedorInput): Promise<Fornecedor> {
    return prisma.fornecedor.update({
      where: { id },
      data,
    });
  }

  findAll() {
    return prisma.fornecedor.findMany({
      include: {
        _count: {
          select: { produtos: true },
        },
      },
      orderBy: { nomeFantasia: 'asc' },
    });
  }

  findByIdWithProdutos(id: number) {
    return prisma.fornecedor.findUnique({
      where: { id },
      include: { produtos: true },
    });
  }
}
