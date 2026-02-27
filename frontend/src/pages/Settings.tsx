import { useState } from 'react';
import { Users, Building2, Settings2, MessageSquare } from 'lucide-react';
import { UsersManagement } from '../components/admin/UsersManagement';
import { DepartmentsManagement } from '../components/admin/DepartmentsManagement';
import { BotConfigManagement } from '../components/admin/BotConfigManagement';

const tabs = [
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'departments', label: 'Setores', icon: Building2 },
  { id: 'bot', label: 'Bot', icon: MessageSquare },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('users');

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Settings2 size={20} className="text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie usuários, setores e o bot</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div
        className="flex gap-0.5 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-[#0d1626] rounded-xl shadow-card border border-slate-100 dark:border-slate-700 p-6">
        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'departments' && <DepartmentsManagement />}
        {activeTab === 'bot' && <BotConfigManagement />}
      </div>
    </div>
  );
}
