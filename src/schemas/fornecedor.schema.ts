import { z } from 'zod';

const cnpjSchema = z.string()
  .trim()
  .pipe(z.string().regex(/^(?:\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/, 'Informe um CNPJ com 14 dígitos, com ou sem máscara.'))
  .transform((cnpj) => cnpj.replace(/\D/g, ''));

export const criarFornecedorSchema = z.object({
  nomeFantasia: z.string().trim().min(1, 'O nome fantasia é obrigatório.'),
  cnpj: cnpjSchema,
  emailContato: z.string().trim().pipe(z.email()).transform((email) => email.toLowerCase()),
  prazoEntrega: z.number().int().positive('O prazo de entrega deve ser um inteiro positivo em dias.'),
}).strict();

export type CriarFornecedorInput = z.infer<typeof criarFornecedorSchema>;
