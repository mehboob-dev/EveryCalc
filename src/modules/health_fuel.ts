import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { formatNumber } from '../core/math.ts';

// ==========================================
// 1. HEALTH CALCULATOR (HET - BMI & BMR)
// ==========================================
export interface HealthResult {
  bmi: string;
  bmiCategory: string;
  bmr: string;
}

export function calculateHealth(
  heightCm: string | number,
  weightKg: string | number,
  age: string | number,
  gender: 'male' | 'female' = 'male'
): HealthResult {
  try {
    const h = new Decimal(heightCm || 0);
    const w = new Decimal(weightKg || 0);
    const a = new Decimal(age || 0);

    if (h.isZero() || w.isZero()) {
      return { bmi: '0.0', bmiCategory: 'Enter height and weight', bmr: '0' };
    }

    const heightM = h.dividedBy(100);
    const bmiVal = w.dividedBy(heightM.pow(2));
    const bmiNum = bmiVal.toNumber();

    let category = 'Normal';
    if (bmiNum < 18.5) category = 'Underweight';
    else if (bmiNum < 25.0) category = 'Normal weight';
    else if (bmiNum < 30.0) category = 'Overweight';
    else category = 'Obese';

    // Mifflin-St Jeor formula
    // Men: 10 * weight + 6.25 * height - 5 * age + 5
    // Women: 10 * weight + 6.25 * height - 5 * age - 161
    let bmrVal = new Decimal(10).times(w).plus(new Decimal(6.25).times(h)).minus(new Decimal(5).times(a));
    bmrVal = gender === 'male' ? bmrVal.plus(5) : bmrVal.minus(161);

    return {
      bmi: bmiVal.toFixed(1),
      bmiCategory: category,
      bmr: bmrVal.toFixed(0)
    };
  } catch {
    return { bmi: '0.0', bmiCategory: 'Error', bmr: '0' };
  }
}

export const HealthModule: CalculatorModule = {
  id: 'HET',
  name: 'Health (BMI/BMR)',
  icon: '❤️',
  render(container: HTMLElement) {
    let gender: 'male' | 'female' = 'male';

    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="segmented-control">
              <button id="btn-gender-male" class="seg-btn active">Male ♂</button>
              <button id="btn-gender-female" class="seg-btn">Female ♀</button>
            </div>

            <div class="input-card">
              <label class="input-label">Height (cm)</label>
              <input type="number" id="het-h" class="form-input" placeholder="175" step="any" inputmode="decimal" />

              <label class="input-label">Weight (kg)</label>
              <input type="number" id="het-w" class="form-input" placeholder="70" step="any" inputmode="decimal" />

              <label class="input-label">Age (years)</label>
              <input type="number" id="het-a" class="form-input" placeholder="25" step="1" inputmode="numeric" />
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">Body Mass Index (BMI)</span>
                <span id="het-res-bmi" class="result-value-highlight">0.0</span>
              </div>
              <div class="result-row">
                <span class="result-label">Weight Classification</span>
                <span id="het-res-cat" class="result-value-success">Normal</span>
              </div>
              <div class="result-row">
                <span class="result-label">Basal Metabolic Rate (BMR)</span>
                <span id="het-res-bmr" class="result-value">0 kcal/day</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const inpH = container.querySelector('#het-h') as HTMLInputElement;
    const inpW = container.querySelector('#het-w') as HTMLInputElement;
    const inpA = container.querySelector('#het-a') as HTMLInputElement;

    const resBmi = container.querySelector('#het-res-bmi') as HTMLElement;
    const resCat = container.querySelector('#het-res-cat') as HTMLElement;
    const resBmr = container.querySelector('#het-res-bmr') as HTMLElement;

    const btnMale = container.querySelector('#btn-gender-male') as HTMLButtonElement;
    const btnFemale = container.querySelector('#btn-gender-female') as HTMLButtonElement;

    function rec() {
      const res = calculateHealth(inpH.value, inpW.value, inpA.value, gender);
      resBmi.textContent = res.bmi;
      resCat.textContent = res.bmiCategory;
      resBmr.textContent = `${formatNumber(res.bmr)} kcal/day`;
    }

    btnMale.addEventListener('click', () => {
      gender = 'male';
      btnMale.classList.add('active');
      btnFemale.classList.remove('active');
      rec();
    });

    btnFemale.addEventListener('click', () => {
      gender = 'female';
      btnFemale.classList.add('active');
      btnMale.classList.remove('active');
      rec();
    });

    [inpH, inpW, inpA].forEach((inp) => inp?.addEventListener('input', rec));
  }
};

