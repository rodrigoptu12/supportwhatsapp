import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { getInitials } from '../../utils/formatters';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-900">WhatsApp Support</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            {user ? getInitials(user.fullName) : <User size={16} />}
          </div>
          <div className="text-sm">
            <p className="font-medium">{user?.fullName}</p>
            <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Sair">
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
