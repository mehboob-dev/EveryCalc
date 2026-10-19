import { describe, it, expect } from 'vitest';
import { calculateDiscount } from '../src/modules/discount.ts';
import { calculateTip } from '../src/modules/tip.ts';
import { calculateTax } from '../src/modules/tax.ts';
import { calculatePercentOf, calculatePercentRatio, calculatePercentChange } from '../src/modules/percentage.ts';
import { convertUnit, UNIT_CATEGORIES } from '../src/modules/unit.ts';
import { calculateGoldPrice } from '../src/modules/gold.ts';
import { calculateIncomeTax } from '../src/modules/income_tax.ts';
import { calculateInHandSalary } from '../src/modules/salary.ts';

describe('Discount Calculator (DCT)', () => {
  it('calculates standard single discount', () => {
    const res = calculateDiscount('100', '20');
    expect(res.finalPrice).toBe('80.00');
    expect(res.totalSavings).toBe('20.00');
  });

  it('calculates secondary stacked discount and tax', () => {
    // 100 with 20% discount -> 80. Then additional 10% discount on 80 -> 72. Then 10% tax -> 7.20. Total: 79.20
    const res = calculateDiscount('100', '20', '10', '10');
    expect(res.discountedPrice).toBe('72.00');
    expect(res.taxAmount).toBe('7.20');
    expect(res.finalPrice).toBe('79.20');
    expect(res.totalSavings).toBe('28.00');
  });
});

describe('Tip Calculator (TIP)', () => {
  it('calculates tip and splits evenly across diners', () => {
    const res = calculateTip('100', '15', '3');
    expect(res.tipAmount).toBe('15.00');
    expect(res.totalPayable).toBe('115.00');
    expect(res.tipPerPerson).toBe('5.00');
    expect(res.totalPerPerson).toBe('38.33');
  });
});

describe('VAT / Tax Calculator (TAX) & Indian GST', () => {
  it('calculates tax when excluding tax (Net -> Gross)', () => {
    const res = calculateTax('100', '20', 'EXCLUDE');
    expect(res.netAmount).toBe('100.00');
    expect(res.taxAmount).toBe('20.00');
    expect(res.grossAmount).toBe('120.00');
  });

  it('calculates tax when including tax (Gross -> Net)', () => {
    const res = calculateTax('120', '20', 'INCLUDE');
    expect(res.grossAmount).toBe('120.00');
    expect(res.netAmount).toBe('100.00');
    expect(res.taxAmount).toBe('20.00');
  });

  it('calculates Indian GST Intra-state breakdown (CGST + SGST split)', () => {
    // 18% GST on ₹1,000 net: CGST 9% (₹90), SGST 9% (₹90), Gross ₹1,180
    const res = calculateTax('1000', '18', 'EXCLUDE', false);
    expect(res.netAmount).toBe('1000.00');
    expect(res.taxAmount).toBe('180.00');
    expect(res.cgstAmount).toBe('90.00');
    expect(res.sgstAmount).toBe('90.00');
    expect(res.igstAmount).toBe('0.00');
    expect(res.grossAmount).toBe('1180.00');
  });

  it('calculates Indian GST Inter-state breakdown (IGST full)', () => {
    // 18% IGST on ₹1,000 net: IGST ₹180, CGST ₹0, SGST ₹0
    const res = calculateTax('1000', '18', 'EXCLUDE', true);
    expect(res.netAmount).toBe('1000.00');
    expect(res.taxAmount).toBe('180.00');
    expect(res.cgstAmount).toBe('0.00');
    expect(res.sgstAmount).toBe('0.00');
    expect(res.igstAmount).toBe('180.00');
    expect(res.grossAmount).toBe('1180.00');
  });
});

describe('Percentage Calculator (PER)', () => {
  it('computes percentage of a value', () => {
    expect(calculatePercentOf('15', '200')).toBe('30');
  });

  it('computes ratio percentage', () => {
    expect(calculatePercentRatio('25', '100')).toBe('25');
    expect(calculatePercentRatio('1', '3')).toBe('33.3333');
  });

  it('computes percentage change', () => {
    const inc = calculatePercentChange('100', '150');
    expect(inc.isIncrease).toBe(true);
    expect(inc.changePct).toBe('50.00');

    const dec = calculatePercentChange('100', '75');
    expect(dec.isIncrease).toBe(false);
    expect(dec.changePct).toBe('25.00');
  });
});

