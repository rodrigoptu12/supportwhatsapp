import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '../services/conversations.service';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { MessageSquare, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['conversation-stats'],
    queryFn: conversationsApi.stats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <LoadingSpinner className="h-64" />;
  }

  const cards = [
    {
      label: 'Total de Conversas',
      value: stats?.total ?? 0,
      icon: MessageSquare,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      accent: 'border-t-violet-400',
      trend: null,
    },
    {
      label: 'Conversas Abertas',
      value: stats?.open ?? 0,
      icon: AlertCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accent: 'border-t-emerald-400',
      trend: 'ativo',
    },
    {
      label: 'Aguardando',
      value: stats?.waiting ?? 0,
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      accent: 'border-t-amber-400',
      trend: null,
    },
    {
      label: 'Finalizadas',
      value: stats?.closed ?? 0,
      icon: CheckCircle,
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-500',
      accent: 'border-t-slate-300',
      trend: null,
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visão geral do atendimento em tempo real
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-xl shadow-card border border-slate-100 border-t-2 ${card.accent} p-6 hover:shadow-card-hover transition-shadow duration-300`}
          >
            <div className="flex items-start justify-between mb-5">
              <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon size={20} className={card.iconColor} />
              </div>
              {card.trend && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp size={9} />
                  {card.trend}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{card.value}</p>
            <p className="text-sm text-slate-500 font-medium mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick info */}
      <div className="mt-8 p-5 bg-white rounded-xl shadow-card border border-slate-100">
        <div className="flex items-center gap-2.5 text-sm text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Dados atualizados a cada 30 segundos automaticamente
        </div>
      </div>
    </div>
  );
}
