import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { formatNumber, formatLabelNumber } from '../core/math.ts';
import { shareText } from '../core/share.ts';

export type TaxMode = 'EXCLUDE' | 'INCLUDE';

export interface TaxCalculation {
  netAmount: string;
  taxAmount: string;
  grossAmount: string;
  cgstAmount?: string;
  sgstAmount?: string;
  igstAmount?: string;
}

export function calculateTax(
  amount: string | number,
  taxRatePercent: string | number,
  mode: TaxMode,
  isInterState: boolean = false
): TaxCalculation {
  try {
    const val = new Decimal(amount || 0);
    const rate = new Decimal(taxRatePercent || 0);

    let net: Decimal;
    let tax: Decimal;
    let gross: Decimal;

    if (mode === 'EXCLUDE') {
      tax = val.times(rate.dividedBy(100));
      gross = val.plus(tax);
      net = val;
    } else {
      net = val.dividedBy(new Decimal(1).plus(rate.dividedBy(100)));
      tax = val.minus(net);
      gross = val;
    }

    const halfTax = tax.dividedBy(2);

    return {
      netAmount: net.toFixed(2),
      taxAmount: tax.toFixed(2),
      grossAmount: gross.toFixed(2),
      cgstAmount: isInterState ? '0.00' : halfTax.toFixed(2),
      sgstAmount: isInterState ? '0.00' : halfTax.toFixed(2),
      igstAmount: isInterState ? tax.toFixed(2) : '0.00'
    };
  } catch {
    return {
      netAmount: '0.00',
      taxAmount: '0.00',
      grossAmount: '0.00',
      cgstAmount: '0.00',
      sgstAmount: '0.00',
      igstAmount: '0.00'
    };
  }
}

