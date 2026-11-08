import { AlertTriangle, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Aviso, Carregando, classesBotao, classesBotaoSecundario, classesCampo, EstadoVazio, Modal } from '../componentes/Modal';
import { api } from '../servicos/api';
import type { AtualizarProduto, CriarProduto, Fornecedor, Produto } from '../tipos';

const formularioVazio: CriarProduto = { sku: '', nome: '', precoCusto: 0, precoVenda: 0, estoqueAtual: 0, estoqueMinimo: 0, fornecedorId: 0 };

export function PaginaProdutos() {
  const [produtos, definirProdutos] = useState<Produto[]>([]);
  const [fornecedores, definirFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorId, definirFornecedorId] = useState('');
  const [somenteCriticos, definirSomenteCriticos] = useState(false);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState('');
  const [formAberto, definirFormAberto] = useState(false);
  const [formulario, definirFormulario] = useState<CriarProduto>(formularioVazio);
  const [editando, definirEditando] = useState<Produto | null>(null);
  const [detalhe, definirDetalhe] = useState<Produto | null>(null);
  const [salvando, definirSalvando] = useState(false);

  const carregarFornecedores = async () => {
    try { definirFornecedores(await api.listarFornecedores()); }
    catch (falha) { definirErro(falha instanceof Error ? falha.message : 'Falha ao carregar fornecedores.'); }
  };

  const carregar = async () => {
    definirCarregando(true);
    try {
      definirProdutos(await api.listarProdutos({
        fornecedorId: fornecedorId ? Number(fornecedorId) : undefined,
        estoqueCritico: somenteCriticos ? true : undefined,
      }));
      definirErro('');
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Falha ao carregar produtos.');
    } finally { definirCarregando(false); }
  };

  useEffect(() => { void carregarFornecedores(); void carregar(); }, []);

  const abrirNovo = () => {
    definirEditando(null);
    definirFormulario({ ...formularioVazio, fornecedorId: fornecedores.find((item) => item.ativo)?.id ?? 0 });
    definirFormAberto(true);
  };

  const abrirEdicao = (produto: Produto) => {
    definirEditando(produto);
    definirFormulario({
      sku: produto.sku,
      nome: produto.nome,
      precoCusto: produto.precoCusto,
      precoVenda: produto.precoVenda,
      estoqueAtual: produto.estoqueAtual,
      estoqueMinimo: produto.estoqueMinimo,
      fornecedorId: produto.fornecedorId,
    });
    definirFormAberto(true);
  };

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault();
    definirErro('');
    if (formulario.precoVenda <= formulario.precoCusto) {
      definirErro('O preço de venda precisa ser maior que o preço de custo.');
      return;
    }

    definirSalvando(true);
    try {
      if (editando) {
        const dados: AtualizarProduto = formulario;
        await api.atualizarProduto(editando.id, dados);
      } else {
        await api.criarProduto(formulario);
      }
      definirFormAberto(false);
      await carregar();
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não foi possível salvar o produto.');
    } finally { definirSalvando(false); }
  };

  const abrirDetalhe = async (produto: Produto) => {
    try { definirDetalhe(await api.buscarProduto(produto.id)); }
    catch (falha) { definirErro(falha instanceof Error ? falha.message : 'Não foi possível abrir o produto.'); }
  };

  const excluir = async (produto: Produto) => {
    if (!window.confirm(`Excluir ${produto.nome}?`)) return;
    try { await api.excluirProduto(produto.id); await carregar(); }
    catch (falha) { definirErro(falha instanceof Error ? falha.message : 'Não foi possível excluir o produto.'); }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Catálogo</p><h1 className="mt-1 text-3xl font-bold">Produtos</h1><p className="mt-2 text-slate-500">Estoque, preços e fornecedor de cada item.</p></div>
        <button className={classesBotao} onClick={abrirNovo}><Plus size={18} />Novo produto</button>
      </div>
      {erro && <Aviso mensagem={erro} fechar={() => definirErro('')} />}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <select className={`${classesCampo} w-auto min-w-56`} value={fornecedorId} onChange={(evento) => definirFornecedorId(evento.target.value)}><option value="">Todos os fornecedores</option>{fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nomeFantasia}</option>)}</select>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={somenteCriticos} onChange={(evento) => definirSomenteCriticos(evento.target.checked)} />Somente estoque crítico</label>
        <button className={classesBotaoSecundario} onClick={() => void carregar()}><Search size={16} />Filtrar</button>
      </div>
      {carregando ? <Carregando /> : produtos.length === 0 ? <EstadoVazio mensagem="Nenhum produto encontrado." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Produto</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Venda</th><th className="px-4 py-3">Estoque</th><th className="px-4 py-3">Ações</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{produtos.map((produto) => {
                const critico = produto.estoqueCritico ?? produto.estoqueAtual <= produto.estoqueMinimo;
                return <tr key={produto.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3"><p className="font-semibold">{produto.nome}</p><p className="text-xs text-slate-500">{produto.sku}</p></td>
                  <td className="px-4 py-3 text-slate-600">{produto.fornecedor?.nomeFantasia ?? fornecedores.find((item) => item.id === produto.fornecedorId)?.nomeFantasia ?? `#${produto.fornecedorId}`}</td>
                  <td className="px-4 py-3">{formatarMoeda(produto.precoVenda)}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${critico ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{critico && <AlertTriangle size={13} />}{produto.estoqueAtual} / mín. {produto.estoqueMinimo}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-1"><Acao rotulo="Detalhes" onClick={() => void abrirDetalhe(produto)}><Eye size={16} /></Acao><Acao rotulo="Editar" onClick={() => abrirEdicao(produto)}><Pencil size={16} /></Acao><Acao rotulo="Excluir" onClick={() => void excluir(produto)}><Trash2 size={16} /></Acao></div></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {formAberto && <Modal titulo={editando ? 'Editar produto' : 'Novo produto'} fechar={() => definirFormAberto(false)} largo>
        <form onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
          <Campo titulo="SKU"><input className={classesCampo} required value={formulario.sku} onChange={(evento) => definirFormulario({ ...formulario, sku: evento.target.value })} /></Campo>
          <Campo titulo="Nome"><input className={classesCampo} required value={formulario.nome} onChange={(evento) => definirFormulario({ ...formulario, nome: evento.target.value })} /></Campo>
          <Campo titulo="Preço de custo"><input className={classesCampo} type="number" min="0.01" step="0.01" required value={formulario.precoCusto} onChange={(evento) => definirFormulario({ ...formulario, precoCusto: Number(evento.target.value) })} /></Campo>
          <Campo titulo="Preço de venda"><input className={classesCampo} type="number" min="0.01" step="0.01" required value={formulario.precoVenda} onChange={(evento) => definirFormulario({ ...formulario, precoVenda: Number(evento.target.value) })} /></Campo>
          <Campo titulo="Estoque atual"><input className={classesCampo} type="number" min="0" step="1" required value={formulario.estoqueAtual} onChange={(evento) => definirFormulario({ ...formulario, estoqueAtual: Number(evento.target.value) })} /></Campo>
          <Campo titulo="Estoque mínimo"><input className={classesCampo} type="number" min="0" step="1" required value={formulario.estoqueMinimo} onChange={(evento) => definirFormulario({ ...formulario, estoqueMinimo: Number(evento.target.value) })} /></Campo>
          <Campo titulo="Fornecedor"><select className={classesCampo} required value={formulario.fornecedorId} onChange={(evento) => definirFormulario({ ...formulario, fornecedorId: Number(evento.target.value) })}><option value={0} disabled>Selecione</option>{fornecedores.filter((item) => item.ativo || item.id === editando?.fornecedorId).map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nomeFantasia}</option>)}</select></Campo>
          <p className="self-end pb-2 text-xs text-slate-500">O preço de venda deve superar o custo.</p>
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className={classesBotaoSecundario} onClick={() => definirFormAberto(false)}>Cancelar</button><button className={classesBotao} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar produto'}</button></div>
        </form>
      </Modal>}

      {detalhe && <Modal titulo={detalhe.nome} fechar={() => definirDetalhe(null)}>
        <div className="space-y-3 text-sm">
          <p><span className="text-slate-500">SKU:</span> {detalhe.sku}</p>
          <p><span className="text-slate-500">Fornecedor:</span> {detalhe.fornecedor?.nomeFantasia}</p>
          <p><span className="text-slate-500">Custo:</span> {formatarMoeda(detalhe.precoCusto)}</p>
          <p><span className="text-slate-500">Venda:</span> {formatarMoeda(detalhe.precoVenda)}</p>
          <p><span className="text-slate-500">Margem sobre o custo:</span> <strong>{detalhe.margemLucroPercentual?.toFixed(2)}%</strong></p>
          <p><span className="text-slate-500">Estoque:</span> {detalhe.estoqueAtual} (mínimo {detalhe.estoqueMinimo})</p>
        </div>
      </Modal>}
    </div>
  );
}

function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <label className="block space-y-1 text-sm font-medium text-slate-700">{titulo}{children}</label>;
}

function Acao({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: ReactNode }) {
  return <button aria-label={rotulo} title={rotulo} onClick={onClick} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700">{children}</button>;
}

const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
