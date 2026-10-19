import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { formatNumber } from '../core/math.ts';
import { t } from '../core/i18n.ts';

export function calculatePercentOf(pct: string | number, total: string | number): string {
  try {
    const p = new Decimal(pct || 0);
    const y = new Decimal(total || 0);
    return y.times(p.dividedBy(100)).toString();
  } catch {
    return '0';
  }
}

export function calculatePercentRatio(part: string | number, total: string | number): string {
  try {
    const x = new Decimal(part || 0);
    const y = new Decimal(total || 0);
    if (y.isZero()) return '0';
    return x.dividedBy(y).times(100).toFixed(4).replace(/\.?0+$/, '');
  } catch {
    return '0';
  }
}

export function calculatePercentChange(fromVal: string | number, toVal: string | number): { changePct: string; isIncrease: boolean } {
  try {
    const from = new Decimal(fromVal || 0);
    const to = new Decimal(toVal || 0);
    if (from.isZero()) return { changePct: '0', isIncrease: true };

    const diff = to.minus(from);
    const pct = diff.dividedBy(from).times(100);
    return {
      changePct: pct.abs().toFixed(2),
      isIncrease: pct.greaterThanOrEqualTo(0)
    };
  } catch {
    return { changePct: '0', isIncrease: true };
  }
}

export const PercentageModule: CalculatorModule = {
  id: 'PER',
  name: 'Percentage Calculator',
  icon: '📊',
  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <!-- Section 1: Percent of -->
            <div class="input-card">
              <div class="card-title">${t('PER_card1_title')}</div>
              <div class="inline-calc-row">
                <span>${t('PER_what_is')}</span>
                <input type="number" id="per1-x" class="form-input form-input-sm" placeholder="0" step="any" inputmode="decimal" />
                <span>${t('PER_pct_of')}</span>
                <input type="number" id="per1-y" class="form-input form-input-sm" placeholder="0" step="any" inputmode="decimal" />
              </div>
              <div class="result-row mt-8">
                <span class="result-label">${t('result')}</span>
                <span id="per1-res" class="result-value-highlight">0</span>
              </div>
            </div>

            <!-- Section 2: Ratio -->
            <div class="input-card">
              <div class="card-title">${t('PER_card2_title')}</div>
              <div class="inline-calc-row">
                <input type="number" id="per2-x" class="form-input form-input-sm" placeholder="0" step="any" inputmode="decimal" />
                <span>${t('PER_is_what_pct_of')}</span>
                <input type="number" id="per2-y" class="form-input form-input-sm" placeholder="0" step="any" inputmode="decimal" />
              </div>
              <div class="result-row mt-8">
                <span class="result-label">${t('PER_percentage')}</span>
                <span id="per2-res" class="result-value-highlight">0%</span>
              </div>
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <!-- Section 3: Percentage Change -->
            <div class="input-card">
              <div class="card-title">${t('PER_card3_title')}</div>
              <div class="inline-calc-row">
                <span>${t('PER_from')}</span>
                <input type="number" id="per3-x" class="form-input form-input-sm" placeholder="0" step="any" inputmode="decimal" />
                <span>${t('PER_to')}</span>
                <input type="number" id="per3-y" class="form-input form-input-sm" placeholder="0" step="any" inputmode="decimal" />
              </div>
              <div class="result-row mt-8">
                <span class="result-label">${t('PER_change')}</span>
                <span id="per3-res" class="result-value-highlight">0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Sec 1
    const p1x = container.querySelector('#per1-x') as HTMLInputElement;
    const p1y = container.querySelector('#per1-y') as HTMLInputElement;
    const p1res = container.querySelector('#per1-res') as HTMLElement;

    function rec1() {
      const res = calculatePercentOf(p1x.value, p1y.value);
      p1res.textContent = formatNumber(res);
    }
    p1x?.addEventListener('input', rec1);
    p1y?.addEventListener('input', rec1);

    // Sec 2
    const p2x = container.querySelector('#per2-x') as HTMLInputElement;
    const p2y = container.querySelector('#per2-y') as HTMLInputElement;
    const p2res = container.querySelector('#per2-res') as HTMLElement;

    function rec2() {
      const res = calculatePercentRatio(p2x.value, p2y.value);
      p2res.textContent = `${formatNumber(res)}%`;
    }
    p2x?.addEventListener('input', rec2);
    p2y?.addEventListener('input', rec2);

    // Sec 3
    const p3x = container.querySelector('#per3-x') as HTMLInputElement;
    const p3y = container.querySelector('#per3-y') as HTMLInputElement;
    const p3res = container.querySelector('#per3-res') as HTMLElement;

    function rec3() {
      const res = calculatePercentChange(p3x.value, p3y.value);
      p3res.textContent = `${res.isIncrease ? '▲ +' : '▼ -'}${res.changePct}%`;
      p3res.className = res.isIncrease ? 'result-value-success' : 'result-value-danger';
    }
    p3x?.addEventListener('input', rec3);
    p3y?.addEventListener('input', rec3);
  }
};
