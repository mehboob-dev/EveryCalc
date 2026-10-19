import { describe, it, expect } from 'vitest';
import { calculate, formatNumber, formatIndianNumber, getIndianWords, appendNumberInput } from '../src/core/math.ts';
import { evaluateExpression, tokenize, infixToRPN } from '../src/core/evaluator.ts';

describe('Keypad Input Handling (0 and 00)', () => {
  it('keeps "0" when 0 or 00 is typed on initial state', () => {
    expect(appendNumberInput('0', '0')).toBe('0');
    expect(appendNumberInput('0', '00')).toBe('0');
  });

  it('replaces initial "0" when non-zero digit is typed', () => {
    expect(appendNumberInput('0', '5')).toBe('5');
    expect(appendNumberInput('0', '9')).toBe('9');
  });

  it('appends 0 and 00 to non-zero numbers', () => {
    expect(appendNumberInput('5', '0')).toBe('50');
    expect(appendNumberInput('5', '00')).toBe('500');
    expect(appendNumberInput('500', '00')).toBe('50000');
    expect(appendNumberInput('1', '00')).toBe('100');
  });

  it('appends 00 to decimal numbers correctly', () => {
    expect(appendNumberInput('0', '.')).toBe('0.');
    expect(appendNumberInput('0.', '00')).toBe('0.00');
    expect(appendNumberInput('5.', '00')).toBe('5.00');
    expect(appendNumberInput('5.2', '00')).toBe('5.200');
  });

  it('handles negative numbers with 0 and 00', () => {
    expect(appendNumberInput('-0', '00')).toBe('-0');
    expect(appendNumberInput('-5', '00')).toBe('-500');
  });

  it('resets calculation result appropriately on new input', () => {
    // Typing 00 or 0 after a result resets to '0'
    expect(appendNumberInput('250', '00', true)).toBe('0');
    expect(appendNumberInput('250', '0', true)).toBe('0');
    // Typing non-zero starts fresh number
    expect(appendNumberInput('250', '5', true)).toBe('5');
    // Typing decimal starts '0.'
    expect(appendNumberInput('250', '.', true)).toBe('0.');
  });

  it('prevents multiple decimal points and respects maximum length', () => {
    expect(appendNumberInput('12.34', '.')).toBe('12.34');
    const eighteenDigits = '123456789012345678';
    expect(appendNumberInput(eighteenDigits, '0')).toBe(eighteenDigits);
    expect(appendNumberInput(eighteenDigits, '00')).toBe(eighteenDigits);
    const seventeenDigits = '12345678901234567';
    expect(appendNumberInput(seventeenDigits, '00')).toBe(seventeenDigits); // 17 + 2 = 19 > 18
  });
});

describe('Core Math Calculations (Decimal.js)', () => {
  it('eliminates IEEE 754 floating-point errors (0.1 + 0.2 = 0.3)', () => {
    const res = calculate('+', '0.1', '0.2');
    expect(res.success).toBe(true);
    expect(res.value).toBe('0.3');
  });

  it('performs exact subtraction', () => {
    const res = calculate('-', '1.0', '0.9');
    expect(res.success).toBe(true);
    expect(res.value).toBe('0.1');
  });

  it('performs exact multiplication', () => {
    const res = calculate('×', '0.2', '0.2');
    expect(res.success).toBe(true);
    expect(res.value).toBe('0.04');
  });

  it('handles division by zero explicitly', () => {
    const res = calculate('÷', '10', '0');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Cannot divide by zero');
  });

  it('computes square root and square', () => {
    expect(calculate('√', '9').value).toBe('3');
    expect(calculate('x²', '5').value).toBe('25');
  });

  it('formats numbers with Indian grouping commas (Lakhs & Crores)', () => {
    expect(formatIndianNumber('1234567.89')).toBe('12,34,567.89');
    expect(formatIndianNumber('10000000')).toBe('1,00,00,000');
    expect(formatIndianNumber('1000')).toBe('1,000');
    expect(formatIndianNumber('42')).toBe('42');
    expect(formatNumber('1234567.89', { grouping: 'indian' })).toBe('12,34,567.89');
  });

  it('converts numbers to Indian denomination words (Thousand, Lakh, Crore)', () => {
    expect(getIndianWords('5000000')).toBe('≈ ₹ 50 Lakh');
    expect(getIndianWords('12500000')).toBe('≈ ₹ 1.25 Crore');
    expect(getIndianWords('25000')).toBe('≈ ₹ 25 Thousand');
    expect(getIndianWords('500')).toBe('');
  });
});

