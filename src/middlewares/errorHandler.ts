import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { Prisma } from '../generated/prisma/client';

const mensagensPorTipo: Record<string, string> = {
  'entity.parse.failed': 'O corpo da requisição não contém um JSON válido.',
  'entity.too.large': 'O corpo da requisição excede o tamanho permitido.',
  'charset.unsupported': 'O charset da requisição não é aceito.',
  'encoding.unsupported': 'A codificação da requisição não é aceita.',
};

// Erros do body-parser já trazem o status HTTP correto; sem este tratamento, um corpo grande demais viraria 500.
const lerErroDeRequisicao = (error: unknown): { status: number; mensagem: string } | undefined => {
  if (typeof error !== 'object' || error === null || !('status' in error) || !('type' in error)) {
    return undefined;
  }

  const { status, type } = error;

  if (typeof status !== 'number' || status < 400 || status >= 500 || typeof type !== 'string') {
    return undefined;
  }

  return { status, mensagem: mensagensPorTipo[type] ?? 'Não foi possível processar a requisição.' };
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Dados inválidos.',
      errors: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
    res.status(409).json({ message: 'A operação entrou em conflito com outra requisição simultânea. Tente novamente.' });
    return;
  }

  const erroDeRequisicao = lerErroDeRequisicao(error);

  if (erroDeRequisicao) {
    res.status(erroDeRequisicao.status).json({ message: erroDeRequisicao.mensagem });
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Erro interno do servidor.' });
};
