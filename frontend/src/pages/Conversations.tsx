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
    <div className="h-[calc(100vh-7.5rem)] flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-card animate-fade-in">
      {/* Conversation list panel */}
      <div className="w-80 border-r border-slate-100 dark:border-slate-700 flex flex-col shrink-0">
        {/* Panel header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700 space-y-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Conversas</h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all duration-150 ${
                  statusFilter === tab.value
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-hidden">
          <ConversationList
            search={debouncedSearch || undefined}
            statusFilter={statusFilter || undefined}
          />
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}
