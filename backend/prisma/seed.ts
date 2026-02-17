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

  // Create bot configurations
  await prisma.botConfiguration.upsert({
    where: { key: 'welcome_message' },
    update: {},
    create: {
      key: 'welcome_message',
      value: {
        message: 'Ola! Bem-vindo ao nosso atendimento.\n\nEscolha uma opcao:\n\n1. Suporte Tecnico\n2. Vendas\n3. Falar com Atendente',
      },
      description: 'Welcome message for new conversations',
    },
  });

  await prisma.botConfiguration.upsert({
    where: { key: 'transfer_message' },
    update: {},
    create: {
      key: 'transfer_message',
      value: {
        message: 'Voce sera transferido para um atendente. Aguarde um momento...',
      },
      description: 'Message when transferring to human',
    },
  });

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
