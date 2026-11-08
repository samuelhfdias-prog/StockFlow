import { AlertTriangle, CheckCircle2, Eye, Plus, ShoppingCart, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Aviso, Carregando, classesBotao, classesBotaoSecundario, classesCampo, EstadoVazio, Modal } from '../componentes/Modal';
import { api } from '../servicos/api';
import type { AlertaReposicao, Cliente, Pedido, PedidoCriado, Produto } from '../tipos';

type ItemCarrinho = { produto: Produto; quantidade: number };

export function PaginaPedidos() {
  const [pedidos, definirPedidos] = useState<Pedido[]>([]);
  const [clientes, definirClientes] = useState<Cliente[]>([]);
  const [produtos, definirProdutos] = useState<Produto[]>([]);
  const [status, definirStatus] = useState('');
  const [clienteIdFiltro, definirClienteIdFiltro] = useState('');
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState('');
  const [formAberto, definirFormAberto] = useState(false);
  const [clienteId, definirClienteId] = useState('');
  const [produtoId, definirProdutoId] = useState('');
  const [quantidade, definirQuantidade] = useState(1);
  const [carrinho, definirCarrinho] = useState<ItemCarrinho[]>([]);
  const [pedidoDetalhe, definirPedidoDetalhe] = useState<Pedido | null>(null);
  const [alertas, definirAlertas] = useState<AlertaReposicao[] | null>(null);
  const [salvando, definirSalvando] = useState(false);

  const carregar = async () => {
    definirCarregando(true);
    try {
      const [listaPedidos, listaClientes, listaProdutos] = await Promise.all([
        api.listarPedidos({ status: status || undefined, clienteId: clienteIdFiltro ? Number(clienteIdFiltro) : undefined }),
        api.listarClientes({ ativo: true }),
        api.listarProdutos(),
      ]);
      definirPedidos(listaPedidos);
      definirClientes(listaClientes);
      definirProdutos(listaProdutos);
      definirErro('');
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Falha ao carregar pedidos.');
    } finally { definirCarregando(false); }
  };

  useEffect(() => { void carregar(); }, []);

  const clienteSelecionado = clientes.find((cliente) => cliente.id === Number(clienteId));
  const valorBruto = useMemo(() => carrinho.reduce((soma, item) => soma + item.produto.precoVenda * item.quantidade, 0), [carrinho]);
  const totalUnidades = useMemo(() => carrinho.reduce((soma, item) => soma + item.quantidade, 0), [carrinho]);
  const taxaDesconto = totalUnidades >= 30 || valorBruto > 7000 ? 0.1 : totalUnidades >= 10 || valorBruto > 2500 ? 0.05 : 0;
  const valorDesconto = Math.round((valorBruto * taxaDesconto + Number.EPSILON) * 100) / 100;
  const valorLiquido = valorBruto - valorDesconto;

  const adicionarItem = () => {
    const produto = produtos.find((item) => item.id === Number(produtoId));
    if (!produto) return;
    const noCarrinho = carrinho.find((item) => item.produto.id === produto.id)?.quantidade ?? 0;
    if (quantidade > produto.estoqueAtual - noCarrinho) {
      definirErro(`Saldo insuficiente para ${produto.sku}. Disponível: ${Math.max(0, produto.estoqueAtual - noCarrinho)}.`);
      return;
    }
    definirCarrinho((atual) => {
      const existente = atual.find((item) => item.produto.id === produto.id);
      return existente
        ? atual.map((item) => item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + quantidade } : item)
        : [...atual, { produto, quantidade }];
    });
    definirErro('');
  };

  const removerItem = (id: number) => definirCarrinho((atual) => atual.filter((item) => item.produto.id !== id));

  const criarPedido = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!clienteSelecionado || carrinho.length === 0) return;
    if (valorLiquido > clienteSelecionado.limiteCredito) {
      definirErro('Crédito disponível insuficiente para este pedido.');
      return;
    }
    definirSalvando(true);
    try {
      const resultado: PedidoCriado = await api.criarPedido({
        clienteId: clienteSelecionado.id,
        itens: carrinho.map((item) => ({ produtoId: item.produto.id, quantidade: item.quantidade })),
      });
      definirFormAberto(false);
      definirCarrinho([]);
      definirAlertas(resultado.alertasReposicao);
      await carregar();
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não foi possível aprovar o pedido.');
    } finally { definirSalvando(false); }
  };

  const abrirDetalhe = async (pedido: Pedido) => {
    try { definirPedidoDetalhe(await api.buscarPedido(pedido.id)); }
    catch (falha) { definirErro(falha instanceof Error ? falha.message : 'Não foi possível carregar o pedido.'); }
  };

  const cancelar = async (pedido: Pedido) => {
    if (!window.confirm(`Cancelar o pedido #${pedido.id} e estornar estoque e crédito?`)) return;
    try {
      await api.cancelarPedido(pedido.id);
      await carregar();
      if (pedidoDetalhe?.id === pedido.id) definirPedidoDetalhe(null);
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não foi possível cancelar o pedido.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Comercial</p><h1 className="mt-1 text-3xl font-bold">Pedidos</h1><p className="mt-2 text-slate-500">Acompanhe vendas, crédito e movimentação do estoque.</p></div>
        <button className={classesBotao} onClick={() => { definirClienteId(''); definirCarrinho([]); definirFormAberto(true); }}><Plus size={18} />Novo pedido</button>
      </div>
      {erro && <Aviso mensagem={erro} fechar={() => definirErro('')} />}
      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <select className={`${classesCampo} w-auto min-w-44`} value={status} onChange={(evento) => definirStatus(evento.target.value)}><option value="">Todos os status</option><option value="APROVADO">Aprovados</option><option value="CANCELADO">Cancelados</option></select>
        <select className={`${classesCampo} w-auto min-w-56`} value={clienteIdFiltro} onChange={(evento) => definirClienteIdFiltro(evento.target.value)}><option value="">Todos os clientes</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.razaoSocial}</option>)}</select>
        <button className={classesBotaoSecundario} onClick={() => void carregar()}>Filtrar</button>
      </div>
      {carregando ? <Carregando /> : pedidos.length === 0 ? <EstadoVazio mensagem="Nenhum pedido encontrado." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Total líquido</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{pedidos.map((pedido) => <tr key={pedido.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3 font-semibold">#{pedido.id}</td><td className="px-4 py-3">{pedido.cliente?.razaoSocial ?? `Cliente #${pedido.clienteId}`}</td><td className="px-4 py-3 text-slate-600">{formatarData(pedido.criadoEm)}</td><td className="px-4 py-3 font-semibold">{formatarMoeda(pedido.valorLiquido)}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pedido.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{pedido.status}</span></td>
              <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => void abrirDetalhe(pedido)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700" aria-label="Ver pedido"><Eye size={16} /></button>{pedido.status === 'APROVADO' && <button onClick={() => void cancelar(pedido)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Cancelar pedido"><XCircle size={16} /></button>}</div></td>
            </tr>)}</tbody>
          </table></div>
        </div>
      )}

      {formAberto && <Modal titulo="Novo pedido" fechar={() => definirFormAberto(false)} largo>
        <form onSubmit={criarPedido} className="space-y-5">
          <Campo titulo="Cliente ativo">
            <select className={classesCampo} required value={clienteId} onChange={(evento) => definirClienteId(evento.target.value)}><option value="">Selecione um cliente</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.razaoSocial} · crédito {formatarMoeda(cliente.limiteCredito)}</option>)}</select>
          </Campo>
          {clienteSelecionado && <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Crédito disponível: <strong>{formatarMoeda(clienteSelecionado.limiteCredito)}</strong></div>}
          <div className="grid gap-3 sm:grid-cols-[1fr_130px_auto]">
            <select className={classesCampo} value={produtoId} onChange={(evento) => definirProdutoId(evento.target.value)}><option value="">Selecione um produto</option>{produtos.map((produto) => <option key={produto.id} value={produto.id}>{produto.sku} · {produto.nome} · saldo {produto.estoqueAtual} · {formatarMoeda(produto.precoVenda)}</option>)}</select>
            <input className={classesCampo} type="number" min="1" step="1" value={quantidade} onChange={(evento) => definirQuantidade(Number(evento.target.value))} aria-label="Quantidade" />
            <button type="button" className={classesBotaoSecundario} disabled={!produtoId} onClick={adicionarItem}>Adicionar</button>
          </div>
          {carrinho.length > 0 && <div className="overflow-hidden rounded-lg border border-slate-200">
            {carrinho.map((item) => <div key={item.produto.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0"><span><strong>{item.produto.sku}</strong> · {item.produto.nome} × {item.quantidade}</span><span className="flex items-center gap-3">{formatarMoeda(item.produto.precoVenda * item.quantidade)}<button type="button" onClick={() => removerItem(item.produto.id)} className="text-xs font-semibold text-rose-600">Remover</button></span></div>)}
          </div>}
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between text-sm text-slate-600"><span>{totalUnidades} unidade(s)</span><span>Bruto: {formatarMoeda(valorBruto)}</span></div>
            <div className="mt-2 flex justify-between text-sm text-emerald-700"><span>Desconto estimado ({taxaDesconto * 100}%)</span><span>− {formatarMoeda(valorDesconto)}</span></div>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold"><span>Total líquido</span><span>{formatarMoeda(valorLiquido)}</span></div>
            {clienteSelecionado && valorLiquido > clienteSelecionado.limiteCredito && <p className="mt-2 text-sm font-semibold text-rose-700">Crédito insuficiente para fechar este pedido.</p>}
          </div>
          <div className="flex justify-end gap-2"><button type="button" className={classesBotaoSecundario} onClick={() => definirFormAberto(false)}>Cancelar</button><button className={classesBotao} disabled={salvando || !clienteSelecionado || carrinho.length === 0 || valorLiquido > (clienteSelecionado?.limiteCredito ?? 0)}><ShoppingCart size={17} />{salvando ? 'Processando...' : 'Aprovar pedido'}</button></div>
        </form>
      </Modal>}

      {pedidoDetalhe && <Modal titulo={`Espelho do pedido #${pedidoDetalhe.id}`} fechar={() => definirPedidoDetalhe(null)} largo>
        <div className="mb-4 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <p>Cliente: <strong>{pedidoDetalhe.cliente?.razaoSocial}</strong></p><p>Status: <strong>{pedidoDetalhe.status}</strong></p><p>Bruto: {formatarMoeda(pedidoDetalhe.valorBruto)}</p><p>Desconto: {formatarMoeda(pedidoDetalhe.valorDesconto)}</p><p className="font-bold">Líquido: {formatarMoeda(pedidoDetalhe.valorLiquido)}</p><p>Data: {formatarData(pedidoDetalhe.criadoEm)}</p>
        </div>
        <h3 className="mb-2 font-bold">Itens faturados</h3>
        <div className="divide-y divide-slate-100">{pedidoDetalhe.itensPedido.map((item) => <div key={item.id} className="flex justify-between gap-3 py-3 text-sm"><span>{item.produto?.sku} · {item.produto?.nome} × {item.quantidade}</span><span>{formatarMoeda(item.subtotal)}</span></div>)}</div>
        {pedidoDetalhe.status === 'APROVADO' && <button className="mt-5 inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" onClick={() => void cancelar(pedidoDetalhe)}><XCircle size={16} />Cancelar e estornar</button>}
      </Modal>}

      {alertas !== null && <Modal titulo="Pedido aprovado" fechar={() => definirAlertas(null)}>
        <div className="mb-4 flex items-center gap-2 text-emerald-700"><CheckCircle2 size={20} /><p className="font-semibold">Pedido registrado e crédito/estoque atualizados.</p></div>
        {alertas.length ? <><div className="mb-3 flex items-center gap-2 font-bold text-amber-800"><AlertTriangle size={18} />Produtos para reposição</div><div className="space-y-2">{alertas.map((alerta) => <div key={alerta.sku} className="rounded-lg bg-amber-50 p-3 text-sm"><strong>{alerta.sku}</strong> · {alerta.nome}<p className="mt-1 text-xs text-amber-800">Saldo {alerta.estoqueAtual} / mínimo {alerta.estoqueMinimo} · {alerta.nomeFantasia} ({alerta.prazoEntrega} dias)</p></div>)}</div></> : <p className="text-sm text-slate-500">Nenhum produto atingiu o estoque mínimo.</p>}
      </Modal>}
    </div>
  );
}

function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <label className="block space-y-1 text-sm font-medium text-slate-700">{titulo}{children}</label>;
}

const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
const formatarData = (valor: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor));
