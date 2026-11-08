import type { RequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client';

const serializarValor = (valor: unknown): unknown => {
  if (Prisma.Decimal.isDecimal(valor)) {
    const numero = valor.toNumber();

    if (!Number.isFinite(numero)) {
      throw new Error('Não foi possível serializar um valor Decimal não finito.');
    }

    return numero;
  }

  if (Array.isArray(valor)) {
    return valor.map(serializarValor);
  }

  if (valor === null || typeof valor !== 'object' || valor instanceof Date) {
    return valor;
  }

  const prototipo = Object.getPrototypeOf(valor);

  if (prototipo !== Object.prototype && prototipo !== null) {
    return valor;
  }

  return Object.fromEntries(
    Object.entries(valor).map(([chave, item]) => [chave, serializarValor(item)]),
  );
};

export const serializeDecimals: RequestHandler = (_req, res, next) => {
  const jsonOriginal = res.json.bind(res);
  res.json = ((valor: unknown) => jsonOriginal(serializarValor(valor))) as typeof res.json;
  next();
};
