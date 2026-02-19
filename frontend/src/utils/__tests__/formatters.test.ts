import { formatDate, formatTime, formatPhone, getInitials, timeAgo } from '../formatters';

describe('formatDate', () => {
  it('formats date in pt-BR format', () => {
    const result = formatDate('2024-06-15T14:30:00Z');
    // pt-BR: dd/mm/yyyy, hh:mm
    expect(result).toMatch(/15\/06\/2024/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe('formatTime', () => {
  it('formats time in pt-BR format', () => {
    const result = formatTime('2024-06-15T14:30:00Z');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe('formatPhone', () => {
  it('formats 13-digit phone number', () => {
    expect(formatPhone('5511999887766')).toBe('+55 (11) 99988-7766');
  });

  it('returns original for non-13-digit phone', () => {
    expect(formatPhone('11999887766')).toBe('11999887766');
  });

  it('returns original for short phone', () => {
    expect(formatPhone('+1234')).toBe('+1234');
  });
});

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial from single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('');
  });

  it('returns max 2 initials', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });
});

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "agora" for less than 1 minute', () => {
    expect(timeAgo('2024-06-15T11:59:30Z')).toBe('agora');
  });

  it('returns minutes for less than 1 hour', () => {
    expect(timeAgo('2024-06-15T11:30:00Z')).toBe('30min');
  });

  it('returns hours for less than 24 hours', () => {
    expect(timeAgo('2024-06-15T09:00:00Z')).toBe('3h');
  });

  it('returns days for less than 7 days', () => {
    expect(timeAgo('2024-06-12T12:00:00Z')).toBe('3d');
  });

  it('returns formatted date for 7+ days', () => {
    const result = timeAgo('2024-06-01T12:00:00Z');
    expect(result).toMatch(/01\/06\/2024/);
  });
});
