import { Prisma } from '../generated/prisma/client';
import { AppError } from '../errors/AppError';
import { FornecedorRepository } from '../repositories/FornecedorRepository';
import { ProdutoRepository } from '../repositories/ProdutoRepository';
import {
  listarProdutosQuerySchema,
  type AtualizarProdutoInput,
  type CriarProdutoInput,
} from '../schemas/produto.schema';

// Margem sobre o custo, calculada com Decimal para não perder centavos em valores como 1,005%.
export const calcularMargemLucroPercentual = (
  precoCusto: Prisma.Decimal | string | number,
  precoVenda: Prisma.Decimal | string | number,
): number => new Prisma.Decimal(precoVenda)
  .minus(precoCusto)
  .div(precoCusto)
  .mul(100)
  .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  .toNumber();

export const MARGEM_MINIMA_PERCENTUAL = 20;

export const MENSAGEM_MARGEM_MINIMA = `O preço de venda deve garantir uma margem de lucro mínima de ${MARGEM_MINIMA_PERCENTUAL}% sobre o preço de custo.`;

// A venda precisa ser pelo menos o custo acrescido da margem mínima; a comparação em Decimal evita erro de centavos.
export const margemMinimaAtendida = (
  precoCusto: Prisma.Decimal | string | number,
  precoVenda: Prisma.Decimal | string | number,
): boolean => new Prisma.Decimal(precoVenda).greaterThanOrEqualTo(
  new Prisma.Decimal(precoCusto).mul(100 + MARGEM_MINIMA_PERCENTUAL).div(100),
);

export class ProdutoService {
  constructor(
    private readonly produtoRepository: Pick<
      ProdutoRepository,
      | 'findBySku'
      | 'create'
      | 'findAll'
      | 'findByIdWithFornecedor'
      | 'findById'
      | 'update'
      | 'countItensPedidoByProdutoId'
      | 'delete'
    > = new ProdutoRepository(),
    private readonly fornecedorRepository: Pick<FornecedorRepository, 'findById'> = new FornecedorRepository(),
  ) {}

  async criar(input: CriarProdutoInput) {
    if (!margemMinimaAtendida(input.precoCusto, input.precoVenda)) {
      throw new AppError(MENSAGEM_MARGEM_MINIMA, 422);
    }

    const produtoExistente = await this.produtoRepository.findBySku(input.sku);

    if (produtoExistente) {
      throw new AppError('Já existe um produto com este SKU.', 409);
    }

    const fornecedor = await this.fornecedorRepository.findById(input.fornecedorId);

    if (!fornecedor) {
      throw new AppError('Fornecedor informado não existe.', 422);
    }

    if (!fornecedor.ativo) {
      throw new AppError('O fornecedor informado está inativo.', 422);
    }

    try {
      return await this.produtoRepository.create(input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new AppError('Já existe um produto com este SKU.', 409);
        }

        if (error.code === 'P2003') {
          throw new AppError('Fornecedor informado não existe.', 422);
        }
      }

      throw error;
    }
  }

  async listar(query: { fornecedorId?: unknown; estoqueCritico?: unknown }) {
    const resultado = listarProdutosQuerySchema.safeParse(query);

    if (!resultado.success) {
      throw new AppError('Filtros de consulta inválidos.', 400);
    }

    const produtos = await this.produtoRepository.findAll(resultado.data);

    return produtos.map((produto) => ({
      ...produto,
      estoqueCritico: produto.estoqueAtual <= produto.estoqueMinimo,
    }));
  }

  async buscarPorId(id: string) {
    const produtoId = Number(id);

    if (!Number.isSafeInteger(produtoId) || produtoId <= 0) {
      throw new AppError('O ID do produto deve ser um número inteiro positivo.', 400);
    }

    const produto = await this.produtoRepository.findByIdWithFornecedor(produtoId);

    if (!produto) {
      throw new AppError('Produto não encontrado.', 404);
    }

    return {
      ...produto,
      margemLucroPercentual: calcularMargemLucroPercentual(produto.precoCusto, produto.precoVenda),
      estoqueCritico: produto.estoqueAtual <= produto.estoqueMinimo,
    };
  }

  async atualizar(id: string, dados: AtualizarProdutoInput) {
    const produtoId = Number(id);

    if (!Number.isSafeInteger(produtoId) || produtoId <= 0) {
      throw new AppError('O ID do produto deve ser um número inteiro positivo.', 400);
    }

    const produtoAtual = await this.produtoRepository.findById(produtoId);

    if (!produtoAtual) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const precoCusto = dados.precoCusto ?? Number(produtoAtual.precoCusto);
    const precoVenda = dados.precoVenda ?? Number(produtoAtual.precoVenda);

    if (precoVenda <= precoCusto) {
      throw new AppError('O preço de venda deve ser maior que o preço de custo.', 422);
    }

    if (dados.sku && dados.sku !== produtoAtual.sku) {
      const produtoComMesmoSku = await this.produtoRepository.findBySku(dados.sku);

      if (produtoComMesmoSku && produtoComMesmoSku.id !== produtoId) {
        throw new AppError('Já existe um produto com este SKU.', 409);
      }
    }

    if (dados.fornecedorId !== undefined && dados.fornecedorId !== produtoAtual.fornecedorId) {
      const fornecedor = await this.fornecedorRepository.findById(dados.fornecedorId);

      if (!fornecedor) {
        throw new AppError('Fornecedor informado não existe.', 422);
      }

      if (!fornecedor.ativo) {
        throw new AppError('O fornecedor informado está inativo.', 422);
      }
    }

    try {
      return await this.produtoRepository.update(produtoId, dados);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new AppError('Já existe um produto com este SKU.', 409);
        }

        if (error.code === 'P2003') {
          throw new AppError('Fornecedor informado não existe.', 422);
        }

        if (error.code === 'P2025') {
          throw new AppError('Produto não encontrado.', 404);
        }
      }

      throw error;
    }
  }

  async remover(id: string): Promise<void> {
    const produtoId = Number(id);

    if (!Number.isSafeInteger(produtoId) || produtoId <= 0) {
      throw new AppError('O ID do produto deve ser um número inteiro positivo.', 400);
    }

    const produto = await this.produtoRepository.findById(produtoId);

    if (!produto) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const itensVinculados = await this.produtoRepository.countItensPedidoByProdutoId(produtoId);

    if (itensVinculados > 0) {
      throw new AppError('Produto vinculado a pedidos não pode ser excluído.', 409);
    }

    try {
      await this.produtoRepository.delete(produtoId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new AppError('Produto vinculado a pedidos não pode ser excluído.', 409);
        }

        if (error.code === 'P2025') {
          throw new AppError('Produto não encontrado.', 404);
        }
      }

      throw error;
    }
  }
}
