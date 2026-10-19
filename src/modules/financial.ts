import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { formatNumber, numberToIndianWords, formatTenureYears, formatTenureMonths } from '../core/math.ts';
import { shareText } from '../core/share.ts';
import { createAffiliateCardElement } from '../core/monetization/engine.ts';

// ==========================================
// 1. LOAN CALCULATOR (LON) & AMORTIZATION
// ==========================================
export type LoanMethod = 'AMORTIZATION' | 'EQUAL_PRINCIPAL';
export type PaymentFrequency = 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';

export interface LoanResult {
  monthlyPayment: string;
  totalInterest: string;
  totalPayment: string;
  frequency?: PaymentFrequency;
}

export interface AmortizationRow {
  period: number;
  payment: string;
  principal: string;
  interest: string;
  totalInterest: string;
  balance: string;
}

export interface YearlyAmortizationRow {
  year: number;
  payment: string;
  principal: string;
  interest: string;
  balance: string;
}

export interface AmortizationSchedule {
  frequency: PaymentFrequency;
  totalPeriods: number;
  periodicPayment: string;
  totalPrincipal: string;
  totalInterest: string;
  totalPayment: string;
  rows: AmortizationRow[];
  yearlyRows: YearlyAmortizationRow[];
}

export function generateAmortizationSchedule(
  principal: string | number,
  annualRatePct: string | number,
  termMonths: string | number,
  frequency: PaymentFrequency = 'MONTHLY',
  method: LoanMethod = 'AMORTIZATION'
): AmortizationSchedule {
  try {
    const p = new Decimal(principal || 0);
    const r = new Decimal(annualRatePct || 0);
    const months = new Decimal(termMonths || 1);

    let periodsPerYear = 12;
    let n = Math.max(1, Math.round(months.toNumber()));

    if (frequency === 'BIWEEKLY') {
      periodsPerYear = 26;
      n = Math.max(1, Math.round(months.dividedBy(12).times(26).toNumber()));
    } else if (frequency === 'WEEKLY') {
      periodsPerYear = 52;
      n = Math.max(1, Math.round(months.dividedBy(12).times(52).toNumber()));
    }

    if (p.isZero() || n <= 0) {
      return {
        frequency,
        totalPeriods: 0,
        periodicPayment: '0.00',
        totalPrincipal: '0.00',
        totalInterest: '0.00',
        totalPayment: '0.00',
        rows: [],
        yearlyRows: []
      };
    }

    const periodicRate = r.dividedBy(100).dividedBy(periodsPerYear);
    let basePeriodicPayment: Decimal;

    if (periodicRate.isZero()) {
      basePeriodicPayment = p.dividedBy(n);
    } else if (method === 'AMORTIZATION') {
      const onePlusIPowN = new Decimal(1).plus(periodicRate).pow(n);
      const numerator = p.times(periodicRate).times(onePlusIPowN);
      const denominator = onePlusIPowN.minus(1);
      basePeriodicPayment = numerator.dividedBy(denominator);
    } else {
      basePeriodicPayment = p.dividedBy(n);
    }

    const rows: AmortizationRow[] = [];
    let currentBalance = new Decimal(p);
    let cumulativeInterest = new Decimal(0);

    for (let k = 1; k <= n; k++) {
      const interestForPeriod = currentBalance.times(periodicRate);
      let principalForPeriod: Decimal;
      let paymentForPeriod: Decimal;

      if (method === 'AMORTIZATION') {
        if (k === n || currentBalance.lessThanOrEqualTo(basePeriodicPayment.minus(interestForPeriod))) {
          principalForPeriod = currentBalance;
          paymentForPeriod = principalForPeriod.plus(interestForPeriod);
          currentBalance = new Decimal(0);
        } else {
          principalForPeriod = basePeriodicPayment.minus(interestForPeriod);
          paymentForPeriod = basePeriodicPayment;
          currentBalance = currentBalance.minus(principalForPeriod);
        }
      } else {
        if (k === n) {
          principalForPeriod = currentBalance;
          paymentForPeriod = principalForPeriod.plus(interestForPeriod);
          currentBalance = new Decimal(0);
        } else {
          principalForPeriod = p.dividedBy(n);
          paymentForPeriod = principalForPeriod.plus(interestForPeriod);
          currentBalance = currentBalance.minus(principalForPeriod);
        }
      }

      cumulativeInterest = cumulativeInterest.plus(interestForPeriod);

      rows.push({
        period: k,
        payment: paymentForPeriod.toFixed(2),
        principal: principalForPeriod.toFixed(2),
        interest: interestForPeriod.toFixed(2),
        totalInterest: cumulativeInterest.toFixed(2),
        balance: currentBalance.toFixed(2)
      });
    }

    // Yearly Aggregation
    const yearlyRows: YearlyAmortizationRow[] = [];
    let curYearPrincipal = new Decimal(0);
    let curYearInterest = new Decimal(0);
    let curYearPayment = new Decimal(0);
    let curYear = 1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      curYearPrincipal = curYearPrincipal.plus(new Decimal(row.principal));
      curYearInterest = curYearInterest.plus(new Decimal(row.interest));
      curYearPayment = curYearPayment.plus(new Decimal(row.payment));

      const isYearEnd = (i + 1) % periodsPerYear === 0 || i === rows.length - 1;
      if (isYearEnd) {
        yearlyRows.push({
          year: curYear,
          payment: curYearPayment.toFixed(2),
          principal: curYearPrincipal.toFixed(2),
          interest: curYearInterest.toFixed(2),
          balance: row.balance
        });
        curYear++;
        curYearPrincipal = new Decimal(0);
        curYearInterest = new Decimal(0);
        curYearPayment = new Decimal(0);
      }
    }

    return {
      frequency,
      totalPeriods: n,
      periodicPayment: rows.length > 0 ? rows[0].payment : '0.00',
      totalPrincipal: p.toFixed(2),
      totalInterest: cumulativeInterest.toFixed(2),
      totalPayment: p.plus(cumulativeInterest).toFixed(2),
      rows,
      yearlyRows
    };
  } catch {
    return {
      frequency,
      totalPeriods: 0,
      periodicPayment: '0.00',
      totalPrincipal: '0.00',
      totalInterest: '0.00',
      totalPayment: '0.00',
      rows: [],
      yearlyRows: []
    };
  }
}

