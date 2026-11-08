import { Boxes, Building2, ClipboardList, LayoutDashboard, LogOut, Package, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';

const navegacao = [
  { rota: '/', nome: 'Painel', icone: LayoutDashboard },
  { rota: '/clientes', nome: 'Clientes', icone: Users },
  { rota: '/fornecedores', nome: 'Fornecedores', icone: Building2 },
  { rota: '/produtos', nome: 'Produtos', icone: Package },
  { rota: '/pedidos', nome: 'Pedidos', icone: ClipboardList },
];

export function Layout() {
  const { usuario, sair } = useAutenticacao();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="flex w-full flex-col bg-marca-900 text-white lg:fixed lg:inset-y-0 lg:w-64">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="rounded-xl bg-blue-500 p-2"><Boxes size={22} /></div>
          <div><p className="font-bold tracking-wide">StockFlow</p><p className="text-xs text-blue-200">Gestão B2B</p></div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible">
          {navegacao.map(({ rota, nome, icone: Icone }) => (
            <NavLink key={rota} to={rota} end={rota === '/'} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? 'bg-white/15 font-semibold text-white' : 'text-blue-100 hover:bg-white/10'}`}>
              <Icone size={18} />{nome}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <p className="truncate text-sm font-semibold">{usuario?.nome}</p>
          <p className="mb-3 text-xs text-blue-200">{usuario?.cargo}</p>
          <button onClick={sair} className="flex items-center gap-2 text-sm text-blue-100 hover:text-white"><LogOut size={16} />Sair</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
