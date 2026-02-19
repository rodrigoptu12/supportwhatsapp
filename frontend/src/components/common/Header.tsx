import { useState, useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { Button } from '../ui/button';
import { getInitials } from '../../utils/formatters';

export function Header() {
  const { user, logout } = useAuth();
  const { onlineUsers, onlineCount } = useOnlineUsers();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-900">WhatsApp Support</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>{onlineCount} online</span>
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border rounded-lg shadow-lg z-50 py-2">
              <p className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase">
                Atendentes online
              </p>
              {onlineUsers.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-500">Nenhum atendente online</p>
              ) : (
                onlineUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 px-3 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                      {getInitials(u.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.fullName}</p>
                      <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
