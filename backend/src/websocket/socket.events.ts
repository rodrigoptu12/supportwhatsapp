export const SocketEvents = {
  // Client -> Server
  SUBSCRIBE_CONVERSATION: 'subscribe:conversation',
  UNSUBSCRIBE_CONVERSATION: 'unsubscribe:conversation',
  TYPING: 'typing',

  // Server -> Client
  NEW_MESSAGE: 'new_message',
  CONVERSATION_UPDATE: 'conversation_update',
  USER_TYPING: 'user_typing',
  NEW_CONVERSATION: 'new_conversation',
  ATTENDANT_ONLINE: 'attendant_online',
  ATTENDANT_OFFLINE: 'attendant_offline',
  MASS_MESSAGE_PROGRESS: 'mass_message_progress',
  MASS_MESSAGE_DONE: 'mass_message_done',
} as const;
