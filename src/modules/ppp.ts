import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { formatLabelNumber } from '../core/math.ts';
import { shareText } from '../core/share.ts';

export interface PppCountry {
  id: string;
  name: string;
  currency: string;
  symbol: string;
  flag: string;
  // World Bank & IMF PPP conversion factor relative to USD (1.00)
  pppFactor: number;
  // Nominal exchange rate per 1 USD
  nominalRate: number;
  // Cost of living sub-indices relative to US = 100
  rentIndex: number;
  groceryIndex: number;
  defaultSalary: number;
  presets: { label: string; value: number }[];
}

export const PPP_COUNTRIES: PppCountry[] = [
  {
    id: 'USA',
    name: 'United States',
    currency: 'USD',
    symbol: '$',
    flag: '🇺🇸',
    pppFactor: 1.0,
    nominalRate: 1.0,
    rentIndex: 100,
    groceryIndex: 100,
    defaultSalary: 100000,
    presets: [
      { label: '$50k', value: 50000 },
      { label: '$80k', value: 80000 },
      { label: '$100k', value: 100000 },
      { label: '$150k', value: 150000 },
      { label: '$200k', value: 200000 }
    ]
  },
  {
    id: 'IND',
    name: 'India',
    currency: 'INR',
    symbol: '₹',
    flag: '🇮🇳',
    pppFactor: 24.5,
    nominalRate: 84.1,
    rentIndex: 14.5,
    groceryIndex: 28.2,
    defaultSalary: 2500000,
    presets: [
      { label: '₹12 L', value: 1200000 },
      { label: '₹25 L', value: 2500000 },
      { label: '₹50 L', value: 5000000 },
      { label: '₹75 L', value: 7500000 },
      { label: '₹1 Cr', value: 10000000 }
    ]
  },
  {
    id: 'ARE',
    name: 'United Arab Emirates (Dubai)',
    currency: 'AED',
    symbol: 'AED',
    flag: '🇦🇪',
    pppFactor: 2.15,
    nominalRate: 3.67,
    rentIndex: 82.0,
    groceryIndex: 64.5,
    defaultSalary: 300000,
    presets: [
      { label: '180k (15k/m)', value: 180000 },
      { label: '300k (25k/m)', value: 300000 },
      { label: '420k (35k/m)', value: 420000 },
      { label: '600k (50k/m)', value: 600000 }
    ]
  },
  {
    id: 'GBR',
    name: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    flag: '🇬🇧',
    pppFactor: 0.72,
    nominalRate: 0.79,
    rentIndex: 68.5,
    groceryIndex: 72.0,
    defaultSalary: 70000,
    presets: [
      { label: '£40k', value: 40000 },
      { label: '£60k', value: 60000 },
      { label: '£80k', value: 80000 },
      { label: '£120k', value: 120000 }
    ]
  },
  {
    id: 'DEU',
    name: 'Germany / Eurozone',
    currency: 'EUR',
    symbol: '€',
    flag: '🇩🇪',
    pppFactor: 0.76,
    nominalRate: 0.92,
    rentIndex: 62.0,
    groceryIndex: 74.0,
    defaultSalary: 75000,
    presets: [
      { label: '€45k', value: 45000 },
      { label: '€65k', value: 65000 },
      { label: '€85k', value: 85000 },
      { label: '€120k', value: 120000 }
    ]
  },
  {
    id: 'CAN',
    name: 'Canada',
    currency: 'CAD',
    symbol: 'C$',
    flag: '🇨🇦',
    pppFactor: 1.25,
    nominalRate: 1.38,
    rentIndex: 74.0,
    groceryIndex: 86.0,
    defaultSalary: 110000,
    presets: [
      { label: 'C$60k', value: 60000 },
      { label: 'C$90k', value: 90000 },
      { label: 'C$120k', value: 120000 },
      { label: 'C$160k', value: 160000 }
    ]
  },
  {
    id: 'AUS',
    name: 'Australia',
    currency: 'AUD',
    symbol: 'A$',
    flag: '🇦🇺',
    pppFactor: 1.42,
    nominalRate: 1.52,
    rentIndex: 76.5,
    groceryIndex: 88.0,
    defaultSalary: 130000,
    presets: [
      { label: 'A$70k', value: 70000 },
      { label: 'A$100k', value: 100000 },
      { label: 'A$140k', value: 140000 },
      { label: 'A$180k', value: 180000 }
    ]
  },
  {
    id: 'SGP',
    name: 'Singapore',
    currency: 'SGD',
    symbol: 'S$',
    flag: '🇸🇬',
    pppFactor: 1.15,
    nominalRate: 1.35,
    rentIndex: 135.0,
    groceryIndex: 85.0,
    defaultSalary: 120000,
    presets: [
      { label: 'S$60k', value: 60000 },
      { label: 'S$100k', value: 100000 },
      { label: 'S$140k', value: 140000 },
      { label: 'S$200k', value: 200000 }
    ]
  },
  {
    id: 'SAU',
    name: 'Saudi Arabia',
    currency: 'SAR',
    symbol: 'SAR',
    flag: '🇸🇦',
    pppFactor: 1.85,
    nominalRate: 3.75,
    rentIndex: 38.0,
    groceryIndex: 52.0,
    defaultSalary: 240000,
    presets: [
      { label: '120k (10k/m)', value: 120000 },
      { label: '240k (20k/m)', value: 240000 },
      { label: '360k (30k/m)', value: 360000 }
    ]
  },
  {
    id: 'QAT',
    name: 'Qatar',
    currency: 'QAR',
    symbol: 'QR',
    flag: '🇶🇦',
    pppFactor: 2.1,
    nominalRate: 3.64,
    rentIndex: 65.0,
    groceryIndex: 58.0,
    defaultSalary: 260000,
    presets: [
      { label: '150k (12.5k/m)', value: 150000 },
      { label: '260k (21.6k/m)', value: 260000 },
      { label: '380k (31.6k/m)', value: 380000 }
    ]
  },
  {
    id: 'KWT',
    name: 'Kuwait',
    currency: 'KWD',
    symbol: 'KD',
    flag: '🇰🇼',
    pppFactor: 0.18,
    nominalRate: 0.31,
    rentIndex: 45.0,
    groceryIndex: 48.0,
    defaultSalary: 24000,
    presets: [
      { label: '15k (1.25k/m)', value: 15000 },
      { label: '25k (2.08k/m)', value: 25000 },
      { label: '36k (3k/m)', value: 36000 }
    ]
  },
  {
    id: 'CHE',
    name: 'Switzerland',
    currency: 'CHF',
    symbol: 'CHF',
    flag: '🇨🇭',
    pppFactor: 1.12,
    nominalRate: 0.89,
    rentIndex: 110.0,
    groceryIndex: 142.0,
    defaultSalary: 140000,
    presets: [
      { label: 'CHF 80k', value: 80000 },
      { label: 'CHF 120k', value: 120000 },
      { label: 'CHF 160k', value: 160000 },
      { label: 'CHF 220k', value: 220000 }
    ]
  },
  {
    id: 'JPN',
    name: 'Japan',
    currency: 'JPY',
    symbol: '¥',
    flag: '🇯🇵',
    pppFactor: 108.0,
    nominalRate: 154.5,
    rentIndex: 44.0,
    groceryIndex: 78.0,
    defaultSalary: 8000000,
    presets: [
      { label: '¥4M', value: 4000000 },
      { label: '¥7M', value: 7000000 },
      { label: '¥10M', value: 10000000 },
      { label: '¥15M', value: 15000000 }
    ]
  },
  {
    id: 'MYS',
    name: 'Malaysia',
    currency: 'MYR',
    symbol: 'RM',
    flag: '🇲🇾',
    pppFactor: 1.62,
    nominalRate: 4.45,
    rentIndex: 18.0,
    groceryIndex: 36.0,
    defaultSalary: 120000,
    presets: [
      { label: 'RM 60k', value: 60000 },
      { label: 'RM 100k', value: 100000 },
      { label: 'RM 150k', value: 150000 }
    ]
  }
];

