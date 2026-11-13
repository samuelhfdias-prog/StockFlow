import { z } from 'zod';

// Limites das colunas DECIMAL(10,2) e INT do MySQL; valores acima disso estouram no banco com erro 500.
export const LIMITE_MONETARIO = 99_999_999.99;
export const LIMITE_INTEIRO = 2_147_483_647;

export const textoObrigatorioSchema = (mensagem: string) => z.string()
  .trim()
  .min(1, mensagem)
  .max(191, 'Use no máximo 191 caracteres.');

export const valorMonetarioSchema = (mensagemPositivo: string) => z.number()
  .positive(mensagemPositivo)
  .max(LIMITE_MONETARIO, 'O valor excede o máximo permitido de R$ 99.999.999,99.')
  .multipleOf(0.01, 'Informe no máximo duas casas decimais.');

export const quantidadeEstoqueSchema = (mensagemNegativo: string) => z.number()
  .int()
  .nonnegative(mensagemNegativo)
  .max(LIMITE_INTEIRO, 'A quantidade excede o limite permitido.');
