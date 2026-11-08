import { Prisma } from '../generated/prisma/client';
import { AppError } from '../errors/AppError';
import { FornecedorRepository } from '../repositories/FornecedorRepository';
import type { CriarFornecedorInput } from '../schemas/fornecedor.schema';

export class FornecedorService {
  constructor(
    private readonly fornecedorRepository: Pick<
      FornecedorRepository,
      'findByCnpj' | 'create' | 'findAll' | 'findByIdWithProdutos'
    > = new FornecedorRepository(),
  ) {}

  async criar(input: CriarFornecedorInput) {
    const fornecedorExistente = await this.fornecedorRepository.findByCnpj(input.cnpj);

    if (fornecedorExistente) {
      throw new AppError('Já existe um fornecedor com este CNPJ.', 409);
    }

    try {
      return await this.fornecedorRepository.create(input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Já existe um fornecedor com este CNPJ.', 409);
      }

      throw error;
    }
  }

  listar() {
    return this.fornecedorRepository.findAll();
  }

  async buscarPorId(id: string) {
    const fornecedorId = Number(id);

    if (!Number.isSafeInteger(fornecedorId) || fornecedorId <= 0) {
      throw new AppError('O ID do fornecedor deve ser um número inteiro positivo.', 400);
    }

    const fornecedor = await this.fornecedorRepository.findByIdWithProdutos(fornecedorId);

    if (!fornecedor) {
      throw new AppError('Fornecedor não encontrado.', 404);
    }

    return fornecedor;
  }
}
