import { z } from 'zod';

export const BOT_CONFIG_KEYS = [
  'greeting',
  'main_menu_options',
  'main_menu_prompt',
  'department_menu_header',
  'department_menu_prompt',
  'department_transfer',
  'no_departments',
  'error_message',
] as const;

export type BotConfigKey = (typeof BOT_CONFIG_KEYS)[number];

export const updateBotConfigSchema = z.object({
  params: z.object({
    key: z.string().min(1),
  }),
  body: z.object({
    value: z.string().min(1),
    description: z.string().optional(),
  }),
});

export type UpdateBotConfigDTO = z.infer<typeof updateBotConfigSchema>['body'];

export const BOT_CONFIG_DEFAULTS: Record<BotConfigKey, { value: string; description: string }> = {
  greeting: {
    value: 'Ola! Bem-vindo ao Grupo Multi Educacao.',
    description: 'Mensagem de boas-vindas',
  },
  main_menu_options: {
    value: '1. Falar com um setor',
    description: 'Opcoes do menu principal',
  },
  main_menu_prompt: {
    value: 'Digite o numero da opcao:',
    description: 'Texto pedindo input no menu principal',
  },
  department_menu_header: {
    value: 'Escolha o setor:',
    description: 'Cabecalho do menu de setores',
  },
  department_menu_prompt: {
    value: 'Digite o numero:',
    description: 'Texto pedindo input no menu de setores',
  },
  department_transfer: {
    value: 'Voce sera atendido pelo setor *{department}*. Aguarde um momento...',
    description: 'Mensagem de transferencia ({department} = nome do setor)',
  },
  no_departments: {
    value: 'No momento nao ha setores disponiveis. Voce sera atendido em breve.',
    description: 'Mensagem quando nao ha setores ativos',
  },
  error_message: {
    value: 'Desculpe, ocorreu um erro. Vou transferir voce para um atendente.',
    description: 'Mensagem de erro generico',
  },
};
