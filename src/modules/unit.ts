import Decimal from 'decimal.js';
import { CalculatorModule } from './types.ts';
import { t } from '../core/i18n.ts';
import { formatNumber } from '../core/format.ts';

export interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  toBase: (val: Decimal) => Decimal;
  fromBase: (val: Decimal) => Decimal;
}

export interface UnitCategory {
  id: string;
  name: string;
  units: UnitDef[];
}

export interface ConvertedUnitItem {
  unit: UnitDef;
  value: string;
  formattedValue: string;
  isPinned: boolean;
}

const FAVORITES_KEY_PREFIX = 'everycalc_unit_favs_';

export function getPinnedUnits(catId: string): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(`${FAVORITES_KEY_PREFIX}${catId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function togglePinnedUnit(catId: string, unitId: string): string[] {
  const current = getPinnedUnits(catId);
  const exists = current.includes(unitId);
  const updated = exists ? current.filter((id) => id !== unitId) : [...current, unitId];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${FAVORITES_KEY_PREFIX}${catId}`, JSON.stringify(updated));
    }
  } catch {
    // Ignore localStorage errors
  }
  return updated;
}

// Linear scale helper: standard multiplier to base unit
function linearUnit(id: string, name: string, symbol: string, factorToBase: string | number | Decimal): UnitDef {
  const f = new Decimal(factorToBase);
  return {
    id,
    name,
    symbol,
    toBase: (val) => val.times(f),
    fromBase: (val) => val.dividedBy(f)
  };
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: 'Length',
    units: [
      linearUnit('m', 'Meter', 'm', 1),
      linearUnit('km', 'Kilometer', 'km', 1000),
      linearUnit('cm', 'Centimeter', 'cm', 0.01),
      linearUnit('mm', 'Millimeter', 'mm', 0.001),
      linearUnit('in', 'Inch', 'in', 0.0254),
      linearUnit('ft', 'Foot', 'ft', 0.3048),
      linearUnit('yd', 'Yard', 'yd', 0.9144),
      linearUnit('mi', 'Mile', 'mi', 1609.344),
      linearUnit('nmi', 'Nautical Mile', 'nmi', 1852)
    ]
  },
  {
    id: 'mass',
    name: 'Mass & Weight',
    units: [
      linearUnit('kg', 'Kilogram', 'kg', 1),
      linearUnit('g', 'Gram', 'g', 0.001),
      linearUnit('mg', 'Milligram', 'mg', 0.000001),
      linearUnit('t', 'Metric Ton', 't', 1000),
      linearUnit('tola', 'Tola (India)', 'tola', 0.0116638038),
      linearUnit('pavan', 'Pavan / Sovereign (8g)', 'pavan', 0.008),
      linearUnit('ratti', 'Ratti', 'ratti', 0.000121497),
      linearUnit('oz', 'Ounce', 'oz', 0.028349523125),
      linearUnit('lb', 'Pound', 'lb', 0.45359237),
      linearUnit('st', 'Stone', 'st', 6.35029318)
    ]
  },
  {
    id: 'area',
    name: 'Area',
    units: [
      linearUnit('sqm', 'Square Meter', 'm²', 1),
      linearUnit('sqkm', 'Square Kilometer', 'km²', 1000000),
      linearUnit('sqcm', 'Square Centimeter', 'cm²', 0.0001),
      linearUnit('sqin', 'Square Inch', 'in²', 0.00064516),
      linearUnit('sqft', 'Square Foot', 'ft²', 0.09290304),
      linearUnit('sqyd', 'Square Yard', 'yd²', 0.83612736),
      linearUnit('guntha', 'Guntha', 'guntha', 101.17141056),
      linearUnit('gaj', 'Gaj (Sq Yard)', 'gaj', 0.83612736),
      linearUnit('bigha', 'Bigha (Pucca)', 'bigha', 2529.285264),
      linearUnit('cent', 'Cent', 'cent', 40.468564224),
      linearUnit('ground', 'Ground', 'ground', 222.967296),
      linearUnit('katha', 'Katha', 'katha', 66.8901888),
      linearUnit('marla', 'Marla', 'marla', 25.29285),
      linearUnit('kanal', 'Kanal', 'kanal', 505.857),
      linearUnit('acre', 'Acre', 'ac', 4046.8564224),
      linearUnit('ha', 'Hectare', 'ha', 10000)
    ]
  },
  {
    id: 'volume',
    name: 'Volume',
    units: [
      linearUnit('l', 'Liter', 'L', 1),
      linearUnit('ml', 'Milliliter', 'mL', 0.001),
      linearUnit('cbm', 'Cubic Meter', 'm³', 1000),
      linearUnit('gal_us', 'Gallon (US)', 'gal', 3.785411784),
      linearUnit('qt_us', 'Quart (US)', 'qt', 0.946352946),
      linearUnit('pt_us', 'Pint (US)', 'pt', 0.473176473),
      linearUnit('cup_us', 'Cup (US)', 'cup', 0.24),
      linearUnit('floz_us', 'Fluid Ounce (US)', 'fl oz', 0.0295735295625)
    ]
  },
  {
    id: 'temperature',
    name: 'Temperature',
    units: [
      {
        id: 'c',
        name: 'Celsius',
        symbol: '°C',
        toBase: (v) => v, // Base is Celsius
        fromBase: (v) => v
      },
      {
        id: 'f',
        name: 'Fahrenheit',
        symbol: '°F',
        toBase: (v) => v.minus(32).times(5).dividedBy(9),
        fromBase: (v) => v.times(9).dividedBy(5).plus(32)
      },
      {
        id: 'k',
        name: 'Kelvin',
        symbol: 'K',
        toBase: (v) => v.minus(new Decimal('273.15')),
        fromBase: (v) => v.plus(new Decimal('273.15'))
      }
    ]
  },
  {
    id: 'time',
    name: 'Time',
    units: [
      linearUnit('s', 'Second', 's', 1),
      linearUnit('ms', 'Millisecond', 'ms', 0.001),
      linearUnit('min', 'Minute', 'min', 60),
      linearUnit('h', 'Hour', 'h', 3600),
      linearUnit('d', 'Day', 'd', 86400),
      linearUnit('wk', 'Week', 'wk', 604800)
    ]
  },
  {
    id: 'speed',
    name: 'Speed',
    units: [
      linearUnit('mps', 'Meters per second', 'm/s', 1),
      linearUnit('kmh', 'Kilometers per hour', 'km/h', new Decimal(1).dividedBy(new Decimal('3.6'))),
      linearUnit('mph', 'Miles per hour', 'mph', 0.44704),
      linearUnit('knot', 'Knot', 'kn', new Decimal(1852).dividedBy(new Decimal(3600)))
    ]
  },
  {
    id: 'data',
    name: 'Digital Data',
    units: [
      linearUnit('b', 'Byte', 'B', 1),
      linearUnit('kb', 'Kilobyte', 'KB', 1024),
      linearUnit('mb', 'Megabyte', 'MB', 1048576),
      linearUnit('gb', 'Gigabyte', 'GB', 1073741824),
      linearUnit('tb', 'Terabyte', 'TB', 1099511627776)
    ]
  }
];

