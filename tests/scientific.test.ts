import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '../src/core/evaluator.ts';

describe('Scientific Engine: Trigonometric Functions (DEG & RAD)', () => {
  it('computes exact sine in degree mode (sin(30) = 0.5)', () => {
    const res = evaluateExpression('sin(30)', 'DEG');
    expect(res.success).toBe(true);
    expect(res.value).toBe('0.5');
  });

  it('computes exact cosine in degree mode (cos(60) = 0.5)', () => {
    const res = evaluateExpression('cos(60)', 'DEG');
    expect(res.success).toBe(true);
    expect(res.value).toBe('0.5');
  });

  it('computes exact tangent in degree mode (tan(45) = 1)', () => {
    const res = evaluateExpression('tan(45)', 'DEG');
    expect(res.success).toBe(true);
    expect(res.value).toBe('1');
  });

  it('computes inverse trigonometric functions (asin, acos, atan)', () => {
    expect(evaluateExpression('asin(0.5)', 'DEG').value).toBe('30');
    expect(evaluateExpression('acos(0.5)', 'DEG').value).toBe('60');
    expect(evaluateExpression('atan(1)', 'DEG').value).toBe('45');
  });

  it('computes trigonometric functions in radian mode', () => {
    // sin(π / 2) = 1
    const res = evaluateExpression('sin(π / 2)', 'RAD');
    expect(res.success).toBe(true);
    expect(res.value).toBe('1');
  });
});

describe('Scientific Engine: Logarithmic Functions and Constants', () => {
  it('computes base-10 logarithm (log(100) = 2, log(1000) = 3)', () => {
    expect(evaluateExpression('log(100)').value).toBe('2');
    expect(evaluateExpression('log(1000)').value).toBe('3');
  });

  it('computes natural logarithm (ln(e) = 1)', () => {
    expect(evaluateExpression('ln(e)').value).toBe('1');
  });

  it('handles mathematical constants π and e with implicit multiplication', () => {
    const resPi = evaluateExpression('2 * π');
    expect(resPi.success).toBe(true);
    expect(parseFloat(resPi.value)).toBeCloseTo(6.283185, 4);

    const resE = evaluateExpression('2e');
    expect(resE.success).toBe(true);
    expect(parseFloat(resE.value)).toBeCloseTo(5.436563, 4);
  });
});

describe('Scientific Engine: Factorial Operator (!)', () => {
  it('computes integer factorials accurately', () => {
    expect(evaluateExpression('5!').value).toBe('120');
    expect(evaluateExpression('0!').value).toBe('1');
    expect(evaluateExpression('1!').value).toBe('1');
    expect(evaluateExpression('6!').value).toBe('720');
  });

  it('combines factorial in expressions (e.g., 3! + 4!)', () => {
    // 6 + 24 = 30
    expect(evaluateExpression('3! + 4!').value).toBe('30');
  });

  it('fails gracefully on negative or non-integer factorial', () => {
    const res = evaluateExpression('(-3)!');
    expect(res.success).toBe(false);
  });
});
