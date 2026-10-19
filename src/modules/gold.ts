import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { formatNumber, formatLabelNumber } from '../core/math.ts';
import { shareText } from '../core/share.ts';

export type GoldPurity =
  | '24K'
  | '23K'
  | '22K'
  | '21K'
  | '20K'
  | '18K'
  | '16K'
  | '14K'
  | '12K'
  | '10K'
  | '9K'
  | string;

export type WeightUnit = 'g' | 'tola' | 'pavan';
export type MakingChargeType = 'PERCENT' | 'FLAT_PER_G' | 'FLAT_TOTAL';
export type RateUnit = 'PER_G' | 'PER_10G';

export interface PurityDef {
  id: string;
  karat: number;
  name: string;
  purityFraction: Decimal;
  purityPct: string;
  description: string;
}

export const GOLD_PURITIES: PurityDef[] = [
  {
    id: '24K',
    karat: 24,
    name: '24K (Pure Gold)',
    purityFraction: new Decimal(1),
    purityPct: '99.9%',
    description: 'Pure Gold / Bullion / Sovereign Coins'
  },
  {
    id: '23K',
    karat: 23,
    name: '23K Gold',
    purityFraction: new Decimal(23).dividedBy(24),
    purityPct: '95.8%',
    description: 'Traditional Fine Jewelry'
  },
  {
    id: '22K',
    karat: 22,
    name: '22K Gold',
    purityFraction: new Decimal(22).dividedBy(24),
    purityPct: '91.6%',
    description: 'Standard Jewelry (India, Asia)'
  },
  {
    id: '21K',
    karat: 21,
    name: '21K Gold',
    purityFraction: new Decimal(21).dividedBy(24),
    purityPct: '87.5%',
    description: 'Arabian Gulf & Mediterranean Jewelry'
  },
  {
    id: '20K',
    karat: 20,
    name: '20K Gold',
    purityFraction: new Decimal(20).dividedBy(24),
    purityPct: '83.3%',
    description: 'Antique & Vintage Jewelry'
  },
  {
    id: '18K',
    karat: 18,
    name: '18K Gold',
    purityFraction: new Decimal(18).dividedBy(24),
    purityPct: '75.0%',
    description: 'Diamond Jewelry, Watches & White Gold'
  },
  {
    id: '16K',
    karat: 16,
    name: '16K Gold',
    purityFraction: new Decimal(16).dividedBy(24),
    purityPct: '66.7%',
    description: 'Vintage & Dental Gold'
  },
  {
    id: '14K',
    karat: 14,
    name: '14K Gold',
    purityFraction: new Decimal(14).dividedBy(24),
    purityPct: '58.5%',
    description: 'Standard Jewelry in North America / USA'
  },
  {
    id: '12K',
    karat: 12,
    name: '12K Gold',
    purityFraction: new Decimal(12).dividedBy(24),
    purityPct: '50.0%',
    description: 'Antique Jewelry & Decorative Alloys'
  },
  {
    id: '10K',
    karat: 10,
    name: '10K Gold',
    purityFraction: new Decimal(10).dividedBy(24),
    purityPct: '41.7%',
    description: 'Minimum Legal Karat in USA'
  },
  {
    id: '9K',
    karat: 9,
    name: '9K Gold',
    purityFraction: new Decimal(9).dividedBy(24),
    purityPct: '37.5%',
    description: 'Popular in UK & Australia'
  }
];

export function getPurityDef(purityIdOrVal: string): PurityDef {
  const norm = (purityIdOrVal || '22K').trim().toUpperCase();
  const found = GOLD_PURITIES.find(
    (p) => p.id === norm || `${p.karat}K` === norm
  );
  if (found) return found;

  // Custom Karat (e.g. '21.6K' or '21.6')
  const karatMatch = norm.match(/^(\d+(?:\.\d+)?)K?$/);
  if (karatMatch) {
    const k = parseFloat(karatMatch[1]);
    if (k > 0 && k <= 24) {
      const frac = new Decimal(k).dividedBy(24);
      return {
        id: `${k}K`,
        karat: k,
        name: `${k}K Gold`,
        purityFraction: frac,
        purityPct: `${frac.times(100).toFixed(1)}%`,
        description: `Custom ${k} Karat Gold`
      };
    }
  }

  // Fallback to 22K
  return GOLD_PURITIES[2];
}

export interface GoldCalculationOptions {
  rateUnit?: RateUnit;
  includeHallmark?: boolean;
}

