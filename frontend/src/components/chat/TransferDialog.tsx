import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../services/users.service';
import { Button } from '../ui/button';

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  onTransfer: (toUserId: string, reason?: string) => void;
  currentUserId: string;
}

export function TransferDialog({ open, onClose, onTransfer, currentUserId }: TransferDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [reason, setReason] = useState('');

  const { data: onlineUsers = [], isLoading } = useQuery({
    queryKey: ['users', 'online'],
    queryFn: usersApi.getOnline,
    enabled: open,
  });

  const availableAgents = onlineUsers.filter((u) => u.id !== currentUserId);

  if (!open) return null;

  const handleTransfer = () => {
    if (!selectedUserId) return;
    onTransfer(selectedUserId, reason || undefined);
    setSelectedUserId('');
    setReason('');
  };

  const handleClose = () => {
    setSelectedUserId('');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Transferir Conversa</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Agente destino
            </label>
            {isLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Carregando agentes...</p>
            ) : availableAgents.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum agente online disponível</p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Selecione um agente</option>
                {availableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Cliente precisa de suporte técnico"
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleTransfer} disabled={!selectedUserId}>
            Transferir
          </Button>
        </div>
      </div>
    </div>
  );
}
