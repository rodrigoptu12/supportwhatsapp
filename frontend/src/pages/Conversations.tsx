import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { ConversationList } from '../components/chat/ConversationList';
import { ChatWindow } from '../components/chat/ChatWindow';

const STATUS_TABS = [
  { label: 'Todas', value: '' },
  { label: 'Abertas', value: 'open' },
  { label: 'Aguardando', value: 'waiting' },
  { label: 'Fechadas', value: 'closed' },
] as const;

export default function Conversations() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-lg overflow-hidden border bg-white shadow-sm">
      {/* Conversation list */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b space-y-3">
          <h2 className="font-semibold text-gray-900">Conversas</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, telefone ou mensagem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList
            search={debouncedSearch || undefined}
            statusFilter={statusFilter || undefined}
          />
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        <ChatWindow />
      </div>
    </div>
  );
}
