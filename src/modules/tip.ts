import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { formatNumber, attachCommaFormatter } from '../core/math.ts';

export interface TipCalculation {
  tipAmount: string;
  totalPayable: string;
  tipPerPerson: string;
  totalPerPerson: string;
}

export function calculateTip(
  billAmount: string | number,
  tipPercent: string | number,
  peopleCount: string | number = 1
): TipCalculation {
  try {
    const bill = new Decimal(billAmount !== undefined && billAmount !== null ? billAmount.toString().replace(/,/g, '') : 0);
    const tipPct = new Decimal(tipPercent || 0);
    let people = new Decimal(peopleCount || 1);
    if (people.lessThanOrEqualTo(0)) people = new Decimal(1);

    const tip = bill.times(tipPct.dividedBy(100));
    const total = bill.plus(tip);
    const tipEach = tip.dividedBy(people);
    const totalEach = total.dividedBy(people);

    return {
      tipAmount: tip.toFixed(2),
      totalPayable: total.toFixed(2),
      tipPerPerson: tipEach.toFixed(2),
      totalPerPerson: totalEach.toFixed(2)
    };
  } catch {
    return {
      tipAmount: '0.00',
      totalPayable: '0.00',
      tipPerPerson: '0.00',
      totalPerPerson: '0.00'
    };
  }
}

export const TipModule: CalculatorModule = {
  id: 'TIP',
  name: 'Tip Calculator',
  icon: '🍽️',
  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="input-card">
              <label class="input-label">Bill Amount</label>
              <div class="input-row">
                <input type="text" id="tip-bill" class="form-input" placeholder="0.00" inputmode="decimal" />
              </div>

              <label class="input-label">Tip Percentage (%)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-pct="10">10%</button>
                <button class="btn-preset active" data-pct="15">15%</button>
                <button class="btn-preset" data-pct="18">18%</button>
                <button class="btn-preset" data-pct="20">20%</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="number" id="tip-percent" class="form-input" value="15" placeholder="15" step="any" inputmode="decimal" />
              </div>

              <label class="input-label">Number of People</label>
              <div class="stepper-row">
                <button id="tip-dec-people" class="btn-stepper">−</button>
                <input type="number" id="tip-people" class="form-input text-center" value="1" min="1" step="1" inputmode="numeric" />
                <button id="tip-inc-people" class="btn-stepper">+</button>
              </div>
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">Tip Amount</span>
                <span id="tip-res-tip" class="result-value">0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total Payable</span>
                <span id="tip-res-total" class="result-value-highlight">0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Tip Per Person</span>
                <span id="tip-res-tip-person" class="result-value">0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total Per Person</span>
                <span id="tip-res-total-person" class="result-value-highlight">0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const billInput = container.querySelector('#tip-bill') as HTMLInputElement;
    const percentInput = container.querySelector('#tip-percent') as HTMLInputElement;
    const peopleInput = container.querySelector('#tip-people') as HTMLInputElement;

    const resTip = container.querySelector('#tip-res-tip') as HTMLElement;
    const resTotal = container.querySelector('#tip-res-total') as HTMLElement;
    const resTipPerson = container.querySelector('#tip-res-tip-person') as HTMLElement;
    const resTotalPerson = container.querySelector('#tip-res-total-person') as HTMLElement;

    function recalculate() {
      const res = calculateTip(billInput.value, percentInput.value, peopleInput.value);
      if (resTip) resTip.textContent = formatNumber(res.tipAmount);
      if (resTotal) resTotal.textContent = formatNumber(res.totalPayable);
      if (resTipPerson) resTipPerson.textContent = formatNumber(res.tipPerPerson);
      if (resTotalPerson) resTotalPerson.textContent = formatNumber(res.totalPerPerson);
    }

    function syncTipPresets(val: string) {
      container.querySelectorAll('.btn-preset').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-pct') === val);
      });
    }

    // Presets
    container.querySelectorAll('.btn-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pct = btn.getAttribute('data-pct');
        if (pct) {
          percentInput.value = pct;
          syncTipPresets(pct);
          recalculate();
        }
      });
    });

    // Stepper
    container.querySelector('#tip-dec-people')?.addEventListener('click', () => {
      const cur = parseInt(peopleInput.value, 10) || 1;
      if (cur > 1) {
        peopleInput.value = String(cur - 1);
        recalculate();
      }
    });

    container.querySelector('#tip-inc-people')?.addEventListener('click', () => {
      const cur = parseInt(peopleInput.value, 10) || 1;
      peopleInput.value = String(cur + 1);
      recalculate();
    });

    attachCommaFormatter(billInput, () => recalculate());
    percentInput.addEventListener('input', () => {
      syncTipPresets(percentInput.value);
      recalculate();
    });
    peopleInput.addEventListener('input', recalculate);
  }
};
