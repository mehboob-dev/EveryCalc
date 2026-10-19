import { describe, it, expect, beforeEach } from 'vitest';
import { formatNumber, formatLabelNumber, resolveGrouping, resolvePrecision, formatExpressionGrouping } from '../src/core/format.ts';
import { updateSettings } from '../src/core/settings.ts';
import { setLanguage } from '../src/core/i18n.ts';

// In-memory mock storage for headless node environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  }
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Cross-cutting Number Formatting, Comma Grouping & Simplified Precision', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setLanguage('en', false);
    updateSettings({
      numberFormat: 'indian',
      precision: 'auto'
    });
  });

  it('correctly resolves grouping for explicit modes and defaults to Indian numbering', () => {
    expect(resolveGrouping('international')).toBe('international');
    expect(resolveGrouping('european')).toBe('european');
    expect(resolveGrouping('indian')).toBe('indian');

    // Auto with languages: de/fr/es to european, otherwise indian
    expect(resolveGrouping('auto', 'hi')).toBe('indian');
    expect(resolveGrouping('auto', 'de')).toBe('european');
    expect(resolveGrouping('auto', 'fr')).toBe('european');
    expect(resolveGrouping('auto', 'es')).toBe('european');
    expect(resolveGrouping('auto', 'en')).toBe('indian');
  });

  it('formats Indian numbers with consistent Lakhs & Crores grouping everywhere', () => {
    const res = formatNumber('12345678.50', { grouping: 'indian', precision: 2 });
    expect(res).toBe('1,23,45,678.50');

    const oneLakh = formatNumber('100000', { grouping: 'indian', precision: 2 });
    expect(oneLakh).toBe('1,00,000.00');

    const tenLakh = formatNumber('1000000', { grouping: 'indian', precision: 'auto' });
    expect(tenLakh).toBe('10,00,000');
  });

  it('formats expressions with grouping commas matching active standard', () => {
    expect(formatExpressionGrouping('100000 + 50000', 'indian')).toBe('1,00,000 + 50,000');
    expect(formatExpressionGrouping('1000000 * 2', 'indian')).toBe('10,00,000 * 2');
    expect(formatExpressionGrouping('sin(100000)', 'indian')).toBe('sin(1,00,000)');

    expect(formatExpressionGrouping('100000 + 50000', 'international')).toBe('100,000 + 50,000');
  });

  it('formats international numbers (3-digit grouping, period decimal)', () => {
    const res = formatNumber('1234567.8912', { grouping: 'international', precision: 2 });
    expect(res).toBe('1,234,567.89');
  });

  it('formats European numbers (period grouping, comma decimal)', () => {
    const res = formatNumber('1234567.8912', { grouping: 'european', precision: 2 });
    expect(res).toBe('1.234.567,89');
  });

  it('supports simplified single precision options from 1 to 10', () => {
    for (let p = 1; p <= 10; p++) {
      updateSettings({ precision: p });
      expect(resolvePrecision()).toBe(p);
      const val = formatNumber('12.34567891234', { precision: p });
      const decimalCount = val.split('.')[1].length;
      expect(decimalCount).toBe(p);
    }
  });

  it('handles auto precision by trimming trailing zeros up to 10 decimals', () => {
    expect(formatNumber('45.0000000000', { grouping: 'international', precision: 'auto' })).toBe('45');
    expect(formatNumber('45.2500000000', { grouping: 'international', precision: 'auto' })).toBe('45.25');
    expect(formatNumber('45.1234567891', { grouping: 'international', precision: 'auto' })).toBe('45.1234567891');
  });

  it('handles negative numbers, zeros, and non-numeric strings gracefully', () => {
    expect(formatNumber('-1234567.89', { grouping: 'international', precision: 2 })).toBe('-1,234,567.89');
    expect(formatNumber('0', { grouping: 'international', precision: 2 })).toBe('0.00');
    expect(formatNumber('-0', { grouping: 'international', precision: 2 })).toBe('0.00');
    expect(formatNumber('Error')).toBe('Error');
    expect(formatNumber('NaN')).toBe('NaN');
  });

  it('adds optional currency symbols appropriately', () => {
    const formatted = formatNumber('50000', { grouping: 'indian', precision: 2, currencySymbol: '₹' });
    expect(formatted).toBe('₹ 50,000.00');
  });

  it('does NOT apply 10 decimal places to labels, gold rate presets, or input echoes', () => {
    // User configured 10 decimal places
    updateSettings({ precision: 10 });

    // Regular formatNumber will format results with 10 decimal places
    expect(formatNumber('75000')).toBe('75,000.0000000000');

    // formatLabelNumber must NEVER add artificial trailing zeros to labels or presets
    expect(formatLabelNumber('75000')).toBe('75,000');
    expect(formatLabelNumber('7200')).toBe('7,200');
    expect(formatLabelNumber('75000.5')).toBe('75,000.5');

    // formatNumber with trimTrailingZeros or isLabel also respects this
    expect(formatNumber('75000', { trimTrailingZeros: true })).toBe('75,000');
    expect(formatNumber('75000', { isLabel: true })).toBe('75,000');
  });
});
