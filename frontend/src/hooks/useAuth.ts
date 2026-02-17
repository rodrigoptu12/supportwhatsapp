import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
    isAttendant: user?.role === 'attendant',
  };
}
