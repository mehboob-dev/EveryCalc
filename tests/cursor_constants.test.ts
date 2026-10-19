import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '../src/core/evaluator.ts';
import { EXTENDED_CONSTANTS } from '../src/core/constants.ts';

describe('Extended Constants & Formula Evaluation', () => {
  it('correctly evaluates formulas with Golden Ratio φ', () => {
    const res = evaluateExpression('φ * 2');
    expect(res.success).toBe(true);
    expect(parseFloat(res.value)).toBeCloseTo(1.6180339887 * 2, 8);
  });

  it('correctly evaluates speed of light c and standard constants', () => {
    const resC = evaluateExpression('c / 1000000');
    expect(resC.success).toBe(true);
    expect(resC.value).toBe('299.792458');

    const resG = evaluateExpression('g * 2');
    expect(resG.success).toBe(true);
    expect(resG.value).toBe('19.6133');
  });

  it('distinguishes single-letter constants from function names (e.g. cos, tan, log)', () => {
    const resCos = evaluateExpression('cos(0)', 'RAD');
    expect(resCos.success).toBe(true);
    expect(resCos.value).toBe('1');

    const resSin = evaluateExpression('sin(0)', 'RAD');
    expect(resSin.success).toBe(true);
    expect(resSin.value).toBe('0');
  });

  it('provides all 14 extended physical and mathematical constants', () => {
    expect(EXTENDED_CONSTANTS.length).toBeGreaterThanOrEqual(14);
    const symbols = EXTENDED_CONSTANTS.map((c) => c.symbol);
    expect(symbols).toContain('π');
    expect(symbols).toContain('e');
    expect(symbols).toContain('φ');
    expect(symbols).toContain('c');
    expect(symbols).toContain('h');
    expect(symbols).toContain('G');
    expect(symbols).toContain('kB');
    expect(symbols).toContain('NA');
  });
});
