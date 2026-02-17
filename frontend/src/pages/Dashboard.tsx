import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '../services/conversations.service';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';

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
      color: 'bg-blue-500',
    },
    {
      label: 'Conversas Abertas',
      value: stats?.open ?? 0,
      icon: AlertCircle,
      color: 'bg-green-500',
    },
    {
      label: 'Aguardando',
      value: stats?.waiting ?? 0,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      label: 'Finalizadas',
      value: stats?.closed ?? 0,
      icon: CheckCircle,
      color: 'bg-gray-500',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
