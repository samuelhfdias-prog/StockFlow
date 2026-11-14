import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Aviso, Carregando, classesBotao, classesBotaoSecundario, classesCampo, EstadoVazio, Modal } from '../componentes/Modal';
import { api, ErroHttp } from '../servicos/api';
import { apenasAlterados } from '../servicos/utilitarios';
import type { AtualizarCliente, Cliente, CriarCliente } from '../tipos';

const formularioVazio: CriarCliente = { razaoSocial: '', cnpj: '', email: '', telefone: '', limiteCredito: 0 };

export function PaginaClientes() {
  const [clientes, definirClientes] = useState<Cliente[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState('');
  const [razaoSocial, definirRazaoSocial] = useState('');
  const [ativo, definirAtivo] = useState('');
  const [formAberto, definirFormAberto] = useState(false);
  const [formulario, definirFormulario] = useState<CriarCliente & { ativo: boolean }>({ ...formularioVazio, ativo: true });
  const [editando, definirEditando] = useState<Cliente | null>(null);
  const [detalhe, definirDetalhe] = useState<Cliente | null>(null);
  const [salvando, definirSalvando] = useState(false);

  const carregar = async () => {
    definirCarregando(true);
    try {
      definirClientes(await api.listarClientes({
        razaoSocial: razaoSocial || undefined,
        ativo: ativo === '' ? undefined : ativo === 'true',
      }));
      definirErro('');
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Falha ao carregar clientes.');
    } finally {
      definirCarregando(false);
    }
  };

  useEffect(() => { void carregar(); }, []);

  const abrirNovo = () => {
    definirEditando(null);
    definirFormulario({ ...formularioVazio, ativo: true });
    definirFormAberto(true);
  };

  const abrirEdicao = (cliente: Cliente) => {
    definirEditando(cliente);
    definirFormulario({
      razaoSocial: cliente.razaoSocial,
      cnpj: cliente.cnpj,
      email: cliente.email,
      telefone: cliente.telefone,
      limiteCredito: cliente.limiteCredito,
      ativo: cliente.ativo,
    });
    definirFormAberto(true);
  };

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault();
    definirSalvando(true);
    try {
      if (editando) {
        const original: typeof formulario = {
          razaoSocial: editando.razaoSocial,
          cnpj: editando.cnpj,
          email: editando.email,
          telefone: editando.telefone,
          limiteCredito: editando.limiteCredito,
          ativo: editando.ativo,
        };
        const dados: AtualizarCliente = apenasAlterados(original, formulario);
        if (Object.keys(dados).length > 0) await api.atualizarCliente(editando.id, dados);
      } else await api.criarCliente({
        razaoSocial: formulario.razaoSocial,
        cnpj: formulario.cnpj,
        email: formulario.email,
        telefone: formulario.telefone,
        limiteCredito: formulario.limiteCredito,
      });
      definirFormAberto(false);
      await carregar();
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não foi possível salvar o cliente.');
    } finally {
      definirSalvando(false);
    }
  };

  const excluir = async (cliente: Cliente) => {
    if (!window.confirm(`Excluir ${cliente.razaoSocial}?`)) return;
    try {
      await api.excluirCliente(cliente.id);
      await carregar();
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível excluir o cliente.';
      definirErro(falha instanceof ErroHttp && falha.status === 409
        ? `${mensagem} Edite o cadastro e inative o cliente para preservar o histórico.`
        : mensagem);
    }
  };

  const abrirDetalhe = async (cliente: Cliente) => {
    try {
      definirDetalhe(await api.buscarCliente(cliente.id));
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não foi possível abrir o cliente.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Cadastros</p><h1 className="mt-1 text-3xl font-bold">Clientes</h1><p className="mt-2 text-slate-500">Carteira de clientes e limite de crédito.</p></div>
        <button className={classesBotao} onClick={abrirNovo}><Plus size={18} />Novo cliente</button>
      </div>
      {erro && <Aviso mensagem={erro} fechar={() => definirErro('')} />}
      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={17} /><input className={`${classesCampo} pl-9`} placeholder="Buscar por razão social" value={razaoSocial} onChange={(evento) => definirRazaoSocial(evento.target.value)} onKeyDown={(evento) => { if (evento.key === 'Enter') void carregar(); }} /></div>
        <select className={`${classesCampo} w-auto min-w-40`} value={ativo} onChange={(evento) => definirAtivo(evento.target.value)}><option value="">Todos os status</option><option value="true">Ativos</option><option value="false">Inativos</option></select>
        <button className={classesBotaoSecundario} onClick={() => void carregar()}>Filtrar</button>
      </div>
      {carregando ? <Carregando /> : clientes.length === 0 ? <EstadoVazio mensagem="Nenhum cliente encontrado." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Razão social</th><th className="px-4 py-3">CNPJ</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Limite disponível</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.map((cliente) => <tr key={cliente.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold">{cliente.razaoSocial}</td><td className="px-4 py-3 text-slate-600">{cliente.cnpj}</td><td className="px-4 py-3 text-slate-600">{cliente.email}</td><td className="px-4 py-3">{formatarMoeda(cliente.limiteCredito)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cliente.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{cliente.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-1"><Acao rotulo="Detalhes" onClick={() => void abrirDetalhe(cliente)}><Eye size={16} /></Acao><Acao rotulo="Editar" onClick={() => abrirEdicao(cliente)}><Pencil size={16} /></Acao><Acao rotulo="Excluir" onClick={() => void excluir(cliente)}><Trash2 size={16} /></Acao></div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formAberto && <Modal titulo={editando ? 'Editar cliente' : 'Novo cliente'} fechar={() => definirFormAberto(false)}>
        <form onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
          <Campo titulo="Razão social"><input className={classesCampo} required value={formulario.razaoSocial} onChange={(evento) => definirFormulario({ ...formulario, razaoSocial: evento.target.value })} /></Campo>
          <Campo titulo="CNPJ"><input className={classesCampo} required value={formulario.cnpj} onChange={(evento) => definirFormulario({ ...formulario, cnpj: evento.target.value })} /></Campo>
          <Campo titulo="E-mail"><input className={classesCampo} type="email" required value={formulario.email} onChange={(evento) => definirFormulario({ ...formulario, email: evento.target.value })} /></Campo>
          <Campo titulo="Telefone"><input className={classesCampo} required value={formulario.telefone} onChange={(evento) => definirFormulario({ ...formulario, telefone: evento.target.value })} /></Campo>
          <Campo titulo="Limite de crédito (R$)"><input className={classesCampo} type="number" min="0.01" step="0.01" required value={formulario.limiteCredito} onChange={(evento) => definirFormulario({ ...formulario, limiteCredito: Number(evento.target.value) })} /></Campo>
          {editando && <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={formulario.ativo} onChange={(evento) => definirFormulario({ ...formulario, ativo: evento.target.checked })} />Cliente ativo</label>}
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className={classesBotaoSecundario} onClick={() => definirFormAberto(false)}>Cancelar</button><button className={classesBotao} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
        </form>
      </Modal>}

      {detalhe && <Modal titulo={detalhe.razaoSocial} fechar={() => definirDetalhe(null)} largo>
        <div className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-slate-500">CNPJ:</span> {detalhe.cnpj}</p><p><span className="text-slate-500">E-mail:</span> {detalhe.email}</p><p><span className="text-slate-500">Telefone:</span> {detalhe.telefone}</p><p><span className="text-slate-500">Crédito disponível:</span> {formatarMoeda(detalhe.limiteCredito)}</p></div>
        <h3 className="mb-3 mt-6 font-bold">Histórico de pedidos</h3>
        {detalhe.pedidos?.length ? <div className="divide-y divide-slate-100">{detalhe.pedidos.map((pedido) => <div key={pedido.id} className="flex justify-between py-3 text-sm"><span>Pedido #{pedido.id} · {pedido.status}</span><span>{formatarMoeda(pedido.valorLiquido)}</span></div>)}</div> : <p className="text-sm text-slate-500">Este cliente ainda não possui pedidos.</p>}
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
