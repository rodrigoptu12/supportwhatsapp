import { loginFormSchema } from '../validators';

describe('loginFormSchema', () => {
  it('validates valid email and password', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@example.com',
      password: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginFormSchema.safeParse({
      email: 'not-an-email',
      password: '123456',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email invalido');
    }
  });

  it('rejects short password', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@example.com',
      password: '123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Senha deve ter no minimo 6 caracteres');
    }
  });
});
