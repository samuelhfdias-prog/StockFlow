import type { RequestHandler } from 'express';
import { ClienteService } from '../services/ClienteService';
import type { CriarClienteInput } from '../schemas/cliente.schema';

export class ClienteController {
  constructor(private readonly clienteService = new ClienteService()) {}

  criar: RequestHandler<Record<string, never>, unknown, CriarClienteInput> = async (req, res) => {
    const cliente = await this.clienteService.criar(req.body);
    res.status(201).json(cliente);
  };
}
