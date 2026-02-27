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

const STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
  open: { dot: 'bg-emerald-400', label: 'aberta' },
  waiting: { dot: 'bg-amber-400', label: 'aguardando' },
  closed: { dot: 'bg-slate-300', label: 'fechada' },
};

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-pink-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ConversationList({ search, statusFilter }: ConversationListProps) {
  const { conversations, isLoading } = useConversations({ status: statusFilter, search });
  const { selectedConversation, selectConversation } = useConversationsStore();

  if (isLoading) {
    return <LoadingSpinner className="h-full" />;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 dark:text-slate-500">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-lg">💬</span>
        </div>
        <p className="text-sm font-medium">Nenhuma conversa</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conversation: Conversation) => {
        const lastMessage = conversation.messages?.[0];
        const isSelected = selectedConversation?.id === conversation.id;
        const status = STATUS_CONFIG[conversation.status] ?? { dot: 'bg-slate-300', label: conversation.status };
        const avatarColor = getAvatarColor(conversation.customer.name);

        const getPreview = () => {
          if (!lastMessage) return '';
          switch (lastMessage.messageType) {
            case 'image': return '📷 Imagem';
            case 'audio': return '🎵 Áudio';
            case 'video': return '🎥 Vídeo';
            case 'document': return '📄 Documento';
            default: return lastMessage.content;
          }
        };

        return (
          <button
            key={conversation.id}
            onClick={() => selectConversation(conversation)}
            className={`w-full text-left px-4 py-3.5 transition-all duration-100 relative border-b border-slate-100 dark:border-slate-800 ${
              isSelected
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-r-2 border-r-emerald-500'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-r-2 border-r-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {getInitials(conversation.customer.name)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {conversation.customer.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                    {timeAgo(conversation.lastMessageAt)}
                  </span>
                </div>

                {lastMessage && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-relaxed">
                    {getPreview()}
                  </p>
                )}

                {/* Badges row */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                  {conversation.isBotActive && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1.5 py-0 h-4 font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-0"
                    >
                      Bot
                    </Badge>
                  )}
                  {conversation.needsHumanAttention && (
                    <Badge
                      variant="destructive"
                      className="text-[9px] px-1.5 py-0 h-4 font-semibold"
                    >
                      Atenção
                    </Badge>
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
