import { FileDown } from 'lucide-react';
import { formatTime } from '../../utils/formatters';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

function MediaContent({ message }: { message: Message }) {
  const { messageType, mediaUrl, content } = message;

  if (!mediaUrl || messageType === 'text') {
    return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>;
  }

  switch (messageType) {
    case 'image':
      return (
        <div>
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={mediaUrl}
              alt={content || 'Imagem'}
              className="max-w-full rounded cursor-pointer"
            />
          </a>
          {content && content !== '[image]' && (
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{content}</p>
          )}
        </div>
      );
    case 'audio':
      return (
        <div>
          <audio controls src={mediaUrl} className="max-w-full" />
          {content && content !== '[audio]' && (
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{content}</p>
          )}
        </div>
      );
    case 'video':
      return (
        <div>
          <video controls src={mediaUrl} className="max-w-full rounded" />
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
            className="flex items-center gap-2 text-sm underline"
          >
            <FileDown size={18} />
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
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isCustomer
            ? 'bg-white border shadow-sm'
            : isBot
              ? 'bg-blue-100 text-blue-900'
              : 'bg-green-500 text-white'
        }`}
      >
        {!isCustomer && (
          <p className="text-[10px] font-medium opacity-70 mb-0.5">
            {isBot ? 'Bot' : message.senderUser?.fullName ?? 'Atendente'}
          </p>
        )}
        <MediaContent message={message} />
        <p className={`text-[10px] text-right mt-1 ${isCustomer ? 'text-gray-400' : 'opacity-70'}`}>
          {formatTime(message.sentAt)}
        </p>
      </div>
    </div>
  );
}
