export const TEST_USERS = {
  admin: {
    email: 'admin@system.com',
    password: 'admin123',
    fullName: 'Administrador',
    role: 'admin',
  },
  attendant: {
    email: 'atendente@system.com',
    password: 'atendente123',
    fullName: 'Atendente Teste',
    role: 'attendant',
  },
} as const;

export const DEPARTMENTS = ['Secretaria', 'Coordenacao', 'Financeiro'] as const;

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