// ==========================================
// 2. FUEL COST CALCULATOR (FCS)
// ==========================================
export interface FuelCostResult {
  fuelVolumeNeeded: string;
  totalCost: string;
}

export function calculateFuelCost(
  distance: string | number,
  fuelEfficiencyKmPerL: string | number,
  pricePerLiter: string | number
): FuelCostResult {
  try {
    const d = new Decimal(distance || 0);
    const eff = new Decimal(fuelEfficiencyKmPerL || 0);
    const price = new Decimal(pricePerLiter || 0);

    if (d.isZero() || eff.isZero()) {
      return { fuelVolumeNeeded: '0.00', totalCost: '0.00' };
    }

    const volume = d.dividedBy(eff);
    const cost = volume.times(price);

    return {
      fuelVolumeNeeded: volume.toFixed(2),
      totalCost: cost.toFixed(2)
    };
  } catch {
    return { fuelVolumeNeeded: '0.00', totalCost: '0.00' };
  }
}

export const FuelCostModule: CalculatorModule = {
  id: 'FCS',
  name: 'Fuel Cost Calculator',
  icon: '⛽',
  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="input-card">
              <label class="input-label">Distance to Travel (km)</label>
              <input type="number" id="fcs-dist" class="form-input" value="300" placeholder="300" step="any" inputmode="decimal" />

              <label class="input-label">Fuel Efficiency (km/L)</label>
              <input type="number" id="fcs-eff" class="form-input" value="15" placeholder="15" step="any" inputmode="decimal" />

              <label class="input-label">Fuel Price per Liter (₹)</label>
              <input type="number" id="fcs-price" class="form-input" value="96.72" placeholder="96.72" step="any" inputmode="decimal" />
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">Estimated Total Cost</span>
                <span id="fcs-res-cost" class="result-value-highlight">₹ 0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Required Fuel</span>
                <span id="fcs-res-vol" class="result-value">0.00 Liters</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const inpDist = container.querySelector('#fcs-dist') as HTMLInputElement;
    const inpEff = container.querySelector('#fcs-eff') as HTMLInputElement;
    const inpPrice = container.querySelector('#fcs-price') as HTMLInputElement;

    const resCost = container.querySelector('#fcs-res-cost') as HTMLElement;
    const resVol = container.querySelector('#fcs-res-vol') as HTMLElement;

    function rec() {
      const res = calculateFuelCost(inpDist.value, inpEff.value, inpPrice.value);
      resCost.textContent = `₹ ${formatNumber(res.totalCost)}`;
      resVol.textContent = `${formatNumber(res.fuelVolumeNeeded)} L`;
    }

    [inpDist, inpEff, inpPrice].forEach((inp) => inp?.addEventListener('input', rec));
    rec();
  }
};

// ==========================================
// 3. FUEL EFFICIENCY CALCULATOR (FFC)
// ==========================================
export interface FuelEfficiencyResult {
  kmPerLiter: string;
  mpgUS: string;
  mpgUK: string;
  litersPer100Km: string;
}

export function calculateFuelEfficiency(
  distanceKm: string | number,
  fuelConsumedLiters: string | number
): FuelEfficiencyResult {
  try {
    const d = new Decimal(distanceKm || 0);
    const f = new Decimal(fuelConsumedLiters || 0);

    if (d.isZero() || f.isZero()) {
      return { kmPerLiter: '0.00', mpgUS: '0.00', mpgUK: '0.00', litersPer100Km: '0.00' };
    }

    const kmL = d.dividedBy(f);
    // 1 km/L = 2.35214583 MPG US
    const mpgUS = kmL.times('2.35214583');
    // 1 km/L = 2.82480936 MPG UK
    const mpgUK = kmL.times('2.82480936');
    // L / 100km = 100 / (km/L)
    const l100km = new Decimal(100).dividedBy(kmL);

    return {
      kmPerLiter: kmL.toFixed(2),
      mpgUS: mpgUS.toFixed(2),
      mpgUK: mpgUK.toFixed(2),
      litersPer100Km: l100km.toFixed(2)
    };
  } catch {
    return { kmPerLiter: '0.00', mpgUS: '0.00', mpgUK: '0.00', litersPer100Km: '0.00' };
  }
}

