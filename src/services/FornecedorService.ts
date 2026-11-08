import { Prisma } from '../generated/prisma/client';
import { AppError } from '../errors/AppError';
import { FornecedorRepository } from '../repositories/FornecedorRepository';
import type { CriarFornecedorInput } from '../schemas/fornecedor.schema';

export class FornecedorService {
  constructor(
    private readonly fornecedorRepository: Pick<FornecedorRepository, 'findByCnpj' | 'create' | 'findAll'> = new FornecedorRepository(),
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
}
