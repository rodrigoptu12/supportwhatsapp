import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '../services/conversations.service';
import { useConversationsStore } from '../store/conversationsStore';
import { useEffect } from 'react';

export function useConversations(status?: string) {
  const queryClient = useQueryClient();
  const { setConversations } = useConversationsStore();

  const query = useQuery({
    queryKey: ['conversations', status],
    queryFn: () => conversationsApi.list({ status }),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (query.data) {
      setConversations(query.data.data);
    }
  }, [query.data, setConversations]);

  const takeoverMutation = useMutation({
    mutationFn: conversationsApi.takeover,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: conversationsApi.close,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    conversations: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    takeover: takeoverMutation.mutateAsync,
    closeConversation: closeMutation.mutateAsync,
    refetch: query.refetch,
  };
}
