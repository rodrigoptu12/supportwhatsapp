import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@system.com' },
    update: {},
    create: {
      email: 'admin@system.com',
      passwordHash: adminPassword,
      fullName: 'Administrador',
      role: 'admin',
    },
  });
  console.log(`Admin created: ${admin.email}`);

  // Create attendant user
  const attendantPassword = await bcrypt.hash('atendente123', 12);
  const attendant = await prisma.user.upsert({
    where: { email: 'atendente@system.com' },
    update: {},
    create: {
      email: 'atendente@system.com',
      passwordHash: attendantPassword,
      fullName: 'Atendente Teste',
      role: 'attendant',
    },
  });
  console.log(`Attendant created: ${attendant.email}`);

  // Create departments
  const secretaria = await prisma.department.upsert({
    where: { name: 'Secretaria' },
    update: {},
    create: {
      name: 'Secretaria',
      description: 'Atendimento geral e informacoes',
      order: 1,
    },
  });
  console.log(`Department created: ${secretaria.name}`);

  const coordenacao = await prisma.department.upsert({
    where: { name: 'Coordenacao' },
    update: {},
    create: {
      name: 'Coordenacao',
      description: 'Coordenacao pedagogica',
      order: 2,
    },
  });
  console.log(`Department created: ${coordenacao.name}`);

  const financeiro = await prisma.department.upsert({
    where: { name: 'Financeiro' },
    update: {},
    create: {
      name: 'Financeiro',
      description: 'Setor financeiro e cobranças',
      order: 3,
    },
  });
  console.log(`Department created: ${financeiro.name}`);

  // Associate attendant to Secretaria department
  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: attendant.id,
        departmentId: secretaria.id,
      },
    },
    update: {},
    create: {
      userId: attendant.id,
      departmentId: secretaria.id,
    },
  });
  console.log(`Attendant associated to: ${secretaria.name}`);

  // Create bot configurations
  const botConfigs = [
    { key: 'greeting', value: 'Ola! Bem-vindo ao Grupo Multi Educacao.', description: 'Mensagem de boas-vindas' },
    { key: 'main_menu_options', value: '1. Falar com um setor', description: 'Opcoes do menu principal' },
    { key: 'main_menu_prompt', value: 'Digite o numero da opcao:', description: 'Texto pedindo input no menu principal' },
    { key: 'department_menu_header', value: 'Escolha o setor:', description: 'Cabecalho do menu de setores' },
    { key: 'department_menu_prompt', value: 'Digite o numero:', description: 'Texto pedindo input no menu de setores' },
    { key: 'department_transfer', value: 'Voce sera atendido pelo setor *{department}*. Aguarde um momento...', description: 'Mensagem de transferencia ({department} = nome do setor)' },
    { key: 'no_departments', value: 'No momento nao ha setores disponiveis. Voce sera atendido em breve.', description: 'Mensagem quando nao ha setores ativos' },
    { key: 'error_message', value: 'Desculpe, ocorreu um erro. Vou transferir voce para um atendente.', description: 'Mensagem de erro generico' },
  ];

  for (const config of botConfigs) {
    await prisma.botConfiguration.upsert({
      where: { key: config.key },
      update: {},
      create: {
        key: config.key,
        value: { message: config.value },
        description: config.description,
      },
    });
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
