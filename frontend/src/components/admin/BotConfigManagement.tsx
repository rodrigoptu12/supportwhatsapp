import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { botConfigApi, BotConfig } from '../../services/bot-config.service';
import { Button } from '../ui/button';
import { Check, X, Pencil, Eye } from 'lucide-react';

const KEY_LABELS: Record<string, string> = {
  greeting: 'Boas-vindas',
  main_menu_options: 'Opcoes do Menu',
  main_menu_prompt: 'Prompt do Menu',
  department_menu_header: 'Cabecalho Setores',
  department_menu_prompt: 'Prompt Setores',
  department_transfer: 'Transferencia',
  no_departments: 'Sem Setores',
  error_message: 'Erro Generico',
};

export function BotConfigManagement() {
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['bot-configs'],
    queryFn: botConfigApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      botConfigApi.update(key, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bot-configs'] });
      setEditingKey(null);
    },
  });

  const handleStartEdit = (config: BotConfig) => {
    setEditingKey(config.key);
    setEditValue(config.value?.message ?? '');
  };

  const handleSave = (key: string) => {
    if (!editValue.trim()) return;
    updateMutation.mutate({ key, value: editValue });
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const getConfigValue = (key: string): string => {
    const config = configs.find((c) => c.key === key);
    return config?.value?.message ?? '';
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Carregando configuracoes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{configs.length} configuracao(oes) do bot</p>
        <Button
          size="sm"
          variant={showPreview ? 'default' : 'ghost'}
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye size={16} className="mr-1" /> {showPreview ? 'Ocultar Preview' : 'Preview'}
        </Button>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm text-green-800">Preview do Fluxo do Bot</h3>
          <div className="space-y-2 text-sm">
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <span className="text-xs text-gray-400 block mb-1">1. Boas-vindas + Menu</span>
              <p className="whitespace-pre-wrap text-gray-700">
                {getConfigValue('greeting')}{'\n\n'}
                {getConfigValue('main_menu_options')}{'\n\n'}
                {getConfigValue('main_menu_prompt')}
              </p>
            </div>
            <div className="text-center text-gray-400 text-xs">Usuario digita "1"</div>
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <span className="text-xs text-gray-400 block mb-1">2. Menu de Setores</span>
              <p className="whitespace-pre-wrap text-gray-700">
                {getConfigValue('department_menu_header')}{'\n\n'}
                1. Secretaria{'\n'}
                2. Coordenacao{'\n'}
                3. Financeiro{'\n\n'}
                {getConfigValue('department_menu_prompt')}
              </p>
            </div>
            <div className="text-center text-gray-400 text-xs">Usuario escolhe um setor</div>
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <span className="text-xs text-gray-400 block mb-1">3. Transferencia</span>
              <p className="whitespace-pre-wrap text-gray-700">
                {getConfigValue('department_transfer').replace('{department}', 'Secretaria')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Config list */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-40">Chave</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mensagem</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 w-24">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {configs.map((config) => (
              <tr key={config.key} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{KEY_LABELS[config.key] ?? config.key}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{config.key}</div>
                  {config.description && (
                    <div className="text-xs text-gray-400">{config.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingKey === config.key ? (
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-gray-700">{config.value?.message ?? '-'}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingKey === config.key ? (
                    <div className="space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleSave(config.key)} disabled={updateMutation.isPending}>
                        <Check size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => handleStartEdit(config)}>
                      <Pencil size={14} />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {configs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma configuracao encontrada. Execute o seed para criar as configuracoes padrao.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-400">
        Use <code className="bg-gray-100 px-1 rounded">{'{department}'}</code> na mensagem de transferencia para inserir o nome do setor automaticamente.
      </div>
    </div>
  );
}
