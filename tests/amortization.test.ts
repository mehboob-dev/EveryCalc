import { describe, it, expect } from 'vitest';
import {
  generateAmortizationSchedule,
  calculateLoan
} from '../src/modules/financial.ts';

describe('Loan Amortization & Multi-Frequency Calculations', () => {
  it('generates 12-month standard monthly amortization schedule correctly', () => {
    // 100,000 principal, 12% annual interest, 12 months
    const schedule = generateAmortizationSchedule('100000', '12', '12', 'MONTHLY', 'AMORTIZATION');
    expect(schedule.frequency).toBe('MONTHLY');
    expect(schedule.totalPeriods).toBe(12);
    expect(schedule.rows.length).toBe(12);

    // Initial period payment should be ~8884.88
    expect(parseFloat(schedule.rows[0].payment)).toBeCloseTo(8884.88, 1);
    // Interest for month 1: 100000 * 0.01 = 1000.00
    expect(parseFloat(schedule.rows[0].interest)).toBeCloseTo(1000.00, 1);

    // Last period balance must reach 0.00 exactly (rounding correction)
    const lastRow = schedule.rows[schedule.rows.length - 1];
    expect(parseFloat(lastRow.balance)).toBe(0);

    // Cumulative principal paid across all rows equals loan principal
    const sumPrincipal = schedule.rows.reduce((sum, r) => sum + parseFloat(r.principal), 0);
    expect(sumPrincipal).toBeCloseTo(100000, 1);

    // Yearly rows should aggregate into 1 year
    expect(schedule.yearlyRows.length).toBe(1);
    expect(schedule.yearlyRows[0].year).toBe(1);
    expect(parseFloat(schedule.yearlyRows[0].balance)).toBe(0);
  });

  it('supports Bi-weekly (26 payments/year) repayment schedule', () => {
    // 100,000 principal, 10% annual interest, 12 months (1 year -> 26 bi-weekly periods)
    const schedule = generateAmortizationSchedule('100000', '10', '12', 'BIWEEKLY', 'AMORTIZATION');
    expect(schedule.frequency).toBe('BIWEEKLY');
    expect(schedule.totalPeriods).toBe(26);
    expect(schedule.rows.length).toBe(26);

    // Last balance must reach 0.00
    const lastRow = schedule.rows[schedule.rows.length - 1];
    expect(parseFloat(lastRow.balance)).toBe(0);

    // Total principal equals 100,000
    const sumPrincipal = schedule.rows.reduce((sum, r) => sum + parseFloat(r.principal), 0);
    expect(sumPrincipal).toBeCloseTo(100000, 1);
  });

  it('supports Weekly (52 payments/year) repayment schedule', () => {
    // 50,000 principal, 8% annual interest, 12 months (1 year -> 52 weekly periods)
    const schedule = generateAmortizationSchedule('50000', '8', '12', 'WEEKLY', 'AMORTIZATION');
    expect(schedule.frequency).toBe('WEEKLY');
    expect(schedule.totalPeriods).toBe(52);
    expect(schedule.rows.length).toBe(52);

    // Last balance must reach 0.00
    const lastRow = schedule.rows[schedule.rows.length - 1];
    expect(parseFloat(lastRow.balance)).toBe(0);
  });

  it('calculates equal principal (reducing balance) amortization schedule', () => {
    const schedule = generateAmortizationSchedule('120000', '12', '12', 'MONTHLY', 'EQUAL_PRINCIPAL');
    expect(schedule.rows.length).toBe(12);
    // Principal in each month should be 120000 / 12 = 10000
    expect(parseFloat(schedule.rows[0].principal)).toBeCloseTo(10000, 1);
    expect(parseFloat(schedule.rows[5].principal)).toBeCloseTo(10000, 1);
    // Last balance is 0.00
    expect(parseFloat(schedule.rows[11].balance)).toBe(0);
  });

  it('works seamlessly with calculateLoan multi-frequency parameters', () => {
    const monthly = calculateLoan('100000', '12', '12', 'AMORTIZATION', 'MONTHLY');
    expect(monthly.monthlyPayment).toBe('8884.88');

    const biweekly = calculateLoan('100000', '12', '12', 'AMORTIZATION', 'BIWEEKLY');
    expect(biweekly.frequency).toBe('BIWEEKLY');
    expect(parseFloat(biweekly.monthlyPayment)).toBeLessThan(parseFloat(monthly.monthlyPayment));
  });
});
