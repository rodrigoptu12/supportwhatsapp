import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../services/messages.service';

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagesApi.list(conversationId!),
    enabled: !!conversationId,
  });

  const sendMutation = useMutation({
    mutationFn: ({ content, messageType }: { content: string; messageType?: string }) =>
      messagesApi.send(conversationId!, content, messageType),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  return {
    messages: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    sendMessage: (content: string) => sendMutation.mutateAsync({ content }),
    isSending: sendMutation.isPending,
    refetch: query.refetch,
  };
}