export const FuelEfficiencyModule: CalculatorModule = {
  id: 'FFC',
  name: 'Fuel Efficiency',
  icon: '🚗',
  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="input-card">
              <label class="input-label">Distance Traveled (km)</label>
              <input type="number" id="ffc-dist" class="form-input" placeholder="450" step="any" inputmode="decimal" />

              <label class="input-label">Fuel Consumed (Liters)</label>
              <input type="number" id="ffc-fuel" class="form-input" placeholder="30" step="any" inputmode="decimal" />
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">Kilometers per Liter (km/L)</span>
                <span id="ffc-res-kml" class="result-value-highlight">0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Liters per 100 km (L/100km)</span>
                <span id="ffc-res-l100" class="result-value">0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Miles per Gallon (US MPG)</span>
                <span id="ffc-res-mpgus" class="result-value">0.00</span>
              </div>
              <div class="result-row">
                <span class="result-label">Miles per Gallon (UK MPG)</span>
                <span id="ffc-res-mpguk" class="result-value">0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const inpDist = container.querySelector('#ffc-dist') as HTMLInputElement;
    const inpFuel = container.querySelector('#ffc-fuel') as HTMLInputElement;

    const resKml = container.querySelector('#ffc-res-kml') as HTMLElement;
    const resL100 = container.querySelector('#ffc-res-l100') as HTMLElement;
    const resMpgUS = container.querySelector('#ffc-res-mpgus') as HTMLElement;
    const resMpgUK = container.querySelector('#ffc-res-mpguk') as HTMLElement;

    function rec() {
      const res = calculateFuelEfficiency(inpDist.value, inpFuel.value);
      resKml.textContent = formatNumber(res.kmPerLiter);
      resL100.textContent = formatNumber(res.litersPer100Km);
      resMpgUS.textContent = formatNumber(res.mpgUS);
      resMpgUK.textContent = formatNumber(res.mpgUK);
    }

    [inpDist, inpFuel].forEach((inp) => inp?.addEventListener('input', rec));
  }
};

// ==========================================
// 4. DATE CALCULATOR (DAT)
// ==========================================
export interface DateDifferenceResult {
  totalDays: number;
  weeksAndDays: string;
}

export function calculateDateDiff(startDateStr: string, endDateStr: string): DateDifferenceResult {
  try {
    const d1 = new Date(startDateStr);
    const d2 = new Date(endDateStr);

    const diffTime = d2.getTime() - d1.getTime();
    const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const absDays = Math.abs(totalDays);
    const weeks = Math.floor(absDays / 7);
    const remDays = absDays % 7;

    return {
      totalDays,
      weeksAndDays: `${weeks} week${weeks === 1 ? '' : 's'}, ${remDays} day${remDays === 1 ? '' : 's'}`
    };
  } catch {
    return { totalDays: 0, weeksAndDays: '0 days' };
  }
}

export const DateModule: CalculatorModule = {
  id: 'DAT',
  name: 'Date Calculator',
  icon: '📅',
  render(container: HTMLElement) {
    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="input-card">
              <label class="input-label">Start Date</label>
              <input type="date" id="dat-start" class="form-input" value="${today}" />

              <label class="input-label">End Date</label>
              <input type="date" id="dat-end" class="form-input" value="${today}" />
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">Total Days Difference</span>
                <span id="dat-res-days" class="result-value-highlight">0 Days</span>
              </div>
              <div class="result-row">
                <span class="result-label">Duration Breakdown</span>
                <span id="dat-res-breakdown" class="result-value">0 weeks, 0 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const inpStart = container.querySelector('#dat-start') as HTMLInputElement;
    const inpEnd = container.querySelector('#dat-end') as HTMLInputElement;

    const resDays = container.querySelector('#dat-res-days') as HTMLElement;
    const resBreakdown = container.querySelector('#dat-res-breakdown') as HTMLElement;

    function rec() {
      const res = calculateDateDiff(inpStart.value, inpEnd.value);
      resDays.textContent = `${res.totalDays} Day${res.totalDays === 1 ? '' : 's'}`;
      resBreakdown.textContent = res.weeksAndDays;
    }

    inpStart.addEventListener('change', rec);
    inpEnd.addEventListener('change', rec);
    rec();
  }
};
