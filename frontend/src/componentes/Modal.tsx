import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({ titulo, fechar, children, largo = false }: {
  titulo: string;
  fechar: () => void;
  children: ReactNode;
  largo?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(evento) => {
      if (evento.target === evento.currentTarget) fechar();
    }}>
      <section className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${largo ? 'max-w-3xl' : 'max-w-xl'}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">{titulo}</h2>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={fechar} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function EstadoVazio({ mensagem }: { mensagem: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{mensagem}</div>;
}

export function Carregando({ mensagem = 'Carregando...' }: { mensagem?: string }) {
  return <div className="py-12 text-center text-sm text-slate-500">{mensagem}</div>;
}

export function Aviso({ mensagem, fechar }: { mensagem: string; fechar: () => void }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
      <span>{mensagem}</span>
      <button onClick={fechar} className="font-semibold">Fechar</button>
    </div>
  );
}

export const classesCampo = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
export const classesBotao = 'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60';
export const classesBotaoSecundario = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50';
