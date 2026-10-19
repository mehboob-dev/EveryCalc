import { CalculatorModule } from './types.ts';
import { formatLabelNumber } from '../core/math.ts';

// ==========================================
// 1. HEXADECIMAL & PROGRAMMER CONVERTER (HEX)
// ==========================================
export interface HexResult {
  hex: string;
  dec: string;
  oct: string;
  bin: string;
}

export function convertBases(inputStr: string, fromBase: 16 | 10 | 8 | 2): HexResult {
  try {
    const trimmed = inputStr.trim();
    if (!trimmed) {
      return { hex: '0', dec: '0', oct: '0', bin: '0' };
    }

    const n = BigInt(
      fromBase === 16 ? `0x${trimmed}` :
      fromBase === 8 ? `0o${trimmed}` :
      fromBase === 2 ? `0b${trimmed}` :
      trimmed
    );

    return {
      hex: n.toString(16).toUpperCase(),
      dec: n.toString(10),
      oct: n.toString(8),
      bin: n.toString(2).replace(/\B(?=(\d{4})+(?!\d))/g, ' ')
    };
  } catch {
    return { hex: '0', dec: '0', oct: '0', bin: '0' };
  }
}

export const HexModule: CalculatorModule = {
  id: 'HEX',
  name: 'Hexadecimal Converter',
  icon: '💻',
  render(container: HTMLElement) {
    let currentBase: 16 | 10 | 8 | 2 = 10;

    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="segmented-control">
              <button class="seg-btn" data-base="16">HEX</button>
              <button class="seg-btn active" data-base="10">DEC</button>
              <button class="seg-btn" data-base="8">OCT</button>
              <button class="seg-btn" data-base="2">BIN</button>
            </div>

            <div class="input-card">
              <label class="input-label" id="hex-input-label">Decimal Input</label>
              <input type="text" id="hex-inp" class="form-input" placeholder="0" value="255" />
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">HEX (16)</span>
                <span id="hex-res-hex" class="result-value-highlight">FF</span>
              </div>
              <div class="result-row">
                <span class="result-label">DEC (10)</span>
                <span id="hex-res-dec" class="result-value">255</span>
              </div>
              <div class="result-row">
                <span class="result-label">OCT (8)</span>
                <span id="hex-res-oct" class="result-value">377</span>
              </div>
              <div class="result-row">
                <span class="result-label">BIN (2)</span>
                <span id="hex-res-bin" class="result-value">1111 1111</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const inp = container.querySelector('#hex-inp') as HTMLInputElement;
    const label = container.querySelector('#hex-input-label') as HTMLElement;

    const resHex = container.querySelector('#hex-res-hex') as HTMLElement;
    const resDec = container.querySelector('#hex-res-dec') as HTMLElement;
    const resOct = container.querySelector('#hex-res-oct') as HTMLElement;
    const resBin = container.querySelector('#hex-res-bin') as HTMLElement;

    function rec() {
      const res = convertBases(inp.value, currentBase);
      resHex.textContent = res.hex;
      resDec.textContent = res.dec;
      resOct.textContent = res.oct;
      resBin.textContent = res.bin;
    }

    container.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const b = parseInt(btn.getAttribute('data-base') || '10', 10) as 16 | 10 | 8 | 2;
        currentBase = b;
        label.textContent = `${btn.textContent} Input`;
        rec();
      });
    });

    inp.addEventListener('input', rec);
    rec();
  }
};

// ==========================================
// 2. GRADE AVERAGE CALCULATOR (GPA)
// ==========================================
interface CourseItem {
  id: string;
  credits: number;
  gradePoint: number;
}

