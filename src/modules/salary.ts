import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { formatNumber, formatLabelNumber, attachCommaFormatter, formatInputValue } from '../core/math.ts';
import { calculateIncomeTax } from './income_tax.ts';
import { shareText } from '../core/share.ts';

export interface SalaryBreakdownResult {
  annualCTC: string;
  monthlyGross: string;
  monthlyBasic: string;
  monthlyHRA: string;
  monthlySpecialAllowance: string;
  monthlyEPF: string;
  monthlyPT: string;
  monthlyTDS: string;
  monthlyTotalDeductions: string;
  monthlyTakeHome: string;
  annualTakeHome: string;
}

export function calculateInHandSalary(
  annualCTC: string | number,
  basicPct: string | number = 40,
  ptMonthly: string | number = 200
): SalaryBreakdownResult {
  try {
    const rawCtc = annualCTC !== undefined && annualCTC !== null ? annualCTC.toString().replace(/,/g, '') : '0';
    const ctc = new Decimal(rawCtc || 0);
    const bPct = new Decimal(basicPct || 40).dividedBy(100);
    const pt = new Decimal(ptMonthly || 200);

    if (ctc.isZero()) {
      return {
        annualCTC: '0.00',
        monthlyGross: '0.00',
        monthlyBasic: '0.00',
        monthlyHRA: '0.00',
        monthlySpecialAllowance: '0.00',
        monthlyEPF: '0.00',
        monthlyPT: '0.00',
        monthlyTDS: '0.00',
        monthlyTotalDeductions: '0.00',
        monthlyTakeHome: '0.00',
        annualTakeHome: '0.00'
      };
    }

    const monthlyGross = ctc.dividedBy(12);
    const monthlyBasic = monthlyGross.times(bPct);
    const monthlyHRA = monthlyBasic.times(0.5); // Standard 50% of Basic
    const monthlySpecial = Decimal.max(0, monthlyGross.minus(monthlyBasic).minus(monthlyHRA));

    // Employee PF = 12% of Basic Salary
    const monthlyEPF = monthlyBasic.times(0.12);

    // Monthly Income Tax (TDS) calculated based on New Tax Regime
    const taxRes = calculateIncomeTax(ctc.toString());
    const monthlyTDS = new Decimal(taxRes.newTotalTax).dividedBy(12);

    const monthlyTotalDeductions = monthlyEPF.plus(pt).plus(monthlyTDS);
    const monthlyTakeHome = Decimal.max(0, monthlyGross.minus(monthlyTotalDeductions));
    const annualTakeHome = monthlyTakeHome.times(12);

    return {
      annualCTC: ctc.toFixed(2),
      monthlyGross: monthlyGross.toFixed(2),
      monthlyBasic: monthlyBasic.toFixed(2),
      monthlyHRA: monthlyHRA.toFixed(2),
      monthlySpecialAllowance: monthlySpecial.toFixed(2),
      monthlyEPF: monthlyEPF.toFixed(2),
      monthlyPT: pt.toFixed(2),
      monthlyTDS: monthlyTDS.toFixed(2),
      monthlyTotalDeductions: monthlyTotalDeductions.toFixed(2),
      monthlyTakeHome: monthlyTakeHome.toFixed(2),
      annualTakeHome: annualTakeHome.toFixed(2)
    };
  } catch {
    return {
      annualCTC: '0.00',
      monthlyGross: '0.00',
      monthlyBasic: '0.00',
      monthlyHRA: '0.00',
      monthlySpecialAllowance: '0.00',
      monthlyEPF: '0.00',
      monthlyPT: '0.00',
      monthlyTDS: '0.00',
      monthlyTotalDeductions: '0.00',
      monthlyTakeHome: '0.00',
      annualTakeHome: '0.00'
    };
  }
}