export interface PppCalculationResult {
  sourceCountry: PppCountry;
  targetCountry: PppCountry;
  sourceSalary: number;
  equivalentSalary: number;
  nominalSalary: number;
  pppRatio: number; // Ratio of living standard conversion
  costOfLivingDiffPct: number; // Positive if target is more expensive, negative if cheaper
  rentDiffPct: number;
  groceryDiffPct: number;
  purchasingPowerMultiplier: number;
}

export function calculatePpp(
  sourceSalaryStr: string | number,
  sourceCountryId: string,
  targetCountryId: string
): PppCalculationResult {
  const source = PPP_COUNTRIES.find((c) => c.id === sourceCountryId) || PPP_COUNTRIES[0];
  const target = PPP_COUNTRIES.find((c) => c.id === targetCountryId) || PPP_COUNTRIES[1];

  let rawSalary = typeof sourceSalaryStr === 'number' ? sourceSalaryStr : parseFloat(sourceSalaryStr.toString());
  if (isNaN(rawSalary) || rawSalary < 0) rawSalary = 0;

  // Conversion formula: Target Salary = Source Salary * (Target PPP Factor / Source PPP Factor)
  const dSalary = new Decimal(rawSalary);
  const dSourceFactor = new Decimal(source.pppFactor);
  const dTargetFactor = new Decimal(target.pppFactor);

  const equivalentSalary = dSalary.times(dTargetFactor).dividedBy(dSourceFactor).toNumber();

  // Nominal exchange equivalent: (Salary in USD) * Target Nominal Rate
  const salaryInUsd = dSalary.dividedBy(new Decimal(source.nominalRate));
  const nominalSalary = salaryInUsd.times(new Decimal(target.nominalRate)).toNumber();

  // Price level index (PLI) = PPP Factor / Nominal Exchange Rate
  // Ratio > 1 means expensive, < 1 means cheaper
  const pliSource = source.pppFactor / source.nominalRate;
  const pliTarget = target.pppFactor / target.nominalRate;

  // Cost of living difference: percentage difference in price levels
  const costOfLivingDiffPct = ((pliTarget - pliSource) / pliSource) * 100;

  // Sub-indices differences
  const rentDiffPct = ((target.rentIndex - source.rentIndex) / source.rentIndex) * 100;
  const groceryDiffPct = ((target.groceryIndex - source.groceryIndex) / source.groceryIndex) * 100;

  // How many times further 1 unit of currency goes in real terms
  const purchasingPowerMultiplier = pliSource / pliTarget;

  return {
    sourceCountry: source,
    targetCountry: target,
    sourceSalary: rawSalary,
    equivalentSalary: Math.round(equivalentSalary),
    nominalSalary: Math.round(nominalSalary),
    pppRatio: target.pppFactor / source.pppFactor,
    costOfLivingDiffPct,
    rentDiffPct,
    groceryDiffPct,
    purchasingPowerMultiplier
  };
}

