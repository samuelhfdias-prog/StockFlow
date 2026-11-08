import type { RequestHandler } from 'express';
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
}
