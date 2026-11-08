import type { RequestHandler } from 'express';
import type { CriarProdutoInput } from '../schemas/produto.schema';
import { ProdutoService } from '../services/ProdutoService';

export class ProdutoController {
  constructor(private readonly produtoService = new ProdutoService()) {}

  criar: RequestHandler<Record<string, never>, unknown, CriarProdutoInput> = async (req, res) => {
    const produto = await this.produtoService.criar(req.body);
    res.status(201).json(produto);
  };
}
