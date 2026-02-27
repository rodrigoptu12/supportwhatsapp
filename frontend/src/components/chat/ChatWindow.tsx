import { useEffect, useRef, useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useConversationsStore } from '../../store/conversationsStore';
import { useConversations } from '../../hooks/useConversations';
import { useAuthStore } from '../../store/authStore';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TransferDialog } from './TransferDialog';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatPhone, getInitials } from '../../utils/formatters';
import { MessageSquare, Bot, ArrowLeftRight, X } from 'lucide-react';

export function ChatWindow() {
  const { selectedConversation } = useConversationsStore();
  const { messages, isLoading, sendMessage } = useMessages(selectedConversation?.id ?? null);
  const { takeover, closeConversation, transfer } = useConversations();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <MessageSquare size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">Nenhuma conversa selecionada</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  const handleTakeover = async () => {
    await takeover(selectedConversation.id);
  };

  const handleClose = async () => {
    await closeConversation(selectedConversation.id);
  };

  const handleSend = (text: string) => {
    void sendMessage(text);
  };

  const statusColors: Record<string, string> = {
    open: 'bg-emerald-400',
    waiting: 'bg-amber-400',
    closed: 'bg-slate-300',
  };

  const nameParts = selectedConversation.customer.name;
  const avatarColors = ['bg-violet-500', 'bg-blue-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500'];
  let hash = 0;
  for (let i = 0; i < nameParts.length; i++) hash = nameParts.charCodeAt(i) + ((hash << 5) - hash);
  const avatarColor = avatarColors[Math.abs(hash) % avatarColors.length];

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 shrink-0"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {getInitials(selectedConversation.customer.name)}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {selectedConversation.customer.name}
              </h2>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColors[selectedConversation.status] ?? 'bg-slate-300'}`} />
            </div>
            <p className="text-xs text-slate-400">
              {formatPhone(selectedConversation.customer.phoneNumber)}
              {' · '}
              {selectedConversation.isBotActive ? (
                <span className="inline-flex items-center gap-1 text-blue-500 font-medium">
                  <Bot size={10} />
                  Bot ativo
                </span>
              ) : (
                <span className="text-emerald-600 font-medium">Atendimento humano</span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedConversation.isBotActive ? (
            <Button
              size="sm"
              onClick={handleTakeover}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 gap-1.5"
            >
              <Bot size={13} />
              Assumir atendimento
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTransferDialog(true)}
                className="text-xs h-8 px-3 gap-1.5 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowLeftRight size={13} />
                Transferir
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleClose}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <X size={13} />
                Finalizar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto p-5 space-y-2 bg-slate-50 dark:bg-slate-950"
      >
        {isLoading ? (
          <LoadingSpinner className="h-full" />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div
        className="shrink-0 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700"
      >
        <MessageInput
          onSend={handleSend}
          disabled={selectedConversation.isBotActive}
          placeholder={
            selectedConversation.isBotActive
              ? 'Assuma o atendimento para enviar mensagens'
              : 'Digite sua mensagem...'
          }
        />
      </div>

      <TransferDialog
        open={showTransferDialog}
        onClose={() => setShowTransferDialog(false)}
        currentUserId={user?.id ?? ''}
        onTransfer={async (toUserId, reason) => {
          await transfer({ id: selectedConversation.id, toUserId, reason });
          setShowTransferDialog(false);
        }}
      />
    </div>
  );
}
