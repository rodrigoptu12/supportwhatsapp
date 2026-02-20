import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
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

  const avatarColors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-teal-500',
  ];

  const getAvatarColor = (id: string) => {
    const index = id.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  };

  return (
    <header className="h-14 bg-white flex items-center justify-between px-6 shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
      {/* Left: title placeholder for page context */}
      <div />

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* Online users */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
          >
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium">{onlineCount} online</span>
            </span>
            <ChevronDown size={13} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-card-hover border border-slate-100 z-50 py-2 animate-fade-in">
              <p className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                Atendentes online
              </p>
              {onlineUsers.length === 0 ? (
                <p className="px-4 py-2 text-sm text-slate-400">Nenhum atendente online</p>
              ) : (
                onlineUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(u.id)} text-white flex items-center justify-center text-xs font-semibold shrink-0`}>
                      {getInitials(u.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{u.fullName}</p>
                      <p className="text-xs text-slate-400 capitalize">{u.role}</p>
                    </div>
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-100" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {user ? getInitials(user.fullName) : '?'}
          </div>
          <div className="text-sm leading-tight hidden sm:block">
            <p className="font-semibold text-slate-800">{user?.fullName}</p>
            <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          title="Sair"
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
}
