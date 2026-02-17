import { useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useConversationsStore } from '../../store/conversationsStore';
import { useConversations } from '../../hooks/useConversations';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatPhone } from '../../utils/formatters';
import { MessageSquare } from 'lucide-react';

export function ChatWindow() {
  const { selectedConversation } = useConversationsStore();
  const { messages, isLoading, sendMessage } = useMessages(selectedConversation?.id ?? null);
  const { takeover, closeConversation } = useConversations();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <MessageSquare size={48} className="mb-3" />
        <p>Selecione uma conversa</p>
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h2 className="text-base font-semibold">{selectedConversation.customer.name}</h2>
          <p className="text-xs text-gray-500">
            {formatPhone(selectedConversation.customer.phoneNumber)}
            {' - '}
            {selectedConversation.isBotActive ? 'Bot ativo' : 'Atendimento humano'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedConversation.isBotActive ? (
            <Button size="sm" onClick={handleTakeover}>
              Assumir Atendimento
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={handleClose}>
              Finalizar
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
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

      {/* Input */}
      <div className="border-t bg-white p-4">
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
    </div>
  );
}
