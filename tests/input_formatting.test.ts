import { describe, it, expect } from 'vitest';
import { attachCommaFormatter, formatInputValue } from '../src/core/math.ts';
import { calculateGoldPrice } from '../src/modules/gold.ts';
import { calculateLoan, generateAmortizationSchedule, calculateSIP, calculateFD, calculateSavings } from '../src/modules/financial.ts';
import { calculateIncomeTax } from '../src/modules/income_tax.ts';
import { calculateTax } from '../src/modules/tax.ts';
import { calculateDiscount } from '../src/modules/discount.ts';
import { calculateTip } from '../src/modules/tip.ts';

describe('Standardized Comma Formatting & Parsing Across All Calculator Modules', () => {
  it('formats values into standardized grouping representation', () => {
    expect(formatInputValue('1000')).toBe('1,000');
    expect(formatInputValue('100000')).toBe('1,00,000');
    expect(formatInputValue('1500000')).toBe('15,00,000');
    expect(formatInputValue('10000000')).toBe('1,00,00,000');
    expect(formatInputValue('78000.50')).toBe('78,000.50');
    expect(formatInputValue('')).toBe('');
    expect(formatInputValue('-')).toBe('-');
  });

  it('attachCommaFormatter dynamically updates input value while tracking caret', () => {
    const listeners: Record<string, ((e?: unknown) => void)[]> = {};
    const input = {
      value: '100000',
      selectionStart: 6,
      addEventListener(type: string, cb: (e?: unknown) => void) {
        listeners[type] = listeners[type] || [];
        listeners[type].push(cb);
      },
      setSelectionRange(start: number, _end: number) {
        this.selectionStart = start;
      }
    } as unknown as HTMLInputElement;

    let changedVal = '';
    attachCommaFormatter(input, (raw) => {
      changedVal = raw;
    });

    // Simulate user typing another zero at the end
    input.value = '1000000';
    input.selectionStart = 7;
    (listeners['input'] || []).forEach((cb) => cb());

    expect(input.value).toBe('10,00,000');
    expect(changedVal).toBe('1000000');
    expect(input.selectionStart).toBe(9); // '10,00,000'.length
  });

  it('calculateGoldPrice accepts comma-grouped gold rate and making charges', () => {
    const res = calculateGoldPrice('10', 'g', '22K', '78,000', '1,000', 'FLAT_TOTAL', { rateUnit: 'PER_10G' });
    expect(parseFloat(res.goldValue)).toBeGreaterThan(0);
    expect(parseFloat(res.totalPayable)).toBeGreaterThan(0);
    expect(res.makingChargeAmount).toBe('1000.00');
  });

  it('calculateLoan and amortization accept comma-grouped principal', () => {
    const res = calculateLoan('50,00,000', '8.5', '240');
    expect(parseFloat(res.monthlyPayment)).toBeGreaterThan(40000);
    expect(parseFloat(res.totalPayment)).toBeGreaterThan(5000000);

    const schedule = generateAmortizationSchedule('50,00,000', '8.5', '240');
    expect(schedule.totalPeriods).toBe(240);
    expect(schedule.rows.length).toBe(240);
  });

  it('calculateSIP accepts comma-grouped monthly investment', () => {
    const res = calculateSIP('10,000', '12', '10');
    expect(res.totalInvested).toBe('1200000.00');
    expect(parseFloat(res.totalValue)).toBeGreaterThan(2000000);
  });

  it('calculateFD accepts comma-grouped investment amount', () => {
    const res = calculateFD('5,00,000', '7.1', '3');
    expect(res.investedAmount).toBe('500000.00');
    expect(parseFloat(res.maturityAmount)).toBeGreaterThan(500000);
  });

  it('calculateSavings accepts comma-grouped deposits', () => {
    const res = calculateSavings('1,00,000', '5,000', '6.5', '24');
    expect(parseFloat(res.finalBalance)).toBeGreaterThan(220000);
  });

  it('calculateIncomeTax accepts comma-grouped CTC and deduction inputs', () => {
    const res = calculateIncomeTax('15,00,000', '1,50,000', '25,000');
    expect(res.grossIncome).toBe('1500000.00');
    expect(parseFloat(res.newTotalTax)).toBeGreaterThan(0);
    expect(parseFloat(res.oldTotalTax)).toBeGreaterThan(0);
  });

  it('calculateTax accepts comma-grouped net amounts', () => {
    const res = calculateTax('1,00,000', '18', 'EXCLUDE');
    expect(res.netAmount).toBe('100000.00');
    expect(res.taxAmount).toBe('18000.00');
    expect(res.grossAmount).toBe('118000.00');
  });

  it('calculateDiscount accepts comma-grouped prices', () => {
    const res = calculateDiscount('10,000', '10');
    expect(res.discountedPrice).toBe('9000.00');
    expect(res.totalSavings).toBe('1000.00');
  });

  it('calculateTip accepts comma-grouped bills', () => {
    const res = calculateTip('5,000', '15', 4);
    expect(res.tipAmount).toBe('750.00');
    expect(res.totalPayable).toBe('5750.00');
    expect(res.totalPerPerson).toBe('1437.50');
  });
});
