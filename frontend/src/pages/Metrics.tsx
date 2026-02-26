import { BarChart3 } from 'lucide-react';

export default function Metrics() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Métricas</h1>
        <p className="text-sm text-slate-500 mt-1">Relatórios e análises de atendimento</p>
      </div>

      <div className="bg-white dark:bg-[#0d1626] rounded-xl shadow-card border border-slate-100 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <BarChart3 size={28} className="text-slate-400" />
        </div>
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Em breve</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          Métricas e relatórios detalhados de atendimento serão implementados aqui.
        </p>
      </div>
    </div>
  );
}
