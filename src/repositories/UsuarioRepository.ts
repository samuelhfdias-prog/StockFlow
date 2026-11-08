import { prisma } from '../database/prisma';
import type { Usuario } from '../generated/prisma/client';

type NovoUsuario = Pick<Usuario, 'nome' | 'email' | 'senhaHash' | 'cargo'>;

export class UsuarioRepository {
  findByEmail(email: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { email } });
  }

  findById(id: number): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { id } });
  }

  create(data: NovoUsuario): Promise<Usuario> {
    return prisma.usuario.create({ data });
  }
}
