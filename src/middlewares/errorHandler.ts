import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
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

  if (
    error instanceof SyntaxError
    && 'status' in error
    && error.status === 400
    && 'type' in error
    && error.type === 'entity.parse.failed'
  ) {
    res.status(400).json({ message: 'O corpo da requisição não contém um JSON válido.' });
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Erro interno do servidor.' });
};
