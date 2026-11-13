import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { jwtSecret } from '../config/jwt';
import { AppError } from '../errors/AppError';

type AuthenticatedPayload = JwtPayload & {
  id: number;
  cargo: string;
};

const isAuthenticatedPayload = (payload: string | JwtPayload): payload is AuthenticatedPayload => (
  typeof payload === 'object'
  && payload !== null
  && typeof payload.id === 'number'
  && Number.isSafeInteger(payload.id)
  && typeof payload.cargo === 'string'
);

export const ensureAuthenticated: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;
  const match = typeof authorization === 'string'
    ? /^Bearer\s+(\S+)$/i.exec(authorization)
    : undefined;

  if (!match) {
    next(new AppError('Token de autenticação não informado.', 401));
    return;
  }

  let payload: string | JwtPayload;

  try {
    payload = jwt.verify(match[1], jwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido ou expirado.', 401));
      return;
    }

    next(error);
    return;
  }

  if (!isAuthenticatedPayload(payload)) {
    next(new AppError('Token inválido ou expirado.', 401));
    return;
  }

  req.user = {
    id: payload.id,
    cargo: payload.cargo,
  };
  next();
};
