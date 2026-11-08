import { prisma } from '../database/prisma';
import type { Produto, Prisma } from '../generated/prisma/client';
import type { CriarProdutoInput } from '../schemas/produto.schema';

type NovoProduto = Pick<
  CriarProdutoInput,
  'sku' | 'nome' | 'precoCusto' | 'precoVenda' | 'estoqueAtual' | 'estoqueMinimo' | 'fornecedorId'
>;

export class ProdutoRepository {
  findBySku(sku: string): Promise<Produto | null> {
    return prisma.produto.findUnique({ where: { sku } });
  }

  create(data: NovoProduto): Promise<Produto> {
    return prisma.produto.create({ data });
  }

  findAll(fornecedorId?: number) {
    const where: Prisma.ProdutoWhereInput = {};

    if (fornecedorId !== undefined) {
      where.fornecedorId = fornecedorId;
    }

    return prisma.produto.findMany({
      where,
      include: {
        fornecedor: {
          select: {
            id: true,
            nomeFantasia: true,
            cnpj: true,
            ativo: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }
}
