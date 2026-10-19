import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { formatNumber, formatLabelNumber } from '../core/math.ts';
import { shareText } from '../core/share.ts';

export interface IncomeTaxResult {
  grossIncome: string;
  // New Regime
  newTaxableIncome: string;
  newBaseTax: string;
  newCess: string;
  newTotalTax: string;
  // Old Regime
  oldTaxableIncome: string;
  oldBaseTax: string;
  oldCess: string;
  oldTotalTax: string;
  // Comparison
  savings: string;
  recommendedRegime: 'NEW' | 'OLD' | 'EQUAL';
}

export function calculateIncomeTax(
  grossIncome: string | number,
  deduction80C: string | number = 0,
  deduction80D: string | number = 0,
  deductionHRA: string | number = 0,
  deductionHomeLoan: string | number = 0
): IncomeTaxResult {
  try {
    const gross = new Decimal(grossIncome || 0);
    const d80c = Decimal.min(new Decimal(deduction80C || 0), 150000); // 80C cap ₹1.5L
    const d80d = Decimal.min(new Decimal(deduction80D || 0), 75000); // 80D health
    const hra = new Decimal(deductionHRA || 0);
    const homeLoan = Decimal.min(new Decimal(deductionHomeLoan || 0), 200000); // 24b cap ₹2L

    if (gross.isZero()) {
      return {
        grossIncome: '0.00',
        newTaxableIncome: '0.00',
        newBaseTax: '0.00',
        newCess: '0.00',
        newTotalTax: '0.00',
        oldTaxableIncome: '0.00',
        oldBaseTax: '0.00',
        oldCess: '0.00',
        oldTotalTax: '0.00',
        savings: '0.00',
        recommendedRegime: 'EQUAL'
      };
    }

    // ==========================================
    // 1. NEW REGIME (FY 2024-25 Budget 2024)
    // Standard deduction: ₹75,000
    // ==========================================
    const newStdDed = new Decimal(75000);
    const newTaxable = Decimal.max(0, gross.minus(newStdDed));
    let newTax = new Decimal(0);

    if (newTaxable.greaterThan(700000)) {
      // Slabs:
      // 0 - 3L: 0%
      // 3L - 7L: 5% (4L * 5% = 20,000)
      if (newTaxable.greaterThan(300000)) {
        const taxableAt5 = Decimal.min(newTaxable.minus(300000), 400000);
        newTax = newTax.plus(taxableAt5.times(0.05));
      }
      // 7L - 10L: 10% (3L * 10% = 30,000)
      if (newTaxable.greaterThan(700000)) {
        const taxableAt10 = Decimal.min(newTaxable.minus(700000), 300000);
        newTax = newTax.plus(taxableAt10.times(0.1));
      }
      // 10L - 12L: 15% (2L * 15% = 30,000)
      if (newTaxable.greaterThan(1000000)) {
        const taxableAt15 = Decimal.min(newTaxable.minus(1000000), 200000);
        newTax = newTax.plus(taxableAt15.times(0.15));
      }
      // 12L - 15L: 20% (3L * 20% = 60,000)
      if (newTaxable.greaterThan(1200000)) {
        const taxableAt20 = Decimal.min(newTaxable.minus(1200000), 300000);
        newTax = newTax.plus(taxableAt20.times(0.2));
      }
      // > 15L: 30%
      if (newTaxable.greaterThan(1500000)) {
        const taxableAt30 = newTaxable.minus(1500000);
        newTax = newTax.plus(taxableAt30.times(0.3));
      }
    } else {
      // Section 87A rebate under New Regime makes tax = 0 for taxable income <= 7 Lakh
      newTax = new Decimal(0);
    }

    const newCess = newTax.times(0.04);
    const newTotal = newTax.plus(newCess);

    // ==========================================
    // 2. OLD REGIME
    // Standard deduction: ₹50,000 + 80C + 80D + HRA + Home Loan
    // ==========================================
    const oldStdDed = new Decimal(50000);
    const totalOldDeductions = oldStdDed.plus(d80c).plus(d80d).plus(hra).plus(homeLoan);
    const oldTaxable = Decimal.max(0, gross.minus(totalOldDeductions));
    let oldTax = new Decimal(0);

    if (oldTaxable.greaterThan(500000)) {
      // 0 - 2.5L: 0%
      // 2.5L - 5L: 5% (2.5L * 5% = 12,500)
      if (oldTaxable.greaterThan(250000)) {
        const taxableAt5 = Decimal.min(oldTaxable.minus(250000), 250000);
        oldTax = oldTax.plus(taxableAt5.times(0.05));
      }
      // 5L - 10L: 20% (5L * 20% = 1,00,000)
      if (oldTaxable.greaterThan(500000)) {
        const taxableAt20 = Decimal.min(oldTaxable.minus(500000), 500000);
        oldTax = oldTax.plus(taxableAt20.times(0.2));
      }
      // > 10L: 30%
      if (oldTaxable.greaterThan(1000000)) {
        const taxableAt30 = oldTaxable.minus(1000000);
        oldTax = oldTax.plus(taxableAt30.times(0.3));
      }
    } else {
      // Section 87A rebate under Old Regime makes tax = 0 for taxable income <= 5 Lakh
      oldTax = new Decimal(0);
    }

    const oldCess = oldTax.times(0.04);
    const oldTotal = oldTax.plus(oldCess);

    // ==========================================
    // 3. COMPARISON
    // ==========================================
    let savings = new Decimal(0);
    let recommended: 'NEW' | 'OLD' | 'EQUAL' = 'EQUAL';

    if (newTotal.lessThan(oldTotal)) {
      savings = oldTotal.minus(newTotal);
      recommended = 'NEW';
    } else if (oldTotal.lessThan(newTotal)) {
      savings = newTotal.minus(oldTotal);
      recommended = 'OLD';
    }

    return {
      grossIncome: gross.toFixed(2),
      newTaxableIncome: newTaxable.toFixed(2),
      newBaseTax: newTax.toFixed(2),
      newCess: newCess.toFixed(2),
      newTotalTax: newTotal.toFixed(2),
      oldTaxableIncome: oldTaxable.toFixed(2),
      oldBaseTax: oldTax.toFixed(2),
      oldCess: oldCess.toFixed(2),
      oldTotalTax: oldTotal.toFixed(2),
      savings: savings.toFixed(2),
      recommendedRegime: recommended
    };
  } catch {
    return {
      grossIncome: '0.00',
      newTaxableIncome: '0.00',
      newBaseTax: '0.00',
      newCess: '0.00',
      newTotalTax: '0.00',
      oldTaxableIncome: '0.00',
      oldBaseTax: '0.00',
      oldCess: '0.00',
      oldTotalTax: '0.00',
      savings: '0.00',
      recommendedRegime: 'EQUAL'
    };
  }
}

