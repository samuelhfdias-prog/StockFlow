import { Boxes, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Aviso, classesBotao, classesCampo } from '../componentes/Modal';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';

export function PaginaCadastro() {
  const { usuario, cadastrar } = useAutenticacao();
  const navegar = useNavigate();
  const [nome, definirNome] = useState('');
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [erro, definirErro] = useState('');
  const [enviando, definirEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    definirErro('');
    definirEnviando(true);
    try {
      await cadastrar(nome, email, senha);
      navegar('/login', {
        replace: true,
        state: { aviso: { mensagem: 'Operador cadastrado. Faça login para continuar.', severidade: 'sucesso' } },
      });
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não foi possível concluir o cadastro.');
    } finally {
      definirEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marca-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3 text-white"><Boxes /></div>
          <div><h1 className="text-2xl font-bold text-slate-900">Novo operador</h1><p className="text-sm text-slate-500">Crie um acesso para a equipe</p></div>
        </div>
        {erro && <Aviso mensagem={erro} fechar={() => definirErro('')} />}
        <form onSubmit={enviar} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Nome
            <span className="relative mt-1 block"><UserRound className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className={`${classesCampo} pl-10`} required minLength={1} value={nome} onChange={(evento) => definirNome(evento.target.value)} /></span>
          </label>
          <label className="block text-sm font-medium text-slate-700">E-mail
            <span className="relative mt-1 block"><Mail className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className={`${classesCampo} pl-10`} type="email" autoComplete="email" required value={email} onChange={(evento) => definirEmail(evento.target.value)} /></span>
          </label>
          <label className="block text-sm font-medium text-slate-700">Senha
            <span className="relative mt-1 block"><LockKeyhole className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className={`${classesCampo} pl-10`} type="password" autoComplete="new-password" minLength={6} required value={senha} onChange={(evento) => definirSenha(evento.target.value)} /></span>
          </label>
          <button className={`${classesBotao} w-full py-2.5`} disabled={enviando}>{enviando ? 'Cadastrando...' : 'Criar operador'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">Já tem acesso? <Link to="/login" className="font-semibold text-blue-700 hover:underline">Voltar ao login</Link></p>
      </div>
    </div>
  );
}
