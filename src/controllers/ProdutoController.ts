import type { RequestHandler } from 'express';
import type { CriarProdutoInput } from '../schemas/produto.schema';
import { ProdutoService } from '../services/ProdutoService';

export class ProdutoController {
  constructor(private readonly produtoService = new ProdutoService()) {}

  criar: RequestHandler<Record<string, never>, unknown, CriarProdutoInput> = async (req, res) => {
    const produto = await this.produtoService.criar(req.body);
    res.status(201).json(produto);
  };

  listar: RequestHandler = async (req, res) => {
    const produtos = await this.produtoService.listar({
      fornecedorId: req.query.fornecedorId,
      estoqueCritico: req.query.estoqueCritico,
    });
    res.status(200).json(produtos);
  };

  buscarPorId: RequestHandler<{ id: string }> = async (req, res) => {
    const produto = await this.produtoService.buscarPorId(req.params.id);
    res.status(200).json(produto);
  };
}