export const PppModule: CalculatorModule = {
  id: 'PPP',
  name: 'Purchasing Power Parity (PPP)',
  icon: '🌍',
  render(container: HTMLElement) {
    let sourceId = 'USA';
    let targetId = 'IND';
    let lastResult: PppCalculationResult | null = null;

    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <!-- Left Pane: Inputs & Selectors -->
          <div class="workspace-inputs-pane">
            <!-- Source Country & Salary Input Card -->
            <div class="input-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label class="input-label" style="margin: 0;">Source Country / Currency</label>
                <span id="ppp-source-flag-code" style="font-size: 13px; font-weight: 700; color: var(--accent-color);">🇺🇸 USD</span>
              </div>
              <div style="margin-bottom: 12px;">
                <select id="ppp-select-source" class="form-select ppp-country-select">
                  ${PPP_COUNTRIES.map((c) => `<option value="${c.id}" ${c.id === sourceId ? 'selected' : ''}>${c.flag} ${c.name} (${c.currency})</option>`).join('')}
                </select>
              </div>

              <label class="input-label" id="lbl-source-salary" style="margin-top: 6px;">Annual Salary / Income (${PPP_COUNTRIES[0].symbol})</label>
              <div>
                <input type="number" id="ppp-input-salary" class="form-input ppp-salary-input" value="100000" placeholder="100000" step="any" inputmode="decimal" />
              </div>

              <!-- Source Quick Preset Buttons -->
              <div id="ppp-presets-container" class="ppp-presets-grid"></div>
            </div>

            <!-- Swap Countries Action Row -->
            <div class="swap-row" style="margin: 2px 0;">
              <button id="btn-swap-ppp" class="btn-swap ppp-swap-btn">⇅ Swap Countries</button>
            </div>

            <!-- Target Country Selector Card -->
            <div class="input-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label class="input-label" style="margin: 0;">Target Country to Compare</label>
                <span id="ppp-target-flag-code" style="font-size: 13px; font-weight: 700; color: var(--accent-color);">🇮🇳 INR</span>
              </div>
              <div>
                <select id="ppp-select-target" class="form-select ppp-country-select">
                  ${PPP_COUNTRIES.map((c) => `<option value="${c.id}" ${c.id === targetId ? 'selected' : ''}>${c.flag} ${c.name} (${c.currency})</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- Right Pane: Equivalent Salary & Living Cost Analytics -->
          <div class="workspace-analytics-pane">
            <div class="result-card ppp-hero-card">
              <div class="ppp-hero-header">
                <span class="ppp-hero-flag" id="ppp-hero-flag">🇮🇳</span>
                <span class="ppp-hero-target-name" id="ppp-hero-target-name">India Equivalent Salary</span>
              </div>
              <div class="ppp-hero-value" id="ppp-res-equivalent">₹ 0</div>
              <div class="ppp-hero-sub">Annual Living Standard Parity</div>

              <div id="ppp-res-explanation" class="ppp-insight-card"></div>

              <!-- Responsive 2x2 Stats Grid -->
              <div class="ppp-stats-grid">
                <div class="ppp-stat-card">
                  <span class="ppp-stat-label">Cost of Living</span>
                  <span class="ppp-stat-value" id="ppp-res-living-diff">-</span>
                </div>
                <div class="ppp-stat-card">
                  <span class="ppp-stat-label">Purchasing Power</span>
                  <span class="ppp-stat-value" id="ppp-res-multiplier">-</span>
                </div>
                <div class="ppp-stat-card">
                  <span class="ppp-stat-label">Rent & Housing</span>
                  <span class="ppp-stat-value" id="ppp-res-rent-diff">-</span>
                </div>
                <div class="ppp-stat-card">
                  <span class="ppp-stat-label">Groceries & Food</span>
                  <span class="ppp-stat-value" id="ppp-res-grocery-diff">-</span>
                </div>
              </div>

              <!-- Spot Nominal Exchange Row -->
              <div class="ppp-nominal-row">
                <span>Spot Market Exchange:</span>
                <span id="ppp-res-nominal" style="font-weight: 700; color: var(--text-primary);">-</span>
              </div>

              <button id="btn-share-ppp" class="btn-primary" style="margin-top: 12px; width: 100%;">
                📤 Share PPP Comparison
              </button>
            </div>
          </div>
        </div>

        <!-- Global PPP Quick Reference Table Card -->
        <div class="all-units-card" style="margin-top: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <span>🌐</span>
              <span>Global Living Standard Equivalents (${PPP_COUNTRIES.length} Countries)</span>
            </span>
            <small style="color: var(--text-secondary); font-size: 11.5px;">World Bank / IMF ICP Benchmarks • Tap card to select</small>
          </div>
          <div id="ppp-all-countries-grid" class="all-units-grid ppp-grid"></div>
        </div>
      </div>
    `;

    const selSource = container.querySelector('#ppp-select-source') as HTMLSelectElement;
    const selTarget = container.querySelector('#ppp-select-target') as HTMLSelectElement;
    const inpSalary = container.querySelector('#ppp-input-salary') as HTMLInputElement;
    const lblSalary = container.querySelector('#lbl-source-salary') as HTMLElement;
    const presetsBox = container.querySelector('#ppp-presets-container') as HTMLElement;
    const btnSwap = container.querySelector('#btn-swap-ppp') as HTMLButtonElement;
    const btnShare = container.querySelector('#btn-share-ppp') as HTMLButtonElement;

    const sourceFlagCode = container.querySelector('#ppp-source-flag-code') as HTMLElement;
    const targetFlagCode = container.querySelector('#ppp-target-flag-code') as HTMLElement;
    const heroFlag = container.querySelector('#ppp-hero-flag') as HTMLElement;
    const heroTargetName = container.querySelector('#ppp-hero-target-name') as HTMLElement;

    const resEquivalent = container.querySelector('#ppp-res-equivalent') as HTMLElement;
    const resExplanation = container.querySelector('#ppp-res-explanation') as HTMLElement;
    const resLivingDiff = container.querySelector('#ppp-res-living-diff') as HTMLElement;
    const resMultiplier = container.querySelector('#ppp-res-multiplier') as HTMLElement;
    const resNominal = container.querySelector('#ppp-res-nominal') as HTMLElement;
    const resRentDiff = container.querySelector('#ppp-res-rent-diff') as HTMLElement;
    const resGroceryDiff = container.querySelector('#ppp-res-grocery-diff') as HTMLElement;
    const allGrid = container.querySelector('#ppp-all-countries-grid') as HTMLElement;

    function updatePresets() {
      const src = PPP_COUNTRIES.find((c) => c.id === sourceId) || PPP_COUNTRIES[0];
      lblSalary.textContent = `Annual Salary / Income (${src.symbol} ${src.currency})`;
      sourceFlagCode.textContent = `${src.flag} ${src.currency}`;

      const tgt = PPP_COUNTRIES.find((c) => c.id === targetId) || PPP_COUNTRIES[1];
      targetFlagCode.textContent = `${tgt.flag} ${tgt.currency}`;
      heroFlag.textContent = tgt.flag;
      heroTargetName.textContent = `${tgt.name} Equivalent Salary`;

      presetsBox.innerHTML = src.presets
        .map(
          (p) => `
          <button class="btn-preset ${parseFloat(inpSalary.value) === p.value ? 'active' : ''}" data-salary="${p.value}">
            ${p.label}
          </button>
        `
        )
        .join('');

      presetsBox.querySelectorAll('[data-salary]').forEach((b) => {
        b.addEventListener('click', () => {
          inpSalary.value = b.getAttribute('data-salary') || src.defaultSalary.toString();
          updatePresets();
          recalculate();
        });
      });
    }

    function renderAllCountryEquivalents() {
      if (!allGrid || !lastResult) return;
      const src = lastResult.sourceCountry;
      const salary = lastResult.sourceSalary;

      allGrid.innerHTML = PPP_COUNTRIES.map((c) => {
        const itemRes = calculatePpp(salary, src.id, c.id);
        const isTarget = c.id === targetId;
        const diffText =
          itemRes.costOfLivingDiffPct > 0
            ? `+${itemRes.costOfLivingDiffPct.toFixed(0)}% cost`
            : `${itemRes.costOfLivingDiffPct.toFixed(0)}% cost`;
        const badgeClass = itemRes.costOfLivingDiffPct > 0 ? 'costlier' : 'cheaper';

        return `
          <div class="ppp-country-card ${isTarget ? 'active' : ''}" data-country-id="${c.id}">
            <div class="ppp-country-card-header">
              <div class="ppp-country-name-group">
                <span class="ppp-country-flag">${c.flag}</span>
                <span class="ppp-country-title">${c.name}</span>
              </div>
              <span class="ppp-country-badge ${badgeClass}">${diffText}</span>
            </div>
            <div class="ppp-country-val">
              ${c.symbol} ${formatLabelNumber(itemRes.equivalentSalary)}
            </div>
          </div>
        `;
      }).join('');

      allGrid.querySelectorAll('[data-country-id]').forEach((card) => {
        card.addEventListener('click', () => {
          const cId = card.getAttribute('data-country-id') || '';
          if (cId && cId !== targetId) {
            targetId = cId;
            selTarget.value = cId;
            updatePresets();
            recalculate();
          }
        });
      });
    }

    function recalculate() {
      const res = calculatePpp(inpSalary.value, sourceId, targetId);
      lastResult = res;

      const tgt = res.targetCountry;
      const src = res.sourceCountry;

      // Equivalent Salary Result
      resEquivalent.textContent = `${tgt.symbol} ${formatLabelNumber(res.equivalentSalary)}`;

      // Explanation sentence
      resExplanation.textContent = `Earning ${src.symbol}${formatLabelNumber(res.sourceSalary)} in ${src.name} provides the exact same local quality of life as earning ${tgt.symbol}${formatLabelNumber(res.equivalentSalary)} in ${tgt.name}.`;

      // Cost of living difference
      if (Math.abs(res.costOfLivingDiffPct) < 1) {
        resLivingDiff.textContent = '≈ Same Cost of Living (0%)';
        resLivingDiff.style.color = 'var(--text-primary)';
      } else if (res.costOfLivingDiffPct < 0) {
        const cheaperPct = Math.abs(res.costOfLivingDiffPct).toFixed(1);
        resLivingDiff.textContent = `${cheaperPct}% Cheaper`;
        resLivingDiff.style.color = '#10b981'; // Green
      } else {
        const pricierPct = res.costOfLivingDiffPct.toFixed(1);
        resLivingDiff.textContent = `+${pricierPct}% More Expensive`;
        resLivingDiff.style.color = '#ef4444'; // Red
      }

      // Multiplier
      resMultiplier.textContent = `${res.purchasingPowerMultiplier.toFixed(2)}x Power`;

      // Nominal comparison
      resNominal.textContent = `${tgt.symbol} ${formatLabelNumber(res.nominalSalary)}`;

      // Sub-indices
      if (res.rentDiffPct < 0) {
        resRentDiff.textContent = `${Math.abs(res.rentDiffPct).toFixed(0)}% lower`;
        resRentDiff.style.color = '#10b981';
      } else {
        resRentDiff.textContent = `+${res.rentDiffPct.toFixed(0)}% higher`;
        resRentDiff.style.color = '#ef4444';
      }

      if (res.groceryDiffPct < 0) {
        resGroceryDiff.textContent = `${Math.abs(res.groceryDiffPct).toFixed(0)}% lower`;
        resGroceryDiff.style.color = '#10b981';
      } else {
        resGroceryDiff.textContent = `+${res.groceryDiffPct.toFixed(0)}% higher`;
        resGroceryDiff.style.color = '#ef4444';
      }

      renderAllCountryEquivalents();
    }

    selSource.addEventListener('change', () => {
      sourceId = selSource.value;
      const src = PPP_COUNTRIES.find((c) => c.id === sourceId);
      if (src) {
        inpSalary.value = src.defaultSalary.toString();
      }
      updatePresets();
      recalculate();
    });

    selTarget.addEventListener('change', () => {
      targetId = selTarget.value;
      updatePresets();
      recalculate();
    });

    inpSalary.addEventListener('input', () => {
      recalculate();
    });

    btnSwap.addEventListener('click', () => {
      const prevSource = sourceId;
      const prevTarget = targetId;
      sourceId = prevTarget;
      targetId = prevSource;

      selSource.value = sourceId;
      selTarget.value = targetId;

      if (lastResult) {
        inpSalary.value = lastResult.equivalentSalary.toString();
      }

      updatePresets();
      recalculate();
    });

    btnShare.addEventListener('click', () => {
      if (!lastResult) return;
      const src = lastResult.sourceCountry;
      const tgt = lastResult.targetCountry;
      const text = `🌍 *Purchasing Power Parity (PPP) Comparison*
📍 *Base*: ${src.flag} ${src.name} (${src.symbol}${formatLabelNumber(lastResult.sourceSalary)} / yr)
📍 *Equivalent*: ${tgt.flag} ${tgt.name} (${tgt.symbol}${formatLabelNumber(lastResult.equivalentSalary)} / yr)

📊 *Living Standard Breakdown*:
• Cost of Living: ${lastResult.costOfLivingDiffPct < 0 ? `${tgt.name} is ${Math.abs(lastResult.costOfLivingDiffPct).toFixed(1)}% cheaper` : `${tgt.name} is +${lastResult.costOfLivingDiffPct.toFixed(1)}% more expensive`}
• Real Purchasing Power: ${lastResult.purchasingPowerMultiplier.toFixed(2)}x
• Rent Difference: ${lastResult.rentDiffPct < 0 ? `${Math.abs(lastResult.rentDiffPct).toFixed(0)}% lower` : `+${lastResult.rentDiffPct.toFixed(0)}% higher`}
• Nominal Exchange Value: ${tgt.symbol}${formatLabelNumber(lastResult.nominalSalary)}

Calculated via EveryCalc PPP Calculator
https://mehboob-dev.github.io/EveryCalc/`;

      shareText(text, 'PPP Living Standard Comparison');
    });

    updatePresets();
    recalculate();
  }
};
