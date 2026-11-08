import { Prisma } from '../generated/prisma/client';
import { AppError } from '../errors/AppError';
import { ClienteRepository } from '../repositories/ClienteRepository';
import {
  listarClientesQuerySchema,
  type AtualizarClienteInput,
  type CriarClienteInput,
} from '../schemas/cliente.schema';

export class ClienteService {
  constructor(
    private readonly clienteRepository: Pick<
      ClienteRepository,
      | 'findByCnpj'
      | 'findByEmail'
      | 'create'
      | 'findAll'
      | 'findByIdWithPedidos'
      | 'findById'
      | 'update'
      | 'countPedidosByClienteId'
      | 'delete'
    > = new ClienteRepository(),
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

  async listar(query: { ativo?: unknown; razaoSocial?: unknown }) {
    const filtros = listarClientesQuerySchema.safeParse(query);

    if (!filtros.success) {
      throw new AppError('Filtros de consulta inválidos.', 400);
    }

    return this.clienteRepository.findAll(filtros.data);
  }

  async buscarPorId(id: string) {
    const clienteId = Number(id);

    if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
      throw new AppError('O ID do cliente deve ser um número inteiro positivo.', 400);
    }

    const cliente = await this.clienteRepository.findByIdWithPedidos(clienteId);

    if (!cliente) {
      throw new AppError('Cliente não encontrado.', 404);
    }

    return cliente;
  }

  async atualizar(id: string, dados: AtualizarClienteInput) {
    const clienteId = Number(id);

    if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
      throw new AppError('O ID do cliente deve ser um número inteiro positivo.', 400);
    }

    const clienteAtual = await this.clienteRepository.findById(clienteId);

    if (!clienteAtual) {
      throw new AppError('Cliente não encontrado.', 404);
    }

    const [clientePorCnpj, clientePorEmail] = await Promise.all([
      dados.cnpj ? this.clienteRepository.findByCnpj(dados.cnpj) : Promise.resolve(null),
      dados.email ? this.clienteRepository.findByEmail(dados.email) : Promise.resolve(null),
    ]);

    if (
      (clientePorCnpj && clientePorCnpj.id !== clienteId)
      || (clientePorEmail && clientePorEmail.id !== clienteId)
    ) {
      throw new AppError('Já existe outro cliente com este CNPJ ou e-mail.', 409);
    }

    try {
      return await this.clienteRepository.update(clienteId, dados);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new AppError('Já existe outro cliente com este CNPJ ou e-mail.', 409);
        }

        if (error.code === 'P2025') {
          throw new AppError('Cliente não encontrado.', 404);
        }
      }

      throw error;
    }
  }

  async remover(id: string): Promise<void> {
    const clienteId = Number(id);

    if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
      throw new AppError('O ID do cliente deve ser um número inteiro positivo.', 400);
    }

    const cliente = await this.clienteRepository.findById(clienteId);

    if (!cliente) {
      throw new AppError('Cliente não encontrado.', 404);
    }

    const pedidosVinculados = await this.clienteRepository.countPedidosByClienteId(clienteId);

    if (pedidosVinculados > 0) {
      throw new AppError('O cliente possui histórico transacional e deve ser apenas inativado.', 409);
    }

    try {
      await this.clienteRepository.delete(clienteId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new AppError('O cliente possui histórico transacional e deve ser apenas inativado.', 409);
        }

        if (error.code === 'P2025') {
          throw new AppError('Cliente não encontrado.', 404);
        }
      }

      throw error;
    }
  }
}