export function exportAmortizationCSV(schedule: AmortizationSchedule): void {
  const headers = ['Period', 'Payment', 'Principal', 'Interest', 'Cumulative Interest', 'Remaining Balance'];
  const lines = [
    headers.join(','),
    ...schedule.rows.map(r => `${r.period},${r.payment},${r.principal},${r.interest},${r.totalInterest},${r.balance}`)
  ];
  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `loan-amortization-${schedule.frequency.toLowerCase()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function calculateLoan(
  principal: string | number,
  annualRatePct: string | number,
  termMonths: string | number,
  method: LoanMethod = 'AMORTIZATION',
  frequency: PaymentFrequency = 'MONTHLY'
): LoanResult {
  try {
    const p = new Decimal(principal || 0);
    const r = new Decimal(annualRatePct || 0);
    const months = new Decimal(termMonths || 1);

    if (p.isZero() || months.isZero()) {
      return { monthlyPayment: '0.00', totalInterest: '0.00', totalPayment: '0.00', frequency };
    }

    if (frequency === 'MONTHLY') {
      const n = months;
      const i = r.dividedBy(100).dividedBy(12);

      if (i.isZero()) {
        const monthly = p.dividedBy(n);
        return {
          monthlyPayment: monthly.toFixed(2),
          totalInterest: '0.00',
          totalPayment: p.toFixed(2),
          frequency
        };
      }

      if (method === 'AMORTIZATION') {
        const onePlusIPowN = new Decimal(1).plus(i).pow(n.toNumber());
        const numerator = p.times(i).times(onePlusIPowN);
        const denominator = onePlusIPowN.minus(1);
        const monthly = numerator.dividedBy(denominator);
        const total = monthly.times(n);
        const totalInt = total.minus(p);

        return {
          monthlyPayment: monthly.toFixed(2),
          totalInterest: totalInt.toFixed(2),
          totalPayment: total.toFixed(2),
          frequency
        };
      } else {
        const monthlyPrincipal = p.dividedBy(n);
        const totalInt = n.plus(1).times(p).times(i).dividedBy(2);
        const total = p.plus(totalInt);
        const firstMonthPayment = monthlyPrincipal.plus(p.times(i));

        return {
          monthlyPayment: `Starts at ${formatNumber(firstMonthPayment.toFixed(2))}`,
          totalInterest: totalInt.toFixed(2),
          totalPayment: total.toFixed(2),
          frequency
        };
      }
    }

    // Bi-weekly or Weekly frequency
    const schedule = generateAmortizationSchedule(principal, annualRatePct, termMonths, frequency, method);
    const firstPayment = schedule.rows.length > 0 ? schedule.rows[0].payment : '0.00';
    return {
      monthlyPayment: method === 'AMORTIZATION' ? firstPayment : `Starts at ${formatNumber(firstPayment)}`,
      totalInterest: schedule.totalInterest,
      totalPayment: schedule.totalPayment,
      frequency
    };
  } catch {
    return { monthlyPayment: '0.00', totalInterest: '0.00', totalPayment: '0.00', frequency };
  }
}

export const LoanModule: CalculatorModule = {
  id: 'LON',
  name: 'Loan EMI Calculator',
  icon: '🏦',
  render(container: HTMLElement) {
    let method: LoanMethod = 'AMORTIZATION';
    let frequency: PaymentFrequency = 'MONTHLY';
    let currentSchedule: AmortizationSchedule | null = null;
    let scheduleViewMode: 'PERIOD' | 'YEARLY' = 'PERIOD';

    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="segmented-control">
              <button id="btn-loan-amort" class="seg-btn active">EMI (Equal Payments)</button>
              <button id="btn-loan-equal-p" class="seg-btn">Reducing Balance</button>
            </div>

            <div class="input-card">
              <label class="input-label">Repayment Frequency</label>
              <div class="tip-preset-row" id="loan-freq-row">
                <button class="btn-preset active" data-freq="MONTHLY">Monthly</button>
                <button class="btn-preset" data-freq="BIWEEKLY">Bi-weekly (26/yr)</button>
                <button class="btn-preset" data-freq="WEEKLY">Weekly (52/yr)</button>
              </div>

              <label class="input-label" style="margin-top: 14px;">Loan Principal (₹)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-amount="500000">₹5 L</button>
                <button class="btn-preset" data-amount="1000000">₹10 L</button>
                <button class="btn-preset" data-amount="2500000">₹25 L</button>
                <button class="btn-preset active" data-amount="5000000">₹50 L</button>
                <button class="btn-preset" data-amount="10000000">₹1 Cr</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="text" id="loan-p" class="form-input" value="50,00,000" placeholder="50,00,000" inputmode="numeric" />
              </div>
              <div id="loan-p-words" style="font-size: 12.5px; font-weight: 600; color: var(--accent-color, #ff9f0a); margin-top: 4px; padding-left: 2px;">Fifty Lakh Rupees</div>

              <label class="input-label" style="margin-top: 14px;">Annual Interest Rate (%)</label>
              <div class="tip-preset-row">
                <button class="btn-preset active" data-rate="8.5">8.5% (Home)</button>
                <button class="btn-preset" data-rate="9.5">9.5% (Car)</button>
                <button class="btn-preset" data-rate="12.0">12% (Personal)</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="number" id="loan-r" class="form-input" value="8.5" placeholder="8.5" step="any" inputmode="decimal" />
              </div>

              <label class="input-label" style="margin-top: 14px;">Loan Tenure (Months)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-months="36">3 Yrs</button>
                <button class="btn-preset" data-months="60">5 Yrs</button>
                <button class="btn-preset" data-months="120">10 Yrs</button>
                <button class="btn-preset active" data-months="240">20 Yrs</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="number" id="loan-n" class="form-input" value="240" placeholder="240" step="1" inputmode="numeric" />
              </div>
              <div id="loan-n-years" style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-top: 4px; padding-left: 2px;">20 Years (240 Months)</div>
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label" id="loan-periodic-label">Monthly EMI</span>
                <span id="loan-res-monthly" class="result-value-highlight">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total Interest Payable</span>
                <span id="loan-res-interest" class="result-value-danger">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total Payment (Principal + Interest)</span>
                <span id="loan-res-total" class="result-value">₹ 0.00</span>
              </div>

              <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 10px;">
                <button id="btn-view-amortization" class="btn-highlight-amort" style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 12px; background: linear-gradient(135deg, #ff9f0a, #ff6b00); color: #ffffff; border: none; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(255, 159, 10, 0.45); transition: transform 0.15s ease, box-shadow 0.15s ease;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">📊</span>
                    <span>View Amortization Schedule</span>
                  </div>
                  <span style="font-size: 13px; background: rgba(255, 255, 255, 0.25); padding: 3px 8px; border-radius: 6px;">Full Table ➔</span>
                </button>
                <button id="btn-share-loan" class="seg-btn active" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; padding: 10px 16px;">
                  <span>💬 Share Loan Quote on WhatsApp</span>
                </button>
              </div>
            </div>

            <!-- Contextual Loan Affiliate Slot -->
            <div id="slot-affiliate-loan"></div>
          </div>
        </div>

        <!-- Amortization Schedule Modal -->
        <div id="modal-amortization" class="modal-overlay center-modal" style="display: none;">
          <div class="dialog-amortization">
            <div class="calc-header" style="border-bottom: 1px solid var(--border-color); padding: 12px 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">📊</span>
                <h3 style="margin: 0; font-size: 16px; font-weight: 700;">Loan Amortization Schedule</h3>
              </div>
              <button id="btn-close-amortization" class="btn-icon">✕</button>
            </div>

            <div class="amortization-body">
              <div class="amortization-summary-card">
                <div class="amort-stat">
                  <span class="amort-stat-label">Principal</span>
                  <span id="amort-sum-p" class="amort-stat-val">₹0</span>
                </div>
                <div class="amort-stat">
                  <span class="amort-stat-label">Total Interest</span>
                  <span id="amort-sum-i" class="amort-stat-val danger">₹0</span>
                </div>
                <div class="amort-stat">
                  <span class="amort-stat-label">Total Payment</span>
                  <span id="amort-sum-t" class="amort-stat-val">₹0</span>
                </div>
                <div class="amort-stat">
                  <span class="amort-stat-label">Installments</span>
                  <span id="amort-sum-n" class="amort-stat-val">0</span>
                </div>
              </div>

              <div class="segmented-control" style="margin: 10px 0;">
                <button id="btn-amort-view-period" class="seg-btn active">Period by Period</button>
                <button id="btn-amort-view-yearly" class="seg-btn">Yearly Summary</button>
              </div>

              <div class="amort-table-container">
                <table class="amort-table">
                  <thead id="amort-thead"></thead>
                  <tbody id="amort-tbody"></tbody>
                </table>
              </div>
            </div>

            <div style="padding: 10px 16px; display: flex; justify-content: space-between; gap: 10px; border-top: 1px solid var(--border-color); background-color: var(--bg-secondary);">
              <button id="btn-export-csv" class="seg-btn active" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <span>📥 Export CSV</span>
              </button>
              <button id="btn-close-amort-footer" class="seg-btn" style="flex: 0 0 100px;">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const inpP = container.querySelector('#loan-p') as HTMLInputElement;
    const inpR = container.querySelector('#loan-r') as HTMLInputElement;
    const inpN = container.querySelector('#loan-n') as HTMLInputElement;
    const wordsP = container.querySelector('#loan-p-words') as HTMLElement;
    const yearsN = container.querySelector('#loan-n-years') as HTMLElement;

    const periodicLabel = container.querySelector('#loan-periodic-label') as HTMLElement;
    const resMonthly = container.querySelector('#loan-res-monthly') as HTMLElement;
    const resInt = container.querySelector('#loan-res-interest') as HTMLElement;
    const resTot = container.querySelector('#loan-res-total') as HTMLElement;
    const btnShare = container.querySelector('#btn-share-loan') as HTMLButtonElement;

    const btnAmort = container.querySelector('#btn-loan-amort') as HTMLButtonElement;
    const btnEqualP = container.querySelector('#btn-loan-equal-p') as HTMLButtonElement;

    const btnViewAmort = container.querySelector('#btn-view-amortization') as HTMLButtonElement;
    const modalAmort = container.querySelector('#modal-amortization') as HTMLElement;
    const btnCloseAmort = container.querySelector('#btn-close-amortization') as HTMLButtonElement;
    const btnCloseAmortFooter = container.querySelector('#btn-close-amort-footer') as HTMLButtonElement;
    const btnExportCSV = container.querySelector('#btn-export-csv') as HTMLButtonElement;
    const btnViewPeriod = container.querySelector('#btn-amort-view-period') as HTMLButtonElement;
    const btnViewYearly = container.querySelector('#btn-amort-view-yearly') as HTMLButtonElement;

    const amortSumP = container.querySelector('#amort-sum-p') as HTMLElement;
    const amortSumI = container.querySelector('#amort-sum-i') as HTMLElement;
    const amortSumT = container.querySelector('#amort-sum-t') as HTMLElement;
    const amortSumN = container.querySelector('#amort-sum-n') as HTMLElement;
    const amortThead = container.querySelector('#amort-thead') as HTMLElement;
    const amortTbody = container.querySelector('#amort-tbody') as HTMLElement;

    let lastLoanRes: LoanResult | null = null;

    function renderAmortTable() {
      if (!currentSchedule) return;
      if (scheduleViewMode === 'PERIOD') {
        const periodTitle = frequency === 'MONTHLY' ? 'Mo' : frequency === 'BIWEEKLY' ? 'Bw' : 'Wk';
        amortThead.innerHTML = `
          <tr>
            <th style="width: 44px;">${periodTitle}</th>
            <th>Payment (₹)</th>
            <th>Principal (₹)</th>
            <th>Interest (₹)</th>
            <th>Balance (₹)</th>
          </tr>
        `;
        amortTbody.innerHTML = currentSchedule.rows.map(r => `
          <tr>
            <td>${r.period}</td>
            <td>${formatNumber(r.payment, { section: 'finance' })}</td>
            <td>${formatNumber(r.principal, { section: 'finance' })}</td>
            <td>${formatNumber(r.interest, { section: 'finance' })}</td>
            <td>${formatNumber(r.balance, { section: 'finance' })}</td>
          </tr>
        `).join('');
      } else {
        amortThead.innerHTML = `
          <tr>
            <th style="width: 50px;">Year</th>
            <th>Payment (₹)</th>
            <th>Principal (₹)</th>
            <th>Interest (₹)</th>
            <th>End Balance (₹)</th>
          </tr>
        `;
        amortTbody.innerHTML = currentSchedule.yearlyRows.map(y => `
          <tr>
            <td>Year ${y.year}</td>
            <td>${formatNumber(y.payment, { section: 'finance' })}</td>
            <td>${formatNumber(y.principal, { section: 'finance' })}</td>
            <td>${formatNumber(y.interest, { section: 'finance' })}</td>
            <td>${formatNumber(y.balance, { section: 'finance' })}</td>
          </tr>
        `).join('');
      }
    }

    function getCleanP(): string {
      return inpP.value.replace(/,/g, '').trim() || '0';
    }

    function openAmortModal() {
      const cleanP = getCleanP();
      if (!currentSchedule) {
        currentSchedule = generateAmortizationSchedule(cleanP, inpR.value, inpN.value, frequency, method);
      }
      amortSumP.textContent = `₹${formatNumber(currentSchedule.totalPrincipal, { section: 'finance' })}`;
      amortSumI.textContent = `₹${formatNumber(currentSchedule.totalInterest, { section: 'finance' })}`;
      amortSumT.textContent = `₹${formatNumber(currentSchedule.totalPayment, { section: 'finance' })}`;
      amortSumN.textContent = `${currentSchedule.totalPeriods} payments`;
      renderAmortTable();
      modalAmort.style.display = 'flex';
      modalAmort.classList.add('open');
    }

    function closeAmortModal() {
      modalAmort.style.display = 'none';
      modalAmort.classList.remove('open');
    }

    btnViewAmort.addEventListener('click', openAmortModal);
    btnCloseAmort.addEventListener('click', closeAmortModal);
    btnCloseAmortFooter.addEventListener('click', closeAmortModal);
    modalAmort.addEventListener('click', (e) => {
      if (e.target === modalAmort) closeAmortModal();
    });

    btnViewPeriod.addEventListener('click', () => {
      scheduleViewMode = 'PERIOD';
      btnViewPeriod.classList.add('active');
      btnViewYearly.classList.remove('active');
      renderAmortTable();
    });

    btnViewYearly.addEventListener('click', () => {
      scheduleViewMode = 'YEARLY';
      btnViewYearly.classList.add('active');
      btnViewPeriod.classList.remove('active');
      renderAmortTable();
    });

    btnExportCSV.addEventListener('click', () => {
      if (currentSchedule) exportAmortizationCSV(currentSchedule);
    });

    function rec() {
      const cleanP = getCleanP();
      const res = calculateLoan(cleanP, inpR.value, inpN.value, method, frequency);
      lastLoanRes = res;
      currentSchedule = generateAmortizationSchedule(cleanP, inpR.value, inpN.value, frequency, method);

      // Update in-words & tenure display
      const numP = parseFloat(cleanP);
      if (wordsP) {
        wordsP.textContent = !isNaN(numP) && numP > 0 ? numberToIndianWords(cleanP) : '';
      }
      const months = parseInt(inpN.value, 10);
      if (yearsN) {
        if (!isNaN(months) && months > 0) {
          const yrs = (months / 12).toFixed(1).replace(/\.0$/, '');
          yearsN.textContent = `${yrs} Years (${months} Months)`;
        } else {
          yearsN.textContent = '';
        }
      }

      if (frequency === 'MONTHLY') {
        periodicLabel.textContent = 'Monthly EMI';
      } else if (frequency === 'BIWEEKLY') {
        periodicLabel.textContent = 'Bi-weekly Payment';
      } else {
        periodicLabel.textContent = 'Weekly Payment';
      }

      resMonthly.textContent = res.monthlyPayment.startsWith('Starts')
        ? res.monthlyPayment
        : `₹ ${formatNumber(res.monthlyPayment, { section: 'finance' })}`;
      resInt.textContent = `₹ ${formatNumber(res.totalInterest, { section: 'finance' })}`;
      resTot.textContent = `₹ ${formatNumber(res.totalPayment, { section: 'finance' })}`;

      if (modalAmort.classList.contains('open')) {
        openAmortModal();
      }
    }

    btnShare.addEventListener('click', () => {
      if (!lastLoanRes) return;
      const cleanP = getCleanP();
      const freqName = frequency === 'MONTHLY' ? 'Monthly' : frequency === 'BIWEEKLY' ? 'Bi-weekly' : 'Weekly';
      const text = `🏦 *Loan Quotation (${freqName})*
Principal: ₹${formatNumber(cleanP, { section: 'finance' })}
Interest Rate: ${inpR.value}% p.a.
Tenure: ${inpN.value} Months (${(parseInt(inpN.value, 10) / 12).toFixed(1)} Years)
Frequency: ${freqName}
---
*${freqName} Payment*: ${lastLoanRes.monthlyPayment.startsWith('Starts') ? lastLoanRes.monthlyPayment : '₹' + formatNumber(lastLoanRes.monthlyPayment, { section: 'finance' })}
Total Interest: ₹${formatNumber(lastLoanRes.totalInterest, { section: 'finance' })}
*Total Payment: ₹${formatNumber(lastLoanRes.totalPayment, { section: 'finance' })}*

Calculated via EveryCalc`;
      shareText(text, 'Loan EMI Quote');
    });

    btnAmort.addEventListener('click', () => {
      method = 'AMORTIZATION';
      btnAmort.classList.add('active');
      btnEqualP.classList.remove('active');
      rec();
    });

    btnEqualP.addEventListener('click', () => {
      method = 'EQUAL_PRINCIPAL';
      btnEqualP.classList.add('active');
      btnAmort.classList.remove('active');
      rec();
    });

    // Wire Frequency Presets
    container.querySelectorAll('#loan-freq-row [data-freq]').forEach((b) => {
      b.addEventListener('click', () => {
        container.querySelectorAll('#loan-freq-row [data-freq]').forEach((btn) => btn.classList.remove('active'));
        b.classList.add('active');
        frequency = (b.getAttribute('data-freq') as PaymentFrequency) || 'MONTHLY';
        rec();
      });
    });

    function syncLoanPresets(attr: string, value: string) {
      container.querySelectorAll(`[${attr}]`).forEach((el) => {
        el.classList.toggle('active', el.getAttribute(attr) === value);
      });
    }

    // Wire presets
    container.querySelectorAll('[data-amount]').forEach((b) => {
      b.addEventListener('click', () => {
        const rawAmt = b.getAttribute('data-amount') || '5000000';
        inpP.value = formatNumber(rawAmt, { section: 'finance' });
        syncLoanPresets('data-amount', rawAmt);
        rec();
      });
    });

    container.querySelectorAll('[data-rate]').forEach((b) => {
      b.addEventListener('click', () => {
        inpR.value = b.getAttribute('data-rate') || '8.5';
        syncLoanPresets('data-rate', inpR.value);
        rec();
      });
    });

    container.querySelectorAll('[data-months]').forEach((b) => {
      b.addEventListener('click', () => {
        inpN.value = b.getAttribute('data-months') || '240';
        syncLoanPresets('data-months', inpN.value);
        rec();
      });
    });

    inpP.addEventListener('input', () => {
      syncLoanPresets('data-amount', getCleanP());
      rec();
    });

    inpP.addEventListener('blur', () => {
      const clean = getCleanP();
      const n = parseFloat(clean);
      if (!isNaN(n) && n > 0) {
        inpP.value = formatNumber(clean, { section: 'finance' });
      }
    });

    inpR.addEventListener('input', () => {
      syncLoanPresets('data-rate', inpR.value);
      rec();
    });

    inpN.addEventListener('input', () => {
      syncLoanPresets('data-months', inpN.value);
      rec();
    });

    const slotLoan = container.querySelector('#slot-affiliate-loan');
    if (slotLoan) {
      const card = createAffiliateCardElement('LON');
      if (card) slotLoan.appendChild(card);
    }

    rec();
  }
};

// ==========================================
// 2. SAVINGS, SIP & FD/RD CALCULATOR (IRA)
// ==========================================
export interface SavingsResult {
  totalPrincipal: string;
  preTaxInterest: string;
  postTaxInterest: string;
  finalBalance: string;
}

export interface SIPResult {
  totalInvested: string;
  estimatedReturns: string;
  totalValue: string;
}

export interface FDResult {
  investedAmount: string;
  totalInterest: string;
  maturityAmount: string;
}

export function calculateSIP(
  monthlyInvestment: string | number,
  annualRatePct: string | number,
  tenureYears: string | number
): SIPResult {
  try {
    const p = new Decimal(monthlyInvestment || 0);
    const r = new Decimal(annualRatePct || 0);
    const y = new Decimal(tenureYears || 0);
    const n = y.times(12);

    if (p.isZero() || n.isZero()) {
      return { totalInvested: '0.00', estimatedReturns: '0.00', totalValue: '0.00' };
    }

    const i = r.dividedBy(100).dividedBy(12);
    const totalInv = p.times(n);

    if (i.isZero()) {
      return {
        totalInvested: totalInv.toFixed(2),
        estimatedReturns: '0.00',
        totalValue: totalInv.toFixed(2)
      };
    }

    // M = P * ((1 + i)^n - 1) / i * (1 + i)
    const onePlusI = new Decimal(1).plus(i);
    const onePlusIPowN = onePlusI.pow(n.toNumber());
    const maturity = p.times(onePlusIPowN.minus(1)).dividedBy(i).times(onePlusI);
    const returns = maturity.minus(totalInv);

    return {
      totalInvested: totalInv.toFixed(2),
      estimatedReturns: returns.toFixed(2),
      totalValue: maturity.toFixed(2)
    };
  } catch {
    return { totalInvested: '0.00', estimatedReturns: '0.00', totalValue: '0.00' };
  }
}

export function calculateFD(
  principal: string | number,
  annualRatePct: string | number,
  tenureYears: string | number,
  isSeniorCitizen: boolean = false
): FDResult {
  try {
    const p = new Decimal(principal || 0);
    let r = new Decimal(annualRatePct || 0);
    if (isSeniorCitizen) {
      r = r.plus(0.5); // Standard Indian senior citizen benefit (+0.5%)
    }
    const y = new Decimal(tenureYears || 0);

    if (p.isZero() || y.isZero()) {
      return { investedAmount: '0.00', totalInterest: '0.00', maturityAmount: '0.00' };
    }

    // Indian Banks compound FD quarterly: A = P * (1 + r / 400)^(4 * y)
    const quarters = y.times(4);
    const ratePerQuarter = r.dividedBy(400);
    const maturity = p.times(new Decimal(1).plus(ratePerQuarter).pow(quarters.toNumber()));
    const interest = maturity.minus(p);

    return {
      investedAmount: p.toFixed(2),
      totalInterest: interest.toFixed(2),
      maturityAmount: maturity.toFixed(2)
    };
  } catch {
    return { investedAmount: '0.00', totalInterest: '0.00', maturityAmount: '0.00' };
  }
}

export function calculateSavings(
  initialDeposit: string | number,
  monthlyDeposit: string | number,
  annualRatePct: string | number,
  termMonths: string | number,
  taxRatePct: string | number = 15.4
): SavingsResult {
  try {
    const init = new Decimal(initialDeposit || 0);
    const monthly = new Decimal(monthlyDeposit || 0);
    const r = new Decimal(annualRatePct || 0);
    const n = parseInt(String(termMonths || 0), 10);
    const taxRate = new Decimal(taxRatePct || 0);

    const i = r.dividedBy(100).dividedBy(12);
    let balance = init;
    let totalInvested = init;

    for (let m = 1; m <= n; m++) {
      const interestThisMonth = balance.times(i);
      balance = balance.plus(interestThisMonth).plus(monthly);
      totalInvested = totalInvested.plus(monthly);
    }

    const preTaxInt = balance.minus(totalInvested);
    const tax = preTaxInt.times(taxRate.dividedBy(100));
    const postTaxInt = preTaxInt.minus(tax);
    const finalBal = totalInvested.plus(postTaxInt);

    return {
      totalPrincipal: totalInvested.toFixed(2),
      preTaxInterest: preTaxInt.toFixed(2),
      postTaxInterest: postTaxInt.toFixed(2),
      finalBalance: finalBal.toFixed(2)
    };
  } catch {
    return { totalPrincipal: '0.00', preTaxInterest: '0.00', postTaxInterest: '0.00', finalBalance: '0.00' };
  }
}

export const SavingsModule: CalculatorModule = {
  id: 'IRA',
  name: 'SIP / FD / Savings',
  icon: '💰',
  render(container: HTMLElement) {
    let mode: 'SIP' | 'FD' | 'SAV' = 'SIP';
    let isSenior = false;

    container.innerHTML = `
      <div class="module-view">
        <div class="segmented-control" style="margin-bottom: 20px;">
          <button id="btn-mode-sip" class="seg-btn active">SIP (Mutual Funds)</button>
          <button id="btn-mode-fd" class="seg-btn">FD (Fixed Deposit)</button>
          <button id="btn-mode-sav" class="seg-btn">RD / Savings</button>
        </div>

        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <!-- SIP View -->
            <div id="view-sip" class="input-card">
              <label class="input-label">Monthly Investment (₹)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-sip-amt="1000">₹1,000</button>
                <button class="btn-preset active" data-sip-amt="5000">₹5,000</button>
                <button class="btn-preset" data-sip-amt="10000">₹10,000</button>
                <button class="btn-preset" data-sip-amt="25000">₹25,000</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="text" id="sip-monthly" class="form-input" value="5,000" placeholder="5,000" inputmode="numeric" />
              </div>
              <div id="sip-monthly-words" style="font-size: 12.5px; font-weight: 600; color: var(--accent-color, #ff9f0a); margin-top: 4px; padding-left: 2px;">Five Thousand Rupees</div>

              <label class="input-label" style="margin-top: 14px;">Expected Return Rate (% p.a.)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-sip-rate="10">10%</button>
                <button class="btn-preset active" data-sip-rate="12">12%</button>
                <button class="btn-preset" data-sip-rate="15">15%</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="number" id="sip-rate" class="form-input" value="12" placeholder="12" step="any" inputmode="decimal" />
              </div>

              <label class="input-label" style="margin-top: 14px;">Time Period (Years)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-sip-years="5">5 Yrs</button>
                <button class="btn-preset active" data-sip-years="10">10 Yrs</button>
                <button class="btn-preset" data-sip-years="15">15 Yrs</button>
                <button class="btn-preset" data-sip-years="20">20 Yrs</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="number" id="sip-years" class="form-input" value="10" placeholder="10" step="1" inputmode="numeric" />
              </div>
              <div id="sip-years-desc" style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-top: 4px; padding-left: 2px;">10 Years (120 Months)</div>
            </div>

            <!-- FD View -->
            <div id="view-fd" class="input-card" style="display: none;">
              <label class="input-label">Total Investment Amount (₹)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-fd-amt="50000">₹50,000</button>
                <button class="btn-preset active" data-fd-amt="100000">₹1 Lakh</button>
                <button class="btn-preset" data-fd-amt="500000">₹5 Lakh</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="text" id="fd-amt" class="form-input" value="1,00,000" placeholder="1,00,000" inputmode="numeric" />
              </div>
              <div id="fd-amt-words" style="font-size: 12.5px; font-weight: 600; color: var(--accent-color, #ff9f0a); margin-top: 4px; padding-left: 2px;">One Lakh Rupees</div>

              <label class="input-label" style="margin-top: 14px;">Annual Interest Rate (% p.a.)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-fd-rate="6.5">6.5%</button>
                <button class="btn-preset active" data-fd-rate="7.1">7.1% (Standard)</button>
                <button class="btn-preset" data-fd-rate="7.5">7.5%</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="number" id="fd-rate" class="form-input" value="7.1" placeholder="7.1" step="any" inputmode="decimal" />
              </div>

              <div style="margin: 12px 0;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
                  <input type="checkbox" id="fd-senior" style="accent-color: var(--accent-color, #ff9f0a); width: 18px; height: 18px;" />
                  <span>Senior Citizen (+0.50% Extra Interest)</span>
                </label>
              </div>

              <label class="input-label">Tenure (Years)</label>
              <div class="input-row">
                <input type="number" id="fd-years" class="form-input" value="3" placeholder="3" step="1" inputmode="numeric" />
              </div>
              <div id="fd-years-desc" style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-top: 4px; padding-left: 2px;">3 Years (36 Months)</div>
            </div>

            <!-- RD / General Savings View -->
            <div id="view-sav" class="input-card" style="display: none;">
              <label class="input-label">Initial Deposit (₹)</label>
              <div class="input-row">
                <input type="text" id="sav-init" class="form-input" value="0" placeholder="0" inputmode="numeric" />
              </div>
              <div id="sav-init-words" style="font-size: 12.5px; font-weight: 600; color: var(--accent-color, #ff9f0a); margin-top: 4px; padding-left: 2px;"></div>

              <label class="input-label" style="margin-top: 14px;">Monthly Deposit (₹)</label>
              <div class="input-row">
                <input type="text" id="sav-monthly" class="form-input" value="2,000" placeholder="2,000" inputmode="numeric" />
              </div>
              <div id="sav-monthly-words" style="font-size: 12.5px; font-weight: 600; color: var(--accent-color, #ff9f0a); margin-top: 4px; padding-left: 2px;">Two Thousand Rupees</div>

              <label class="input-label" style="margin-top: 14px;">Annual Interest Rate (%)</label>
              <div class="input-row">
                <input type="number" id="sav-rate" class="form-input" value="6.5" placeholder="6.5" step="any" inputmode="decimal" />
              </div>

              <label class="input-label" style="margin-top: 14px;">Term (Months)</label>
              <div class="input-row">
                <input type="number" id="sav-term" class="form-input" value="24" placeholder="24" step="1" inputmode="numeric" />
              </div>
              <div id="sav-term-desc" style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-top: 4px; padding-left: 2px;">2 Years (24 Months)</div>

              <label class="input-label" style="margin-top: 14px;">TDS / Tax on Interest (%) [Default 10% TDS]</label>
              <div class="input-row">
                <input type="number" id="sav-tax" class="form-input" value="10" placeholder="10" step="any" inputmode="decimal" />
              </div>
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <!-- Result Card for SIP & FD -->
            <div id="result-sip-fd" class="result-card">
              <div class="result-row">
                <span id="res-lbl-invested" class="result-label">Invested Amount</span>
                <span id="res-val-invested" class="result-value">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span id="res-lbl-returns" class="result-label">Estimated Returns</span>
                <span id="res-val-returns" class="result-value-success">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span id="res-lbl-total" class="result-label">Total Maturity Value</span>
                <span id="res-val-total" class="result-value-highlight">₹ 0.00</span>
              </div>

              <!-- Visual Investment Ratio Progress Bar -->
              <div style="margin: 16px 0 6px;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 6px;">
                  <span style="color: var(--text-secondary);"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--accent-color, #3b82f6);margin-right:6px;"></span>Invested: <span id="res-ratio-inv">50%</span></span>
                  <span style="color: #10b981;"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#10b981;margin-right:6px;"></span>Returns: <span id="res-ratio-ret">50%</span></span>
                </div>
                <div style="height: 10px; border-radius: 5px; background: rgba(128,128,128,0.2); overflow: hidden; display: flex; width: 100%;">
                  <div id="res-bar-inv" style="background: var(--accent-color, #3b82f6); width: 50%; transition: width 0.25s ease;"></div>
                  <div id="res-bar-ret" style="background: #10b981; width: 50%; transition: width 0.25s ease;"></div>
                </div>
              </div>

              <div style="margin-top: 14px;">
                <button id="btn-share-savings" class="seg-btn active" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;">
                  <span>💬 Share Investment Plan on WhatsApp</span>
                </button>
              </div>
            </div>

            <!-- Contextual SIP/FD Affiliate Slot -->
            <div id="slot-affiliate-ira"></div>

            <!-- Schedule Card: Year-by-Year Growth Table -->
            <div id="card-schedule" class="result-card">
              <div class="card-title" id="schedule-title" style="margin-bottom: 12px; font-size: 14px; font-weight: 700;">
                Annual Wealth Progression
              </div>
              <div style="overflow-x: auto; max-height: 320px; scrollbar-width: thin;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: right;">
                  <thead>
                    <tr style="border-bottom: 1px solid rgba(128,128,128,0.25); color: var(--text-secondary); font-size: 11px; text-transform: uppercase;">
                      <th style="text-align: left; padding: 6px 4px;">Year</th>
                      <th style="padding: 6px 4px;">Invested</th>
                      <th style="padding: 6px 4px;">Returns</th>
                      <th style="padding: 6px 4px;">Total Value</th>
                    </tr>
                  </thead>
                  <tbody id="schedule-table-body"></tbody>
                </table>
              </div>
            </div>

            <!-- Result Card for RD -->
            <div id="result-sav" class="result-card" style="display: none;">
              <div class="result-row">
                <span class="result-label">Final Maturity Balance</span>
                <span id="sav-res-final" class="result-value-highlight">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total Principal Invested</span>
                <span id="sav-res-principal" class="result-value">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Net Interest (After TDS)</span>
                <span id="sav-res-post-tax" class="result-value-success">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Gross Interest Earned</span>
                <span id="sav-res-pre-tax" class="result-value">₹ 0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnModeSip = container.querySelector('#btn-mode-sip') as HTMLButtonElement;
    const btnModeFd = container.querySelector('#btn-mode-fd') as HTMLButtonElement;
    const btnModeSav = container.querySelector('#btn-mode-sav') as HTMLButtonElement;

    const viewSip = container.querySelector('#view-sip') as HTMLElement;
    const viewFd = container.querySelector('#view-fd') as HTMLElement;
    const viewSav = container.querySelector('#view-sav') as HTMLElement;

    const resSipFd = container.querySelector('#result-sip-fd') as HTMLElement;
    const resSav = container.querySelector('#result-sav') as HTMLElement;
    const cardSchedule = container.querySelector('#card-schedule') as HTMLElement;
    const scheduleTitle = container.querySelector('#schedule-title') as HTMLElement;
    const scheduleBody = container.querySelector('#schedule-table-body') as HTMLElement;
    const btnShareSavings = container.querySelector('#btn-share-savings') as HTMLButtonElement;

    const resRatioInv = container.querySelector('#res-ratio-inv') as HTMLElement;
    const resRatioRet = container.querySelector('#res-ratio-ret') as HTMLElement;
    const resBarInv = container.querySelector('#res-bar-inv') as HTMLElement;
    const resBarRet = container.querySelector('#res-bar-ret') as HTMLElement;

    const lblInvested = container.querySelector('#res-lbl-invested') as HTMLElement;
    const valInvested = container.querySelector('#res-val-invested') as HTMLElement;
    const lblReturns = container.querySelector('#res-lbl-returns') as HTMLElement;
    const valReturns = container.querySelector('#res-val-returns') as HTMLElement;
    const lblTotal = container.querySelector('#res-lbl-total') as HTMLElement;
    const valTotal = container.querySelector('#res-val-total') as HTMLElement;

    // SIP inputs
    const sipMonthly = container.querySelector('#sip-monthly') as HTMLInputElement;
    const sipRate = container.querySelector('#sip-rate') as HTMLInputElement;
    const sipYears = container.querySelector('#sip-years') as HTMLInputElement;
    const sipMonthlyWords = container.querySelector('#sip-monthly-words') as HTMLElement;
    const sipYearsDesc = container.querySelector('#sip-years-desc') as HTMLElement;

    // FD inputs
    const fdAmt = container.querySelector('#fd-amt') as HTMLInputElement;
    const fdRate = container.querySelector('#fd-rate') as HTMLInputElement;
    const fdYears = container.querySelector('#fd-years') as HTMLInputElement;
    const fdSenior = container.querySelector('#fd-senior') as HTMLInputElement;
    const fdAmtWords = container.querySelector('#fd-amt-words') as HTMLElement;
    const fdYearsDesc = container.querySelector('#fd-years-desc') as HTMLElement;

    // SAV inputs
    const inpInit = container.querySelector('#sav-init') as HTMLInputElement;
    const inpMonthly = container.querySelector('#sav-monthly') as HTMLInputElement;
    const inpRate = container.querySelector('#sav-rate') as HTMLInputElement;
    const inpTerm = container.querySelector('#sav-term') as HTMLInputElement;
    const inpTax = container.querySelector('#sav-tax') as HTMLInputElement;
    const savInitWords = container.querySelector('#sav-init-words') as HTMLElement;
    const savMonthlyWords = container.querySelector('#sav-monthly-words') as HTMLElement;
    const savTermDesc = container.querySelector('#sav-term-desc') as HTMLElement;

    const resFinal = container.querySelector('#sav-res-final') as HTMLElement;
    const resPrinc = container.querySelector('#sav-res-principal') as HTMLElement;
    const resPost = container.querySelector('#sav-res-post-tax') as HTMLElement;
    const resPre = container.querySelector('#sav-res-pre-tax') as HTMLElement;

    function cleanNum(str: string): string {
      return (str || '').replace(/,/g, '').trim() || '0';
    }

    function syncPresets(attr: string, value: string) {
      container.querySelectorAll(`[${attr}]`).forEach((el) => {
        el.classList.toggle('active', el.getAttribute(attr) === value);
      });
    }

    function rec() {
      if (mode === 'SIP') {
        const cleanM = cleanNum(sipMonthly.value);
        const res = calculateSIP(cleanM, sipRate.value, sipYears.value);
        lblInvested.textContent = 'Invested Amount';
        valInvested.textContent = `₹ ${formatNumber(res.totalInvested, { section: 'finance' })}`;
        lblReturns.textContent = 'Estimated Returns';
        valReturns.textContent = `₹ ${formatNumber(res.estimatedReturns, { section: 'finance' })}`;
        lblTotal.textContent = 'Total Maturity Value';
        valTotal.textContent = `₹ ${formatNumber(res.totalValue, { section: 'finance' })}`;

        if (sipMonthlyWords) {
          const n = parseFloat(cleanM);
          sipMonthlyWords.textContent = !isNaN(n) && n > 0 ? numberToIndianWords(cleanM) : '';
        }
        if (sipYearsDesc) {
          sipYearsDesc.textContent = formatTenureYears(sipYears.value);
        }

        const totalNum = parseFloat(res.totalValue) || 0;
        const invNum = parseFloat(res.totalInvested) || 0;
        const invPct = totalNum > 0 ? Math.min(100, Math.max(0, Math.round((invNum / totalNum) * 100))) : 50;
        const retPct = 100 - invPct;
        if (resRatioInv) resRatioInv.textContent = `${invPct}%`;
        if (resRatioRet) resRatioRet.textContent = `${retPct}%`;
        if (resBarInv) resBarInv.style.width = `${invPct}%`;
        if (resBarRet) resBarRet.style.width = `${retPct}%`;

        // Generate Annual SIP Growth Schedule
        const years = Math.min(30, Math.max(1, parseInt(sipYears.value, 10) || 1));
        let html = '';
        for (let y = 1; y <= years; y++) {
          const yrRes = calculateSIP(cleanM, sipRate.value, y);
          html += `
            <tr style="border-bottom: 1px solid rgba(128,128,128,0.1); line-height: 1.8;">
              <td style="text-align: left; padding: 6px 4px; font-weight: 600; color: var(--text-secondary);">Year ${y}</td>
              <td style="padding: 6px 4px;">₹ ${formatNumber(yrRes.totalInvested, { section: 'finance' })}</td>
              <td style="padding: 6px 4px; color: #10b981;">+ ₹ ${formatNumber(yrRes.estimatedReturns, { section: 'finance' })}</td>
              <td style="padding: 6px 4px; font-weight: 700; color: var(--accent-color);">₹ ${formatNumber(yrRes.totalValue, { section: 'finance' })}</td>
            </tr>
          `;
        }
        if (scheduleBody) scheduleBody.innerHTML = html;
        if (cardSchedule) cardSchedule.style.display = 'block';
        if (scheduleTitle) scheduleTitle.textContent = 'Annual SIP Wealth Progression';
      } else if (mode === 'FD') {
        const cleanA = cleanNum(fdAmt.value);
        const res = calculateFD(cleanA, fdRate.value, fdYears.value, isSenior);
        lblInvested.textContent = 'Deposit Amount';
        valInvested.textContent = `₹ ${formatNumber(res.investedAmount, { section: 'finance' })}`;
        lblReturns.textContent = `Total Interest Earned ${isSenior ? '(+0.5% Senior)' : ''}`;
        valReturns.textContent = `₹ ${formatNumber(res.totalInterest, { section: 'finance' })}`;
        lblTotal.textContent = 'Total Maturity Value';
        valTotal.textContent = `₹ ${formatNumber(res.maturityAmount, { section: 'finance' })}`;

        if (fdAmtWords) {
          const n = parseFloat(cleanA);
          fdAmtWords.textContent = !isNaN(n) && n > 0 ? numberToIndianWords(cleanA) : '';
        }
        if (fdYearsDesc) {
          fdYearsDesc.textContent = formatTenureYears(fdYears.value);
        }

        const totalNum = parseFloat(res.maturityAmount) || 0;
        const invNum = parseFloat(res.investedAmount) || 0;
        const invPct = totalNum > 0 ? Math.min(100, Math.max(0, Math.round((invNum / totalNum) * 100))) : 50;
        const retPct = 100 - invPct;
        if (resRatioInv) resRatioInv.textContent = `${invPct}%`;
        if (resRatioRet) resRatioRet.textContent = `${retPct}%`;
        if (resBarInv) resBarInv.style.width = `${invPct}%`;
        if (resBarRet) resBarRet.style.width = `${retPct}%`;

        // Generate Annual FD Growth Schedule
        const years = Math.min(30, Math.max(1, parseInt(fdYears.value, 10) || 1));
        let html = '';
        for (let y = 1; y <= years; y++) {
          const yrRes = calculateFD(cleanA, fdRate.value, y, isSenior);
          html += `
            <tr style="border-bottom: 1px solid rgba(128,128,128,0.1); line-height: 1.8;">
              <td style="text-align: left; padding: 6px 4px; font-weight: 600; color: var(--text-secondary);">Year ${y}</td>
              <td style="padding: 6px 4px;">₹ ${formatNumber(yrRes.investedAmount, { section: 'finance' })}</td>
              <td style="padding: 6px 4px; color: #10b981;">+ ₹ ${formatNumber(yrRes.totalInterest, { section: 'finance' })}</td>
              <td style="padding: 6px 4px; font-weight: 700; color: var(--accent-color);">₹ ${formatNumber(yrRes.maturityAmount, { section: 'finance' })}</td>
            </tr>
          `;
        }
        if (scheduleBody) scheduleBody.innerHTML = html;
        if (cardSchedule) cardSchedule.style.display = 'block';
        if (scheduleTitle) scheduleTitle.textContent = 'Annual Fixed Deposit Schedule';
      } else {
        const cleanI = cleanNum(inpInit.value);
        const cleanM = cleanNum(inpMonthly.value);
        const res = calculateSavings(cleanI, cleanM, inpRate.value, inpTerm.value, inpTax.value);
        resFinal.textContent = `₹ ${formatNumber(res.finalBalance, { section: 'finance' })}`;
        resPrinc.textContent = `₹ ${formatNumber(res.totalPrincipal, { section: 'finance' })}`;
        resPost.textContent = `₹ ${formatNumber(res.postTaxInterest, { section: 'finance' })}`;
        resPre.textContent = `₹ ${formatNumber(res.preTaxInterest, { section: 'finance' })}`;

        if (savInitWords) {
          const n = parseFloat(cleanI);
          savInitWords.textContent = !isNaN(n) && n > 0 ? numberToIndianWords(cleanI) : '';
        }
        if (savMonthlyWords) {
          const n = parseFloat(cleanM);
          savMonthlyWords.textContent = !isNaN(n) && n > 0 ? numberToIndianWords(cleanM) : '';
        }
        if (savTermDesc) {
          savTermDesc.textContent = formatTenureMonths(inpTerm.value);
        }

        if (cardSchedule) cardSchedule.style.display = 'none';
      }
    }

    btnModeSip.addEventListener('click', () => {
      mode = 'SIP';
      btnModeSip.classList.add('active');
      btnModeFd.classList.remove('active');
      btnModeSav.classList.remove('active');
      viewSip.style.display = 'block';
      viewFd.style.display = 'none';
      viewSav.style.display = 'none';
      resSipFd.style.display = 'block';
      resSav.style.display = 'none';
      if (cardSchedule) cardSchedule.style.display = 'block';
      rec();
    });

    btnModeFd.addEventListener('click', () => {
      mode = 'FD';
      btnModeFd.classList.add('active');
      btnModeSip.classList.remove('active');
      btnModeSav.classList.remove('active');
      viewSip.style.display = 'none';
      viewFd.style.display = 'block';
      viewSav.style.display = 'none';
      resSipFd.style.display = 'block';
      resSav.style.display = 'none';
      if (cardSchedule) cardSchedule.style.display = 'block';
      rec();
    });

    btnModeSav.addEventListener('click', () => {
      mode = 'SAV';
      btnModeSav.classList.add('active');
      btnModeSip.classList.remove('active');
      btnModeFd.classList.remove('active');
      viewSip.style.display = 'none';
      viewFd.style.display = 'none';
      viewSav.style.display = 'block';
      resSipFd.style.display = 'none';
      resSav.style.display = 'block';
      if (cardSchedule) cardSchedule.style.display = 'none';
      rec();
    });

    fdSenior.addEventListener('change', () => {
      isSenior = fdSenior.checked;
      rec();
    });

    // Preset wireups for SIP with bi-directional sync
    container.querySelectorAll('[data-sip-amt]').forEach((b) => {
      b.addEventListener('click', () => {
        sipMonthly.value = b.getAttribute('data-sip-amt') || '5000';
        syncPresets('data-sip-amt', sipMonthly.value);
        rec();
      });
    });

    container.querySelectorAll('[data-sip-rate]').forEach((b) => {
      b.addEventListener('click', () => {
        sipRate.value = b.getAttribute('data-sip-rate') || '12';
        syncPresets('data-sip-rate', sipRate.value);
        rec();
      });
    });

    container.querySelectorAll('[data-sip-years]').forEach((b) => {
      b.addEventListener('click', () => {
        sipYears.value = b.getAttribute('data-sip-years') || '10';
        syncPresets('data-sip-years', sipYears.value);
        rec();
      });
    });

    // Preset wireups for SIP with bi-directional sync
    container.querySelectorAll('[data-sip-amt]').forEach((b) => {
      b.addEventListener('click', () => {
        const raw = b.getAttribute('data-sip-amt') || '5000';
        sipMonthly.value = formatNumber(raw, { section: 'finance' });
        syncPresets('data-sip-amt', raw);
        rec();
      });
    });

    container.querySelectorAll('[data-sip-rate]').forEach((b) => {
      b.addEventListener('click', () => {
        sipRate.value = b.getAttribute('data-sip-rate') || '12';
        syncPresets('data-sip-rate', sipRate.value);
        rec();
      });
    });

    container.querySelectorAll('[data-sip-years]').forEach((b) => {
      b.addEventListener('click', () => {
        sipYears.value = b.getAttribute('data-sip-years') || '10';
        syncPresets('data-sip-years', sipYears.value);
        rec();
      });
    });

    // Preset wireups for FD with bi-directional sync
    container.querySelectorAll('[data-fd-amt]').forEach((b) => {
      b.addEventListener('click', () => {
        const raw = b.getAttribute('data-fd-amt') || '100000';
        fdAmt.value = formatNumber(raw, { section: 'finance' });
        syncPresets('data-fd-amt', raw);
        rec();
      });
    });

    container.querySelectorAll('[data-fd-rate]').forEach((b) => {
      b.addEventListener('click', () => {
        fdRate.value = b.getAttribute('data-fd-rate') || '7.1';
        syncPresets('data-fd-rate', fdRate.value);
        rec();
      });
    });

    function attachCommaBlur(input: HTMLInputElement) {
      input.addEventListener('blur', () => {
        const cl = cleanNum(input.value);
        const n = parseFloat(cl);
        if (!isNaN(n) && n >= 0) {
          input.value = formatNumber(cl, { section: 'finance' });
        }
      });
    }

    attachCommaBlur(sipMonthly);
    attachCommaBlur(fdAmt);
    attachCommaBlur(inpInit);
    attachCommaBlur(inpMonthly);

    // Bi-directional input sync listeners
    sipMonthly.addEventListener('input', () => {
      syncPresets('data-sip-amt', cleanNum(sipMonthly.value));
      rec();
    });

    sipRate.addEventListener('input', () => {
      syncPresets('data-sip-rate', sipRate.value);
      rec();
    });

    sipYears.addEventListener('input', () => {
      syncPresets('data-sip-years', sipYears.value);
      rec();
    });

    fdAmt.addEventListener('input', () => {
      syncPresets('data-fd-amt', cleanNum(fdAmt.value));
      rec();
    });

    fdRate.addEventListener('input', () => {
      syncPresets('data-fd-rate', fdRate.value);
      rec();
    });

    [fdYears, inpInit, inpMonthly, inpRate, inpTerm, inpTax].forEach(
      (inp) => inp?.addEventListener('input', rec)
    );

    btnShareSavings?.addEventListener('click', () => {
      let text = '';
      if (mode === 'SIP') {
        const cleanM = cleanNum(sipMonthly.value);
        const res = calculateSIP(cleanM, sipRate.value, sipYears.value);
        text = `📈 *Mutual Fund SIP Plan*
Monthly Investment: ₹${formatNumber(cleanM, { section: 'finance' })}
Expected Return: ${sipRate.value}% p.a.
Duration: ${formatTenureYears(sipYears.value)}
---
Total Invested: ₹${formatNumber(res.totalInvested, { section: 'finance' })}
Estimated Returns: ₹${formatNumber(res.estimatedReturns, { section: 'finance' })}
*Total Maturity Value: ₹${formatNumber(res.totalValue, { section: 'finance' })}*

Calculated via EveryCalc`;
      } else {
        const cleanA = cleanNum(fdAmt.value);
        const res = calculateFD(cleanA, fdRate.value, fdYears.value, isSenior);
        text = `🏦 *Fixed Deposit (FD) Plan*
Deposit Amount: ₹${formatNumber(cleanA, { section: 'finance' })}
Interest Rate: ${fdRate.value}% ${isSenior ? '(+0.5% Senior Citizen)' : ''}
Duration: ${formatTenureYears(fdYears.value)} (Quarterly Compounding)
---
Total Interest Earned: ₹${formatNumber(res.totalInterest, { section: 'finance' })}
*Maturity Amount: ₹${formatNumber(res.maturityAmount, { section: 'finance' })}*

Calculated via EveryCalc`;
      }
      shareText(text, 'Investment Plan');
    });

    const slotIra = container.querySelector('#slot-affiliate-ira');
    if (slotIra) {
      const card = createAffiliateCardElement('IRA');
      if (card) slotIra.appendChild(card);
    }

    rec();
  }
};