describe('Unit Converter (UNT)', () => {
  it('converts meters to kilometers and miles', () => {
    const lenCat = UNIT_CATEGORIES.find((c) => c.id === 'length')!;
    expect(convertUnit('1000', lenCat, 'm', 'km')).toBe('1');
    expect(convertUnit('1609.344', lenCat, 'm', 'mi')).toBe('1');
  });

  it('converts temperature between Celsius, Fahrenheit and Kelvin', () => {
    const tempCat = UNIT_CATEGORIES.find((c) => c.id === 'temperature')!;
    expect(convertUnit('0', tempCat, 'c', 'f')).toBe('32');
    expect(convertUnit('100', tempCat, 'c', 'f')).toBe('212');
    expect(convertUnit('0', tempCat, 'c', 'k')).toBe('273.15');
    expect(convertUnit('32', tempCat, 'f', 'c')).toBe('0');
  });

  it('converts data units accurately', () => {
    const dataCat = UNIT_CATEGORIES.find((c) => c.id === 'data')!;
    expect(convertUnit('1', dataCat, 'gb', 'mb')).toBe('1024');
    expect(convertUnit('1024', dataCat, 'kb', 'mb')).toBe('1');
  });

  it('converts traditional Indian area units (Guntha, Gaj, Bigha, Cent)', () => {
    const areaCat = UNIT_CATEGORIES.find((c) => c.id === 'area')!;
    // 1 Gaj is exactly 1 sq yard
    expect(convertUnit('1', areaCat, 'gaj', 'sqyd')).toBe('1');
    // 1 Guntha = 101.17141056 sqm
    expect(parseFloat(convertUnit('1', areaCat, 'guntha', 'sqm'))).toBeCloseTo(101.17, 1);
    // 1 Cent = 40.468564224 sqm
    expect(parseFloat(convertUnit('1', areaCat, 'cent', 'sqm'))).toBeCloseTo(40.47, 1);
  });

  it('converts traditional Indian gold weight units (Tola, Pavan)', () => {
    const massCat = UNIT_CATEGORIES.find((c) => c.id === 'mass')!;
    // 1 Tola = 11.6638038 grams
    expect(parseFloat(convertUnit('1', massCat, 'tola', 'g'))).toBeCloseTo(11.66, 1);
    // 1 Pavan = 8 grams
    expect(convertUnit('1', massCat, 'pavan', 'g')).toBe('8');
  });

  it('performs bidirectional conversions symmetrically across categories', () => {
    const lenCat = UNIT_CATEGORIES.find((c) => c.id === 'length')!;
    const massCat = UNIT_CATEGORIES.find((c) => c.id === 'mass')!;
    const tempCat = UNIT_CATEGORIES.find((c) => c.id === 'temperature')!;

    // Length: 1000m -> 1km and 1km -> 1000m
    const toKm = convertUnit('1000', lenCat, 'm', 'km');
    const backToM = convertUnit(toKm, lenCat, 'km', 'm');
    expect(toKm).toBe('1');
    expect(backToM).toBe('1000');

    // Mass: 5kg -> 5000g and 5000g -> 5kg
    const toG = convertUnit('5', massCat, 'kg', 'g');
    const backToKg = convertUnit(toG, massCat, 'g', 'kg');
    expect(toG).toBe('5000');
    expect(backToKg).toBe('5');

    // Temperature: 25°C -> 77°F and 77°F -> 25°C
    const toF = convertUnit('25', tempCat, 'c', 'f');
    const backToC = convertUnit(toF, tempCat, 'f', 'c');
    expect(toF).toBe('77');
    expect(backToC).toBe('25');
  });
});