export const SalaryModule: CalculatorModule = {
  id: 'SAL',
  name: 'In-Hand Salary Calculator',
  icon: '💼',
  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="input-card">
              <label class="input-label">Annual Cost to Company (CTC in ₹)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-sal="600000">₹6 L</button>
                <button class="btn-preset" data-sal="1000000">₹10 L</button>
                <button class="btn-preset active" data-sal="1500000">₹15 L</button>
                <button class="btn-preset" data-sal="2500000">₹25 L</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="text" id="sal-ctc" class="form-input" value="15,00,000" placeholder="15,00,000" inputmode="decimal" />
              </div>

              <label class="input-label">Basic Salary (% of CTC)</label>
              <div class="tip-preset-row">
                <button class="btn-preset active" data-basic="40">40% (Standard)</button>
                <button class="btn-preset" data-basic="50">50%</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="number" id="sal-basic-pct" class="form-input" value="40" placeholder="40" step="any" inputmode="decimal" />
              </div>

              <label class="input-label">Professional Tax (₹ / Month)</label>
              <input type="number" id="sal-pt" class="form-input" value="200" placeholder="200" step="any" inputmode="decimal" />
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <!-- In-Hand Highlight Card -->
            <div class="input-card" style="background: rgba(10, 132, 255, 0.12); border: 1px solid rgba(10, 132, 255, 0.35); text-align: center; padding: 16px;">
              <div style="font-size: 13.5px; font-weight: 700; color: var(--accent-color, #ff9f0a);">Estimated Monthly Take-Home (In-Hand)</div>
              <div id="sal-res-monthly-inhand" style="font-size: clamp(20px, 6vw, 28px); font-weight: 800; color: #fff; margin: 6px 0;">₹ 0.00</div>
              <div id="sal-res-annual-inhand" style="font-size: 13px; color: var(--text-secondary);">Annual in bank: ₹ 0.00</div>
            </div>

            <!-- Breakdown Card -->
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">Monthly Gross Salary</span>
                <span id="sal-res-gross" class="result-value">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Basic Pay</span>
                <span id="sal-res-basic" class="result-value">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">HRA (House Rent Allowance)</span>
                <span id="sal-res-hra" class="result-value">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Special Allowance</span>
                <span id="sal-res-special" class="result-value">₹ 0.00</span>
              </div>

              <div style="margin: 10px 0; border-top: 1px dashed rgba(255,255,255,0.15);"></div>

              <div class="result-row">
                <span class="result-label" style="color: var(--danger-color, #ff453a);">Employee PF (12% of Basic)</span>
                <span id="sal-res-epf" class="result-value-danger">- ₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label" style="color: var(--danger-color, #ff453a);">Professional Tax (PT)</span>
                <span id="sal-res-pt" class="result-value-danger">- ₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label" style="color: var(--danger-color, #ff453a);">Estimated TDS / Income Tax</span>
                <span id="sal-res-tds" class="result-value-danger">- ₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label" style="font-weight: 700;">Total Monthly Deductions</span>
                <span id="sal-res-deductions" class="result-value-danger" style="font-weight: 700;">₹ 0.00</span>
              </div>

              <div style="margin-top: 14px;">
                <button id="btn-share-sal" class="seg-btn active" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;">
                  <span>💬 Share Salary Breakdown on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const inpCtc = container.querySelector('#sal-ctc') as HTMLInputElement;
    const inpBasicPct = container.querySelector('#sal-basic-pct') as HTMLInputElement;
    const inpPt = container.querySelector('#sal-pt') as HTMLInputElement;

    const resMonthlyInhand = container.querySelector('#sal-res-monthly-inhand') as HTMLElement;
    const resAnnualInhand = container.querySelector('#sal-res-annual-inhand') as HTMLElement;
    const resGross = container.querySelector('#sal-res-gross') as HTMLElement;
    const resBasic = container.querySelector('#sal-res-basic') as HTMLElement;
    const resHra = container.querySelector('#sal-res-hra') as HTMLElement;
    const resSpecial = container.querySelector('#sal-res-special') as HTMLElement;
    const resEpf = container.querySelector('#sal-res-epf') as HTMLElement;
    const resPt = container.querySelector('#sal-res-pt') as HTMLElement;
    const resTds = container.querySelector('#sal-res-tds') as HTMLElement;
    const resDeductions = container.querySelector('#sal-res-deductions') as HTMLElement;
    const btnShare = container.querySelector('#btn-share-sal') as HTMLButtonElement;

    let lastRes: SalaryBreakdownResult | null = null;

    function rec() {
      const res = calculateInHandSalary(inpCtc.value, inpBasicPct.value, inpPt.value);
      lastRes = res;

      resMonthlyInhand.textContent = `₹ ${formatNumber(res.monthlyTakeHome)}`;
      resAnnualInhand.textContent = `Annual in bank: ₹ ${formatNumber(res.annualTakeHome)}`;
      resGross.textContent = `₹ ${formatNumber(res.monthlyGross)}`;
      resBasic.textContent = `₹ ${formatNumber(res.monthlyBasic)}`;
      resHra.textContent = `₹ ${formatNumber(res.monthlyHRA)}`;
      resSpecial.textContent = `₹ ${formatNumber(res.monthlySpecialAllowance)}`;
      resEpf.textContent = `- ₹ ${formatNumber(res.monthlyEPF)}`;
      resPt.textContent = `- ₹ ${formatNumber(res.monthlyPT)}`;
      resTds.textContent = `- ₹ ${formatNumber(res.monthlyTDS)}`;
      resDeductions.textContent = `₹ ${formatNumber(res.monthlyTotalDeductions)}`;
    }

    function syncSalPresets(attr: string, val: string) {
      const cleanVal = val.replace(/,/g, '');
      container.querySelectorAll(`[${attr}]`).forEach((b) => {
        b.classList.toggle('active', b.getAttribute(attr) === cleanVal);
      });
    }

    container.querySelectorAll('[data-sal]').forEach((b) => {
      b.addEventListener('click', () => {
        const raw = b.getAttribute('data-sal') || '1500000';
        inpCtc.value = formatInputValue(raw);
        syncSalPresets('data-sal', raw);
        rec();
      });
    });

    container.querySelectorAll('[data-basic]').forEach((b) => {
      b.addEventListener('click', () => {
        inpBasicPct.value = b.getAttribute('data-basic') || '40';
        syncSalPresets('data-basic', inpBasicPct.value);
        rec();
      });
    });

    btnShare.addEventListener('click', () => {
      if (!lastRes) return;
      const text = `💼 *Salary In-Hand Estimate*
Annual CTC: ₹${formatLabelNumber(lastRes.annualCTC)}
Monthly Gross: ₹${formatLabelNumber(lastRes.monthlyGross)}
---
Deductions:
• EPF: ₹${formatNumber(lastRes.monthlyEPF)}
• PT: ₹${formatNumber(lastRes.monthlyPT)}
• TDS (Income Tax): ₹${formatNumber(lastRes.monthlyTDS)}
Total Deductions: ₹${formatNumber(lastRes.monthlyTotalDeductions)}
---
💰 *Monthly Take-Home (In-Hand): ₹${formatNumber(lastRes.monthlyTakeHome)}*
Annual Take-Home: ₹${formatNumber(lastRes.annualTakeHome)}

Calculated via EveryCalc`;
      shareText(text, 'In-Hand Salary Estimate');
    });

    attachCommaFormatter(inpCtc, (raw) => {
      syncSalPresets('data-sal', raw);
      rec();
    });
    inpBasicPct.addEventListener('input', () => {
      syncSalPresets('data-basic', inpBasicPct.value);
      rec();
    });
    inpPt.addEventListener('input', rec);

    inpCtc.value = formatInputValue(inpCtc.value || '1500000');
    rec();
  }
};
