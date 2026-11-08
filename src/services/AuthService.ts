import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '../generated/prisma/client';
import { jwtSecret } from '../config/jwt';
import { AppError } from '../errors/AppError';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import type { LoginInput, RegistrarUsuarioInput } from '../schemas/auth.schema';

export type UsuarioRegistrado = {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  criadoEm: Date;
};

export class AuthService {
  constructor(
    private readonly usuarioRepository: Pick<UsuarioRepository, 'findByEmail' | 'findById' | 'create'> = new UsuarioRepository(),
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

  async login(input: LoginInput): Promise<{
    token: string;
    usuario: Pick<UsuarioRegistrado, 'id' | 'nome' | 'email' | 'cargo'>;
  }> {
    const usuario = await this.usuarioRepository.findByEmail(input.email);

    if (!usuario || !(await bcrypt.compare(input.senha, usuario.senhaHash))) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    const token = jwt.sign(
      { id: usuario.id, cargo: usuario.cargo },
      jwtSecret,
      { expiresIn: '8h' },
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
      },
    };
  }

  async me(id: number): Promise<Pick<UsuarioRegistrado, 'id' | 'nome' | 'email' | 'cargo'>> {
    const usuario = await this.usuarioRepository.findById(id);

    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
    };
  }
}
