import Decimal from 'decimal.js';

// Configure Decimal for financial and scientific precision
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 20
});

export { Decimal };

export interface CalculationResult {
  success: boolean;
  value: string;
  error?: string;
}

/**
 * Evaluates basic arithmetic operations deterministically
 */
export function calculate(op: string, a: string | number, b?: string | number): CalculationResult {
  try {
    const da = new Decimal(a);
    const db = b !== undefined ? new Decimal(b) : new Decimal(0);

    let res: Decimal;
    switch (op) {
      case '+':
        res = da.plus(db);
        break;
      case '-':
      case '−':
        res = da.minus(db);
        break;
      case '*':
      case '×':
        res = da.times(db);
        break;
      case '/':
      case '÷':
        if (db.isZero()) {
          return { success: false, value: '0', error: 'Cannot divide by zero' };
        }
        res = da.dividedBy(db);
        break;
      case '%':
        res = da.dividedBy(100);
        break;
      case 'sqrt':
      case '√':
        if (da.isNegative()) {
          return { success: false, value: '0', error: 'Invalid input' };
        }
        res = da.squareRoot();
        break;
      case 'sqr':
      case 'x²':
        res = da.pow(2);
        break;
      case 'inv':
      case '1/x':
        if (da.isZero()) {
          return { success: false, value: '0', error: 'Cannot divide by zero' };
        }
        res = new Decimal(1).dividedBy(da);
        break;
      default:
        return { success: false, value: '0', error: `Unknown operator: ${op}` };
    }

    return { success: true, value: res.toString() };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Calculation error';
    return { success: false, value: '0', error: message };
  }
}

/**
 * Format decimal string with Indian numbering system grouping (Lakhs & Crores)
 * e.g. 1,00,000 (1 Lakh), 1,00,00,000 (1 Crore)
 */
export function formatIndianNumber(val: string): string {
  if (!val || val === 'NaN' || val === 'Infinity' || val === '-Infinity' || val === 'Error') return val;
  const isNegative = val.startsWith('-');
  const cleanVal = isNegative ? val.slice(1) : val;
  const parts = cleanVal.split('.');
  let intPart = parts[0];

  if (intPart.length > 3) {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherDigits = intPart.substring(0, intPart.length - 3);
    const withCommas = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    intPart = `${withCommas},${lastThree}`;
  }

  const result = parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  return isNegative ? `-${result}` : result;
}

/**
 * Returns Indian denomination representation (Thousand, Lakh, Crore)
 */
export function getIndianWords(val: string): string {
  try {
    const d = new Decimal(val).abs();
    if (d.lessThan(1000)) return '';
    if (d.greaterThanOrEqualTo(10000000)) {
      const cr = d.dividedBy(10000000);
      const crStr = cr.toFixed(2).replace(/\.?0+$/, '');
      return `≈ ₹ ${crStr} Crore`;
    }
    if (d.greaterThanOrEqualTo(100000)) {
      const lk = d.dividedBy(100000);
      const lkStr = lk.toFixed(2).replace(/\.?0+$/, '');
      return `≈ ₹ ${lkStr} Lakh`;
    }
    if (d.greaterThanOrEqualTo(1000)) {
      const th = d.dividedBy(1000);
      const thStr = th.toFixed(2).replace(/\.?0+$/, '');
      return `≈ ₹ ${thStr} Thousand`;
    }
  } catch {
    return '';
  }
  return '';
}

import { formatNumber as coreFormatNumber, FormatOptions } from './format.ts';

export { coreFormatNumber as formatNumber };
export type { FormatOptions };

/**
 * Appends a digit, '00', or decimal separator to the current calculator number input
 */
export function appendNumberInput(
  currentNumber: string,
  input: string,
  isResultDisplayed: boolean = false
): string {
  if (isResultDisplayed) {
    if (input === '00' || input === '0') {
      return '0';
    }
    if (input === '.') {
      return '0.';
    }
    return input;
  }

  if (currentNumber === '0' && input !== '.') {
    if (input === '00') {
      return '0';
    }
    return input;
  }

  if (currentNumber === '-0' && input !== '.') {
    if (input === '00') {
      return '-0';
    }
    return '-' + input;
  }

  if (input === '.' && currentNumber.includes('.')) {
    return currentNumber;
  }

  if (currentNumber.length + input.length > 18) {
    return currentNumber;
  }

  return currentNumber + input;
}

