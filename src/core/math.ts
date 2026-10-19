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

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertUnderThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ONES[n % 10] : '');
  } else if (n > 0) {
    str += ONES[n];
  }
  return str.trim();
}

/**
 * Converts a number to Indian English words (Lakhs, Crores, Thousands, Rupees)
 */
export function numberToIndianWords(val: string | number): string {
  try {
    const cleanStr = String(val).replace(/,/g, '').trim();
    if (!cleanStr) return '';
    const num = Math.floor(Math.abs(Number(cleanStr)));
    if (isNaN(num) || num <= 0) return '';
    if (num > 9999999999) {
      const cr = (num / 10000000).toFixed(2).replace(/\.?0+$/, '');
      return `₹ ${cr} Crore Rupees`;
    }

    const crore = Math.floor(num / 10000000);
    let remainder = num % 10000000;
    const lakh = Math.floor(remainder / 100000);
    remainder = remainder % 100000;
    const thousand = Math.floor(remainder / 1000);
    const hundred = remainder % 1000;

    const parts: string[] = [];
    if (crore > 0) parts.push(`${convertUnderThousand(crore)} Crore`);
    if (lakh > 0) parts.push(`${convertUnderThousand(lakh)} Lakh`);
    if (thousand > 0) parts.push(`${convertUnderThousand(thousand)} Thousand`);
    if (hundred > 0) parts.push(convertUnderThousand(hundred));

    const words = parts.join(' ').trim();
    return words ? `${words} Rupees` : '';
  } catch {
    return '';
  }
}

/**
 * Returns Indian denomination representation (Thousand, Lakh, Crore)
 */
export function getIndianWords(val: string): string {
  try {
    const cleanStr = String(val).replace(/,/g, '').trim();
    if (!cleanStr) return '';
    const d = new Decimal(cleanStr).abs();
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

/**
 * Formats tenure in years to dual format: "X Years (Y Months)"
 */
export function formatTenureYears(years: number | string): string {
  const y = parseFloat(String(years));
  if (isNaN(y) || y <= 0) return '';
  const months = Math.round(y * 12);
  const yrLabel = y === 1 ? '1 Year' : `${y} Years`;
  return `${yrLabel} (${months} Months)`;
}

/**
 * Formats tenure in months to dual format: "X Years (Y Months)" or "M Months"
 */
export function formatTenureMonths(months: number | string): string {
  const m = parseInt(String(months), 10);
  if (isNaN(m) || m <= 0) return '';
  if (m < 12) {
    const yrFraction = (m / 12).toFixed(1).replace(/\.0$/, '');
    return `${m} Months (${yrFraction} Years)`;
  }
  const yrs = (m / 12).toFixed(1).replace(/\.0$/, '');
  const yrLabel = yrs === '1' ? '1 Year' : `${yrs} Years`;
  return `${yrLabel} (${m} Months)`;
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

