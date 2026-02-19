import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../services/users.service';

export function useOnlineUsers() {
  const { data: onlineUsers = [] } = useQuery({
    queryKey: ['online-users'],
    queryFn: usersApi.getOnline,
    refetchInterval: 60_000,
  });

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
  };
}
