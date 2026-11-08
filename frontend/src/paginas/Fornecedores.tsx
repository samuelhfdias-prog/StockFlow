import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Aviso, Carregando, classesBotao, classesBotaoSecundario, classesCampo, EstadoVazio, Modal } from '../componentes/Modal';
import { api } from '../servicos/api';
import type { AtualizarFornecedor, CriarFornecedor, Fornecedor } from '../tipos';

const formularioVazio: CriarFornecedor = { nomeFantasia: '', cnpj: '', emailContato: '', prazoEntrega: 1 };

export function PaginaFornecedores() {
  const [fornecedores, definirFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState('');
  const [formAberto, definirFormAberto] = useState(false);
  const [formulario, definirFormulario] = useState<CriarFornecedor & { ativo: boolean }>({ ...formularioVazio, ativo: true });
  const [editando, definirEditando] = useState<Fornecedor | null>(null);
  const [detalhe, definirDetalhe] = useState<Fornecedor | null>(null);
  const [salvando, definirSalvando] = useState(false);

  const carregar = async () => {
    definirCarregando(true);
    try {
      definirFornecedores(await api.listarFornecedores());
      definirErro('');
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Falha ao carregar fornecedores.');
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

  const abrirEdicao = (fornecedor: Fornecedor) => {
    definirEditando(fornecedor);
    definirFormulario({
      nomeFantasia: fornecedor.nomeFantasia,
      cnpj: fornecedor.cnpj,
      emailContato: fornecedor.emailContato,
      prazoEntrega: fornecedor.prazoEntrega,
      ativo: fornecedor.ativo,
    });
    definirFormAberto(true);
  };

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault();
    definirSalvando(true);
    try {
      if (editando) {
        const { nomeFantasia, emailContato, prazoEntrega, ativo } = formulario;
        const dados: AtualizarFornecedor = { nomeFantasia, emailContato, prazoEntrega, ativo };
        await api.atualizarFornecedor(editando.id, dados);
      } else {
        const { nomeFantasia, cnpj, emailContato, prazoEntrega } = formulario;
        await api.criarFornecedor({ nomeFantasia, cnpj, emailContato, prazoEntrega });
      }
      definirFormAberto(false);
      await carregar();
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não foi possível salvar o fornecedor.');
    } finally {
      definirSalvando(false);
    }
  };

  const excluir = async (fornecedor: Fornecedor) => {
    if (!window.confirm(`Excluir ${fornecedor.nomeFantasia}?`)) return;
    try {
      await api.excluirFornecedor(fornecedor.id);
      await carregar();
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não foi possível excluir o fornecedor.');
    }
  };

  const abrirDetalhe = async (fornecedor: Fornecedor) => {
    try {
      definirDetalhe(await api.buscarFornecedor(fornecedor.id));
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não foi possível abrir o fornecedor.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Cadastros</p><h1 className="mt-1 text-3xl font-bold">Fornecedores</h1><p className="mt-2 text-slate-500">Parceiros homologados e seus produtos no catálogo.</p></div>
        <button className={classesBotao} onClick={abrirNovo}><Plus size={18} />Novo fornecedor</button>
      </div>
      {erro && <Aviso mensagem={erro} fechar={() => definirErro('')} />}
      {carregando ? <Carregando /> : fornecedores.length === 0 ? <EstadoVazio mensagem="Nenhum fornecedor cadastrado." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Nome fantasia</th><th className="px-4 py-3">CNPJ</th><th className="px-4 py-3">Prazo médio</th><th className="px-4 py-3">Produtos</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{fornecedores.map((fornecedor) => <tr key={fornecedor.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-semibold">{fornecedor.nomeFantasia}</td><td className="px-4 py-3 text-slate-600">{fornecedor.cnpj}</td><td className="px-4 py-3">{fornecedor.prazoEntrega} dias</td><td className="px-4 py-3">{fornecedor._count?.produtos ?? 0}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${fornecedor.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{fornecedor.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td className="px-4 py-3"><div className="flex gap-1"><Acao rotulo="Produtos" onClick={() => void abrirDetalhe(fornecedor)}><Eye size={16} /></Acao><Acao rotulo="Editar" onClick={() => abrirEdicao(fornecedor)}><Pencil size={16} /></Acao><Acao rotulo="Excluir" onClick={() => void excluir(fornecedor)}><Trash2 size={16} /></Acao></div></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {formAberto && <Modal titulo={editando ? 'Editar fornecedor' : 'Novo fornecedor'} fechar={() => definirFormAberto(false)}>
        <form onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
          <Campo titulo="Nome fantasia"><input className={classesCampo} required value={formulario.nomeFantasia} onChange={(evento) => definirFormulario({ ...formulario, nomeFantasia: evento.target.value })} /></Campo>
          <Campo titulo="CNPJ"><input className={classesCampo} required disabled={Boolean(editando)} value={formulario.cnpj} onChange={(evento) => definirFormulario({ ...formulario, cnpj: evento.target.value })} /></Campo>
          <Campo titulo="E-mail de contato"><input className={classesCampo} type="email" required value={formulario.emailContato} onChange={(evento) => definirFormulario({ ...formulario, emailContato: evento.target.value })} /></Campo>
          <Campo titulo="Prazo médio (dias)"><input className={classesCampo} type="number" min="1" step="1" required value={formulario.prazoEntrega} onChange={(evento) => definirFormulario({ ...formulario, prazoEntrega: Number(evento.target.value) })} /></Campo>
          {editando && <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={formulario.ativo} onChange={(evento) => definirFormulario({ ...formulario, ativo: evento.target.checked })} />Fornecedor ativo</label>}
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className={classesBotaoSecundario} onClick={() => definirFormAberto(false)}>Cancelar</button><button className={classesBotao} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button></div>
        </form>
      </Modal>}

      {detalhe && <Modal titulo={`Produtos de ${detalhe.nomeFantasia}`} fechar={() => definirDetalhe(null)} largo>
        {detalhe.produtos?.length ? <div className="divide-y divide-slate-100">{detalhe.produtos.map((produto) => <div key={produto.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><div><p className="font-semibold">{produto.nome}</p><p className="text-xs text-slate-500">{produto.sku}</p></div><p>{produto.estoqueAtual} em estoque · {formatarMoeda(produto.precoVenda)}</p></div>)}</div> : <p className="text-sm text-slate-500">Este fornecedor ainda não tem produtos cadastrados.</p>}
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
