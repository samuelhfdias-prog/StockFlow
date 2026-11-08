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