export interface GoldCalculationResult {
  weightInGrams: string;
  purityKarat: string;
  purityPct: string;
  goldRatePerGram: string;
  goldValue: string;
  makingChargeAmount: string;
  hallmarkAmount: string;
  subtotal: string;
  gstAmount: string;
  totalPayable: string;
}

export function calculateGoldPrice(
  weight: string | number,
  unit: WeightUnit,
  purity: GoldPurity,
  rate: string | number,
  makingChargeVal: string | number,
  makingChargeType: MakingChargeType = 'PERCENT',
  options: GoldCalculationOptions = {}
): GoldCalculationResult {
  try {
    const rawWeight = new Decimal(weight || 0);
    const rawRate = new Decimal(rate || 0);
    const chargeVal = new Decimal(makingChargeVal || 0);
    const rateUnit: RateUnit = options.rateUnit || 'PER_10G';
    const includeHallmark = options.includeHallmark ?? false;

    const purityDef = getPurityDef(purity);

    // 1. Convert weight to grams
    let grams: Decimal;
    if (unit === 'tola') {
      grams = rawWeight.times('11.6638038');
    } else if (unit === 'pavan') {
      grams = rawWeight.times('8.0');
    } else {
      grams = rawWeight;
    }

    if (grams.isZero() || rawRate.isZero()) {
      return {
        weightInGrams: grams.toFixed(3),
        purityKarat: `${purityDef.karat}K`,
        purityPct: purityDef.purityPct,
        goldRatePerGram: '0.00',
        goldValue: '0.00',
        makingChargeAmount: '0.00',
        hallmarkAmount: includeHallmark ? '53.10' : '0.00',
        subtotal: '0.00',
        gstAmount: '0.00',
        totalPayable: includeHallmark ? '53.10' : '0.00'
      };
    }

    // 2. Base rate normalized to per gram
    const ratePerGramInput = rateUnit === 'PER_10G' ? rawRate.dividedBy(10) : rawRate;

    // 3. Rate is the benchmark rate for pure gold, scaled by Karat fraction
    const effectiveGoldRatePerGram = purityDef.karat === 24
      ? ratePerGramInput
      : ratePerGramInput.times(purityDef.purityFraction);

    // 4. Pure Gold Value = Weight in grams × Effective Rate per gram
    const goldValue = grams.times(effectiveGoldRatePerGram);

    // 5. Making charges
    let makingChargeAmount: Decimal;
    if (makingChargeType === 'PERCENT') {
      makingChargeAmount = goldValue.times(chargeVal.dividedBy(100));
    } else if (makingChargeType === 'FLAT_PER_G') {
      makingChargeAmount = grams.times(chargeVal);
    } else {
      // FLAT_TOTAL
      makingChargeAmount = chargeVal;
    }

    // 6. Subtotal = Gold Value + Making Charges
    const subtotal = goldValue.plus(makingChargeAmount);

    // 7. Indian Jewelry GST = 3% on subtotal
    const gstAmount = subtotal.times('0.03');

    // 8. BIS Hallmarking fee (Optional ₹53.10 per article)
    const hallmarkFee = includeHallmark ? new Decimal('53.10') : new Decimal(0);

    const totalPayable = subtotal.plus(gstAmount).plus(hallmarkFee);

    return {
      weightInGrams: grams.toFixed(3),
      purityKarat: `${purityDef.karat}K`,
      purityPct: purityDef.purityPct,
      goldRatePerGram: effectiveGoldRatePerGram.toFixed(2),
      goldValue: goldValue.toFixed(2),
      makingChargeAmount: makingChargeAmount.toFixed(2),
      hallmarkAmount: hallmarkFee.toFixed(2),
      subtotal: subtotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      totalPayable: totalPayable.toFixed(2)
    };
  } catch {
    return {
      weightInGrams: '0.000',
      purityKarat: '22K',
      purityPct: '91.6%',
      goldRatePerGram: '0.00',
      goldValue: '0.00',
      makingChargeAmount: '0.00',
      hallmarkAmount: '0.00',
      subtotal: '0.00',
      gstAmount: '0.00',
      totalPayable: '0.00'
    };
  }
}