export const IncomeTaxModule: CalculatorModule = {
  id: 'ITX',
  name: 'Income Tax (New vs Old)',
  icon: '📑',
  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="input-card">
              <label class="input-label">Annual Gross Income / CTC (₹)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-ctc="750000">₹7.5 L</button>
                <button class="btn-preset active" data-ctc="1200000">₹12 L</button>
                <button class="btn-preset" data-ctc="1800000">₹18 L</button>
                <button class="btn-preset" data-ctc="2500000">₹25 L</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="number" id="itx-gross" class="form-input" value="1200000" placeholder="1200000" step="any" inputmode="decimal" />
              </div>

              <div style="margin-top: 14px; font-weight: 700; font-size: 13.5px; color: var(--accent-color, #ff9f0a);">
                Old Regime Deductions (Optional)
              </div>

              <label class="input-label" style="margin-top: 8px;">Section 80C (EPF, PPF, ELSS, Life Ins) [Max ₹1.5L]</label>
              <input type="number" id="itx-80c" class="form-input" value="150000" placeholder="150000" step="any" inputmode="decimal" />

              <label class="input-label">Section 80D (Health Insurance Premium)</label>
              <input type="number" id="itx-80d" class="form-input" value="25000" placeholder="25000" step="any" inputmode="decimal" />

              <label class="input-label">Annual HRA Exemption</label>
              <input type="number" id="itx-hra" class="form-input" value="0" placeholder="0" step="any" inputmode="decimal" />

              <label class="input-label">Home Loan Interest (Section 24b) [Max ₹2L]</label>
              <input type="number" id="itx-homeloan" class="form-input" value="0" placeholder="0" step="any" inputmode="decimal" />
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <!-- Recommendation Banner -->
            <div id="itx-banner" class="input-card" style="background: rgba(48, 209, 88, 0.15); border: 1px solid rgba(48, 209, 88, 0.4); text-align: center; padding: 14px;">
              <div id="itx-rec-title" style="font-weight: 700; font-size: 16px; color: #30d158;">New Regime is Better</div>
              <div id="itx-rec-desc" style="font-size: 13px; margin-top: 4px; color: var(--text-secondary);">You save ₹ 0 in taxes</div>
            </div>

            <!-- Side-by-Side Comparison Matrix -->
            <div class="result-card">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 12px;">
                <div style="background: var(--bg-surface, rgba(255,255,255,0.05)); padding: 10px 6px; border-radius: 12px; text-align: center; border: 1px solid rgba(255, 159, 10, 0.25);">
                  <div style="font-size: 11.5px; font-weight: 700; color: var(--accent-color, #ff9f0a);">New Regime (FY 24-25)</div>
                  <div id="itx-res-new-tax" style="font-size: clamp(16px, 4.5vw, 20px); font-weight: 800; margin-top: 4px;">₹ 0.00</div>
                  <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px;">Std Ded: ₹75,000</div>
                </div>

                <div style="background: var(--bg-surface, rgba(255,255,255,0.05)); padding: 10px 6px; border-radius: 12px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1);">
                  <div style="font-size: 11.5px; font-weight: 700; color: var(--text-secondary);">Old Regime</div>
                  <div id="itx-res-old-tax" style="font-size: clamp(16px, 4.5vw, 20px); font-weight: 800; margin-top: 4px;">₹ 0.00</div>
                  <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px;">Std Ded: ₹50,000</div>
                </div>
              </div>

              <div class="result-row">
                <span class="result-label">New Regime Taxable Income</span>
                <span id="itx-res-new-taxable" class="result-value">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Old Regime Taxable Income</span>
                <span id="itx-res-old-taxable" class="result-value">₹ 0.00</span>
              </div>

              <div style="margin-top: 14px;">
                <button id="btn-share-itx" class="seg-btn active" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;">
                  <span>💬 Share Tax Comparison on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const inpGross = container.querySelector('#itx-gross') as HTMLInputElement;
    const inp80c = container.querySelector('#itx-80c') as HTMLInputElement;
    const inp80d = container.querySelector('#itx-80d') as HTMLInputElement;
    const inpHra = container.querySelector('#itx-hra') as HTMLInputElement;
    const inpHomeLoan = container.querySelector('#itx-homeloan') as HTMLInputElement;

    const banner = container.querySelector('#itx-banner') as HTMLElement;
    const recTitle = container.querySelector('#itx-rec-title') as HTMLElement;
    const recDesc = container.querySelector('#itx-rec-desc') as HTMLElement;

    const resNewTax = container.querySelector('#itx-res-new-tax') as HTMLElement;
    const resOldTax = container.querySelector('#itx-res-old-tax') as HTMLElement;
    const resNewTaxable = container.querySelector('#itx-res-new-taxable') as HTMLElement;
    const resOldTaxable = container.querySelector('#itx-res-old-taxable') as HTMLElement;
    const btnShare = container.querySelector('#btn-share-itx') as HTMLButtonElement;

    let lastRes: IncomeTaxResult | null = null;

    function rec() {
      const res = calculateIncomeTax(
        inpGross.value,
        inp80c.value,
        inp80d.value,
        inpHra.value,
        inpHomeLoan.value
      );
      lastRes = res;

      resNewTax.textContent = `₹ ${formatNumber(res.newTotalTax)}`;
      resOldTax.textContent = `₹ ${formatNumber(res.oldTotalTax)}`;
      resNewTaxable.textContent = `₹ ${formatNumber(res.newTaxableIncome)}`;
      resOldTaxable.textContent = `₹ ${formatNumber(res.oldTaxableIncome)}`;

      if (res.recommendedRegime === 'NEW') {
        recTitle.textContent = '🎉 New Tax Regime is Recommended!';
        recTitle.style.color = '#30d158';
        recDesc.textContent = `You save ₹ ${formatNumber(res.savings)} with the New Regime.`;
        banner.style.background = 'rgba(48, 209, 88, 0.15)';
        banner.style.borderColor = 'rgba(48, 209, 88, 0.4)';
      } else if (res.recommendedRegime === 'OLD') {
        recTitle.textContent = '🎉 Old Tax Regime is Recommended!';
        recTitle.style.color = '#30d158';
        recDesc.textContent = `You save ₹ ${formatNumber(res.savings)} with Old Regime deductions.`;
        banner.style.background = 'rgba(48, 209, 88, 0.15)';
        banner.style.borderColor = 'rgba(48, 209, 88, 0.4)';
      } else {
        recTitle.textContent = 'Both Regimes Result in Equal Tax';
        recTitle.style.color = 'var(--accent-color, #ff9f0a)';
        recDesc.textContent = 'Zero tax payable under both regimes.';
        banner.style.background = 'rgba(255, 159, 10, 0.15)';
        banner.style.borderColor = 'rgba(255, 159, 10, 0.4)';
      }
    }

    function syncCtcPresets(val: string) {
      container.querySelectorAll('[data-ctc]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-ctc') === val);
      });
    }

    container.querySelectorAll('[data-ctc]').forEach((b) => {
      b.addEventListener('click', () => {
        inpGross.value = b.getAttribute('data-ctc') || '1200000';
        syncCtcPresets(inpGross.value);
        rec();
      });
    });

    btnShare.addEventListener('click', () => {
      if (!lastRes) return;
      const text = `📑 *Income Tax Comparison (FY 2024-25)*
Gross CTC: ₹${formatLabelNumber(lastRes.grossIncome)}
---
✨ *New Regime Tax*: ₹${formatNumber(lastRes.newTotalTax)}
🏛️ *Old Regime Tax*: ₹${formatNumber(lastRes.oldTotalTax)}
---
💡 *Verdict*: ${lastRes.recommendedRegime === 'NEW' ? 'New Regime saves ₹' + formatNumber(lastRes.savings) : lastRes.recommendedRegime === 'OLD' ? 'Old Regime saves ₹' + formatNumber(lastRes.savings) : 'Both Equal (₹0 Tax)'}

Calculated via EveryCalc`;
      shareText(text, 'Income Tax Comparison');
    });

    inpGross.addEventListener('input', () => {
      syncCtcPresets(inpGross.value);
      rec();
    });
    [inp80c, inp80d, inpHra, inpHomeLoan].forEach((inp) => inp?.addEventListener('input', rec));
    rec();
  }
};
