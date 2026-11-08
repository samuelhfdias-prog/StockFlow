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
