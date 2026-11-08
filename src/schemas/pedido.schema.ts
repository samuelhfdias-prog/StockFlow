import { z } from 'zod';

const idSchema = z.number()
  .int()
  .positive('O ID deve ser um inteiro positivo.')
  .max(2_147_483_647, 'O ID excede o limite permitido.');

export const criarPedidoSchema = z.object({
  clienteId: idSchema,
  itens: z.array(z.object({
    produtoId: idSchema,
    quantidade: z.number()
      .int()
      .positive('A quantidade deve ser um inteiro positivo.')
      .max(2_147_483_647, 'A quantidade excede o limite permitido.'),
  }).strict()).min(1, 'O pedido deve conter ao menos um item.'),
}).strict();

export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>;

export const listarPedidosQuerySchema = z.object({
  status: z.enum(['APROVADO', 'CANCELADO']).optional(),
  clienteId: z.string()
    .regex(/^[1-9]\d*$/, 'O ID do cliente deve ser um inteiro positivo.')
    .transform(Number)
    .refine(Number.isSafeInteger, 'O ID do cliente excede o limite permitido.')
    .optional(),
}).strict();

export type ListarPedidosFiltros = z.infer<typeof listarPedidosQuerySchema>;