export function convertUnit(
  value: string | number,
  category: UnitCategory,
  fromUnitId: string,
  toUnitId: string
): string {
  try {
    const val = new Decimal(value || 0);
    const fromUnit = category.units.find((u) => u.id === fromUnitId);
    const toUnit = category.units.find((u) => u.id === toUnitId);

    if (!fromUnit || !toUnit) return '0';

    const baseVal = fromUnit.toBase(val);
    const targetVal = toUnit.fromBase(baseVal);

    // Limit display precision cleanly up to 10 significant decimals
    const str = targetVal.toFixed(8).replace(/\.?0+$/, '');
    return str === '' ? '0' : str;
  } catch {
    return '0';
  }
}

export function convertAllUnits(
  value: string | number,
  category: UnitCategory,
  fromUnitId: string
): ConvertedUnitItem[] {
  const pinnedIds = getPinnedUnits(category.id);
  const items: ConvertedUnitItem[] = category.units.map((u) => {
    const rawVal = convertUnit(value, category, fromUnitId, u.id);
    const formatted = formatNumber(rawVal, { section: 'unit' });
    return {
      unit: u,
      value: rawVal,
      formattedValue: formatted,
      isPinned: pinnedIds.includes(u.id)
    };
  });

  // Sort pinned units to the top while preserving original order within each group
  return items.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });
}

