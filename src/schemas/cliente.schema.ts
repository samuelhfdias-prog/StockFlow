import { z } from 'zod';
import { textoObrigatorioSchema, valorMonetarioSchema } from './comum.schema';

const cnpjSchema = z.string()
  .trim()
  .pipe(z.string().regex(/^(?:\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/, 'Informe um CNPJ com 14 dígitos, com ou sem máscara.'))
  .transform((cnpj) => cnpj.replace(/\D/g, ''));

const emailSchema = z.string()
  .trim()
  .max(191, 'Use no máximo 191 caracteres.')
  .pipe(z.email())
  .transform((email) => email.toLowerCase());

const telefoneSchema = z.string()
  .trim()
  .max(30, 'Use no máximo 30 caracteres no telefone.')
  .refine((telefone) => {
    const digits = telefone.replace(/\D/g, '');
    return /^\+?[\d\s().-]+$/.test(telefone) && digits.length >= 10 && digits.length <= 15;
  }, 'Informe um telefone com 10 a 15 dígitos.');

export const criarClienteSchema = z.object({
  razaoSocial: textoObrigatorioSchema('A razão social é obrigatória.'),
  cnpj: cnpjSchema,
  email: emailSchema,
  telefone: telefoneSchema,
  limiteCredito: valorMonetarioSchema('O limite de crédito deve ser maior que zero.'),
}).strict();

export type CriarClienteInput = z.infer<typeof criarClienteSchema>;

export const atualizarClienteSchema = z.object({
  razaoSocial: textoObrigatorioSchema('A razão social é obrigatória.').optional(),
  cnpj: cnpjSchema.optional(),
  email: emailSchema.optional(),
  telefone: telefoneSchema.optional(),
  limiteCredito: valorMonetarioSchema('O limite de crédito deve ser maior que zero.').optional(),
  ativo: z.boolean().optional(),
}).strict().refine(
  (dados) => Object.values(dados).some((valor) => valor !== undefined),
  'Informe ao menos um campo para atualizar.',
);

export type AtualizarClienteInput = z.infer<typeof atualizarClienteSchema>;

export const listarClientesQuerySchema = z.object({
  ativo: z.enum(['true', 'false']).optional().transform((ativo) => (
    ativo === undefined ? undefined : ativo === 'true'
  )),
  razaoSocial: z.string().trim().min(1, 'A razão social não pode estar vazia.').optional(),
}).strict();

export type ListarClientesFiltros = z.infer<typeof listarClientesQuerySchema>;
