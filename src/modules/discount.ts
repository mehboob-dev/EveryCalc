import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { formatNumber } from '../core/math.ts';
import { t } from '../core/i18n.ts';

export interface DiscountCalculation {
  discountedPrice: string;
  finalPrice: string;
  totalSavings: string;
  taxAmount: string;
}

export function calculateDiscount(
  originalPrice: string | number,
  discountPercent: string | number,
  additionalDiscount: string | number = 0,
  taxPercent: string | number = 0
): DiscountCalculation {
  try {
    const p = new Decimal(originalPrice || 0);
    const d1 = new Decimal(discountPercent || 0);
    const d2 = new Decimal(additionalDiscount || 0);
    const t = new Decimal(taxPercent || 0);

    const priceAfterD1 = p.times(new Decimal(1).minus(d1.dividedBy(100)));
    const priceAfterD2 = priceAfterD1.times(new Decimal(1).minus(d2.dividedBy(100)));
    const tax = priceAfterD2.times(t.dividedBy(100));
    const finalPrice = priceAfterD2.plus(tax);
    const savings = p.minus(priceAfterD2);

    return {
      discountedPrice: priceAfterD2.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      totalSavings: savings.toFixed(2),
      taxAmount: tax.toFixed(2)
    };
  } catch {
    return {
      discountedPrice: '0.00',
      finalPrice: '0.00',
      totalSavings: '0.00',
      taxAmount: '0.00'
    };
  }
}

export const DiscountModule: CalculatorModule = {
  id: 'DCT',
  name: 'Discount Calculator',
  icon: '🏷️',
  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="input-card">
              <label class="input-label">${t('originalPrice')}</label>
              <div class="input-row">
                <input type="number" id="dct-price" class="form-input" placeholder="0.00" step="any" inputmode="decimal" />
              </div>

              <label class="input-label">${t('discount')}</label>
              <div class="input-row">
                <input type="number" id="dct-discount" class="form-input" placeholder="0" step="any" inputmode="decimal" />
              </div>

              <label class="input-label">${t('additionalDiscount')}</label>
              <div class="input-row">
                <input type="number" id="dct-add-discount" class="form-input" placeholder="0" step="any" inputmode="decimal" />
              </div>

              <label class="input-label">${t('salesTax')}</label>
              <div class="input-row">
                <input type="number" id="dct-tax" class="form-input" placeholder="0" step="any" inputmode="decimal" />
              </div>
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">${t('finalPrice')}</span>
                <span id="dct-res-final" class="result-value-highlight">0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">${t('totalSavings')}</span>
                <span id="dct-res-savings" class="result-value-success">0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">${t('taxAmount')}</span>
                <span id="dct-res-tax" class="result-value">0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const priceInput = container.querySelector('#dct-price') as HTMLInputElement;
    const discountInput = container.querySelector('#dct-discount') as HTMLInputElement;
    const addDiscountInput = container.querySelector('#dct-add-discount') as HTMLInputElement;
    const taxInput = container.querySelector('#dct-tax') as HTMLInputElement;

    const resFinal = container.querySelector('#dct-res-final') as HTMLElement;
    const resSavings = container.querySelector('#dct-res-savings') as HTMLElement;
    const resTax = container.querySelector('#dct-res-tax') as HTMLElement;

    function recalculate() {
      const res = calculateDiscount(
        priceInput.value,
        discountInput.value,
        addDiscountInput.value,
        taxInput.value
      );
      if (resFinal) resFinal.textContent = formatNumber(res.finalPrice);
      if (resSavings) resSavings.textContent = formatNumber(res.totalSavings);
      if (resTax) resTax.textContent = formatNumber(res.taxAmount);
    }

    [priceInput, discountInput, addDiscountInput, taxInput].forEach((inp) => {
      inp?.addEventListener('input', recalculate);
    });
  }
};
