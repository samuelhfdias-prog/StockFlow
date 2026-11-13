import { z } from 'zod';
import { textoObrigatorioSchema } from './comum.schema';

const emailSchema = z.string().trim().max(191, 'Use no máximo 191 caracteres.').pipe(z.email()).transform((email) => email.toLowerCase());

// O bcrypt considera apenas os primeiros 72 bytes da senha.
const senhaSchema = z.string()
  .min(6, 'A senha deve ter pelo menos 6 caracteres.')
  .refine((senha) => Buffer.byteLength(senha) <= 72, 'A senha deve ter no máximo 72 bytes (caracteres acentuados ocupam mais de um).');

export const registrarUsuarioSchema = z.object({
  nome: textoObrigatorioSchema('O nome é obrigatório.'),
  email: emailSchema,
  senha: senhaSchema,
  cargo: z.enum(['ADMIN', 'OPERADOR']).optional(),
}).strict();

export type RegistrarUsuarioInput = z.infer<typeof registrarUsuarioSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'A senha é obrigatória.'),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
