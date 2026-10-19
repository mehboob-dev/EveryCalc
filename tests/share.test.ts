import { describe, it, expect } from 'vitest';
import { formatShareCalculation } from '../src/core/share.ts';

describe('General Calculator Share Formatting', () => {
  it('formats expression with result and Indian words denomination', () => {
    const text = formatShareCalculation('1,50,000 + 4,500', '154500');
    expect(text).toContain('🧮 *Calculation*');
    expect(text).toContain('1,50,000 + 4,500 = *1,54,500*');
    expect(text).toContain('≈ ₹ 1.55 Lakh');
    expect(text).toContain('Calculated via EveryCalc');
  });

  it('strips trailing = from expression if present', () => {
    const text = formatShareCalculation('2500000 + 500000 =', '3000000');
    expect(text).toContain('2500000 + 500000 = *30,00,000*');
    expect(text).toContain('≈ ₹ 30 Lakh');
  });

  it('formats without expression when only result is available', () => {
    const text = formatShareCalculation('', '50000000');
    expect(text).toContain('*Result: 5,00,00,000*');
    expect(text).toContain('≈ ₹ 5 Crore');
  });

  it('handles small numbers without denomination words gracefully', () => {
    const text = formatShareCalculation('12 + 18', '30');
    expect(text).toContain('12 + 18 = *30*');
    expect(text).not.toContain('≈ ₹');
    expect(text).toContain('Calculated via EveryCalc');
  });
});
