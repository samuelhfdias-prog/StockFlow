import { Prisma } from '../generated/prisma/client';
import { AppError } from '../errors/AppError';
import { FornecedorRepository } from '../repositories/FornecedorRepository';
import { ProdutoRepository } from '../repositories/ProdutoRepository';
import type { CriarProdutoInput } from '../schemas/produto.schema';

export class ProdutoService {
  constructor(
    private readonly produtoRepository: Pick<ProdutoRepository, 'findBySku' | 'create'> = new ProdutoRepository(),
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
}