export const GoldModule: CalculatorModule = {
  id: 'GLD',
  name: 'Gold & Jewelry Calculator',
  icon: '🪙',
  render(container: HTMLElement) {
    let currentPurity: PurityDef = GOLD_PURITIES[2]; // 22K by default
    let unit: WeightUnit = 'g';
    let chargeType: MakingChargeType = 'PERCENT';
    let rateUnit: RateUnit = 'PER_10G';
    let includeHallmark = false;

    // Presets catalog for popular gold rates
    const RATE_PRESETS = {
      PER_G: ['7200', '7500', '7800', '8000'],
      PER_10G: ['72000', '75000', '78000', '80000']
    };

    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <!-- Inputs Pane -->
          <div class="workspace-inputs-pane">
            <div class="input-card" style="padding: clamp(16px, 3vw, 24px);">
              <!-- Section 1: Gold Karat Selection -->
              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                  <label class="input-label" style="margin: 0; font-weight: 700;">Gold Karat</label>
                  <span id="gld-purity-badge" style="font-size: 11.5px; font-weight: 700; color: var(--accent-color, #ff9f0a); background: rgba(255, 159, 10, 0.12); padding: 3px 8px; border-radius: 8px;">
                    22K • 91.6% Pure Gold
                  </span>
                </div>
                <div class="category-scroll" id="gld-purity-pills" style="margin-bottom: 8px;"></div>
                <select id="gld-select-purity" class="form-select" style="width: 100%;">
                  ${GOLD_PURITIES.map((p) => `<option value="${p.id}" ${p.id === '22K' ? 'selected' : ''}>${p.name} — ${p.description}</option>`).join('')}
                </select>
              </div>

              <!-- Section 2: Weight Input with Unit Toggles -->
              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px;">
                  <label class="input-label" style="margin: 0;">Gold Weight</label>
                  <div class="pill-toggle-group">
                    <button class="pill-toggle-btn active" id="btn-unit-g">Grams</button>
                    <button class="pill-toggle-btn" id="btn-unit-pavan">Pavan (8g)</button>
                    <button class="pill-toggle-btn" id="btn-unit-tola">Tola (11.66g)</button>
                  </div>
                </div>
                <input type="number" id="gld-weight" class="form-input" value="10" placeholder="10" step="any" inputmode="decimal" />
              </div>

              <!-- Section 3: Gold Rate (Pure Gold Benchmark Rate) -->
              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                  <label class="input-label" id="lbl-gold-rate" style="margin: 0;">Gold Rate (₹)</label>
                  <div class="pill-toggle-group">
                    <button class="pill-toggle-btn" id="btn-rate-g">₹ / Gram</button>
                    <button class="pill-toggle-btn active" id="btn-rate-10g">₹ / 10 Grams</button>
                  </div>
                </div>

                <!-- Rate Presets -->
                <div class="tip-preset-row" id="gld-rate-presets" style="margin-bottom: 8px;"></div>
                <input type="number" id="gld-rate" class="form-input" value="78000" placeholder="78000" step="any" inputmode="decimal" />
                <div id="rate-explanation" style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;"></div>
              </div>

              <!-- Section 4: Making Charges -->
              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                  <label class="input-label" style="margin: 0;">Making Charges</label>
                  <div class="pill-toggle-group">
                    <button class="pill-toggle-btn active" id="btn-mc-pct">Percent (%)</button>
                    <button class="pill-toggle-btn" id="btn-mc-flat-g">₹ / Gram</button>
                    <button class="pill-toggle-btn" id="btn-mc-flat-total">Flat ₹</button>
                  </div>
                </div>

                <div class="tip-preset-row" id="mc-presets-pct" style="margin-bottom: 8px;">
                  <button class="btn-preset" data-mc="8">8%</button>
                  <button class="btn-preset active" data-mc="10">10%</button>
                  <button class="btn-preset" data-mc="12">12%</button>
                  <button class="btn-preset" data-mc="15">15%</button>
                  <button class="btn-preset" data-mc="18">18%</button>
                </div>
                <input type="number" id="gld-mc" class="form-input" value="10" placeholder="10" step="any" inputmode="decimal" />
              </div>

              <!-- Section 5: Optional Hallmark Toggle -->
              <div>
                <button id="btn-toggle-hallmark" class="seg-btn" style="width: 100%; height: 42px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                  + BIS Hallmark Fee (₹53.10)
                </button>
              </div>
            </div>
          </div>

          <!-- Analytics & Invoice Breakdown Pane (Sticky Desktop) -->
          <div class="workspace-analytics-pane">
            <div class="result-card" style="padding: clamp(16px, 3vw, 24px);">
              <!-- Live Formula Banner -->
              <div id="gld-formula-banner" style="background: var(--bg-surface, rgba(255,255,255,0.05)); border: 1px solid rgba(255, 159, 10, 0.3); border-radius: 12px; padding: 10px 12px; margin-bottom: 12px; font-size: 11.5px; color: var(--text-secondary); line-height: 1.45;">
                <span id="gld-formula-text">10.000g @ ₹7,150.00/g = ₹71,500.00</span>
              </div>

              <div class="result-row">
                <span class="result-label">Gold Karat</span>
                <span id="gld-res-karat" class="result-value">22K • 91.6%</span>
              </div>
              <div class="result-row">
                <span class="result-label">Effective Gold Rate</span>
                <span id="gld-res-rate-g" class="result-value">₹ 0.00 / g</span>
              </div>
              <div class="result-row">
                <span class="result-label">Gold Weight</span>
                <span id="gld-res-weight" class="result-value">10.000 g</span>
              </div>
              <div class="result-row">
                <span class="result-label">Pure Gold Value</span>
                <span id="gld-res-gold-val" class="result-value">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Making Charges</span>
                <span id="gld-res-mc" class="result-value">₹ 0.00</span>
              </div>
              <div class="result-row" id="row-hallmark" style="display: none;">
                <span class="result-label">BIS Hallmark Fee (incl. GST)</span>
                <span id="gld-res-hallmark" class="result-value">₹ 53.10</span>
              </div>
              <div class="result-row">
                <span class="result-label">Subtotal (Pre-Tax)</span>
                <span id="gld-res-subtotal" class="result-value">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Jewelry GST (3%)</span>
                <span id="gld-res-gst" class="result-value-success">₹ 0.00</span>
              </div>
              <div class="result-row" style="margin-top: 6px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.18);">
                <span class="result-label" style="font-weight: 700; font-size: 14.5px;">Total Invoice Price</span>
                <span id="gld-res-total" class="result-value-highlight">₹ 0.00</span>
              </div>

              <div style="margin-top: 16px;">
                <button id="btn-share-gld" class="seg-btn active" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; padding: 12px;">
                  <span>💬 Share Detailed Quotation on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // DOM Elements
    const pillsContainer = container.querySelector('#gld-purity-pills') as HTMLElement;
    const selectPurity = container.querySelector('#gld-select-purity') as HTMLSelectElement;
    const purityBadge = container.querySelector('#gld-purity-badge') as HTMLElement;

    const inpWeight = container.querySelector('#gld-weight') as HTMLInputElement;
    const inpRate = container.querySelector('#gld-rate') as HTMLInputElement;
    const inpMc = container.querySelector('#gld-mc') as HTMLInputElement;
    const btnToggleHallmark = container.querySelector('#btn-toggle-hallmark') as HTMLButtonElement;

    const lblGoldRate = container.querySelector('#lbl-gold-rate') as HTMLElement;
    const rateExplanation = container.querySelector('#rate-explanation') as HTMLElement;
    const ratePresetsContainer = container.querySelector('#gld-rate-presets') as HTMLElement;
    const mcPresetsPct = container.querySelector('#mc-presets-pct') as HTMLElement;
    const formulaText = container.querySelector('#gld-formula-text') as HTMLElement;

    // Result Nodes
    const resKarat = container.querySelector('#gld-res-karat') as HTMLElement;
    const resRateG = container.querySelector('#gld-res-rate-g') as HTMLElement;
    const resWeight = container.querySelector('#gld-res-weight') as HTMLElement;
    const resGoldVal = container.querySelector('#gld-res-gold-val') as HTMLElement;
    const resMc = container.querySelector('#gld-res-mc') as HTMLElement;
    const resHallmark = container.querySelector('#gld-res-hallmark') as HTMLElement;
    const resSubtotal = container.querySelector('#gld-res-subtotal') as HTMLElement;
    const resGst = container.querySelector('#gld-res-gst') as HTMLElement;
    const resTotal = container.querySelector('#gld-res-total') as HTMLElement;

    const rowHallmark = container.querySelector('#row-hallmark') as HTMLElement;
    const btnShare = container.querySelector('#btn-share-gld') as HTMLButtonElement;

    // Unit Buttons
    const btnUnitG = container.querySelector('#btn-unit-g') as HTMLButtonElement;
    const btnUnitPavan = container.querySelector('#btn-unit-pavan') as HTMLButtonElement;
    const btnUnitTola = container.querySelector('#btn-unit-tola') as HTMLButtonElement;

    // Rate Buttons
    const btnRateG = container.querySelector('#btn-rate-g') as HTMLButtonElement;
    const btnRate10g = container.querySelector('#btn-rate-10g') as HTMLButtonElement;

    // Making Charge Buttons
    const btnMcPct = container.querySelector('#btn-mc-pct') as HTMLButtonElement;
    const btnMcFlatG = container.querySelector('#btn-mc-flat-g') as HTMLButtonElement;
    const btnMcFlatTotal = container.querySelector('#btn-mc-flat-total') as HTMLButtonElement;

    let lastRes: GoldCalculationResult | null = null;

    // Render Quick Access Karat Pills
    function renderPills() {
      pillsContainer.innerHTML = GOLD_PURITIES
        .map((p) => {
          const isActive = currentPurity.id === p.id;
          return `<button class="cat-pill ${isActive ? 'active' : ''}" data-purity="${p.id}">${p.id}</button>`;
        })
        .join('');

      pillsContainer.querySelectorAll('[data-purity]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const pId = btn.getAttribute('data-purity') || '22K';
          currentPurity = getPurityDef(pId);
          selectPurity.value = currentPurity.id;
          renderPills();
          syncRateUI();
          rec();
        });
      });
    }

    function updateRatePresets() {
      const presets = RATE_PRESETS[rateUnit];
      ratePresetsContainer.innerHTML = presets
        .map((val) => `<button class="btn-preset ${inpRate.value === val ? 'active' : ''}" data-gld-rate="${val}">₹${formatLabelNumber(val)}</button>`)
        .join('');

      ratePresetsContainer.querySelectorAll('[data-gld-rate]').forEach((b) => {
        b.addEventListener('click', () => {
          inpRate.value = b.getAttribute('data-gld-rate') || presets[2];
          updateRatePresets();
          rec();
        });
      });
    }

    function syncRateUI() {
      purityBadge.textContent = `${currentPurity.karat}K • ${currentPurity.purityPct} Pure`;
      lblGoldRate.textContent = `Gold Rate (${rateUnit === 'PER_G' ? '₹ / Gram' : '₹ / 10g'})`;

      if (currentPurity.karat === 24) {
        rateExplanation.textContent = 'Standard market rate for 24 Karat pure gold bullion.';
      } else {
        rateExplanation.textContent = `Derives ${currentPurity.id} rate automatically using ${currentPurity.karat}/24 (${currentPurity.purityPct}) purity.`;
      }
      updateRatePresets();
    }

    function rec() {
      const res = calculateGoldPrice(
        inpWeight.value,
        unit,
        currentPurity.id,
        inpRate.value,
        inpMc.value,
        chargeType,
        {
          rateUnit,
          includeHallmark
        }
      );
      lastRes = res;

      resKarat.textContent = `${res.purityKarat} • ${res.purityPct}`;
      resRateG.textContent = `₹ ${formatLabelNumber(res.goldRatePerGram)} / g`;
      resWeight.textContent = `${res.weightInGrams} g`;
      resGoldVal.textContent = `₹ ${formatNumber(res.goldValue)}`;
      resMc.textContent = `₹ ${formatNumber(res.makingChargeAmount)}`;
      resSubtotal.textContent = `₹ ${formatNumber(res.subtotal)}`;
      resGst.textContent = `₹ ${formatNumber(res.gstAmount)}`;
      resTotal.textContent = `₹ ${formatNumber(res.totalPayable)}`;

      // Hallmark visibility
      if (includeHallmark) {
        rowHallmark.style.display = 'flex';
        resHallmark.textContent = `₹ ${res.hallmarkAmount}`;
      } else {
        rowHallmark.style.display = 'none';
      }

      // Live formula text
      formulaText.textContent = `${res.weightInGrams}g @ ₹${formatLabelNumber(res.goldRatePerGram)}/g = ₹${formatNumber(res.goldValue)} + Making ₹${formatNumber(res.makingChargeAmount)} + 3% GST (₹${formatNumber(res.gstAmount)}) = ₹${formatNumber(res.totalPayable)}`;
    }

    // Select dropdown listener
    selectPurity.addEventListener('change', () => {
      currentPurity = getPurityDef(selectPurity.value);
      renderPills();
      syncRateUI();
      rec();
    });

    // Unit event listeners
    btnUnitG.addEventListener('click', () => {
      unit = 'g';
      btnUnitG.classList.add('active');
      btnUnitPavan.classList.remove('active');
      btnUnitTola.classList.remove('active');
      rec();
    });

    btnUnitPavan.addEventListener('click', () => {
      unit = 'pavan';
      btnUnitPavan.classList.add('active');
      btnUnitG.classList.remove('active');
      btnUnitTola.classList.remove('active');
      rec();
    });

    btnUnitTola.addEventListener('click', () => {
      unit = 'tola';
      btnUnitTola.classList.add('active');
      btnUnitG.classList.remove('active');
      btnUnitPavan.classList.remove('active');
      rec();
    });

    // Rate Unit listeners
    btnRateG.addEventListener('click', () => {
      rateUnit = 'PER_G';
      btnRateG.classList.add('active');
      btnRate10g.classList.remove('active');
      inpRate.value = '7800';
      syncRateUI();
      rec();
    });

    btnRate10g.addEventListener('click', () => {
      rateUnit = 'PER_10G';
      btnRate10g.classList.add('active');
      btnRateG.classList.remove('active');
      inpRate.value = '78000';
      syncRateUI();
      rec();
    });

    // Making charge handlers
    btnMcPct.addEventListener('click', () => {
      chargeType = 'PERCENT';
      btnMcPct.classList.add('active');
      btnMcFlatG.classList.remove('active');
      btnMcFlatTotal.classList.remove('active');
      mcPresetsPct.style.display = 'flex';
      inpMc.value = '10';
      rec();
    });

    btnMcFlatG.addEventListener('click', () => {
      chargeType = 'FLAT_PER_G';
      btnMcFlatG.classList.add('active');
      btnMcPct.classList.remove('active');
      btnMcFlatTotal.classList.remove('active');
      mcPresetsPct.style.display = 'none';
      inpMc.value = '500';
      rec();
    });

    btnMcFlatTotal.addEventListener('click', () => {
      chargeType = 'FLAT_TOTAL';
      btnMcFlatTotal.classList.add('active');
      btnMcPct.classList.remove('active');
      btnMcFlatG.classList.remove('active');
      mcPresetsPct.style.display = 'none';
      inpMc.value = '2000';
      rec();
    });

    container.querySelectorAll('[data-mc]').forEach((b) => {
      b.addEventListener('click', () => {
        container.querySelectorAll('[data-mc]').forEach((el) => el.classList.remove('active'));
        b.classList.add('active');
        inpMc.value = b.getAttribute('data-mc') || '10';
        rec();
      });
    });

    // Hallmark toggle
    btnToggleHallmark.addEventListener('click', () => {
      includeHallmark = !includeHallmark;
      btnToggleHallmark.classList.toggle('active', includeHallmark);
      btnToggleHallmark.textContent = includeHallmark ? '✓ BIS Hallmark Fee (₹53.10 Included)' : '+ BIS Hallmark Fee (₹53.10)';
      rec();
    });

    // WhatsApp Share button
    btnShare.addEventListener('click', () => {
      if (!lastRes) return;
      const text = `🪙 *Gold Jewelry Price Quotation*
Purity: ${lastRes.purityKarat} (${lastRes.purityPct} Pure)
Weight: ${inpWeight.value} ${unit.toUpperCase()} (${lastRes.weightInGrams}g)
Effective Rate: ₹${formatLabelNumber(lastRes.goldRatePerGram)}/g
---
Gold Value: ₹${formatNumber(lastRes.goldValue)}
Making Charges: ₹${formatNumber(lastRes.makingChargeAmount)}
${includeHallmark ? `BIS Hallmark Fee: ₹${lastRes.hallmarkAmount}\n` : ''}Subtotal: ₹${formatNumber(lastRes.subtotal)}
Jewelry GST (3%): ₹${formatNumber(lastRes.gstAmount)}
*Total Invoice Price: ₹${formatNumber(lastRes.totalPayable)}*

Calculated via EveryCalc`;
      shareText(text, 'Gold Jewelry Estimate');
    });

    // Inputs
    inpWeight.addEventListener('input', rec);
    inpRate.addEventListener('input', () => {
      ratePresetsContainer.querySelectorAll('[data-gld-rate]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-gld-rate') === inpRate.value);
      });
      rec();
    });
    inpMc.addEventListener('input', () => {
      container.querySelectorAll('[data-mc]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-mc') === inpMc.value);
      });
      rec();
    });

    // Initial setup
    renderPills();
    syncRateUI();
    rec();
  }
};
