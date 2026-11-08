import { Prisma } from '../generated/prisma/client';
import { AppError } from '../errors/AppError';
import { ClienteRepository } from '../repositories/ClienteRepository';
import type { CriarClienteInput } from '../schemas/cliente.schema';

export class ClienteService {
  constructor(
    private readonly clienteRepository: Pick<ClienteRepository, 'findByCnpj' | 'findByEmail' | 'create'> = new ClienteRepository(),
  ) {}

  async criar(input: CriarClienteInput) {
    const clientePorCnpj = await this.clienteRepository.findByCnpj(input.cnpj);

    if (clientePorCnpj) {
      throw new AppError('Já existe um cliente com este CNPJ ou e-mail.', 409);
    }

    const clientePorEmail = await this.clienteRepository.findByEmail(input.email);

    if (clientePorEmail) {
      throw new AppError('Já existe um cliente com este CNPJ ou e-mail.', 409);
    }

    try {
      return await this.clienteRepository.create(input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Já existe um cliente com este CNPJ ou e-mail.', 409);
      }

      throw error;
    }
  }
}
