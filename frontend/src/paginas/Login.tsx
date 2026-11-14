import { Boxes, LockKeyhole, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';
import { Aviso, classesBotao, classesCampo } from '../componentes/Modal';
import { useAviso } from '../componentes/useAviso';
import type { AvisoTela } from '../tipos';

export function PaginaLogin() {
  const { usuario, entrar } = useAutenticacao();
  const localizacao = useLocation();
  const estado = localizacao.state as { de?: string; aviso?: AvisoTela } | null;
  const destino = estado?.de || '/';
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [avisoInicial, definirAvisoInicial] = useState(estado?.aviso ?? null);
  const { aviso, mostrarErro, limpar } = useAviso();
  const [enviando, definirEnviando] = useState(false);

  // Depois do login o contexto preenche `usuario`; o redirecionamento acontece aqui, já com o destino original.
  if (usuario) return <Navigate to={destino} replace />;

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    limpar();
    definirAvisoInicial(null);
    definirEnviando(true);
    try {
      await entrar(email, senha);
    } catch (falha) {
      mostrarErro(falha, 'Não foi possível entrar.');
      definirEnviando(false);
    }
  };

  const avisoAtual = aviso ?? avisoInicial;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marca-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3 text-white"><Boxes /></div>
          <div><h1 className="text-2xl font-bold text-slate-900">StockFlow</h1><p className="text-sm text-slate-500">Acesse a gestão B2B</p></div>
        </div>
        {avisoAtual && <Aviso {...avisoAtual} fechar={() => { limpar(); definirAvisoInicial(null); }} />}
        <form onSubmit={enviar} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">E-mail
            <span className="relative mt-1 block"><Mail className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className={`${classesCampo} pl-10`} type="email" autoComplete="email" required value={email} onChange={(evento) => definirEmail(evento.target.value)} /></span>
          </label>
          <label className="block text-sm font-medium text-slate-700">Senha
            <span className="relative mt-1 block"><LockKeyhole className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className={`${classesCampo} pl-10`} type="password" autoComplete="current-password" required value={senha} onChange={(evento) => definirSenha(evento.target.value)} /></span>
          </label>
          <button className={`${classesBotao} w-full py-2.5`} disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">Ainda não tem acesso? <Link to="/cadastro" className="font-semibold text-blue-700 hover:underline">Cadastre um operador</Link></p>
      </div>
    </div>
  );
}
