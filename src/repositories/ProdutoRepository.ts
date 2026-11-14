import { prisma } from '../database/prisma';
import type { Produto, Prisma } from '../generated/prisma/client';
import type { AtualizarProdutoInput, CriarProdutoInput, ListarProdutosFiltros } from '../schemas/produto.schema';

type NovoProduto = Pick<
  CriarProdutoInput,
  'sku' | 'nome' | 'precoCusto' | 'precoVenda' | 'estoqueAtual' | 'estoqueMinimo' | 'fornecedorId'
>;

export class ProdutoRepository {
  findBySku(sku: string): Promise<Produto | null> {
    return prisma.produto.findUnique({ where: { sku } });
  }

  findById(id: number): Promise<Produto | null> {
    return prisma.produto.findUnique({ where: { id } });
  }

  create(data: NovoProduto): Promise<Produto> {
    return prisma.produto.create({ data });
  }

  update(id: number, data: AtualizarProdutoInput): Promise<Produto> {
    return prisma.produto.update({
      where: { id },
      data,
    });
  }

  countItensPedidoByProdutoId(produtoId: number): Promise<number> {
    return prisma.itemPedido.count({ where: { produtoId } });
  }

  delete(id: number): Promise<Produto> {
    return prisma.produto.delete({ where: { id } });
  }

  findAll(filtros: ListarProdutosFiltros = {}) {
    const where: Prisma.ProdutoWhereInput = {};

    if (filtros.fornecedorId !== undefined) {
      where.fornecedorId = filtros.fornecedorId;
    }

    if (filtros.estoqueCritico === true) {
      // Compara as duas colunas direto no MySQL: estoqueAtual <= estoqueMinimo.
      where.estoqueAtual = { lte: prisma.produto.fields.estoqueMinimo };
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

  findByIdWithFornecedor(id: number) {
    return prisma.produto.findUnique({
      where: { id },
      include: { fornecedor: true },
    });
  }
}