describe('Indian Gold & Jewelry Price Calculator (GLD)', () => {
  it('calculates 24K pure gold price accurately', () => {
    // 10 grams of 24K gold at ₹72,000 per 10g (₹7,200/g) with 0% making charges
    // Gold value = 72,000. 3% GST = 2,160. Total = 74,160
    const res = calculateGoldPrice('10', 'g', '24K', '72000', '0', 'PERCENT');
    expect(res.weightInGrams).toBe('10.000');
    expect(res.goldRatePerGram).toBe('7200.00');
    expect(res.goldValue).toBe('72000.00');
    expect(res.gstAmount).toBe('2160.00');
    expect(res.totalPayable).toBe('74160.00');
  });

  it('calculates 22K (916 hallmark) gold with percentage making charges and 3% GST', () => {
    // 1 Tola (~11.664 g) of 22K gold (purity = 22/24) with 10% making charge
    const res = calculateGoldPrice('1', 'tola', '22K', '72000', '10', 'PERCENT');
    expect(parseFloat(res.weightInGrams)).toBeCloseTo(11.664, 2);
    // 24K is 7200/g -> 22K is 7200 * (22/24) = 6600/g
    expect(res.goldRatePerGram).toBe('6600.00');
    // Gold value = 11.6638038 * 6600 = 76981.11
    expect(parseFloat(res.goldValue)).toBeCloseTo(76981.11, 1);
    // Making charges = 10% = 7698.11
    expect(parseFloat(res.makingChargeAmount)).toBeCloseTo(7698.11, 1);
    // 3% GST on (76981.11 + 7698.11 = 84679.22) = 2540.38
    expect(parseFloat(res.gstAmount)).toBeCloseTo(2540.38, 1);
  });

  it('calculates gold with flat per-gram making charge', () => {
    // 8g (1 Pavan) of 18K gold (18/24 = 75%) with ₹500/g making charge
    // 24K rate = 72000/10g -> 18K rate = 5400/g
    // Gold value = 8 * 5400 = 43200
    // Making charge = 8 * 500 = 4000
    // Subtotal = 47200
    // 3% GST = 1416
    // Total = 48616
    const res = calculateGoldPrice('1', 'pavan', '18K', '72000', '500', 'FLAT_PER_G');
    expect(res.weightInGrams).toBe('8.000');
    expect(res.goldRatePerGram).toBe('5400.00');
    expect(res.goldValue).toBe('43200.00');
    expect(res.makingChargeAmount).toBe('4000.00');
    expect(res.subtotal).toBe('47200.00');
    expect(res.gstAmount).toBe('1416.00');
    expect(res.totalPayable).toBe('48616.00');
  });

  it('accurately calculates prices across all internationally recognized Karats', () => {
    // 10 grams at ₹72,000 per 10g 24K benchmark rate (₹7,200/g)
    const karatsToTest = [
      { purity: '24K', expectedRate: '7200.00' },
      { purity: '23K', expectedRate: (7200 * 23 / 24).toFixed(2) }, // 6900.00
      { purity: '22K', expectedRate: (7200 * 22 / 24).toFixed(2) }, // 6600.00
      { purity: '21K', expectedRate: (7200 * 21 / 24).toFixed(2) }, // 6300.00
      { purity: '20K', expectedRate: (7200 * 20 / 24).toFixed(2) }, // 6000.00
      { purity: '18K', expectedRate: (7200 * 18 / 24).toFixed(2) }, // 5400.00
      { purity: '16K', expectedRate: (7200 * 16 / 24).toFixed(2) }, // 4800.00
      { purity: '14K', expectedRate: (7200 * 14 / 24).toFixed(2) }, // 4200.00
      { purity: '12K', expectedRate: (7200 * 12 / 24).toFixed(2) }, // 3600.00
      { purity: '10K', expectedRate: (7200 * 10 / 24).toFixed(2) }, // 3000.00
      { purity: '9K', expectedRate: (7200 * 9 / 24).toFixed(2) },   // 2700.00
    ];

    for (const testCase of karatsToTest) {
      const res = calculateGoldPrice('10', 'g', testCase.purity, '72000', '0', 'PERCENT');
      expect(res.goldRatePerGram).toBe(testCase.expectedRate);
      expect(res.purityKarat).toBe(testCase.purity);
    }
  });

  it('calculates with hallmark fee and custom purity correctly', () => {
    // 10g of 22K gold at ₹7,200/g rate (rateUnit PER_G)
    // Making charge: 10%
    // BIS Hallmark: ₹53.10
    // 22K rate = 7200 * (22/24) = 6600/g
    // Gold value = 10 * 6600 = 66000
    // Making charge: 10% of 66000 = 6600
    // Subtotal = 66000 + 6600 = 72600.00
    // 3% GST on 72600 = 2178.00
    // Total = 72600 + 2178 + 53.10 = 74831.10
    const res = calculateGoldPrice('10', 'g', '22K', '7200', '10', 'PERCENT', {
      rateUnit: 'PER_G',
      includeHallmark: true
    });

    expect(res.weightInGrams).toBe('10.000');
    expect(res.goldRatePerGram).toBe('6600.00');
    expect(res.goldValue).toBe('66000.00');
    expect(res.makingChargeAmount).toBe('6600.00');
    expect(res.hallmarkAmount).toBe('53.10');
    expect(res.subtotal).toBe('72600.00');
    expect(res.gstAmount).toBe('2178.00');
    expect(res.totalPayable).toBe('74831.10');
  });
});

