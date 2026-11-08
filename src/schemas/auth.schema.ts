import { z } from 'zod';

const emailSchema = z.string().trim().pipe(z.email()).transform((email) => email.toLowerCase());

export const registrarUsuarioSchema = z.object({
  nome: z.string().trim().min(1, 'O nome é obrigatório.'),
  email: emailSchema,
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  cargo: z.enum(['ADMIN', 'OPERADOR']).optional(),
}).strict();

export type RegistrarUsuarioInput = z.infer<typeof registrarUsuarioSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'A senha é obrigatória.'),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
