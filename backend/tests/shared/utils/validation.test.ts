/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { validate } from '@/shared/utils/validation';

const mockReq = (overrides: any = {}) => ({
  body: {},
  query: {},
  params: {},
  ...overrides,
});

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

const schema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(2),
  }),
});

describe('validate middleware', () => {
  it('calls next() on valid data', () => {
    const middleware = validate(schema);
    const req = mockReq({ body: { email: 'a@a.com', name: 'John' } });

    middleware(req as any, mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('returns 400 with errors on validation failure', () => {
    const middleware = validate(schema);
    const req = mockReq({ body: { email: 'invalid', name: '' } });
    const res = mockRes();

    middleware(req as any, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({ field: expect.any(String), message: expect.any(String) }),
        ]),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next(error) on non-Zod error', () => {
    const badSchema = {
      parse: () => {
        throw new Error('Unexpected error');
      },
    };
    const middleware = validate(badSchema as any);
    const req = mockReq();

    middleware(req as any, mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
