import { describe, it, expect } from 'vitest';
import { calculateLoan, calculateSavings, calculateUnitPrice, calculateSIP, calculateFD } from '../src/modules/financial.ts';
import { calculateHealth, calculateFuelCost, calculateFuelEfficiency, calculateDateDiff } from '../src/modules/health_fuel.ts';
import { convertBases, calculateCycle } from '../src/modules/advanced.ts';

describe('Financial Modules (LON, IRA, UPR)', () => {
  it('calculates equal payment loan amortization', () => {
    // Principal: 100,000, 12% annual interest (1% monthly), 12 months
    const res = calculateLoan('100000', '12', '12', 'AMORTIZATION');
    expect(res.monthlyPayment).toBe('8884.88');
    expect(res.totalInterest).toBe('6618.55');
    expect(res.totalPayment).toBe('106618.55');
  });

  it('calculates Indian SIP returns (Mutual Funds)', () => {
    // ₹5,000 / month, 12% p.a., 10 years (120 months)
    // Invested: 5000 * 120 = 600,000
    const res = calculateSIP('5000', '12', '10');
    expect(res.totalInvested).toBe('600000.00');
    expect(parseFloat(res.totalValue)).toBeGreaterThan(1150000);
    expect(parseFloat(res.estimatedReturns)).toBeGreaterThan(550000);
  });

  it('calculates Indian Fixed Deposit with quarterly compounding and Senior Citizen bonus', () => {
    // ₹1,00,000, 7.0% p.a., 3 years
    const regular = calculateFD('100000', '7.0', '3', false);
    expect(regular.investedAmount).toBe('100000.00');
    expect(parseFloat(regular.maturityAmount)).toBeGreaterThan(120000);

    // Senior citizen +0.5% rate -> 7.5%
    const senior = calculateFD('100000', '7.0', '3', true);
    expect(parseFloat(senior.totalInterest)).toBeGreaterThan(parseFloat(regular.totalInterest));
  });

  it('calculates savings compound interest', () => {
    // Initial: 10,000, Monthly: 1,000, Rate: 5%, Term: 12 months, Tax: 0%
    const res = calculateSavings('10000', '1000', '5', '12', '0');
    expect(res.totalPrincipal).toBe('22000.00');
    expect(parseFloat(res.finalBalance)).toBeGreaterThan(22000);
  });

  it('evaluates unit prices and determines cheaper item', () => {
    // Item A: $10 for 500g -> $0.02/g. Item B: $15 for 1000g -> $0.015/g.
    const res = calculateUnitPrice('10', '500', '15', '1000');
    expect(res.unitPriceA).toBe('0.0200');
    expect(res.unitPriceB).toBe('0.0150');
    expect(res.cheaperItem).toBe('B');
    expect(res.savingsPercent).toBe('25.0');
  });
});

describe('Health and Fuel Modules (HET, FCS, FFC, DAT)', () => {
  it('calculates BMI and category correctly', () => {
    // 180cm, 75kg -> BMI = 75 / 1.8^2 = 23.15 (Normal)
    const res = calculateHealth('180', '75', '25', 'male');
    expect(res.bmi).toBe('23.1');
    expect(res.bmiCategory).toBe('Normal weight');
    expect(parseInt(res.bmr, 10)).toBeGreaterThan(1700);
  });

  it('calculates fuel cost accurately', () => {
    // Distance: 300 km, Efficiency: 15 km/L, Fuel price: 1.50
    const res = calculateFuelCost('300', '15', '1.50');
    expect(res.fuelVolumeNeeded).toBe('20.00');
    expect(res.totalCost).toBe('30.00');
  });

  it('converts fuel efficiency to multiple metrics', () => {
    // 100 km on 10 Liters -> 10 km/L -> 10 L/100km
    const res = calculateFuelEfficiency('100', '10');
    expect(res.kmPerLiter).toBe('10.00');
    expect(res.litersPer100Km).toBe('10.00');
    expect(res.mpgUS).toBe('23.52');
  });

  it('calculates date difference in days and weeks', () => {
    const res = calculateDateDiff('2026-01-01', '2026-01-15');
    expect(res.totalDays).toBe(14);
    expect(res.weeksAndDays).toBe('2 weeks, 0 days');
  });
});

describe('Advanced Converters (HEX, LDC)', () => {
  it('converts decimal to hex, octal, and binary', () => {
    const res = convertBases('255', 10);
    expect(res.hex).toBe('FF');
    expect(res.oct).toBe('377');
    expect(res.bin).toBe('1111 1111');
  });

  it('calculates ovulation window based on cycle length', () => {
    const res = calculateCycle('2026-05-01', 28);
    expect(res.ovulationDay).toBeDefined();
    expect(res.fertileWindow).toContain('–');
  });
});
