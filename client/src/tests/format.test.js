import { formatPrice, formatTime, STATUS_MAP } from '../utils/format';

describe('formatPrice', () => {
  test('formats number with ¥ and 2 decimal places', () => {
    expect(formatPrice(99)).toBe('¥99.00');
    expect(formatPrice(99.9)).toBe('¥99.90');
    expect(formatPrice(0)).toBe('¥0.00');
  });

  test('handles string input', () => {
    expect(formatPrice('123.5')).toBe('¥123.50');
  });

  test('handles decimal input', () => {
    expect(formatPrice(1999.99)).toBe('¥1999.99');
  });
});

describe('formatTime', () => {
  test('formats ISO date string to Chinese format', () => {
    const result = formatTime('2024-03-15 10:30:00');
    expect(result).toContain('2024年');
    expect(result).toContain('03月');
    expect(result).toContain('15日');
    expect(result).toContain('10:30');
  });

  test('returns empty string for null/undefined', () => {
    expect(formatTime(null)).toBe('');
    expect(formatTime(undefined)).toBe('');
    expect(formatTime('')).toBe('');
  });
});

describe('STATUS_MAP', () => {
  test('has all expected statuses', () => {
    expect(STATUS_MAP.pending).toBeDefined();
    expect(STATUS_MAP.paid).toBeDefined();
    expect(STATUS_MAP.shipped).toBeDefined();
    expect(STATUS_MAP.delivered).toBeDefined();
    expect(STATUS_MAP.cancelled).toBeDefined();
  });

  test('each status has label and class', () => {
    Object.values(STATUS_MAP).forEach(s => {
      expect(s.label).toBeDefined();
      expect(s.class).toBeDefined();
    });
  });
});
