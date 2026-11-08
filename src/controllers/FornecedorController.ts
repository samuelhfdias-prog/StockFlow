import type { RequestHandler } from 'express';
import type { AtualizarFornecedorInput, CriarFornecedorInput } from '../schemas/fornecedor.schema';
import { FornecedorService } from '../services/FornecedorService';

export class FornecedorController {
  constructor(private readonly fornecedorService = new FornecedorService()) {}

  criar: RequestHandler<Record<string, never>, unknown, CriarFornecedorInput> = async (req, res) => {
    const fornecedor = await this.fornecedorService.criar(req.body);
    res.status(201).json(fornecedor);
  };

  listar: RequestHandler = async (_req, res) => {
    const fornecedores = await this.fornecedorService.listar();
    res.status(200).json(fornecedores);
  };

  buscarPorId: RequestHandler<{ id: string }> = async (req, res) => {
    const fornecedor = await this.fornecedorService.buscarPorId(req.params.id);
    res.status(200).json(fornecedor);
  };

  atualizar: RequestHandler<{ id: string }, unknown, AtualizarFornecedorInput> = async (req, res) => {
    const fornecedor = await this.fornecedorService.atualizar(req.params.id, req.body);
    res.status(200).json(fornecedor);
  };
}
