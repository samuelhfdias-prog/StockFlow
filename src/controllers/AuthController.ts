import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { AuthService } from '../services/AuthService';
import type { LoginInput, RegistrarUsuarioInput } from '../schemas/auth.schema';

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  registrar: RequestHandler<Record<string, never>, unknown, RegistrarUsuarioInput> = async (req, res) => {
    const usuario = await this.authService.registrar(req.body);
    res.status(201).json(usuario);
  };

  login: RequestHandler<Record<string, never>, unknown, LoginInput> = async (req, res) => {
    const resultado = await this.authService.login(req.body);
    res.status(200).json(resultado);
  };

  me: RequestHandler = async (req, res) => {
    if (!req.user) {
      throw new AppError('Token de autenticação não informado.', 401);
    }

    const usuario = await this.authService.me(req.user.id);
    res.status(200).json(usuario);
  };
}
