import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../services/users.service';
import { departmentsApi } from '../../services/departments.service';
import { Button } from '../ui/button';
import { Building2, X, Check } from 'lucide-react';
import type { User, Department } from '../../types';

export function UsersManagement() {
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.list(1, 100),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
  });

  const { data: userDepartments, isLoading: deptsLoading } = useQuery({
    queryKey: ['user-departments', editingUserId],
    queryFn: () => usersApi.getDepartments(editingUserId!),
    enabled: !!editingUserId,
  });

  const setDeptsMutation = useMutation({
    mutationFn: ({ userId, departmentIds }: { userId: string; departmentIds: string[] }) =>
      usersApi.setDepartments(userId, departmentIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-departments'] });
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      setEditingUserId(null);
    },
  });

  const users = usersData?.data ?? [];

  const handleEditDepartments = (user: User) => {
    setEditingUserId(user.id);
    setSelectedDeptIds([]);
  };

  // Sync selectedDeptIds when userDepartments loads
  const currentUserDepts = editingUserId && userDepartments && !deptsLoading
    ? userDepartments.map((d) => d.id)
    : null;

  const effectiveDeptIds = currentUserDepts !== null && selectedDeptIds.length === 0 && editingUserId
    ? currentUserDepts
    : selectedDeptIds;

  const handleToggleDept = (deptId: string) => {
    const current = effectiveDeptIds;
    if (current.includes(deptId)) {
      setSelectedDeptIds(current.filter((id) => id !== deptId));
    } else {
      setSelectedDeptIds([...current, deptId]);
    }
  };

  const handleSave = () => {
    if (!editingUserId) return;
    setDeptsMutation.mutate({ userId: editingUserId, departmentIds: effectiveDeptIds });
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      supervisor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      attendant: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300',
    };
    const labels: Record<string, string> = {
      admin: 'Admin',
      supervisor: 'Supervisor',
      attendant: 'Atendente',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${styles[role] ?? styles.attendant}`}>
        {labels[role] ?? role}
      </span>
    );
  };

  if (usersLoading) {
    return <div className="text-center py-8 text-slate-500">Carregando usuarios...</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{users.length} usuario(s)</p>

      <div className="bg-white dark:bg-slate-800/40 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Email</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Perfil</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Setores</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{user.fullName}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{user.email}</td>
                <td className="px-4 py-3 text-center">{getRoleBadge(user.role)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${user.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => handleEditDepartments(user)}>
                    <Building2 size={14} className="mr-1" /> Setores
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Department assignment modal */}
      {editingUserId && (
        <DepartmentModal
          user={users.find((u) => u.id === editingUserId)!}
          departments={departments}
          selectedIds={effectiveDeptIds}
          isLoading={deptsLoading}
          isSaving={setDeptsMutation.isPending}
          onToggle={handleToggleDept}
          onSave={handleSave}
          onClose={() => setEditingUserId(null)}
        />
      )}
    </div>
  );
}

function DepartmentModal({
  user,
  departments,
  selectedIds,
  isLoading,
  isSaving,
  onToggle,
  onSave,
  onClose,
}: {
  user: User;
  departments: Department[];
  selectedIds: string[];
  isLoading: boolean;
  isSaving: boolean;
  onToggle: (id: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#0f1929] rounded-lg shadow-xl w-full max-w-md mx-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Setores de {user.fullName}</h3>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <p className="text-center text-slate-500 py-4">Carregando...</p>
          ) : (
            <div className="space-y-2">
              {departments.map((dept) => {
                const isSelected = selectedIds.includes(dept.id);
                return (
                  <button
                    key={dept.id}
                    onClick={() => onToggle(dept.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{dept.name}</p>
                      {dept.description && (
                        <p className="text-xs text-slate-500">{dept.description}</p>
                      )}
                    </div>
                    {isSelected && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
              {departments.length === 0 && (
                <p className="text-center text-slate-400 py-4">Nenhum setor cadastrado</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={onSave} disabled={isSaving || isLoading}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
