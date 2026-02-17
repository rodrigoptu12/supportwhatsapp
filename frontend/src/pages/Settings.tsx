import { useState } from 'react';
import { Users, Building2, Settings2 } from 'lucide-react';
import { UsersManagement } from '../components/admin/UsersManagement';
import { DepartmentsManagement } from '../components/admin/DepartmentsManagement';

const tabs = [
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'departments', label: 'Setores', icon: Building2 },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('users');

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Settings2 size={24} className="text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'users' && <UsersManagement />}
      {activeTab === 'departments' && <DepartmentsManagement />}
    </div>
  );
}
