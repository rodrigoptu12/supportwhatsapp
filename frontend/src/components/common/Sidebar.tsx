import { MessageSquare, LayoutDashboard, BarChart3, Settings, Headphones, Zap, LayoutTemplate } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/conversations', icon: MessageSquare, label: 'Conversas' },
  { to: '/metrics', icon: BarChart3, label: 'Métricas', roles: ['admin', 'supervisor'] },
  { to: '/templates', icon: LayoutTemplate, label: 'Templates', roles: ['admin', 'supervisor'] },
  { to: '/mass-message', icon: Zap, label: 'Envio em Massa', roles: ['admin', 'supervisor'] },
  { to: '/settings', icon: Settings, label: 'Configurações', roles: ['admin'] },
];

export function Sidebar() {
  const { user } = useAuth();

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <aside
      className="w-56 flex flex-col shrink-0 select-none bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-white/5"
    >
      {/* Logo */}
      <div
        className="px-4 py-5 flex items-center gap-3 border-b border-slate-200 dark:border-white/5"
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
          <Headphones size={17} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Suporte</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">WhatsApp</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-5 pb-3 space-y-0.5">
        <p className="px-3 mb-3 text-[9px] font-bold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500">
          Navegação
        </p>
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t border-slate-200 dark:border-white/5"
      >
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium">v1.0.0</p>
      </div>
    </aside>
  );
}