const GRADE_POINTS: Record<string, number> = {
  'A+': 4.3, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

export const GpaModule: CalculatorModule = {
  id: 'GPA',
  name: 'Grade Average (GPA)',
  icon: '🎓',
  render(container: HTMLElement) {
    const courses: CourseItem[] = [
      { id: '1', credits: 3, gradePoint: 4.0 },
      { id: '2', credits: 4, gradePoint: 3.7 },
      { id: '3', credits: 3, gradePoint: 3.3 }
    ];

    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div id="course-list-container"></div>
            <button id="btn-add-course" class="btn-sub" style="margin-top: 4px;">+ Add Course</button>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">Cumulative GPA</span>
                <span id="gpa-res-val" class="result-value-highlight">3.69</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total Credits</span>
                <span id="gpa-res-credits" class="result-value">10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const listEl = container.querySelector('#course-list-container') as HTMLElement;
    const gpaEl = container.querySelector('#gpa-res-val') as HTMLElement;
    const creditsEl = container.querySelector('#gpa-res-credits') as HTMLElement;
    const btnAdd = container.querySelector('#btn-add-course') as HTMLButtonElement;

    function renderCourses() {
      let totalPts = 0;
      let totalCreds = 0;

      listEl.innerHTML = courses.map((c, idx) => {
        totalPts += c.credits * c.gradePoint;
        totalCreds += c.credits;

        const options = Object.keys(GRADE_POINTS)
          .map((g) => `<option value="${GRADE_POINTS[g]}" ${GRADE_POINTS[g] === c.gradePoint ? 'selected' : ''}>${g} (${GRADE_POINTS[g]})</option>`)
          .join('');

        return `
          <div class="input-card" style="padding: 12px; margin-bottom: 8px;">
            <div class="input-row" style="flex-wrap: wrap; gap: 8px;">
              <span style="font-size: 13.5px; font-weight: 600; min-width: 65px;">Course ${idx + 1}</span>
              <input type="number" class="form-input form-input-sm inp-credit" data-id="${c.id}" value="${c.credits}" min="1" max="10" placeholder="Credits" />
              <select class="form-select sel-grade" data-id="${c.id}" style="min-width: 85px; flex: 1;">${options}</select>
            </div>
          </div>
        `;
      }).join('');

      const gpa = totalCreds > 0 ? (totalPts / totalCreds).toFixed(2) : '0.00';
      gpaEl.textContent = gpa;
      creditsEl.textContent = String(totalCreds);

      // Event listeners for courses
      listEl.querySelectorAll('.inp-credit').forEach((inp) => {
        inp.addEventListener('input', (e) => {
          const id = (e.target as HTMLElement).getAttribute('data-id');
          const item = courses.find((x) => x.id === id);
          if (item) {
            item.credits = parseInt((e.target as HTMLInputElement).value, 10) || 0;
            renderCourses();
          }
        });
      });

      listEl.querySelectorAll('.sel-grade').forEach((sel) => {
        sel.addEventListener('change', (e) => {
          const id = (e.target as HTMLElement).getAttribute('data-id');
          const item = courses.find((x) => x.id === id);
          if (item) {
            item.gradePoint = parseFloat((e.target as HTMLSelectElement).value) || 0;
            renderCourses();
          }
        });
      });
    }

    btnAdd.addEventListener('click', () => {
      courses.push({ id: String(Date.now()), credits: 3, gradePoint: 4.0 });
      renderCourses();
    });

    renderCourses();
  }
};

// ==========================================
// 3. OVULATION & CYCLE CALCULATOR (LDC)
// ==========================================
export function calculateCycle(lastPeriodDateStr: string, cycleDays: number = 28) {
  try {
    const lastDate = new Date(lastPeriodDateStr);
    const nextPeriod = new Date(lastDate);
    nextPeriod.setDate(nextPeriod.getDate() + cycleDays);

    const ovulationDate = new Date(nextPeriod);
    ovulationDate.setDate(ovulationDate.getDate() - 14);

    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - 4);

    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(fertileEnd.getDate() + 1);

    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    return {
      ovulationDay: fmt(ovulationDate),
      fertileWindow: `${fmt(fertileStart)} – ${fmt(fertileEnd)}`,
      nextPeriodDay: fmt(nextPeriod)
    };
  } catch {
    return { ovulationDay: 'Invalid date', fertileWindow: 'N/A', nextPeriodDay: 'N/A' };
  }
}