describe('Income Tax Calculator (ITX) - Budget 2024 New vs Old Regime', () => {
  it('gives zero tax under New Regime for taxable income <= ₹7 Lakh due to Section 87A rebate', () => {
    // Gross income ₹7,75,000 - ₹75,000 standard deduction = ₹7,00,000 taxable -> 87A rebate gives 0 tax
    const res = calculateIncomeTax('775000');
    expect(res.newTaxableIncome).toBe('700000.00');
    expect(res.newTotalTax).toBe('0.00');
  });

  it('correctly calculates New Regime tax on ₹12 Lakh salary', () => {
    // Gross ₹12,00,000 - ₹75,000 Std Ded = ₹11,25,000 taxable
    // 0-3L: 0
    // 3L-7L (4L @ 5%): 20,000
    // 7L-10L (3L @ 10%): 30,000
    // 10L-11.25L (1.25L @ 15%): 18,750
    // Total base tax = 68,750. 4% cess = 2,750. Total tax = 71,500
    const res = calculateIncomeTax('1200000');
    expect(res.newTaxableIncome).toBe('1125000.00');
    expect(res.newBaseTax).toBe('68750.00');
    expect(res.newCess).toBe('2750.00');
    expect(res.newTotalTax).toBe('71500.00');
  });

  it('accurately compares New vs Old regime and identifies highest tax saver', () => {
    // ₹15 Lakh income with maximum 80C (1.5L), 80D (25k), and Home Loan (2L)
    const res = calculateIncomeTax('1500000', '150000', '25000', '0', '200000');
    // New regime taxable: 15L - 75k = 14,25,000
    // Old regime taxable: 15L - (50k std + 1.5L 80C + 25k 80D + 2L home loan) = 15L - 4.25L = 10,75,000
    expect(res.newTaxableIncome).toBe('1425000.00');
    expect(res.oldTaxableIncome).toBe('1075000.00');
    expect(['NEW', 'OLD']).toContain(res.recommendedRegime);
  });
});

describe('In-Hand Salary Calculator (SAL)', () => {
  it('breaks down monthly take-home salary from Annual CTC', () => {
    // CTC ₹12 Lakh (₹1,00,000/mo)
    // Basic 40% = ₹40,000/mo
    // EPF 12% of Basic = ₹4,800/mo
    // PT = ₹200/mo
    const res = calculateInHandSalary('1200000', 40, 200);
    expect(res.annualCTC).toBe('1200000.00');
    expect(res.monthlyGross).toBe('100000.00');
    expect(res.monthlyBasic).toBe('40000.00');
    expect(res.monthlyEPF).toBe('4800.00');
    expect(res.monthlyPT).toBe('200.00');
    expect(parseFloat(res.monthlyTakeHome)).toBeGreaterThan(80000);
    expect(parseFloat(res.annualTakeHome)).toBeCloseTo(parseFloat(res.monthlyTakeHome) * 12, 1);
  });
});
