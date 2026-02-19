import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { TEST_USERS } from './fixtures/test-data';

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5173';
const AUTH_DIR = path.join(__dirname, '.auth');

async function waitForBackend(maxRetries = 30, delayMs = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) {
        console.log('Backend is ready');
        return;
      }
    } catch {
      // Backend not ready yet
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Backend not ready after ${maxRetries} retries`);
}

async function loginAndSaveState(
  email: string,
  password: string,
  filename: string,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status}`);
  }

  const data = await res.json();

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: FRONTEND_URL,
        localStorage: [
          {
            name: 'auth-storage',
            value: JSON.stringify({
              state: {
                user: data.user,
                token: data.accessToken,
                refreshToken: data.refreshToken,
                isAuthenticated: true,
              },
              version: 0,
            }),
          },
        ],
      },
    ],
  };

  fs.writeFileSync(
    path.join(AUTH_DIR, filename),
    JSON.stringify(storageState, null, 2),
  );
  console.log(`Auth state saved for ${email}`);
}

async function globalSetup(): Promise<void> {
  // Wait for backend
  await waitForBackend();

  // Run seed
  console.log('Running database seed...');
  execSync('npx prisma db seed', {
    cwd: path.join(__dirname, '..', 'backend'),
    stdio: 'pipe',
  });
  console.log('Seed completed');

  // Create auth directory
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // Login and save states
  await loginAndSaveState(
    TEST_USERS.admin.email,
    TEST_USERS.admin.password,
    'admin.json',
  );
  await loginAndSaveState(
    TEST_USERS.attendant.email,
    TEST_USERS.attendant.password,
    'attendant.json',
  );
}

export default globalSetup;
