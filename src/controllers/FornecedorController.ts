import type { RequestHandler } from 'express';
import type { CriarFornecedorInput } from '../schemas/fornecedor.schema';
import { FornecedorService } from '../services/FornecedorService';

export class FornecedorController {
  constructor(private readonly fornecedorService = new FornecedorService()) {}

  criar: RequestHandler<Record<string, never>, unknown, CriarFornecedorInput> = async (req, res) => {
    const fornecedor = await this.fornecedorService.criar(req.body);
    res.status(201).json(fornecedor);
  };
}