export const UnitModule: CalculatorModule = {
  id: 'UNT',
  name: 'Unit Converter',
  icon: '📏',
  render(container: HTMLElement) {
    let currentCategory = UNIT_CATEGORIES[0];
    let fromUnit = currentCategory.units[0];
    let toUnit = currentCategory.units[1];

    container.innerHTML = `
      <div class="module-view">
        <!-- Category selector horizontal bar -->
        <div class="category-scroll" id="unit-categories" style="margin-bottom: 16px;"></div>

        <div class="workspace-layout">
          <div class="workspace-inputs-pane">
            <div class="input-card">
              <label class="input-label" id="lbl-unit-from">${t('from')}</label>
              <div class="input-row">
                <input type="number" id="unit-input-from" class="form-input" placeholder="0" value="1" step="any" inputmode="decimal" />
                <select id="unit-select-from" class="form-select"></select>
              </div>
            </div>

            <div class="swap-row" style="margin: 4px 0;">
              <button id="btn-swap-units" class="btn-swap">${t('swapUnits')}</button>
            </div>
          </div>

          <div class="workspace-analytics-pane">
            <div class="input-card">
              <label class="input-label" id="lbl-unit-to">${t('to')}</label>
              <div class="input-row">
                <input type="number" id="unit-input-to" class="form-input" placeholder="0" step="any" inputmode="decimal" />
                <select id="unit-select-to" class="form-select"></select>
              </div>
            </div>
          </div>
        </div>

        <!-- Live All Units in Category Grid -->
        <div class="all-units-card" style="margin-top: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <span>📊</span>
              <span>All <span id="lbl-current-cat-name">${currentCategory.name}</span> Units</span>
            </span>
            <small style="color: var(--text-secondary); font-size: 11.5px;">⭐ Tap star to pin to top</small>
          </div>
          <div id="all-units-grid" class="all-units-grid"></div>
        </div>
      </div>
    `;

    const catContainer = container.querySelector('#unit-categories') as HTMLElement;
    const inputFrom = container.querySelector('#unit-input-from') as HTMLInputElement;
    const inputTo = container.querySelector('#unit-input-to') as HTMLInputElement;
    const selectFrom = container.querySelector('#unit-select-from') as HTMLSelectElement;
    const selectTo = container.querySelector('#unit-select-to') as HTMLSelectElement;
    const btnSwap = container.querySelector('#btn-swap-units') as HTMLButtonElement;
    const allUnitsGrid = container.querySelector('#all-units-grid') as HTMLElement;
    const lblCatName = container.querySelector('#lbl-current-cat-name') as HTMLElement;

    let isUpdating = false;
    let lastActiveField: 'from' | 'to' = 'from';

    function renderAllUnits() {
      if (!allUnitsGrid) return;
      const baseVal = inputFrom.value.trim();
      const currentVal = baseVal === '' || baseVal === '-' ? '0' : baseVal;
      const allConverted = convertAllUnits(currentVal, currentCategory, selectFrom.value);

      allUnitsGrid.innerHTML = allConverted.map((item) => `
        <div class="unit-grid-item ${item.isPinned ? 'pinned' : ''}" data-unit-id="${item.unit.id}">
          <div class="unit-grid-item-info">
            <span class="unit-grid-item-name">${item.unit.name} (${item.unit.symbol})</span>
            <span class="unit-grid-item-val">${item.formattedValue}</span>
          </div>
          <button class="btn-star-pin ${item.isPinned ? 'active' : ''}" data-pin-id="${item.unit.id}" title="${item.isPinned ? 'Unpin' : 'Pin to top'}">
            ${item.isPinned ? '⭐' : '☆'}
          </button>
        </div>
      `).join('');

      // Wire pin buttons
      allUnitsGrid.querySelectorAll('.btn-star-pin').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const unitId = btn.getAttribute('data-pin-id');
          if (unitId) {
            togglePinnedUnit(currentCategory.id, unitId);
            renderAllUnits();
          }
        });
      });

      // Wire item click to select as destination unit
      allUnitsGrid.querySelectorAll('.unit-grid-item').forEach((item) => {
        item.addEventListener('click', () => {
          const unitId = item.getAttribute('data-unit-id');
          if (unitId && selectTo) {
            selectTo.value = unitId;
            toUnit = currentCategory.units.find((u) => u.id === unitId) || currentCategory.units[0];
            syncFromTo();
          }
        });
      });
    }

    function populateSelects() {
      selectFrom.innerHTML = currentCategory.units
        .map((u) => `<option value="${u.id}">${u.name} (${u.symbol})</option>`)
        .join('');
      selectTo.innerHTML = currentCategory.units
        .map((u) => `<option value="${u.id}">${u.name} (${u.symbol})</option>`)
        .join('');

      selectFrom.value = fromUnit.id;
      selectTo.value = toUnit.id;
    }

    function syncFromTo() {
      if (isUpdating) return;
      isUpdating = true;
      try {
        const val = inputFrom.value.trim();
        if (val === '' || val === '-') {
          inputTo.value = '';
        } else {
          const res = convertUnit(val, currentCategory, selectFrom.value, selectTo.value);
          inputTo.value = res;
        }
      } finally {
        isUpdating = false;
        renderAllUnits();
      }
    }

    function syncToFrom() {
      if (isUpdating) return;
      isUpdating = true;
      try {
        const val = inputTo.value.trim();
        if (val === '' || val === '-') {
          inputFrom.value = '';
        } else {
          const res = convertUnit(val, currentCategory, selectTo.value, selectFrom.value);
          inputFrom.value = res;
        }
      } finally {
        isUpdating = false;
        renderAllUnits();
      }
    }

    function recalculate() {
      if (lastActiveField === 'to') {
        syncToFrom();
      } else {
        syncFromTo();
      }
    }

    function renderCategories() {
      catContainer.innerHTML = UNIT_CATEGORIES.map(
        (cat) => `<button class="cat-pill ${cat.id === currentCategory.id ? 'active' : ''}" data-cat="${cat.id}">${cat.name}</button>`
      ).join('');

      catContainer.querySelectorAll('.cat-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          const catId = btn.getAttribute('data-cat');
          const found = UNIT_CATEGORIES.find((c) => c.id === catId);
          if (found) {
            currentCategory = found;
            fromUnit = found.units[0];
            toUnit = found.units[1] || found.units[0];
            if (lblCatName) lblCatName.textContent = found.name;
            renderCategories();
            populateSelects();
            inputFrom.value = '1';
            lastActiveField = 'from';
            syncFromTo();
          }
        });
      });
    }

    inputFrom.addEventListener('input', () => {
      lastActiveField = 'from';
      syncFromTo();
    });

    inputTo.addEventListener('input', () => {
      lastActiveField = 'to';
      syncToFrom();
    });

    selectFrom.addEventListener('change', () => {
      fromUnit = currentCategory.units.find((u) => u.id === selectFrom.value) || currentCategory.units[0];
      recalculate();
    });

    selectTo.addEventListener('change', () => {
      toUnit = currentCategory.units.find((u) => u.id === selectTo.value) || currentCategory.units[1] || currentCategory.units[0];
      recalculate();
    });

    btnSwap.addEventListener('click', () => {
      const tempId = selectFrom.value;
      selectFrom.value = selectTo.value;
      selectTo.value = tempId;

      fromUnit = currentCategory.units.find((u) => u.id === selectFrom.value) || currentCategory.units[0];
      toUnit = currentCategory.units.find((u) => u.id === selectTo.value) || currentCategory.units[1] || currentCategory.units[0];

      lastActiveField = 'from';
      syncFromTo();
    });

    renderCategories();
    populateSelects();
    syncFromTo();
  }
};
