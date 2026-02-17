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
      admin: 'bg-purple-100 text-purple-700',
      supervisor: 'bg-blue-100 text-blue-700',
      attendant: 'bg-gray-100 text-gray-700',
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
    return <div className="text-center py-8 text-gray-500">Carregando usuarios...</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{users.length} usuario(s)</p>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Perfil</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Setores</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.fullName}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3 text-center">{getRoleBadge(user.role)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Setores de {user.fullName}</h3>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <p className="text-center text-gray-500 py-4">Carregando...</p>
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
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{dept.name}</p>
                      {dept.description && (
                        <p className="text-xs text-gray-500">{dept.description}</p>
                      )}
                    </div>
                    {isSelected && <Check size={18} className="text-blue-600" />}
                  </button>
                );
              })}
              {departments.length === 0 && (
                <p className="text-center text-gray-400 py-4">Nenhum setor cadastrado</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={onSave} disabled={isSaving || isLoading}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
