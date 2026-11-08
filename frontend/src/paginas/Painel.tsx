import { AlertTriangle, ArrowUpRight, Boxes, Building2, ClipboardList, Users } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Aviso, Carregando } from '../componentes/Modal';
import { api } from '../servicos/api';
import type { Cliente, Fornecedor, Pedido, Produto } from '../tipos';

export function PainelPrincipal() {
  const [clientes, definirClientes] = useState<Cliente[]>([]);
  const [fornecedores, definirFornecedores] = useState<Fornecedor[]>([]);
  const [pedidos, definirPedidos] = useState<Pedido[]>([]);
  const [criticos, definirCriticos] = useState<Produto[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState('');

  useEffect(() => {
    Promise.all([
      api.listarClientes({ ativo: true }),
      api.listarFornecedores(),
      api.listarPedidos({ status: 'APROVADO' }),
      api.listarProdutos({ estoqueCritico: true }),
    ]).then(([listaClientes, listaFornecedores, listaPedidos, listaProdutos]) => {
      definirClientes(listaClientes);
      definirFornecedores(listaFornecedores);
      definirPedidos(listaPedidos);
      definirCriticos(listaProdutos);
    }).catch((falha) => definirErro(falha instanceof Error ? falha.message : 'Falha ao carregar o painel.'))
      .finally(() => definirCarregando(false));
  }, []);

  if (carregando) return <Carregando mensagem="Carregando indicadores..." />;

  return (
    <div>
      <div className="mb-7"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Visão geral</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Painel principal</h1><p className="mt-2 text-slate-500">Acompanhe a operação da sua carteira B2B.</p></div>
      {erro && <Aviso mensagem={erro} fechar={() => definirErro('')} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador titulo="Clientes ativos" valor={clientes.length} icone={<Users />} cor="bg-blue-50 text-blue-700" />
        <Indicador titulo="Fornecedores" valor={fornecedores.length} icone={<Building2 />} cor="bg-violet-50 text-violet-700" />
        <Indicador titulo="Pedidos aprovados" valor={pedidos.length} icone={<ClipboardList />} cor="bg-emerald-50 text-emerald-700" />
        <Indicador titulo="Estoque crítico" valor={criticos.length} icone={<Boxes />} cor="bg-amber-50 text-amber-700" />
      </div>
      <section className="mt-8 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><AlertTriangle className="text-amber-600" size={20} /><h2 className="font-bold text-slate-900">Reposição imediata</h2></div>
          <Link to="/produtos" className="flex items-center gap-1 text-sm font-semibold text-blue-700">Ver produtos <ArrowUpRight size={16} /></Link>
        </div>
        {criticos.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Nenhum produto atingiu o estoque mínimo.</p> : (
          <div className="divide-y divide-slate-100">
            {criticos.slice(0, 8).map((produto) => (
              <div key={produto.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div><p className="font-semibold text-slate-800">{produto.nome}</p><p className="text-xs text-slate-500">{produto.sku} · {produto.fornecedor?.nomeFantasia}</p></div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{produto.estoqueAtual} / mín. {produto.estoqueMinimo}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Indicador({ titulo, valor, icone, cor }: { titulo: string; valor: number; icone: ReactNode; cor: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex rounded-xl p-3 ${cor}`}>{icone}</div>
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}
