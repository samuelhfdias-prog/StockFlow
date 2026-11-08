import { describe, expect, it, vi } from 'vitest';
import type { ClienteRepository } from '../src/repositories/ClienteRepository';
import type { FornecedorRepository } from '../src/repositories/FornecedorRepository';
import type { ProdutoRepository } from '../src/repositories/ProdutoRepository';
import { ClienteService } from '../src/services/ClienteService';
import { FornecedorService } from '../src/services/FornecedorService';
import { ProdutoService } from '../src/services/ProdutoService';

const criarRepositorioCliente = (sobrescritos: Partial<ClienteRepository> = {}) => ({
  findByCnpj: vi.fn<ClienteRepository['findByCnpj']>(),
  findByEmail: vi.fn<ClienteRepository['findByEmail']>(),
  create: vi.fn<ClienteRepository['create']>(),
  findAll: vi.fn<ClienteRepository['findAll']>(),
  findByIdWithPedidos: vi.fn<ClienteRepository['findByIdWithPedidos']>(),
  findById: vi.fn<ClienteRepository['findById']>(),
  update: vi.fn<ClienteRepository['update']>(),
  countPedidosByClienteId: vi.fn<ClienteRepository['countPedidosByClienteId']>(),
  delete: vi.fn<ClienteRepository['delete']>(),
  ...sobrescritos,
});

const criarRepositorioFornecedor = (sobrescritos: Partial<FornecedorRepository> = {}) => ({
  findByCnpj: vi.fn<FornecedorRepository['findByCnpj']>(),
  findById: vi.fn<FornecedorRepository['findById']>(),
  create: vi.fn<FornecedorRepository['create']>(),
  update: vi.fn<FornecedorRepository['update']>(),
  findByIdWithProdutoCount: vi.fn<FornecedorRepository['findByIdWithProdutoCount']>(),
  delete: vi.fn<FornecedorRepository['delete']>(),
  findAll: vi.fn<FornecedorRepository['findAll']>(),
  findByIdWithProdutos: vi.fn<FornecedorRepository['findByIdWithProdutos']>(),
  ...sobrescritos,
});

const criarRepositorioProduto = (sobrescritos: Partial<ProdutoRepository> = {}) => ({
  findBySku: vi.fn<ProdutoRepository['findBySku']>(),
  findById: vi.fn<ProdutoRepository['findById']>(),
  create: vi.fn<ProdutoRepository['create']>(),
  update: vi.fn<ProdutoRepository['update']>(),
  countItensPedidoByProdutoId: vi.fn<ProdutoRepository['countItensPedidoByProdutoId']>(),
  delete: vi.fn<ProdutoRepository['delete']>(),
  findAll: vi.fn<ProdutoRepository['findAll']>(),
  findByIdWithFornecedor: vi.fn<ProdutoRepository['findByIdWithFornecedor']>(),
  ...sobrescritos,
});

describe('Services de cadastros', () => {
  it('recusa cliente com CNPJ repetido', async () => {
    const repositorio = criarRepositorioCliente({
      findByCnpj: vi.fn().mockResolvedValue({ id: 1 }),
    });
    const servico = new ClienteService(repositorio);

    await expect(servico.criar({
      razaoSocial: 'Cliente',
      cnpj: '12345678000190',
      email: 'cliente@example.com',
      telefone: '11999999999',
      limiteCredito: 1000,
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('recusa fornecedor com CNPJ repetido', async () => {
    const repositorio = criarRepositorioFornecedor({
      findByCnpj: vi.fn().mockResolvedValue({ id: 1 }),
    });
    const servico = new FornecedorService(repositorio);

    await expect(servico.criar({
      nomeFantasia: 'Fornecedor',
      cnpj: '12345678000190',
      emailContato: 'contato@example.com',
      prazoEntrega: 5,
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('exige preço de venda maior que o custo e fornecedor ativo', async () => {
    const produtos = criarRepositorioProduto({
      findBySku: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 1 }),
    });
    const fornecedorInativo = criarRepositorioFornecedor({
      findById: vi.fn().mockResolvedValue({ id: 3, ativo: false }),
    });
    const servico = new ProdutoService(produtos, fornecedorInativo);
    const dados = {
      sku: 'SKU-1',
      nome: 'Produto',
      precoCusto: 10,
      precoVenda: 15,
      estoqueAtual: 4,
      estoqueMinimo: 2,
      fornecedorId: 3,
    };

    await expect(servico.criar({ ...dados, precoVenda: 10 }))
      .rejects.toMatchObject({ statusCode: 422 });
    await expect(servico.criar(dados))
      .rejects.toMatchObject({ statusCode: 422, message: 'O fornecedor informado está inativo.' });
    expect(produtos.create).not.toHaveBeenCalled();
  });
});
