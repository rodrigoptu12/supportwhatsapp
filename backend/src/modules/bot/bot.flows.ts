export interface BotFlow {
  id: string;
  name: string;
  menuLevel: string;
  options: BotFlowOption[];
}

export interface BotFlowOption {
  key: string;
  label: string;
  action: 'navigate' | 'transfer' | 'message';
  target?: string;
  message?: string;
}

export const defaultFlows: BotFlow[] = [
  {
    id: 'main',
    name: 'Menu Principal',
    menuLevel: 'main',
    options: [
      { key: '1', label: 'Suporte Tecnico', action: 'navigate', target: 'support' },
      { key: '2', label: 'Vendas', action: 'navigate', target: 'sales' },
      { key: '3', label: 'Falar com Atendente', action: 'transfer' },
    ],
  },
  {
    id: 'support',
    name: 'Suporte Tecnico',
    menuLevel: 'support',
    options: [
      { key: '1', label: 'Problema com produto', action: 'transfer' },
      { key: '2', label: 'Duvida tecnica', action: 'transfer' },
      { key: '3', label: 'Falar com atendente', action: 'transfer' },
      { key: '0', label: 'Voltar', action: 'navigate', target: 'main' },
    ],
  },
  {
    id: 'sales',
    name: 'Vendas',
    menuLevel: 'sales',
    options: [
      { key: '1', label: 'Conhecer produtos', action: 'transfer' },
      { key: '2', label: 'Precos e planos', action: 'transfer' },
      { key: '3', label: 'Falar com vendedor', action: 'transfer' },
      { key: '0', label: 'Voltar', action: 'navigate', target: 'main' },
    ],
  },
];