export const OvulationModule: CalculatorModule = {
  id: 'LDC',
  name: 'Ovulation Calculator',
  icon: '🌸',
  render(container: HTMLElement) {
    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="input-card">
              <label class="input-label">First Day of Last Period</label>
              <input type="date" id="ldc-last" class="form-input" value="${today}" />

              <label class="input-label">Average Cycle Length (Days)</label>
              <input type="number" id="ldc-cycle" class="form-input" value="28" min="20" max="45" step="1" inputmode="numeric" />
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">Estimated Ovulation</span>
                <span id="ldc-res-ovul" class="result-value-highlight">--</span>
              </div>
              <div class="result-row">
                <span class="result-label">Fertile Window</span>
                <span id="ldc-res-fertile" class="result-value-success">--</span>
              </div>
              <div class="result-row">
                <span class="result-label">Next Period Due</span>
                <span id="ldc-res-next" class="result-value">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const inpLast = container.querySelector('#ldc-last') as HTMLInputElement;
    const inpCycle = container.querySelector('#ldc-cycle') as HTMLInputElement;

    const resOvul = container.querySelector('#ldc-res-ovul') as HTMLElement;
    const resFertile = container.querySelector('#ldc-res-fertile') as HTMLElement;
    const resNext = container.querySelector('#ldc-res-next') as HTMLElement;

    function rec() {
      const res = calculateCycle(inpLast.value, parseInt(inpCycle.value, 10) || 28);
      resOvul.textContent = res.ovulationDay;
      resFertile.textContent = res.fertileWindow;
      resNext.textContent = res.nextPeriodDay;
    }

    inpLast.addEventListener('change', rec);
    inpCycle.addEventListener('input', rec);
    rec();
  }
};

// ==========================================
// 4. CURRENCY CONVERTER (CUR - Offline Capable)
// ==========================================
// Base: USD
const CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 84.1,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  GBP: 0.79,
  EUR: 0.92,
  SGD: 1.35,
  CAD: 1.38,
  AUD: 1.52,
  JPY: 154.5,
  CNY: 7.24,
  CHF: 0.89
};

