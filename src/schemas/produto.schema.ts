import { z } from 'zod';
import { LIMITE_INTEIRO, quantidadeEstoqueSchema, textoObrigatorioSchema, valorMonetarioSchema } from './comum.schema';

export const criarProdutoSchema = z.object({
  sku: textoObrigatorioSchema('O SKU é obrigatório.'),
  nome: textoObrigatorioSchema('O nome do produto é obrigatório.'),
  precoCusto: valorMonetarioSchema('O preço de custo deve ser maior que zero.'),
  precoVenda: valorMonetarioSchema('O preço de venda deve ser maior que zero.'),
  estoqueAtual: quantidadeEstoqueSchema('O estoque atual não pode ser negativo.'),
  estoqueMinimo: quantidadeEstoqueSchema('O estoque mínimo não pode ser negativo.'),
  fornecedorId: z.number().int().positive('O ID do fornecedor deve ser um inteiro positivo.').max(LIMITE_INTEIRO),
}).strict();

export type CriarProdutoInput = z.infer<typeof criarProdutoSchema>;

export const atualizarProdutoSchema = z.object({
  sku: textoObrigatorioSchema('O SKU é obrigatório.').optional(),
  nome: textoObrigatorioSchema('O nome do produto é obrigatório.').optional(),
  precoCusto: valorMonetarioSchema('O preço de custo deve ser maior que zero.').optional(),
  precoVenda: valorMonetarioSchema('O preço de venda deve ser maior que zero.').optional(),
  estoqueAtual: quantidadeEstoqueSchema('O estoque atual não pode ser negativo.').optional(),
  estoqueMinimo: quantidadeEstoqueSchema('O estoque mínimo não pode ser negativo.').optional(),
  fornecedorId: z.number().int().positive('O ID do fornecedor deve ser um inteiro positivo.').max(LIMITE_INTEIRO).optional(),
}).strict().refine(
  (dados) => Object.values(dados).some((valor) => valor !== undefined),
  'Informe ao menos um campo para atualizar.',
);

export type AtualizarProdutoInput = z.infer<typeof atualizarProdutoSchema>;

export const listarProdutosQuerySchema = z.object({
  fornecedorId: z.string()
    .regex(/^[1-9]\d*$/, 'O ID do fornecedor deve ser um inteiro positivo.')
    .transform(Number)
    .refine((id) => id <= LIMITE_INTEIRO, 'O ID do fornecedor excede o limite permitido.')
    .optional(),
  estoqueCritico: z.enum(['true', 'false'])
    .transform((valor) => valor === 'true')
    .optional(),
}).strict();

export type ListarProdutosFiltros = z.infer<typeof listarProdutosQuerySchema>;
