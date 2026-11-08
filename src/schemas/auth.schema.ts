import { z } from 'zod';

export const registrarUsuarioSchema = z.object({
  nome: z.string().trim().min(1, 'O nome é obrigatório.'),
  email: z.string().trim().pipe(z.email()).transform((email) => email.toLowerCase()),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  cargo: z.enum(['ADMIN', 'OPERADOR']).optional(),
}).strict();

export type RegistrarUsuarioInput = z.infer<typeof registrarUsuarioSchema>;
