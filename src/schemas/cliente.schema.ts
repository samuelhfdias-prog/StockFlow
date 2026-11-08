import { z } from 'zod';

const cnpjSchema = z.string()
  .trim()
  .pipe(z.string().regex(/^(?:\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/, 'Informe um CNPJ com 14 dígitos, com ou sem máscara.'))
  .transform((cnpj) => cnpj.replace(/\D/g, ''));

const emailSchema = z.string()
  .trim()
  .pipe(z.email())
  .transform((email) => email.toLowerCase());

const telefoneSchema = z.string()
  .trim()
  .refine((telefone) => {
    const digits = telefone.replace(/\D/g, '');
    return /^\+?[\d\s().-]+$/.test(telefone) && digits.length >= 10 && digits.length <= 15;
  }, 'Informe um telefone com 10 a 15 dígitos.');

export const criarClienteSchema = z.object({
  razaoSocial: z.string().trim().min(1, 'A razão social é obrigatória.'),
  cnpj: cnpjSchema,
  email: emailSchema,
  telefone: telefoneSchema,
  limiteCredito: z.number().finite().positive('O limite de crédito deve ser maior que zero.'),
}).strict();

export type CriarClienteInput = z.infer<typeof criarClienteSchema>;

export const listarClientesQuerySchema = z.object({
  ativo: z.enum(['true', 'false']).optional().transform((ativo) => (
    ativo === undefined ? undefined : ativo === 'true'
  )),
  razaoSocial: z.string().trim().min(1, 'A razão social não pode estar vazia.').optional(),
}).strict();

export type ListarClientesFiltros = z.infer<typeof listarClientesQuerySchema>;
