import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '../../services/departments.service';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Pencil, Trash2, X, Check, Users } from 'lucide-react';
import type { Department } from '../../types';

export function DepartmentsManagement() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', order: 0 });

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowCreate(false);
      setForm({ name: '', description: '', order: 0 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; description?: string; isActive?: boolean; order?: number }) =>
      departmentsApi.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: departmentsApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createMutation.mutate({ name: form.name, description: form.description || undefined, order: form.order });
  };

  const handleStartEdit = (dept: Department) => {
    setEditingId(dept.id);
    setForm({ name: dept.name, description: dept.description ?? '', order: dept.order });
  };

  const handleSaveEdit = (id: string) => {
    if (!form.name.trim()) return;
    updateMutation.mutate({ id, name: form.name, description: form.description || undefined, order: form.order });
  };

  const handleToggleActive = (dept: Department) => {
    updateMutation.mutate({ id: dept.id, isActive: !dept.isActive });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este setor?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Carregando setores...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{departments.length} setor(es) cadastrado(s)</p>
        <Button size="sm" onClick={() => setShowCreate(true)} disabled={showCreate}>
          <Plus size={16} className="mr-1" /> Novo Setor
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
          <h3 className="font-medium text-sm">Novo Setor</h3>
          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="Nome do setor"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Descricao (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Ordem"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
              <Check size={14} className="mr-1" /> Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowCreate(false); setForm({ name: '', description: '', order: 0 }); }}>
              <X size={14} className="mr-1" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Departments list */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ordem</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Descricao</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Atendentes</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-gray-50">
                {editingId === dept.id ? (
                  <>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        className="w-16"
                        value={form.order}
                        onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-gray-500">
                        <Users size={14} /> {dept._count?.users ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {dept.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(dept.id)}>
                        <Check size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X size={14} />
                      </Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-gray-500">{dept.order}</td>
                    <td className="px-4 py-3 font-medium">{dept.name}</td>
                    <td className="px-4 py-3 text-gray-500">{dept.description ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 text-gray-500">
                        <Users size={14} /> {dept._count?.users ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(dept)}
                        className={`px-2 py-0.5 rounded-full text-xs cursor-pointer ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {dept.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleStartEdit(dept)}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(dept.id)}>
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhum setor cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
