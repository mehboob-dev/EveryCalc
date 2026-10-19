import { describe, it, expect, beforeEach } from 'vitest';
import { formatNumber, resolveGrouping, resolvePrecision } from '../src/core/format.ts';
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

describe('Cross-cutting Number Formatting & Precision Engine', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setLanguage('en', false);
    updateSettings({
      numberFormat: 'auto',
      masterPrecision: 'auto',
      sectionPrecision: { general: 'auto', finance: 2, unit: 'auto' }
    });
  });

  it('correctly resolves grouping for explicit and locale-driven modes', () => {
    expect(resolveGrouping('international')).toBe('international');
    expect(resolveGrouping('european')).toBe('european');
    expect(resolveGrouping('indian')).toBe('indian');

    // Auto with languages
    expect(resolveGrouping('auto', 'hi')).toBe('indian');
    expect(resolveGrouping('auto', 'de')).toBe('european');
    expect(resolveGrouping('auto', 'fr')).toBe('european');
    expect(resolveGrouping('auto', 'es')).toBe('european');
    expect(resolveGrouping('auto', 'en')).toBe('international');
  });

  it('formats international numbers (comma grouping, period decimal)', () => {
    const res = formatNumber('1234567.8912', { grouping: 'international', precision: 2 });
    expect(res).toBe('1,234,567.89');
  });

  it('formats European numbers (period grouping, comma decimal)', () => {
    const res = formatNumber('1234567.8912', { grouping: 'european', precision: 2 });
    expect(res).toBe('1.234.567,89');
  });

  it('formats Indian numbers (Lakhs & Crores grouping)', () => {
    const res = formatNumber('12345678.50', { grouping: 'indian', precision: 2 });
    expect(res).toBe('1,23,45,678.50');
  });

  it('handles auto precision by trimming trailing zeros', () => {
    expect(formatNumber('45.00000000', { grouping: 'international', precision: 'auto' })).toBe('45');
    expect(formatNumber('45.25000000', { grouping: 'international', precision: 'auto' })).toBe('45.25');
    expect(formatNumber('45.123456789', { grouping: 'international', precision: 'auto' })).toBe('45.12345679');
  });

  it('applies section precision defaults (2 for finance, auto for general)', () => {
    updateSettings({
      sectionPrecision: { finance: 2, general: 'auto', unit: 4 }
    });
    expect(resolvePrecision('finance')).toBe(2);
    expect(resolvePrecision('general')).toBe('auto');
    expect(resolvePrecision('unit')).toBe(4);
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
});
