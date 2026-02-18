import { useConversations } from '../../hooks/useConversations';
import { useConversationsStore } from '../../store/conversationsStore';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { timeAgo, getInitials } from '../../utils/formatters';
import type { Conversation } from '../../types';

interface ConversationListProps {
  search?: string;
  statusFilter?: string;
}

export function ConversationList({ search, statusFilter }: ConversationListProps) {
  const { conversations, isLoading } = useConversations({ status: statusFilter, search });
  const { selectedConversation, selectConversation } = useConversationsStore();

  if (isLoading) {
    return <LoadingSpinner className="h-full" />;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Nenhuma conversa encontrada
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    open: 'bg-green-500',
    waiting: 'bg-yellow-500',
    closed: 'bg-gray-400',
  };

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conversation: Conversation) => {
        const lastMessage = conversation.messages?.[0];
        const isSelected = selectedConversation?.id === conversation.id;

        return (
          <button
            key={conversation.id}
            onClick={() => selectConversation(conversation)}
            className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                {getInitials(conversation.customer.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">
                    {conversation.customer.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {timeAgo(conversation.lastMessageAt)}
                  </span>
                </div>
                {lastMessage && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {lastMessage.messageType === 'image'
                      ? '📷 Imagem'
                      : lastMessage.messageType === 'audio'
                        ? '🎵 Audio'
                        : lastMessage.messageType === 'video'
                          ? '🎥 Video'
                          : lastMessage.messageType === 'document'
                            ? '📄 Documento'
                            : lastMessage.content}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${statusColors[conversation.status] ?? 'bg-gray-400'}`} />
                  <span className="text-xs text-gray-400 capitalize">{conversation.status}</span>
                  {conversation.isBotActive && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Bot</Badge>
                  )}
                  {conversation.needsHumanAttention && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Atencao</Badge>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
