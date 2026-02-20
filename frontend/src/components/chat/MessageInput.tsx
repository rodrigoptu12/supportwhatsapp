import { useState } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Digite sua mensagem...',
}: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const canSend = !disabled && text.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm leading-relaxed transition-all duration-150 outline-none
            ${disabled
              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed placeholder:text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100'
            }`}
          style={{ maxHeight: '120px', minHeight: '40px' }}
        />
      </div>

      <button
        type="submit"
        disabled={!canSend}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 ${
          canSend
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
        }`}
      >
        <Send size={16} />
      </button>
    </form>
  );
}