// ==========================================
// 3. UNIT PRICE CALCULATOR (UPR)
// ==========================================
export interface UnitPriceResult {
  unitPriceA: string;
  unitPriceB: string;
  cheaperItem: 'A' | 'B' | 'EQUAL';
  savingsPercent: string;
}

export function calculateUnitPrice(
  priceA: string | number,
  qtyA: string | number,
  priceB: string | number,
  qtyB: string | number
): UnitPriceResult {
  try {
    const pA = new Decimal(priceA || 0);
    const qA = new Decimal(qtyA || 0);
    const pB = new Decimal(priceB || 0);
    const qB = new Decimal(qtyB || 0);

    if (qA.isZero() || qB.isZero()) {
      return { unitPriceA: '0.00', unitPriceB: '0.00', cheaperItem: 'EQUAL', savingsPercent: '0' };
    }

    const upA = pA.dividedBy(qA);
    const upB = pB.dividedBy(qB);

    if (upA.equals(upB)) {
      return { unitPriceA: upA.toFixed(4), unitPriceB: upB.toFixed(4), cheaperItem: 'EQUAL', savingsPercent: '0' };
    }

    const isACheaper = upA.lessThan(upB);
    const diff = isACheaper ? upB.minus(upA).dividedBy(upB) : upA.minus(upB).dividedBy(upA);
    const pct = diff.times(100).toFixed(1);

    return {
      unitPriceA: upA.toFixed(4),
      unitPriceB: upB.toFixed(4),
      cheaperItem: isACheaper ? 'A' : 'B',
      savingsPercent: pct
    };
  } catch {
    return { unitPriceA: '0.00', unitPriceB: '0.00', cheaperItem: 'EQUAL', savingsPercent: '0' };
  }
}

