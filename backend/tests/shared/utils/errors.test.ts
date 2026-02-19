import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '@/shared/utils/errors';

describe('Error classes', () => {
  describe('AppError', () => {
    it('sets message and default statusCode 500', () => {
      const error = new AppError('Something went wrong');

      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('accepts custom statusCode and isOperational', () => {
      const error = new AppError('Fatal', 503, false);

      expect(error.statusCode).toBe(503);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('NotFoundError', () => {
    it('creates 404 error with resource name', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('UnauthorizedError', () => {
    it('creates 401 error with default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Not authorized');
      expect(error.statusCode).toBe(401);
    });

    it('accepts custom message', () => {
      const error = new UnauthorizedError('Token expired');

      expect(error.message).toBe('Token expired');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('creates 403 error with default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
    });

    it('accepts custom message', () => {
      const error = new ForbiddenError('No access');

      expect(error.message).toBe('No access');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('ValidationError', () => {
    it('creates 400 error', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error).toBeInstanceOf(AppError);
    });
  });
});
