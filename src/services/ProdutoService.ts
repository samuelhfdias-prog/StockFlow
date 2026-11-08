import { Prisma } from '../generated/prisma/client';
import { AppError } from '../errors/AppError';
import { FornecedorRepository } from '../repositories/FornecedorRepository';
import { ProdutoRepository } from '../repositories/ProdutoRepository';
import {
  listarProdutosQuerySchema,
  type AtualizarProdutoInput,
  type CriarProdutoInput,
} from '../schemas/produto.schema';

export class ProdutoService {
  constructor(
    private readonly produtoRepository: Pick<
      ProdutoRepository,
      'findBySku' | 'create' | 'findAll' | 'findByIdWithFornecedor' | 'findById' | 'update'
    > = new ProdutoRepository(),
    private readonly fornecedorRepository: Pick<FornecedorRepository, 'findById'> = new FornecedorRepository(),
  ) {}

  async criar(input: CriarProdutoInput) {
    if (input.precoVenda <= input.precoCusto) {
      throw new AppError('O preço de venda deve ser maior que o preço de custo.', 422);
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

    const produtos = await this.produtoRepository.findAll(resultado.data.fornecedorId);
    const comEstoqueCritico = produtos.map((produto) => ({
      ...produto,
      estoqueCritico: produto.estoqueAtual <= produto.estoqueMinimo,
    }));

    if (resultado.data.estoqueCritico === true) {
      return comEstoqueCritico.filter((produto) => produto.estoqueCritico);
    }

    return comEstoqueCritico;
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

    const precoCusto = Number(produto.precoCusto);
    const precoVenda = Number(produto.precoVenda);

    if (!Number.isFinite(precoCusto) || precoCusto <= 0 || !Number.isFinite(precoVenda)) {
      throw new AppError('Não foi possível calcular a margem de lucro para este produto.', 422);
    }

    const margemLucroPercentual = Number((((precoVenda - precoCusto) / precoCusto) * 100).toFixed(2));

    return {
      ...produto,
      margemLucroPercentual,
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
}