describe('Expression Evaluator (Shunting-Yard & Infix)', () => {
  it('respects operator precedence: multiplication before addition', () => {
    const res = evaluateExpression('2 + 3 * 4');
    expect(res.success).toBe(true);
    expect(res.value).toBe('14');
  });

  it('respects parentheses precedence', () => {
    const res = evaluateExpression('(2 + 3) * 4');
    expect(res.success).toBe(true);
    expect(res.value).toBe('20');
  });

  it('handles nested parentheses', () => {
    const res = evaluateExpression('((2 + 3) * (4 - 1)) + 5');
    expect(res.success).toBe(true);
    expect(res.value).toBe('20');
  });

  it('handles implicit multiplication: 2(3 + 4)', () => {
    const res = evaluateExpression('2(3 + 4)');
    expect(res.success).toBe(true);
    expect(res.value).toBe('14');
  });

  it('handles implicit multiplication between parentheses: (2)(3)', () => {
    const res = evaluateExpression('(2)(3)');
    expect(res.success).toBe(true);
    expect(res.value).toBe('6');
  });

  it('handles unary minus at start and after operators', () => {
    expect(evaluateExpression('-5 + 3').value).toBe('-2');
    expect(evaluateExpression('5 * -3').value).toBe('-15');
    expect(evaluateExpression('(-5) * (-3)').value).toBe('15');
  });

  it('handles exponentiation and right-associativity', () => {
    // 2 ^ 3 = 8
    expect(evaluateExpression('2 ^ 3').value).toBe('8');
  });

  it('handles square root in expressions: sqrt(16) + 4', () => {
    expect(evaluateExpression('sqrt(16) + 4').value).toBe('8');
    expect(evaluateExpression('2 * √(9)').value).toBe('6');
  });

  it('fails deterministically on division by zero', () => {
    const res = evaluateExpression('10 / (5 - 5)');
    expect(res.success).toBe(false);
    expect(res.error).toBe('Cannot divide by zero');
  });

  it('fails deterministically on unmatched opening parenthesis', () => {
    const res = evaluateExpression('(2 + 3 * 4');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Mismatched parentheses');
  });

  it('fails deterministically on unmatched closing parenthesis', () => {
    const res = evaluateExpression('2 + 3) * 4');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Mismatched parentheses');
  });

  describe('ClevCalc-style Percentage Calculations', () => {
    it('calculates addition percentage (12 + 5% = 12.6)', () => {
      const res = evaluateExpression('12 + 5%');
      expect(res.success).toBe(true);
      expect(res.value).toBe('12.6');
    });

    it('calculates subtraction percentage (100 - 20% = 80)', () => {
      const res = evaluateExpression('100 - 20%');
      expect(res.success).toBe(true);
      expect(res.value).toBe('80');
    });

    it('calculates multiplication percentage (12 * 5% = 0.6)', () => {
      const res = evaluateExpression('12 * 5%');
      expect(res.success).toBe(true);
      expect(res.value).toBe('0.6');
    });

    it('calculates division percentage (12 / 5% = 240)', () => {
      const res = evaluateExpression('12 / 5%');
      expect(res.success).toBe(true);
      expect(res.value).toBe('240');
    });

    it('calculates standalone percentage (5% = 0.05)', () => {
      const res = evaluateExpression('5%');
      expect(res.success).toBe(true);
      expect(res.value).toBe('0.05');
    });

    it('calculates chained percentage operations (12 + 5% + 10% = 13.86)', () => {
      const res = evaluateExpression('12 + 5% + 10%');
      expect(res.success).toBe(true);
      expect(res.value).toBe('13.86');
    });

    it('calculates percentage of compound expression ((12 + 5)% = 0.17)', () => {
      const res = evaluateExpression('(12 + 5)%');
      expect(res.success).toBe(true);
      expect(res.value).toBe('0.17');
    });
  });
});
