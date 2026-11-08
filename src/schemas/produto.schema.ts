import { z } from 'zod';

export const criarProdutoSchema = z.object({
  sku: z.string().trim().min(1, 'O SKU é obrigatório.'),
  nome: z.string().trim().min(1, 'O nome do produto é obrigatório.'),
  precoCusto: z.number().finite().positive('O preço de custo deve ser maior que zero.'),
  precoVenda: z.number().finite().positive('O preço de venda deve ser maior que zero.'),
  estoqueAtual: z.number().int().nonnegative('O estoque atual não pode ser negativo.'),
  estoqueMinimo: z.number().int().nonnegative('O estoque mínimo não pode ser negativo.'),
  fornecedorId: z.number().int().positive('O ID do fornecedor deve ser um inteiro positivo.'),
}).strict();

export type CriarProdutoInput = z.infer<typeof criarProdutoSchema>;

export const atualizarProdutoSchema = z.object({
  sku: z.string().trim().min(1, 'O SKU é obrigatório.').optional(),
  nome: z.string().trim().min(1, 'O nome do produto é obrigatório.').optional(),
  precoCusto: z.number().finite().positive('O preço de custo deve ser maior que zero.').optional(),
  precoVenda: z.number().finite().positive('O preço de venda deve ser maior que zero.').optional(),
  estoqueAtual: z.number().int().nonnegative('O estoque atual não pode ser negativo.').optional(),
  estoqueMinimo: z.number().int().nonnegative('O estoque mínimo não pode ser negativo.').optional(),
  fornecedorId: z.number().int().positive('O ID do fornecedor deve ser um inteiro positivo.').optional(),
}).strict().refine(
  (dados) => Object.values(dados).some((valor) => valor !== undefined),
  'Informe ao menos um campo para atualizar.',
);

export type AtualizarProdutoInput = z.infer<typeof atualizarProdutoSchema>;

export const listarProdutosQuerySchema = z.object({
  fornecedorId: z.string()
    .regex(/^[1-9]\d*$/, 'O ID do fornecedor deve ser um inteiro positivo.')
    .transform(Number)
    .optional(),
  estoqueCritico: z.enum(['true', 'false'])
    .transform((valor) => valor === 'true')
    .optional(),
}).strict();

export type ListarProdutosFiltros = z.infer<typeof listarProdutosQuerySchema>;
