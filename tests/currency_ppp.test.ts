import { describe, it, expect } from 'vitest';
import { calculatePpp, PPP_COUNTRIES } from '../src/modules/ppp.ts';
import { CURRENCIES, getPinnedCurrencies, togglePinnedCurrency } from '../src/modules/advanced.ts';
import { formatInputValue } from '../src/core/math.ts';

describe('Currency Converter (Bidirectional & All Currencies List)', () => {
  it('contains comprehensive global currency definitions with codes, flags, and rates', () => {
    expect(CURRENCIES.length).toBeGreaterThanOrEqual(15);
    const usd = CURRENCIES.find((c) => c.code === 'USD');
    const inr = CURRENCIES.find((c) => c.code === 'INR');
    const aed = CURRENCIES.find((c) => c.code === 'AED');
    const eur = CURRENCIES.find((c) => c.code === 'EUR');

    expect(usd?.ratePerUSD).toBe(1.0);
    expect(inr?.ratePerUSD).toBeGreaterThan(80);
    expect(aed?.ratePerUSD).toBeGreaterThan(3.5);
    expect(eur?.ratePerUSD).toBeLessThan(1.0);
  });

  it('manages pinned currencies with default fallback', () => {
    const pinned = getPinnedCurrencies();
    expect(pinned).toContain('USD');
    expect(pinned).toContain('INR');
  });

  it('toggles pinned currencies reliably', () => {
    const initial = getPinnedCurrencies();
    const updated = togglePinnedCurrency('JPY');
    expect(updated).toContain('JPY');

    const toggledBack = togglePinnedCurrency('JPY');
    expect(toggledBack).not.toContain('JPY');
  });
});

describe('Purchasing Power Parity (PPP) Calculator', () => {
  it('correctly calculates equivalent living standard salary between USA and India', () => {
    // US $100,000 to India
    const res = calculatePpp(100000, 'USA', 'IND');

    // Equivalent salary: $100,000 * (24.5 / 1.0) = ₹24,50,000
    expect(res.equivalentSalary).toBe(2450000);
    expect(res.sourceSalary).toBe(100000);
    expect(res.sourceCountry.id).toBe('USA');
    expect(res.targetCountry.id).toBe('IND');

    // India is cheaper than US in cost of living
    expect(res.costOfLivingDiffPct).toBeLessThan(-50);
    expect(res.purchasingPowerMultiplier).toBeGreaterThan(2.5);
  });

  it('correctly handles comma-formatted string inputs according to grouping system', () => {
    // US $100,000 with commas
    const res = calculatePpp('1,00,000', 'USA', 'IND');
    expect(res.equivalentSalary).toBe(2450000);

    // India ₹24,50,000 with commas
    const resReverse = calculatePpp('24,50,000', 'IND', 'USA');
    expect(resReverse.equivalentSalary).toBe(100000);

    // formatInputValue produces standardized grouping commas
    expect(formatInputValue('100000')).toBe('1,00,000');
    expect(formatInputValue('2500000')).toBe('25,00,000');
  });

  it('correctly calculates reverse conversion from India to USA', () => {
    // India ₹24,50,000 to USA
    const res = calculatePpp(2450000, 'IND', 'USA');

    // Equivalent should be ~$100,000
    expect(res.equivalentSalary).toBe(100000);
    expect(res.costOfLivingDiffPct).toBeGreaterThan(100);
    expect(res.purchasingPowerMultiplier).toBeLessThan(0.5);
  });

  it('handles UAE Dubai to India salary comparison', () => {
    // AED 300,000 (~25k/month) to India
    const res = calculatePpp(300000, 'ARE', 'IND');
    expect(res.equivalentSalary).toBeGreaterThan(3000000);
    expect(res.targetCountry.currency).toBe('INR');
  });

  it('returns valid PPP country dataset with sub-indices and presets', () => {
    expect(PPP_COUNTRIES.length).toBeGreaterThanOrEqual(10);
    PPP_COUNTRIES.forEach((c) => {
      expect(c.pppFactor).toBeGreaterThan(0);
      expect(c.nominalRate).toBeGreaterThan(0);
      expect(c.presets.length).toBeGreaterThanOrEqual(3);
    });
  });
});
