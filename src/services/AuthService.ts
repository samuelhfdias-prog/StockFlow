import bcrypt from 'bcryptjs';
import { Prisma } from '../generated/prisma/client';
import { AppError } from '../errors/AppError';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import type { RegistrarUsuarioInput } from '../schemas/auth.schema';

export type UsuarioRegistrado = {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  criadoEm: Date;
};

export class AuthService {
  constructor(
    private readonly usuarioRepository: Pick<UsuarioRepository, 'findByEmail' | 'create'> = new UsuarioRepository(),
  ) {}

  async registrar(input: RegistrarUsuarioInput): Promise<UsuarioRegistrado> {
    if (input.cargo === 'ADMIN') {
      throw new AppError('O cadastro público não pode criar usuários administradores.', 403);
    }

    const usuarioExistente = await this.usuarioRepository.findByEmail(input.email);

    if (usuarioExistente) {
      throw new AppError('Este e-mail já está cadastrado.', 409);
    }

    const senhaHash = await bcrypt.hash(input.senha, 10);
    let usuario;

    try {
      usuario = await this.usuarioRepository.create({
        nome: input.nome,
        email: input.email,
        senhaHash,
        cargo: input.cargo ?? 'OPERADOR',
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Este e-mail já está cadastrado.', 409);
      }

      throw error;
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
      criadoEm: usuario.criadoEm,
    };
  }
}
