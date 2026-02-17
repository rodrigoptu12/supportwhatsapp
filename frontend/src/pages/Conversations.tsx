import { ConversationList } from '../components/chat/ConversationList';
import { ChatWindow } from '../components/chat/ChatWindow';

export default function Conversations() {
  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-lg overflow-hidden border bg-white shadow-sm">
      {/* Conversation list */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Conversas</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList />
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        <ChatWindow />
      </div>
    </div>
  );
}