export const TaxModule: CalculatorModule = {
  id: 'TAX',
  name: 'GST Calculator (India)',
  icon: '🧾',
  render(container: HTMLElement) {
    let currentMode: TaxMode = 'EXCLUDE';
    let isInterState = false;

    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="segmented-control">
              <button id="btn-mode-exclude" class="seg-btn active">Add GST (Exclusive)</button>
              <button id="btn-mode-include" class="seg-btn">Remove GST (Inclusive)</button>
            </div>

            <div class="segmented-control">
              <button id="btn-gst-intra" class="seg-btn active">Intra-State (CGST + SGST)</button>
              <button id="btn-gst-inter" class="seg-btn">Inter-State (IGST)</button>
            </div>

            <div class="input-card">
              <label id="tax-amount-label" class="input-label">Net Amount (₹ Before GST)</label>
              <div class="input-row">
                <input type="number" id="tax-amount" class="form-input" placeholder="0.00" step="any" inputmode="decimal" />
              </div>

              <label class="input-label">GST Slab Rate (%)</label>
              <div class="tip-preset-row">
                <button class="btn-preset" data-rate="0">0%</button>
                <button class="btn-preset" data-rate="5">5%</button>
                <button class="btn-preset" data-rate="12">12%</button>
                <button class="btn-preset active" data-rate="18">18%</button>
                <button class="btn-preset" data-rate="28">28%</button>
              </div>
              <div class="input-row" style="margin-top: 8px;">
                <input type="number" id="tax-rate" class="form-input" value="18" placeholder="18" step="any" inputmode="decimal" />
              </div>
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">Net Amount</span>
                <span id="tax-res-net" class="result-value">₹ 0.00</span>
              </div>
              <div id="row-cgst" class="result-row">
                <span id="label-cgst" class="result-label">CGST (9%)</span>
                <span id="tax-res-cgst" class="result-value-success">₹ 0.00</span>
              </div>
              <div id="row-sgst" class="result-row">
                <span id="label-sgst" class="result-label">SGST (9%)</span>
                <span id="tax-res-sgst" class="result-value-success">₹ 0.00</span>
              </div>
              <div id="row-igst" class="result-row" style="display: none;">
                <span id="label-igst" class="result-label">IGST (18%)</span>
                <span id="tax-res-igst" class="result-value-success">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total GST Amount</span>
                <span id="tax-res-tax" class="result-value-success" style="font-weight: 700;">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total Amount (Gross)</span>
                <span id="tax-res-gross" class="result-value-highlight">₹ 0.00</span>
              </div>

              <div style="margin-top: 14px;">
                <button id="btn-share-gst" class="seg-btn active" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;">
                  <span>💬 Share Quotation on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const amountInput = container.querySelector('#tax-amount') as HTMLInputElement;
    const rateInput = container.querySelector('#tax-rate') as HTMLInputElement;
    const amountLabel = container.querySelector('#tax-amount-label') as HTMLElement;

    const resNet = container.querySelector('#tax-res-net') as HTMLElement;
    const resCgst = container.querySelector('#tax-res-cgst') as HTMLElement;
    const resSgst = container.querySelector('#tax-res-sgst') as HTMLElement;
    const resIgst = container.querySelector('#tax-res-igst') as HTMLElement;
    const resTax = container.querySelector('#tax-res-tax') as HTMLElement;
    const resGross = container.querySelector('#tax-res-gross') as HTMLElement;
    const btnShare = container.querySelector('#btn-share-gst') as HTMLButtonElement;

    let lastRes: TaxCalculation | null = null;

    const rowCgst = container.querySelector('#row-cgst') as HTMLElement;
    const rowSgst = container.querySelector('#row-sgst') as HTMLElement;
    const rowIgst = container.querySelector('#row-igst') as HTMLElement;
    const labelCgst = container.querySelector('#label-cgst') as HTMLElement;
    const labelSgst = container.querySelector('#label-sgst') as HTMLElement;
    const labelIgst = container.querySelector('#label-igst') as HTMLElement;

    const btnExclude = container.querySelector('#btn-mode-exclude') as HTMLButtonElement;
    const btnInclude = container.querySelector('#btn-mode-include') as HTMLButtonElement;
    const btnIntra = container.querySelector('#btn-gst-intra') as HTMLButtonElement;
    const btnInter = container.querySelector('#btn-gst-inter') as HTMLButtonElement;

    function recalculate() {
      const rateVal = parseFloat(rateInput.value) || 0;
      const halfRate = (rateVal / 2).toFixed(1).replace(/\.0$/, '');

      if (labelCgst) labelCgst.textContent = `CGST (${halfRate}%)`;
      if (labelSgst) labelSgst.textContent = `SGST (${halfRate}%)`;
      if (labelIgst) labelIgst.textContent = `IGST (${rateVal}%)`;

      if (isInterState) {
        if (rowCgst) rowCgst.style.display = 'none';
        if (rowSgst) rowSgst.style.display = 'none';
        if (rowIgst) rowIgst.style.display = 'flex';
      } else {
        if (rowCgst) rowCgst.style.display = 'flex';
        if (rowSgst) rowSgst.style.display = 'flex';
        if (rowIgst) rowIgst.style.display = 'none';
      }

      const res = calculateTax(amountInput.value, rateInput.value, currentMode, isInterState);
      lastRes = res;
      if (resNet) resNet.textContent = `₹ ${formatNumber(res.netAmount)}`;
      if (resCgst) resCgst.textContent = `₹ ${formatNumber(res.cgstAmount || '0.00')}`;
      if (resSgst) resSgst.textContent = `₹ ${formatNumber(res.sgstAmount || '0.00')}`;
      if (resIgst) resIgst.textContent = `₹ ${formatNumber(res.igstAmount || '0.00')}`;
      if (resTax) resTax.textContent = `₹ ${formatNumber(res.taxAmount)}`;
      if (resGross) resGross.textContent = `₹ ${formatNumber(res.grossAmount)}`;
    }

    btnShare.addEventListener('click', () => {
      if (!lastRes) return;
      const rateVal = rateInput.value || '18';
      const breakdownText = isInterState
        ? `IGST (${rateVal}%): ₹${formatNumber(lastRes.igstAmount || '0.00')}`
        : `CGST: ₹${formatNumber(lastRes.cgstAmount || '0.00')} | SGST: ₹${formatNumber(lastRes.sgstAmount || '0.00')}`;

      const text = `🧾 *GST Quotation (${isInterState ? 'Inter-State' : 'Intra-State'})*
Net Amount: ₹${formatLabelNumber(lastRes.netAmount)}
GST Rate: ${rateVal}%
${breakdownText}
Total GST: ₹${formatNumber(lastRes.taxAmount)}
*Total Amount Payable: ₹${formatNumber(lastRes.grossAmount)}*

Calculated via EveryCalc`;
      shareText(text, 'GST Quotation');
    });

    btnExclude.addEventListener('click', () => {
      currentMode = 'EXCLUDE';
      btnExclude.classList.add('active');
      btnInclude.classList.remove('active');
      amountLabel.textContent = 'Net Amount (₹ Before GST)';
      recalculate();
    });

    btnInclude.addEventListener('click', () => {
      currentMode = 'INCLUDE';
      btnInclude.classList.add('active');
      btnExclude.classList.remove('active');
      amountLabel.textContent = 'Total Amount (₹ After GST)';
      recalculate();
    });

    btnIntra.addEventListener('click', () => {
      isInterState = false;
      btnIntra.classList.add('active');
      btnInter.classList.remove('active');
      recalculate();
    });

    btnInter.addEventListener('click', () => {
      isInterState = true;
      btnInter.classList.add('active');
      btnIntra.classList.remove('active');
      recalculate();
    });

    function syncRatePresets(val: string) {
      container.querySelectorAll('.btn-preset').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-rate') === val);
      });
    }

    container.querySelectorAll('.btn-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rate = btn.getAttribute('data-rate');
        if (rate) {
          rateInput.value = rate;
          syncRatePresets(rate);
          recalculate();
        }
      });
    });

    amountInput.addEventListener('input', recalculate);
    rateInput.addEventListener('input', () => {
      syncRatePresets(rateInput.value);
      recalculate();
    });
  }
};
