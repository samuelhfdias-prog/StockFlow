import type { RequestHandler } from 'express';
import type { CriarPedidoInput } from '../schemas/pedido.schema';
import { PedidoService } from '../services/PedidoService';

export class PedidoController {
  constructor(private readonly pedidoService = new PedidoService()) {}

  criarPedido: RequestHandler<Record<string, never>, unknown, CriarPedidoInput> = async (req, res) => {
    const resultado = await this.pedidoService.criarPedido(req.body);
    res.status(201).json(resultado);
  };

  buscarPorId: RequestHandler<{ id: string }> = async (req, res) => {
    const pedido = await this.pedidoService.buscarPorId(req.params.id);
    res.status(200).json(pedido);
  };

  cancelarPedido: RequestHandler<{ id: string }> = async (req, res) => {
    const resultado = await this.pedidoService.cancelarPedido(req.params.id);
    res.status(200).json(resultado);
  };
}
