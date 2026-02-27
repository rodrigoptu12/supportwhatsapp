import { FileDown } from 'lucide-react';
import { formatTime } from '../../utils/formatters';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

function MediaContent({ message }: { message: Message }) {
  const { messageType, mediaUrl, content } = message;

  if (!mediaUrl || messageType === 'text') {
    return <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content}</p>;
  }

  switch (messageType) {
    case 'image':
      return (
        <div>
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={mediaUrl}
              alt={content || 'Imagem'}
              className="max-w-full rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
            />
          </a>
          {content && content !== '[image]' && (
            <p className="text-sm mt-2 whitespace-pre-wrap break-words">{content}</p>
          )}
        </div>
      );
    case 'audio':
      return (
        <div>
          <audio controls src={mediaUrl} className="max-w-full" style={{ height: '36px' }} />
          {content && content !== '[audio]' && (
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{content}</p>
          )}
        </div>
      );
    case 'video':
      return (
        <div>
          <video controls src={mediaUrl} className="max-w-full rounded-lg" />
          {content && content !== '[video]' && (
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{content}</p>
          )}
        </div>
      );
    case 'document':
      return (
        <div>
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm underline underline-offset-2"
          >
            <FileDown size={16} />
            <span>{content || 'Documento'}</span>
          </a>
        </div>
      );
    default:
      return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>;
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isCustomer = message.senderType === 'customer';
  const isBot = message.senderType === 'bot';
  const isSystem = message.senderType === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm px-3 py-1.5 rounded-full font-medium">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex message-bubble ${isCustomer ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[72%] rounded-2xl px-4 py-2.5 shadow-message ${
          isCustomer
            ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm'
            : isBot
              ? 'bg-slate-700 dark:bg-slate-600 text-slate-100 rounded-tr-sm'
              : 'text-white rounded-tr-sm'
        }`}
        style={
          !isCustomer && !isBot
            ? { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }
            : undefined
        }
      >
        {!isCustomer && (
          <p
            className={`text-[10px] font-semibold mb-1 ${
              isBot ? 'text-slate-400' : 'text-emerald-200'
            }`}
          >
            {isBot ? '🤖 Bot' : (message.senderUser?.fullName ?? 'Atendente')}
          </p>
        )}

        <MediaContent message={message} />

        <p
          className={`text-[10px] text-right mt-1.5 tabular-nums ${
            isCustomer ? 'text-slate-400' : isBot ? 'text-slate-500' : 'text-emerald-200'
          }`}
        >
          {formatTime(message.sentAt)}
        </p>
      </div>
    </div>
  );
}