export const UnitPriceModule: CalculatorModule = {
  id: 'UPR',
  name: 'Unit Price Calculator',
  icon: '⚖️',
  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <!-- Item A -->
            <div class="input-card">
              <div class="card-title">Item A</div>
              <div class="input-row">
                <input type="number" id="upr-pa" class="form-input" placeholder="Price (A)" step="any" inputmode="decimal" />
                <input type="number" id="upr-qa" class="form-input" placeholder="Quantity (A)" step="any" inputmode="decimal" />
              </div>
              <div class="result-row mt-8">
                <span class="result-label">Unit Price A</span>
                <span id="upr-res-a" class="result-value">0.00</span>
              </div>
            </div>

            <!-- Item B -->
            <div class="input-card">
              <div class="card-title">Item B</div>
              <div class="input-row">
                <input type="number" id="upr-pb" class="form-input" placeholder="Price (B)" step="any" inputmode="decimal" />
                <input type="number" id="upr-qb" class="form-input" placeholder="Quantity (B)" step="any" inputmode="decimal" />
              </div>
              <div class="result-row mt-8">
                <span class="result-label">Unit Price B</span>
                <span id="upr-res-b" class="result-value">0.00</span>
              </div>
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">Comparison Verdict</span>
                <span id="upr-verdict" class="result-value-highlight">Enter values</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const pa = container.querySelector('#upr-pa') as HTMLInputElement;
    const qa = container.querySelector('#upr-qa') as HTMLInputElement;
    const pb = container.querySelector('#upr-pb') as HTMLInputElement;
    const qb = container.querySelector('#upr-qb') as HTMLInputElement;

    const resA = container.querySelector('#upr-res-a') as HTMLElement;
    const resB = container.querySelector('#upr-res-b') as HTMLElement;
    const verdict = container.querySelector('#upr-verdict') as HTMLElement;

    function rec() {
      const res = calculateUnitPrice(pa.value, qa.value, pb.value, qb.value);
      resA.textContent = formatNumber(res.unitPriceA);
      resB.textContent = formatNumber(res.unitPriceB);

      if (res.cheaperItem === 'A') {
        verdict.textContent = `Item A is ${res.savingsPercent}% cheaper!`;
        verdict.className = 'result-value-success';
      } else if (res.cheaperItem === 'B') {
        verdict.textContent = `Item B is ${res.savingsPercent}% cheaper!`;
        verdict.className = 'result-value-success';
      } else {
        verdict.textContent = 'Both items have equal unit price';
        verdict.className = 'result-value';
      }
    }

    [pa, qa, pb, qb].forEach((inp) => inp?.addEventListener('input', rec));
  }
};