export const CurrencyModule: CalculatorModule = {
  id: 'CUR',
  name: 'Currency Converter',
  icon: '💱',
  render(container: HTMLElement) {
    container.innerHTML = `
      <div class="module-view">
        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="input-card">
              <label class="input-label">From</label>
              <div class="input-row">
                <input type="number" id="cur-amount" class="form-input" value="100" placeholder="100" step="any" inputmode="decimal" />
                <select id="cur-from" class="form-select">
                  ${Object.keys(CURRENCY_RATES).map((c) => `<option value="${c}" ${c === 'USD' ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="swap-row" style="margin: 4px 0;">
              <button id="btn-swap-cur" class="btn-swap">⇅ Swap Currencies</button>
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="input-card">
              <label class="input-label">To (Converted)</label>
              <div class="input-row">
                <div id="cur-res-val" class="unit-res-display">0.00</div>
                <select id="cur-to" class="form-select">
                  ${Object.keys(CURRENCY_RATES).map((c) => `<option value="${c}" ${c === 'INR' ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const inpAmt = container.querySelector('#cur-amount') as HTMLInputElement;
    const selFrom = container.querySelector('#cur-from') as HTMLSelectElement;
    const selTo = container.querySelector('#cur-to') as HTMLSelectElement;
    const resVal = container.querySelector('#cur-res-val') as HTMLElement;
    const btnSwap = container.querySelector('#btn-swap-cur') as HTMLButtonElement;

    function rec() {
      const amt = parseFloat(inpAmt.value) || 0;
      const rFrom = CURRENCY_RATES[selFrom.value] || 1;
      const rTo = CURRENCY_RATES[selTo.value] || 1;

      // Amount in USD = amt / rFrom; Amount in Target = (amt / rFrom) * rTo
      const converted = (amt / rFrom) * rTo;
      const prefix = selTo.value === 'INR' ? '₹ ' : '';
      resVal.textContent = `${prefix}${formatLabelNumber(converted.toFixed(2))} ${selTo.value}`;
    }

    btnSwap.addEventListener('click', () => {
      const t = selFrom.value;
      selFrom.value = selTo.value;
      selTo.value = t;
      rec();
    });

    inpAmt.addEventListener('input', rec);
    selFrom.addEventListener('change', rec);
    selTo.addEventListener('change', rec);
    rec();
  }
};

// ==========================================
// 5. WORLD TIMEZONE CONVERTER & SCRUBBER (TMZ)
// ==========================================
export interface CityTimezone {
  id: string;
  name: string;
  country: string;
  tz: string;
}

export const GLOBAL_CITIES: CityTimezone[] = [
  { id: 'delhi', name: 'New Delhi', country: 'India (IST UTC+05:30)', tz: 'Asia/Kolkata' },
  { id: 'mumbai', name: 'Mumbai', country: 'India (IST UTC+05:30)', tz: 'Asia/Kolkata' },
  { id: 'dubai', name: 'Dubai', country: 'UAE (GST UTC+04:00)', tz: 'Asia/Dubai' },
  { id: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia (AST UTC+03:00)', tz: 'Asia/Riyadh' },
  { id: 'doha', name: 'Doha', country: 'Qatar (AST UTC+03:00)', tz: 'Asia/Qatar' },
  { id: 'kuwait', name: 'Kuwait City', country: 'Kuwait (AST UTC+03:00)', tz: 'Asia/Kuwait' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore (SGT UTC+08:00)', tz: 'Asia/Singapore' },
  { id: 'london', name: 'London', country: 'UK (GMT/BST)', tz: 'Europe/London' },
  { id: 'newyork', name: 'New York', country: 'USA (EST/EDT)', tz: 'America/New_York' },
  { id: 'sanfrancisco', name: 'San Francisco', country: 'USA (PST/PDT)', tz: 'America/Los_Angeles' },
  { id: 'chicago', name: 'Chicago', country: 'USA (CST/CDT)', tz: 'America/Chicago' },
  { id: 'toronto', name: 'Toronto', country: 'Canada (EST/EDT)', tz: 'America/Toronto' },
  { id: 'vancouver', name: 'Vancouver', country: 'Canada (PST/PDT)', tz: 'America/Vancouver' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan (JST UTC+09:00)', tz: 'Asia/Tokyo' },
  { id: 'sydney', name: 'Sydney', country: 'Australia (AEST/AEDT)', tz: 'Australia/Sydney' },
  { id: 'melbourne', name: 'Melbourne', country: 'Australia (AEST/AEDT)', tz: 'Australia/Melbourne' },
  { id: 'paris', name: 'Paris', country: 'France (CET/CEST)', tz: 'Europe/Paris' },
  { id: 'berlin', name: 'Berlin', country: 'Germany (CET/CEST)', tz: 'Europe/Berlin' },
  { id: 'frankfurt', name: 'Frankfurt', country: 'Germany (CET/CEST)', tz: 'Europe/Berlin' },
  { id: 'zurich', name: 'Zurich', country: 'Switzerland (CET/CEST)', tz: 'Europe/Zurich' },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands (CET/CEST)', tz: 'Europe/Amsterdam' },
  { id: 'hongkong', name: 'Hong Kong', country: 'Hong Kong (HKT UTC+08:00)', tz: 'Asia/Hong_Kong' },
  { id: 'shanghai', name: 'Shanghai', country: 'China (CST UTC+08:00)', tz: 'Asia/Shanghai' },
  { id: 'seoul', name: 'Seoul', country: 'South Korea (KST UTC+09:00)', tz: 'Asia/Seoul' },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand (ICT UTC+07:00)', tz: 'Asia/Bangkok' },
  { id: 'kualalumpur', name: 'Kuala Lumpur', country: 'Malaysia (MYT UTC+08:00)', tz: 'Asia/Kuala_Lumpur' },
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia (WIB UTC+07:00)', tz: 'Asia/Jakarta' },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand (NZST/NZDT)', tz: 'Pacific/Auckland' },
  { id: 'cairo', name: 'Cairo', country: 'Egypt (EET UTC+02:00)', tz: 'Africa/Cairo' },
  { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa (SAST UTC+02:00)', tz: 'Africa/Johannesburg' },
  { id: 'saopaulo', name: 'São Paulo', country: 'Brazil (BRT UTC-03:00)', tz: 'America/Sao_Paulo' },
  { id: 'buenosaires', name: 'Buenos Aires', country: 'Argentina (ART UTC-03:00)', tz: 'America/Argentina/Buenos_Aires' },
  { id: 'mexicocity', name: 'Mexico City', country: 'Mexico (CST UTC-06:00)', tz: 'America/Mexico_City' },
  { id: 'moscow', name: 'Moscow', country: 'Russia (MSK UTC+03:00)', tz: 'Europe/Moscow' },
  { id: 'istanbul', name: 'Istanbul', country: 'Turkey (TRT UTC+03:00)', tz: 'Europe/Istanbul' }
];

export const DEFAULT_ACTIVE_CITY_IDS = [
  'delhi',
  'dubai',
  'london',
  'newyork',
  'singapore',
  'tokyo',
  'sanfrancisco',
  'sydney'
];

const ACTIVE_CITIES_STORAGE_KEY = 'everycalc_active_cities';

export function getActiveCities(): CityTimezone[] {
  try {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_ACTIVE_CITY_IDS.map((id) => GLOBAL_CITIES.find((c) => c.id === id)!).filter(Boolean);
    }
    const raw = localStorage.getItem(ACTIVE_CITIES_STORAGE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : DEFAULT_ACTIVE_CITY_IDS;
    const cities = ids.map((id) => GLOBAL_CITIES.find((c) => c.id === id)).filter(Boolean) as CityTimezone[];
    return cities.length > 0 ? cities : DEFAULT_ACTIVE_CITY_IDS.map((id) => GLOBAL_CITIES.find((c) => c.id === id)!).filter(Boolean);
  } catch {
    return DEFAULT_ACTIVE_CITY_IDS.map((id) => GLOBAL_CITIES.find((c) => c.id === id)!).filter(Boolean);
  }
}

export function saveActiveCityIds(ids: string[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_CITIES_STORAGE_KEY, JSON.stringify(ids));
    }
  } catch {
    // Ignore storage errors
  }
}

export interface CityTimeResult {
  timeStr: string;
  dateStr: string;
  hour: number;
  dayNightIcon: string;
}

export function calculateCityTime(baseDate: Date, city: CityTimezone): CityTimeResult {
  try {
    const timeStr = baseDate.toLocaleTimeString('en-US', {
      timeZone: city.tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const dateStr = baseDate.toLocaleDateString('en-US', {
      timeZone: city.tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    // Extract 24-hour component for day/night icon calculation
    const hour24Str = baseDate.toLocaleTimeString('en-US', {
      timeZone: city.tz,
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(hour24Str, 10) || 0;
    const isDay = hour >= 6 && hour < 19;
    const dayNightIcon = isDay ? '☀️' : '🌙';

    return { timeStr, dateStr, hour, dayNightIcon };
  } catch {
    return { timeStr: '--:--', dateStr: '--', hour: 12, dayNightIcon: '☀️' };
  }
}

export const TimezoneModule: CalculatorModule = {
  id: 'TMZ',
  name: 'World Timezone',
  icon: '🌐',
  render(container: HTMLElement) {
    let activeCities = getActiveCities();
    let isLiveMode = true;
    let liveTimer: number | null = null;
    let scrubbedReferenceMinutes = -1; // 0..1439 when scrubbing

    container.innerHTML = `
      <div class="module-view">
        <!-- Interactive 24-Hour Scrubber Card -->
        <div class="tmz-scrubber-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">⏱️</span>
              <span style="font-size: 15px; font-weight: 700; color: var(--text-primary);">24-Hour Time Scrubber</span>
            </div>
            <button id="btn-tmz-live" class="seg-btn active" style="padding: 5px 12px; font-size: 12px; font-weight: 600;">
              ⚡ Live Mode
            </button>
          </div>

          <div class="tmz-slider-container">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
              <span>Reference City: <strong>New Delhi (IST)</strong></span>
              <span id="tmz-scrubbed-time-label" style="font-weight: 700; color: var(--accent-color, #ff9f0a);">Live Time</span>
            </div>
            <input type="range" id="tmz-slider" class="tmz-slider" min="0" max="1439" step="15" value="720" />
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--text-secondary); opacity: 0.7;">
              <span>12:00 AM</span>
              <span>06:00 AM</span>
              <span>12:00 PM</span>
              <span>06:00 PM</span>
              <span>11:59 PM</span>
            </div>
          </div>
        </div>

        <!-- City Management & Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 4px;">
          <span style="font-size: 14.5px; font-weight: 700; color: var(--text-primary);">
            Active Clocks (<span id="tmz-city-count">${activeCities.length}</span>)
          </span>
          <button id="btn-add-city" class="seg-btn" style="padding: 6px 14px; font-size: 12.5px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <span>➕</span>
            <span>Add City</span>
          </button>
        </div>

        <!-- City List -->
        <div id="tmz-city-list"></div>

        <!-- Add City Modal -->
        <div id="modal-add-city" class="modal-overlay center-modal" style="display: none;">
          <div class="dialog-cities">
            <div class="calc-header" style="border-bottom: 1px solid var(--border-color); padding: 12px 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🌐</span>
                <h3 style="margin: 0; font-size: 16px; font-weight: 700;">Add Global City</h3>
              </div>
              <button id="btn-close-add-city" class="btn-icon">✕</button>
            </div>

            <div style="padding: 12px 16px;">
              <input type="text" id="city-search-input" class="form-input" placeholder="🔍 Search by city or country..." style="width: 100%; box-sizing: border-box;" />
            </div>

            <div id="city-search-list" style="padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; max-height: 50vh; overflow-y: auto;"></div>
          </div>
        </div>
      </div>
    `;

    const cityList = container.querySelector('#tmz-city-list') as HTMLElement;
    const slider = container.querySelector('#tmz-slider') as HTMLInputElement;
    const scrubbedTimeLabel = container.querySelector('#tmz-scrubbed-time-label') as HTMLElement;
    const btnLive = container.querySelector('#btn-tmz-live') as HTMLButtonElement;
    const btnAddCity = container.querySelector('#btn-add-city') as HTMLButtonElement;
    const modalAddCity = container.querySelector('#modal-add-city') as HTMLElement;
    const btnCloseAddCity = container.querySelector('#btn-close-add-city') as HTMLButtonElement;
    const citySearchInput = container.querySelector('#city-search-input') as HTMLInputElement;
    const citySearchList = container.querySelector('#city-search-list') as HTMLElement;
    const cityCountLabel = container.querySelector('#tmz-city-count') as HTMLElement;

    function getBaseDate(): Date {
      const now = new Date();
      if (isLiveMode || scrubbedReferenceMinutes < 0) {
        return now;
      }
      // Compute scrubbed Date relative to current year/month/day at IST or local
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      d.setMinutes(scrubbedReferenceMinutes);
      return d;
    }

    function renderClocks() {
      const baseDate = getBaseDate();

      cityList.innerHTML = activeCities.map((c) => {
        const res = calculateCityTime(baseDate, c);
        const canDelete = activeCities.length > 1;
        return `
          <div class="tmz-city-card" data-city-id="${c.id}">
            <div class="tmz-city-left">
              <span class="tmz-daynight-icon">${res.dayNightIcon}</span>
              <div class="tmz-city-info">
                <span class="tmz-city-name">${c.name}</span>
                <span class="tmz-city-country">${c.country}</span>
              </div>
            </div>
            <div class="tmz-city-right">
              <div class="tmz-time-box">
                <span class="tmz-time-val">${res.timeStr}</span>
                <span class="tmz-date-val">${res.dateStr}</span>
              </div>
              ${canDelete ? `<button class="btn-remove-city" data-delete-id="${c.id}" title="Remove ${c.name}">✕</button>` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Wire remove buttons
      cityList.querySelectorAll('.btn-remove-city').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cityId = btn.getAttribute('data-delete-id');
          if (cityId) {
            activeCities = activeCities.filter((c) => c.id !== cityId);
            saveActiveCityIds(activeCities.map((c) => c.id));
            if (cityCountLabel) cityCountLabel.textContent = activeCities.length.toString();
            renderClocks();
          }
        });
      });
    }

    function syncLiveState() {
      if (isLiveMode) {
        btnLive.classList.add('active');
        btnLive.textContent = '⚡ Live Mode';
        scrubbedTimeLabel.textContent = 'Live Time';
        const now = new Date();
        const curMinutes = now.getHours() * 60 + now.getMinutes();
        slider.value = curMinutes.toString();
        renderClocks();

        if (!liveTimer) {
          liveTimer = window.setInterval(() => {
            if (isLiveMode) {
              const n = new Date();
              slider.value = (n.getHours() * 60 + n.getMinutes()).toString();
              renderClocks();
            }
          }, 1000);
        }
      } else {
        btnLive.classList.remove('active');
        btnLive.textContent = '⏸️ Scrubbing';
        if (liveTimer) {
          clearInterval(liveTimer);
          liveTimer = null;
        }
      }
    }

    slider.addEventListener('input', () => {
      isLiveMode = false;
      scrubbedReferenceMinutes = parseInt(slider.value, 10);
      const hrs = Math.floor(scrubbedReferenceMinutes / 60);
      const mins = scrubbedReferenceMinutes % 60;
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
      const displayMins = mins.toString().padStart(2, '0');
      scrubbedTimeLabel.textContent = `${displayHrs}:${displayMins} ${ampm} (${hrs.toString().padStart(2, '0')}:${displayMins})`;
      syncLiveState();
      renderClocks();
    });

    btnLive.addEventListener('click', () => {
      isLiveMode = true;
      scrubbedReferenceMinutes = -1;
      syncLiveState();
    });

    function renderAvailableCities(filterText: string = '') {
      const q = filterText.toLowerCase().trim();
      const activeIds = new Set(activeCities.map((c) => c.id));
      const available = GLOBAL_CITIES.filter((c) => !activeIds.has(c.id) && (
        c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
      ));

      if (available.length === 0) {
        citySearchList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No matching cities found</div>`;
        return;
      }

      citySearchList.innerHTML = available.map((c) => `
        <div class="constant-item" data-add-city="${c.id}">
          <div class="constant-left">
            <span class="constant-symbol-badge" style="font-size: 15px;">🌐</span>
            <div class="constant-info">
              <span class="constant-name">${c.name}</span>
              <span class="constant-val">${c.country}</span>
            </div>
          </div>
          <button class="seg-btn active" style="padding: 4px 10px; font-size: 12px;">+ Add</button>
        </div>
      `).join('');

      citySearchList.querySelectorAll('[data-add-city]').forEach((el) => {
        el.addEventListener('click', () => {
          const id = el.getAttribute('data-add-city');
          const found = GLOBAL_CITIES.find((c) => c.id === id);
          if (found) {
            activeCities.push(found);
            saveActiveCityIds(activeCities.map((c) => c.id));
            if (cityCountLabel) cityCountLabel.textContent = activeCities.length.toString();
            renderAvailableCities(citySearchInput.value);
            renderClocks();
          }
        });
      });
    }

    function openAddCityModal() {
      citySearchInput.value = '';
      renderAvailableCities('');
      modalAddCity.style.display = 'flex';
      modalAddCity.classList.add('open');
      citySearchInput.focus();
    }

    function closeAddCityModal() {
      modalAddCity.style.display = 'none';
      modalAddCity.classList.remove('open');
    }

    btnAddCity.addEventListener('click', openAddCityModal);
    btnCloseAddCity.addEventListener('click', closeAddCityModal);
    modalAddCity.addEventListener('click', (e) => {
      if (e.target === modalAddCity) closeAddCityModal();
    });

    citySearchInput.addEventListener('input', () => {
      renderAvailableCities(citySearchInput.value);
    });

    syncLiveState();
  }
};
