import { z } from 'zod';
import { LIMITE_INTEIRO, textoObrigatorioSchema } from './comum.schema';

const emailContatoSchema = z.string()
  .trim()
  .max(191, 'Use no máximo 191 caracteres.')
  .pipe(z.email())
  .transform((email) => email.toLowerCase());

const prazoEntregaSchema = z.number()
  .int()
  .positive('O prazo de entrega deve ser um inteiro positivo em dias.')
  .max(LIMITE_INTEIRO, 'O prazo de entrega excede o limite permitido.');

const cnpjSchema = z.string()
  .trim()
  .pipe(z.string().regex(/^(?:\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/, 'Informe um CNPJ com 14 dígitos, com ou sem máscara.'))
  .transform((cnpj) => cnpj.replace(/\D/g, ''));

export const criarFornecedorSchema = z.object({
  nomeFantasia: textoObrigatorioSchema('O nome fantasia é obrigatório.'),
  cnpj: cnpjSchema,
  emailContato: emailContatoSchema,
  prazoEntrega: prazoEntregaSchema,
}).strict();

export type CriarFornecedorInput = z.infer<typeof criarFornecedorSchema>;

export const atualizarFornecedorSchema = z.object({
  nomeFantasia: textoObrigatorioSchema('O nome fantasia é obrigatório.').optional(),
  emailContato: emailContatoSchema.optional(),
  prazoEntrega: prazoEntregaSchema.optional(),
  ativo: z.boolean().optional(),
}).strict().refine(
  (dados) => Object.values(dados).some((valor) => valor !== undefined),
  'Informe ao menos um campo para atualizar.',
);

export type AtualizarFornecedorInput = z.infer<typeof atualizarFornecedorSchema>;
