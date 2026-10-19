import { formatNumber, formatExpressionGrouping, getIndianWords } from './core/math.ts';
import { evaluateExpression } from './core/evaluator.ts';
import { EXTENDED_CONSTANTS } from './core/constants.ts';
import { getHistory, addHistory, clearHistory, HistoryItem } from './core/history.ts';
import { getSettings, updateSettings } from './core/settings.ts';
import { playKeyClick } from './core/sound.ts';
import { handleKeyboardEvent } from './core/keyboard.ts';
import { CalculatorModule } from './modules/types.ts';
import { DiscountModule } from './modules/discount.ts';
import { TipModule } from './modules/tip.ts';
import { TaxModule } from './modules/tax.ts';
import { PercentageModule } from './modules/percentage.ts';
import { UnitModule } from './modules/unit.ts';
import { LoanModule, SavingsModule, UnitPriceModule } from './modules/financial.ts';
import { HealthModule, FuelCostModule, FuelEfficiencyModule, DateModule } from './modules/health_fuel.ts';
import { HexModule, GpaModule, OvulationModule, CurrencyModule, TimezoneModule } from './modules/advanced.ts';
import { AnniversaryModule } from './modules/anniversary.ts';
import { GoldModule } from './modules/gold.ts';
import { IncomeTaxModule } from './modules/income_tax.ts';
import { SalaryModule } from './modules/salary.ts';
import { PppModule } from './modules/ppp.ts';
import {
  initLanguage,
  getLanguage,
  setLanguage,
  t,
  updatePageSEO,
  SUPPORTED_LANGUAGES,
  SupportedLanguage
} from './core/i18n.ts';

// Complete Registry of all Calculator & Converter Modules
const MODULE_REGISTRY: Record<string, CalculatorModule> = {
  UNT: UnitModule,
  CUR: CurrencyModule,
  PPP: PppModule,
  DCT: DiscountModule,
  LON: LoanModule,
  IRA: SavingsModule,
  TIP: TipModule,
  PER: PercentageModule,
  UPR: UnitPriceModule,
  TAX: TaxModule,
  GLD: GoldModule,
  ITX: IncomeTaxModule,
  SAL: SalaryModule,
  DAT: DateModule,
  ANN: AnniversaryModule,
  HET: HealthModule,
  FCS: FuelCostModule,
  FFC: FuelEfficiencyModule,
  GPA: GpaModule,
  HEX: HexModule,
  LDC: OvulationModule,
  TMZ: TimezoneModule
};

const userSettings = getSettings();
initLanguage();

const CALCULATOR_MODES = [
  { id: 'NOR', name: 'General Calculator', icon: '🔢' },
  { id: 'TAX', name: 'GST Calculator (India)', icon: '🧾' },
  { id: 'GLD', name: 'Gold & Jewelry Price', icon: '🪙' },
  { id: 'LON', name: 'Loan EMI Calculator', icon: '🏦' },
  { id: 'IRA', name: 'SIP / FD / Savings', icon: '💰' },
  { id: 'ITX', name: 'Income Tax (New vs Old)', icon: '📑' },
  { id: 'SAL', name: 'In-Hand Salary Calculator', icon: '💼' },
  { id: 'UNT', name: 'Unit Converter', icon: '📏' },
  { id: 'CUR', name: 'Currency Converter', icon: '💱' },
  { id: 'PPP', name: 'Purchasing Power Parity (PPP)', icon: '🌍' },
  { id: 'DCT', name: 'Discount Calculator', icon: '🏷️' },
  { id: 'TIP', name: 'Tip Calculator', icon: '🍽️' },
  { id: 'PER', name: 'Percentage Calculator', icon: '📊' },
  { id: 'UPR', name: 'Unit Price Calculator', icon: '⚖️' },
  { id: 'DAT', name: 'Date Calculator', icon: '📅' },
  { id: 'ANN', name: 'Anniversary & D-Day', icon: '🎉' },
  { id: 'HET', name: 'Health (BMI/BMR)', icon: '❤️' },
  { id: 'FCS', name: 'Fuel Cost Calculator', icon: '⛽' },
  { id: 'FFC', name: 'Fuel Efficiency', icon: '🚗' },
  { id: 'GPA', name: 'Grade Average (GPA)', icon: '🎓' },
  { id: 'HEX', name: 'Hexadecimal Converter', icon: '💻' },
  { id: 'LDC', name: 'Ovulation Calculator', icon: '🌸' },
  { id: 'TMZ', name: 'World Timezone', icon: '🌐' }
];

interface MenuCategoryDef {
  id: string;
  name: string;
  badge: string;
  moduleIds: string[];
}

const MENU_CATEGORIES: MenuCategoryDef[] = [
  {
    id: 'finance',
    name: 'Finance & India',
    badge: 'India & Money',
    moduleIds: ['TAX', 'GLD', 'LON', 'IRA', 'ITX', 'SAL', 'CUR', 'PPP']
  },
  {
    id: 'everyday',
    name: 'Everyday & Math',
    badge: 'Everyday',
    moduleIds: ['NOR', 'UNT', 'DCT', 'TIP', 'PER', 'UPR', 'DAT', 'ANN']
  },
  {
    id: 'health_utils',
    name: 'Health & Utilities',
    badge: 'Lifestyle',
    moduleIds: ['HET', 'FCS', 'FFC', 'GPA', 'HEX', 'LDC', 'TMZ']
  }
];

function getModuleName(id: string): string {
  const trans = t(`${id}_name`);
  if (trans && trans !== `${id}_name`) return trans;
  const found = CALCULATOR_MODES.find((m) => m.id === id);
  return found ? found.name : id;
}

// Calculator state
interface CalcState {
  formula: string;
  cursorPos: number;
  expression: string;
  currentNumber: string;
  livePreview: string;
  isResultDisplayed: boolean;
  isScientificOpen: boolean;
  activeCalculatorId: string;
  activeCalculatorName: string;
}

const state: CalcState = {
  formula: '0',
  cursorPos: 1,
  expression: '',
  currentNumber: '0',
  livePreview: '',
  isResultDisplayed: false,
  isScientificOpen: false,
  activeCalculatorId: userSettings.defaultCalculatorId || 'NOR',
  activeCalculatorName: getModuleName(userSettings.defaultCalculatorId || 'NOR')
};

function triggerHaptic() {
  if (userSettings.hapticFeedback && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      // Ignore vibration error
    }
  }
  if (userSettings.soundFeedback) {
    playKeyClick();
  }
}

/**
 * Calculates live preview result if valid
 */
function updateLivePreview() {
  const full = state.formula;
  if (!full || full === '0' || state.isResultDisplayed) {
    state.livePreview = '';
    return;
  }

  if (/[+\-−×*÷/^√!%]|sin|cos|tan|log|ln|asin|acos|atan/.test(full)) {
    const res = evaluateExpression(full, userSettings.angleMode);
    if (res.success && res.value !== full) {
      state.livePreview = `= ${formatNumber(res.value, { section: 'general' })}`;
    } else {
      state.livePreview = '';
    }
  } else {
    state.livePreview = '';
  }
}

function updateDisplay() {
  const displayMain = document.getElementById('display-main');
  const displayExpr = document.getElementById('display-expression');
  const displayWords = document.getElementById('display-words');
  const displayPrev = document.getElementById('display-preview');
  const btnClear = document.getElementById('btn-clear');
  const btnAngle = document.getElementById('btn-angle-mode');

  updateLivePreview();

  if (displayMain) {
    if (state.isResultDisplayed) {
      displayMain.textContent = state.formula === 'Error' ? 'Error' : formatNumber(state.formula, { section: 'general' });
    } else {
      let html = '';
      for (let i = 0; i < state.formula.length; i++) {
        if (i === state.cursorPos) {
          html += '<span class="calc-cursor"></span>';
        }
        const ch = state.formula[i];
        const displayChar = ch === ' ' ? '&nbsp;' : ch;
        html += `<span class="char-token" data-idx="${i}">${displayChar}</span>`;
      }
      if (state.cursorPos >= state.formula.length) {
        html += '<span class="calc-cursor"></span>';
      }
      displayMain.innerHTML = html;
    }
  }

  if (displayWords) {
    displayWords.textContent = getIndianWords(state.formula.replace(/,/g, ''));
  }

  if (displayExpr) {
    displayExpr.textContent = state.expression;
  }

  if (displayPrev) {
    displayPrev.textContent = state.livePreview;
  }

  if (btnAngle) {
    btnAngle.textContent = userSettings.angleMode;
  }

  if (btnClear) {
    const hasInput = state.formula !== '0' || state.expression !== '';
    btnClear.textContent = hasInput ? 'C' : 'AC';
  }
}

function setCursorPos(pos: number) {
  state.cursorPos = Math.max(0, Math.min(pos, state.formula.length));
  if (state.isResultDisplayed) {
    state.isResultDisplayed = false;
  }
  updateDisplay();
}

function moveCursorLeft() {
  if (state.cursorPos > 0) {
    setCursorPos(state.cursorPos - 1);
  }
}

function moveCursorRight() {
  if (state.cursorPos < state.formula.length) {
    setCursorPos(state.cursorPos + 1);
  }
}

function insertAtCursor(str: string) {
  triggerHaptic();
  if (state.isResultDisplayed) {
    if (['+', '−', '×', '÷', '^', '%', '!'].includes(str.trim())) {
      state.formula = `${state.formula} ${str.trim()} `;
      state.cursorPos = state.formula.length;
    } else {
      state.formula = str === '.' ? '0.' : str;
      state.cursorPos = state.formula.length;
    }
    state.isResultDisplayed = false;
  } else {
    if (state.formula === '0' && str !== '.' && !['+', '−', '×', '÷', '^', '%', '!'].includes(str.trim())) {
      state.formula = str;
      state.cursorPos = str.length;
    } else {
      const before = state.formula.slice(0, state.cursorPos);
      const after = state.formula.slice(state.cursorPos);
      state.formula = before + str + after;
      state.cursorPos += str.length;
    }
  }

  // Format numeric tokens with chosen grouping system and adjust cursorPos
  const unformattedBefore = state.formula.slice(0, state.cursorPos).replace(/,/g, '');
  state.formula = formatExpressionGrouping(state.formula);
  let count = 0;
  let newPos = state.formula.length;
  for (let i = 0; i < state.formula.length; i++) {
    if (count === unformattedBefore.length) {
      newPos = i;
      break;
    }
    if (state.formula[i] !== ',') {
      count++;
    }
    if (count === unformattedBefore.length) {
      newPos = i + 1;
      break;
    }
  }
  state.cursorPos = newPos;

  updateDisplay();
}

function deleteAtCursor() {
  triggerHaptic();
  if (state.isResultDisplayed) {
    state.formula = '0';
    state.cursorPos = 1;
    state.expression = '';
    state.isResultDisplayed = false;
    updateDisplay();
    return;
  }
  if (state.cursorPos <= 0) return;

  let before = state.formula.slice(0, state.cursorPos);
  const after = state.formula.slice(state.cursorPos);

  if (before.endsWith(',')) {
    before = before.slice(0, -1);
  }

  const fnMatch = before.match(/(asin|acos|atan|sinh|cosh|tanh|sqrt|sin|cos|tan|log|ln)\($/);
  if (fnMatch) {
    before = before.slice(0, -fnMatch[0].length);
  } else if (before.endsWith(' ') && before.length >= 3) {
    const opMatch = before.match(/\s[+\-−×*÷/^]\s$/);
    if (opMatch) {
      before = before.slice(0, -opMatch[0].length);
    } else {
      before = before.slice(0, -1);
    }
  } else {
    before = before.slice(0, -1);
  }

  const unformattedBefore = before.replace(/,/g, '');
  const combined = before + after;
  if (combined === '' || combined === '-') {
    state.formula = '0';
    state.cursorPos = 1;
  } else {
    state.formula = formatExpressionGrouping(combined);
    let count = 0;
    let newPos = state.formula.length;
    for (let i = 0; i < state.formula.length; i++) {
      if (count === unformattedBefore.length) {
        newPos = i;
        break;
      }
      if (state.formula[i] !== ',') {
        count++;
      }
      if (count === unformattedBefore.length) {
        newPos = i + 1;
        break;
      }
    }
    state.cursorPos = newPos;
  }
  updateDisplay();
}

function handleNumber(num: string) {
  insertAtCursor(num);
}

function handleOperation(op: string) {
  insertAtCursor(` ${op} `);
}

function handleParenthesis(paren: string) {
  insertAtCursor(paren);
}

function handleFunction(fnName: string) {
  insertAtCursor(`${fnName}(`);
}

function handleConstant(c: string) {
  insertAtCursor(c);
}

function handlePostfix(op: string) {
  insertAtCursor(op);
}

function handlePercent() {
  insertAtCursor('%');
}

function handleSquareRoot() {
  insertAtCursor('sqrt(');
}

function handleEquals() {
  triggerHaptic();
  const raw = state.formula.trim();
  if (!raw || raw === 'Error') return;

  const res = evaluateExpression(raw, userSettings.angleMode);
  if (res.success) {
    addHistory(raw, res.value);
    state.expression = `${raw} =`;
    state.formula = res.value;
    state.cursorPos = state.formula.length;
    state.isResultDisplayed = true;
    renderHistoryList();
  } else {
    state.expression = raw;
    state.formula = 'Error';
    state.cursorPos = 5;
    state.isResultDisplayed = true;
  }
  updateDisplay();
}

function handleClear() {
  triggerHaptic();
  state.formula = '0';
  state.cursorPos = 1;
  state.expression = '';
  state.isResultDisplayed = false;
  updateDisplay();
}

function handleBackspace() {
  deleteAtCursor();
}

function handleToggleSign() {
  triggerHaptic();
  if (state.formula !== '0' && state.formula !== 'Error') {
    if (state.formula.startsWith('-(') && state.formula.endsWith(')')) {
      state.formula = state.formula.slice(2, -1);
    } else if (state.formula.startsWith('-')) {
      state.formula = state.formula.slice(1);
    } else {
      state.formula = `-(${state.formula})`;
    }
    state.cursorPos = state.formula.length;
    updateDisplay();
  }
}

function showToast(message: string): void {
  let toast = document.getElementById('calc-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'calc-toast';
    toast.className = 'calc-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast?.classList.remove('show'), 2000);
}

function copyCurrentResult(): void {
  const textToCopy = state.isResultDisplayed
    ? state.currentNumber
    : state.currentNumber !== '0'
      ? state.currentNumber
      : state.livePreview || '0';
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        showToast(t('copiedToClipboard', { value: formatNumber(textToCopy) }));
      })
      .catch(() => {});
  }
}

function flashButton(selector: string): void {
  const btn = document.querySelector(selector) as HTMLElement;
  if (btn) {
    btn.classList.add('keyboard-active');
    setTimeout(() => btn.classList.remove('keyboard-active'), 120);
  }
}

function renderHistoryList() {
  const containers = [
    document.getElementById('history-list'),
    document.getElementById('desktop-history-list')
  ].filter(Boolean) as HTMLElement[];

  const items = getHistory();

  containers.forEach((container) => {
    if (items.length === 0) {
      container.innerHTML = '<div class="history-empty">No calculations yet</div>';
      return;
    }

    container.innerHTML = items
      .map(
        (item: HistoryItem) => `
        <div class="history-item" data-res="${item.result}" title="Click to use ${item.result}">
          <div class="history-expr">${item.expression} =</div>
          <div class="history-res">${formatNumber(item.result)}</div>
        </div>
      `
      )
      .join('');

    container.querySelectorAll('.history-item').forEach((el) => {
      el.addEventListener('click', () => {
        const resVal = el.getAttribute('data-res');
        if (resVal) {
          state.currentNumber = resVal;
          state.isResultDisplayed = true;
          updateDisplay();
          triggerHaptic();
          document.getElementById('modal-history')?.classList.remove('open');
        }
      });
    });
  });
}

function switchMode(modeId: string, modeName?: string) {
  state.activeCalculatorId = modeId;
  const resolvedName = modeName || getModuleName(modeId);
  state.activeCalculatorName = resolvedName;

  const titleEl = document.getElementById('header-title');
  if (titleEl) titleEl.textContent = resolvedName;

  updatePageSEO(modeId);

  const generalView = document.getElementById('view-general');
  const moduleView = document.getElementById('view-module');
  const btnHistory = document.getElementById('btn-history');

  document.getElementById('modal-menu')?.classList.remove('open');
  document.querySelectorAll('.drawer-item, .sidebar-item').forEach((el) => {
    const isActive = el.getAttribute('data-id') === modeId;
    el.classList.toggle('active', isActive);
    if (isActive && el.classList.contains('sidebar-item')) {
      (el as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  if (modeId === 'NOR') {
    if (generalView) generalView.style.display = '';
    if (moduleView) moduleView.style.display = 'none';
    if (btnHistory) btnHistory.style.display = '';
    updateDisplay();
    renderHistoryList();
  } else {
    if (generalView) generalView.style.display = 'none';
    if (moduleView) {
      moduleView.style.display = '';
      const mod = MODULE_REGISTRY[modeId];
      if (mod) {
        mod.render(moduleView);
      }
    }
    if (btnHistory) btnHistory.style.display = 'none';
  }
}

function setupKeyboard(): void {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    const isInputFocused =
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      document.activeElement instanceof HTMLSelectElement;

    // Clipboard copy
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C') && !isInputFocused) {
      const selection = window.getSelection()?.toString();
      if (!selection) {
        copyCurrentResult();
      }
      return;
    }

    // Clipboard paste
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V') && !isInputFocused) {
      if (navigator.clipboard) {
        navigator.clipboard
          .readText()
          .then((text) => {
            const clean = text.trim();
            if (/^-?[\d.,+\-−×*÷/^()!%a-zA-Zπeφ\s]+$/.test(clean)) {
              insertAtCursor(clean);
              showToast(t('pasted', { value: clean }));
            }
          })
          .catch(() => {});
      }
      return;
    }

    // Only route numeric/calculation keys to general calculator when in NOR mode
    if (state.activeCalculatorId !== 'NOR') {
      return;
    }

    handleKeyboardEvent(
      e,
      {
        onNumber: (num) => {
          handleNumber(num);
          flashButton(`[data-num="${num}"]`);
        },
        onOperation: (op) => {
          handleOperation(op);
          flashButton(`[data-op="${op}"]`);
        },
        onEquals: () => {
          handleEquals();
          flashButton('#btn-equals');
        },
        onClear: () => {
          handleClear();
          flashButton('#btn-clear');
        },
        onBackspace: () => {
          handleBackspace();
          flashButton('#btn-backspace');
        },
        onPercent: () => {
          handlePercent();
          flashButton('[data-percent="%"]');
        },
        onParenthesis: (p) => {
          handleParenthesis(p);
          flashButton(`[data-paren="${p}"]`);
        },
        onSquareRoot: () => {
          handleSquareRoot();
          flashButton('#btn-sqrt');
        },
        onConstant: (c) => {
          handleConstant(c);
          flashButton(`[data-const="${c}"]`);
        },
        onArrowLeft: () => {
          moveCursorLeft();
        },
        onArrowRight: () => {
          moveCursorRight();
        },
        onHome: () => {
          setCursorPos(0);
        },
        onEnd: () => {
          setCursorPos(state.formula.length);
        },
        onToggleSign: () => {
          handleToggleSign();
          flashButton('#btn-sign');
        },
        onPostfix: (p) => {
          handlePostfix(p);
          flashButton(`[data-postfix="${p}"]`);
        }
      },
      isInputFocused
    );
  });
}

function setupApp() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="desktop-shell">
      <!-- Permanent Desktop Sidebar for screens >= 768px -->
      <aside class="desktop-sidebar">
        <div class="desktop-sidebar-header">
          <div class="desktop-logo-group">
            <span class="desktop-logo-icon">🧮</span>
            <span class="desktop-logo-text">EveryCalc</span>
          </div>
          <button id="btn-collapse-sidebar" class="btn-sidebar-collapse" title="Collapse sidebar" aria-label="Collapse sidebar">◀</button>
        </div>
        <div class="desktop-sidebar-search">
          <span class="search-icon">🔍</span>
          <input type="text" id="desktop-search-input" class="desktop-search-input" placeholder="${t('searchPlaceholder')}" autocomplete="off" />
        </div>
        <div class="desktop-sidebar-list" id="desktop-sidebar-list"></div>
      </aside>

      <!-- Main App Area -->
      <div class="desktop-main-area">
        <header class="calc-header">
          <div class="calc-title-group">
            <button id="btn-menu" class="btn-icon" aria-label="Open Menu">☰</button>
            <span id="header-title" class="calc-title">${state.activeCalculatorName}</span>
          </div>
          <div class="calc-actions">
            <button id="btn-lang" class="btn-icon" aria-label="Language / Idioma" title="Language / Idioma">🌐</button>
            <button id="btn-history" class="btn-icon" aria-label="History">🕒</button>
            <button id="btn-settings" class="btn-icon" aria-label="Settings">⚙️</button>
            <button id="btn-theme" class="btn-icon" aria-label="Toggle Theme">🌓</button>
          </div>
        </header>

        <!-- General Calculator View -->
        <div id="view-general" class="view-general-container">
          <div class="calc-main-column">
            <div class="calc-display" id="calc-display-box" title="Click to copy result">
              <div id="display-expression" class="display-expression"></div>
              <div id="display-main" class="display-main">0</div>
              <div id="display-words" class="display-words" style="font-size: 0.9rem; color: var(--accent-color, #ff9f0a); min-height: 1.3rem; text-align: right; padding-right: 4px; font-weight: 600; letter-spacing: 0.3px;"></div>
              <div id="display-preview" class="display-preview"></div>
            </div>

            <div class="calc-sub-bar">
              <button class="btn-sub" id="btn-toggle-sci" title="Toggle Scientific Keypad">fx</button>
              <button class="btn-sub" id="btn-angle-mode" title="Toggle Degree / Radian">${userSettings.angleMode}</button>
              <button class="btn-sub" id="btn-sign" title="Toggle Sign (± / _)">±</button>
              <button class="btn-sub" data-paren="(" title="Open Parenthesis">(</button>
              <button class="btn-sub" data-paren=")" title="Close Parenthesis">)</button>
              <button class="btn-sub" id="btn-sqrt" title="Square Root">√</button>
              <button class="btn-sub" data-op="^" title="Power">^</button>
            </div>

            <!-- Expandable Scientific Keypad -->
            <div id="sci-keypad" class="calc-sci-grid" style="display: none;">
              <button class="sci-btn" data-fn="sin">sin</button>
              <button class="sci-btn" data-fn="cos">cos</button>
              <button class="sci-btn" data-fn="tan">tan</button>
              <button class="sci-btn" data-fn="ln">ln</button>
              <button class="sci-btn" data-fn="log">log</button>

              <button class="sci-btn" data-fn="asin">asin</button>
              <button class="sci-btn" data-fn="acos">acos</button>
              <button class="sci-btn" data-fn="atan">atan</button>
              <button class="sci-btn" data-const="π">π</button>
              <button class="sci-btn" data-const="e">e</button>

              <button class="sci-btn" data-postfix="!">x!</button>
              <button class="sci-btn" data-const="φ" title="Golden Ratio (φ)">φ</button>
              <button class="sci-btn" data-fn="sqrt">√x</button>
              <button class="sci-btn" data-paren="(">(</button>
              <button class="sci-btn" id="btn-open-const" style="font-weight: 700; color: var(--accent-color, #ff9f0a);" title="More Constants">CONST</button>
            </div>

            <div class="calc-keypad">
              <button id="btn-clear" class="calc-btn btn-func" title="Clear (Escape / Delete)">AC</button>
              <button id="btn-backspace" class="calc-btn btn-func" title="Backspace (Backspace)">⌫</button>
              <button id="btn-percent" data-percent="%" class="calc-btn btn-func" title="Percent (%)">%</button>
              <button data-op="÷" class="calc-btn btn-op" title="Divide (/)">÷</button>

              <button data-num="7" class="calc-btn btn-num">7</button>
              <button data-num="8" class="calc-btn btn-num">8</button>
              <button data-num="9" class="calc-btn btn-num">9</button>
              <button data-op="×" class="calc-btn btn-op" title="Multiply (*)">×</button>

              <button data-num="4" class="calc-btn btn-num">4</button>
              <button data-num="5" class="calc-btn btn-num">5</button>
              <button data-num="6" class="calc-btn btn-num">6</button>
              <button data-op="−" class="calc-btn btn-op" title="Subtract (-)">−</button>

              <button data-num="1" class="calc-btn btn-num">1</button>
              <button data-num="2" class="calc-btn btn-num">2</button>
              <button data-num="3" class="calc-btn btn-num">3</button>
              <button data-op="+" class="calc-btn btn-op" title="Add (+)">+</button>

              <button data-num="0" class="calc-btn btn-num">0</button>
              <button data-num="00" class="calc-btn btn-num">00</button>
              <button data-num="." class="calc-btn btn-num">.</button>
              <button id="btn-equals" class="calc-btn btn-op" title="Calculate (Enter / =)">=</button>
            </div>
          </div>

          <!-- Desktop Side History Tape Panel -->
          <aside class="desktop-history-pane">
            <div class="desktop-history-header">
              <span>${t('historyTape')}</span>
              <button id="btn-clear-desktop-history" class="btn-clear-tape" title="Clear History Tape">${t('clear')}</button>
            </div>
            <div id="desktop-history-list" class="desktop-history-list"></div>
          </aside>
        </div>

        <!-- Specialized Module View Container -->
        <div id="view-module" class="view-module-container" style="display: none;"></div>
      </div>
    </div>

    <!-- Navigation Drawer Modal -->
    <div id="modal-menu" class="modal-overlay">
      <div class="drawer-menu">
        <div class="drawer-header">
          <span>${t('calculators')}</span>
          <button id="btn-close-menu" class="btn-icon">✕</button>
        </div>
        <div class="drawer-list" id="drawer-list"></div>
      </div>
    </div>

    <!-- History Drawer Modal -->
    <div id="modal-history" class="modal-overlay">
      <div class="drawer-history">
        <div class="drawer-header">
          <span>${t('history')}</span>
          <button id="btn-close-history" class="btn-icon">✕</button>
        </div>
        <div class="drawer-list" id="history-list"></div>
        <div class="history-footer">
          <button id="btn-clear-history" class="btn-clear-history">${t('clearHistory')}</button>
        </div>
      </div>
    </div>

    <!-- Language Selection Modal -->
    <div id="modal-language" class="modal-overlay center-modal">
      <div class="dialog-language">
        <div class="drawer-header">
          <span id="language-title">🌐 ${t('language')} / Idioma</span>
          <button id="btn-close-language" class="btn-icon">✕</button>
        </div>
        <div class="language-list" id="language-options-list"></div>
      </div>
    </div>

    <!-- Mathematical & Physical Constants Modal -->
    <div id="modal-constants" class="modal-overlay center-modal">
      <div class="dialog-constants">
        <div class="drawer-header">
          <span>📐 Mathematical & Physical Constants</span>
          <button id="btn-close-constants" class="btn-icon">✕</button>
        </div>
        <div class="constants-search-box">
          <input type="text" id="const-search-input" class="form-input" placeholder="Search constants (e.g. Planck, c, G, φ)..." />
        </div>
        <div class="constants-list" id="constants-list"></div>
      </div>
    </div>

    <!-- User Settings Modal -->
    <div id="modal-settings" class="modal-overlay">
      <div class="drawer-history">
        <div class="drawer-header">
          <span id="settings-title">${t('settings')}</span>
          <button id="btn-close-settings" class="btn-icon">✕</button>
        </div>
        <div class="drawer-settings-scroll">
          <div class="input-card">
            <label class="input-label" id="lbl-language">${t('language')} / Idioma</label>
            <select id="set-language" class="form-select" style="width: 100%; margin-bottom: 14px;">
              ${SUPPORTED_LANGUAGES.map((l) => `<option value="${l.code}" ${l.code === getLanguage() ? 'selected' : ''}>${l.flag} ${l.nativeName} (${l.name})</option>`).join('')}
            </select>

            <label class="input-label" id="lbl-number-format">${t('numberFormat')}</label>
            <select id="set-number-format" class="form-select" style="width: 100%; margin-bottom: 14px;">
              <option value="indian" ${userSettings.numberFormat === 'indian' ? 'selected' : ''}>Indian Lakhs & Crores (12,34,567.89)</option>
              <option value="international" ${userSettings.numberFormat === 'international' ? 'selected' : ''}>Standard International (1,234,567.89)</option>
              <option value="european" ${userSettings.numberFormat === 'european' ? 'selected' : ''}>European (1.234.567,89)</option>
              <option value="auto" ${userSettings.numberFormat === 'auto' ? 'selected' : ''}>🌐 Auto (Locale Based)</option>
            </select>

            <label class="input-label" id="lbl-precision">Decimal Precision</label>
            <select id="set-precision" class="form-select" style="width: 100%; margin-bottom: 14px;">
              <option value="auto" ${userSettings.precision === 'auto' ? 'selected' : ''}>✨ Auto (Dynamic Trim)</option>
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${userSettings.precision === n ? 'selected' : ''}>${n} (${n} decimal place${n > 1 ? 's' : ''})</option>`).join('')}
            </select>

            <label class="input-label" id="lbl-angle-mode">${t('angleMode')}</label>
            <div class="segmented-control">
              <button id="set-deg" class="seg-btn ${userSettings.angleMode === 'DEG' ? 'active' : ''}">${t('deg')}</button>
              <button id="set-rad" class="seg-btn ${userSettings.angleMode === 'RAD' ? 'active' : ''}">${t('rad')}</button>
            </div>

            <label class="input-label" id="lbl-haptic">${t('hapticFeedback')}</label>
            <div class="segmented-control">
              <button id="set-haptic-on" class="seg-btn ${userSettings.hapticFeedback ? 'active' : ''}">${t('on')}</button>
              <button id="set-haptic-off" class="seg-btn ${!userSettings.hapticFeedback ? 'active' : ''}">${t('off')}</button>
            </div>

            <label class="input-label" id="lbl-sound">${t('soundFeedback')}</label>
            <div class="segmented-control">
              <button id="set-sound-on" class="seg-btn ${userSettings.soundFeedback ? 'active' : ''}">${t('on')}</button>
              <button id="set-sound-off" class="seg-btn ${!userSettings.soundFeedback ? 'active' : ''}">${t('off')}</button>
            </div>

            <label class="input-label" id="lbl-default-tool">${t('defaultCalculator')}</label>
            <select id="set-default-tool" class="form-select" style="width: 100%;">
              ${CALCULATOR_MODES.map((m) => `<option value="${m.id}" ${m.id === userSettings.defaultCalculatorId ? 'selected' : ''}>${m.icon} ${getModuleName(m.id)}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    </div>
  `;

  let draggedModeId: string | null = null;

  function toggleFavoriteMode(modeId: string) {
    const favs = [...(userSettings.menuFavorites || ['NOR', 'LON', 'TAX', 'UNT'])];
    const idx = favs.indexOf(modeId);
    if (idx >= 0) {
      favs.splice(idx, 1);
      showToast('Removed from favorites');
    } else {
      favs.push(modeId);
      showToast('Added to favorites ⭐');
    }
    userSettings.menuFavorites = favs;
    updateSettings({ menuFavorites: favs });
    renderCalculatorLists();
  }

  function reorderFavorites(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const favs = [...(userSettings.menuFavorites || ['NOR', 'LON', 'TAX', 'UNT'])];
    const sourceIdx = favs.indexOf(sourceId);
    const targetIdx = favs.indexOf(targetId);
    if (sourceIdx < 0 || targetIdx < 0) return;

    favs.splice(sourceIdx, 1);
    favs.splice(targetIdx, 0, sourceId);
    userSettings.menuFavorites = favs;
    updateSettings({ menuFavorites: favs });
    renderCalculatorLists();
    showToast('Favorites reordered ↕️');
  }

  function renderCalculatorLists() {
    const drawerList = document.getElementById('drawer-list');
    const desktopSidebarList = document.getElementById('desktop-sidebar-list');

    if (drawerList) drawerList.innerHTML = '';
    if (desktopSidebarList) desktopSidebarList.innerHTML = '';

    const favorites = userSettings.menuFavorites || ['NOR', 'LON', 'TAX', 'UNT'];
    const favoriteModes = favorites
      .map((id) => CALCULATOR_MODES.find((m) => m.id === id))
      .filter(Boolean) as typeof CALCULATOR_MODES;

    // Helper to render Mobile Drawer item
    function createDrawerItem(mode: typeof CALCULATOR_MODES[0], isFavSection: boolean = false) {
      const localizedName = getModuleName(mode.id);
      const isFav = favorites.includes(mode.id);

      const item = document.createElement('div');
      item.setAttribute('data-id', mode.id);
      item.className = `drawer-item ${mode.id === state.activeCalculatorId ? 'active' : ''}`;
      item.draggable = isFavSection;

      item.innerHTML = `
        <div class="drawer-item-content">
          ${isFavSection ? '<span class="drawer-drag-handle" title="Drag to reorder">⋮⋮</span>' : ''}
          <span style="font-size: 18px;">${mode.icon}</span>
          <span class="drawer-item-title">${localizedName}</span>
        </div>
        <div class="drawer-item-actions">
          <button class="btn-star-fav ${isFav ? 'active' : ''}" data-fav-id="${mode.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
            ${isFav ? '⭐' : '☆'}
          </button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.btn-star-fav')) return;
        switchMode(mode.id, localizedName);
      });

      const starBtn = item.querySelector('.btn-star-fav');
      starBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteMode(mode.id);
      });

      if (isFavSection) {
        item.addEventListener('dragstart', (e) => {
          draggedModeId = mode.id;
          item.classList.add('dragging');
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', mode.id);
          }
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (draggedModeId && draggedModeId !== mode.id) {
            item.classList.add('drag-over');
          }
        });

        item.addEventListener('dragleave', () => {
          item.classList.remove('drag-over');
        });

        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.classList.remove('drag-over');
          if (draggedModeId && draggedModeId !== mode.id) {
            reorderFavorites(draggedModeId, mode.id);
          }
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          document.querySelectorAll('.drawer-item').forEach((el) => el.classList.remove('drag-over'));
          draggedModeId = null;
        });
      }

      return item;
    }

    // Helper to render Desktop Sidebar item
    function createSidebarItem(mode: typeof CALCULATOR_MODES[0]) {
      const localizedName = getModuleName(mode.id);
      const isFav = favorites.includes(mode.id);

      const item = document.createElement('div');
      item.setAttribute('data-id', mode.id);
      item.setAttribute('title', localizedName);
      item.className = `sidebar-item ${mode.id === state.activeCalculatorId ? 'active' : ''}`;
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
          <span class="sidebar-item-icon">${mode.icon}</span>
          <span class="sidebar-item-name">${localizedName}</span>
        </div>
        <button class="btn-star-fav ${isFav ? 'active' : ''}" data-sidebar-fav="${mode.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
          ${isFav ? '⭐' : '☆'}
        </button>
      `;

      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.btn-star-fav')) return;
        switchMode(mode.id, localizedName);
      });

      const starBtn = item.querySelector('[data-sidebar-fav]');
      starBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteMode(mode.id);
      });

      return item;
    }

    // 1. Render Favorites Section in Drawer
    if (drawerList && favoriteModes.length > 0) {
      const favHeader = document.createElement('div');
      favHeader.className = 'drawer-category-header';
      favHeader.innerHTML = `
        <span>⭐ Favorites</span>
        <span class="drawer-category-badge">${favoriteModes.length} pinned</span>
      `;
      drawerList.appendChild(favHeader);

      favoriteModes.forEach((mode) => {
        drawerList.appendChild(createDrawerItem(mode, true));
      });
    }

    // 2. Render Categorized Sections in Drawer
    if (drawerList) {
      MENU_CATEGORIES.forEach((cat) => {
        const catModes = cat.moduleIds
          .map((id) => CALCULATOR_MODES.find((m) => m.id === id))
          .filter(Boolean) as typeof CALCULATOR_MODES;

        const catHeader = document.createElement('div');
        catHeader.className = 'drawer-category-header';
        catHeader.innerHTML = `
          <span>${cat.name}</span>
          <span class="drawer-category-badge">${catModes.length}</span>
        `;
        drawerList.appendChild(catHeader);

        catModes.forEach((mode) => {
          drawerList.appendChild(createDrawerItem(mode, false));
        });
      });
    }

    // 3. Render Desktop Sidebar (Favorites first, then Categorized)
    if (desktopSidebarList) {
      if (favoriteModes.length > 0) {
        const favHeader = document.createElement('div');
        favHeader.className = 'drawer-category-header sidebar-cat-header';
        favHeader.innerHTML = `
          <span>⭐ Favorites</span>
          <span class="drawer-category-badge">${favoriteModes.length}</span>
        `;
        desktopSidebarList.appendChild(favHeader);

        favoriteModes.forEach((mode) => {
          desktopSidebarList.appendChild(createSidebarItem(mode));
        });
      }

      MENU_CATEGORIES.forEach((cat) => {
        const catModes = cat.moduleIds
          .map((id) => CALCULATOR_MODES.find((m) => m.id === id))
          .filter(Boolean) as typeof CALCULATOR_MODES;

        const catHeader = document.createElement('div');
        catHeader.className = 'drawer-category-header sidebar-cat-header';
        catHeader.innerHTML = `
          <span>${cat.name}</span>
          <span class="drawer-category-badge">${catModes.length}</span>
        `;
        desktopSidebarList.appendChild(catHeader);

        catModes.forEach((mode) => {
          desktopSidebarList.appendChild(createSidebarItem(mode));
        });
      });
    }
  }

  function updateDefaultToolOptions() {
    const setDefaultTool = document.getElementById('set-default-tool') as HTMLSelectElement;
    if (!setDefaultTool) return;
    const currentVal = setDefaultTool.value || userSettings.defaultCalculatorId;
    setDefaultTool.innerHTML = CALCULATOR_MODES.map(
      (m) => `<option value="${m.id}" ${m.id === currentVal ? 'selected' : ''}>${m.icon} ${getModuleName(m.id)}</option>`
    ).join('');
  }

  renderCalculatorLists();

  // Keypad bindings
  document.querySelectorAll('[data-num]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const num = btn.getAttribute('data-num');
      if (num) handleNumber(num);
    });
  });

  document.querySelectorAll('[data-op]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const op = btn.getAttribute('data-op');
      if (op) handleOperation(op);
    });
  });

  document.querySelectorAll('[data-paren]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const paren = btn.getAttribute('data-paren');
      if (paren) handleParenthesis(paren);
    });
  });

  document.querySelectorAll('[data-fn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fn = btn.getAttribute('data-fn');
      if (fn) handleFunction(fn);
    });
  });

  document.querySelectorAll('[data-const]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const c = btn.getAttribute('data-const');
      if (c) handleConstant(c);
    });
  });

  document.querySelectorAll('[data-postfix]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-postfix');
      if (p) handlePostfix(p);
    });
  });

  document.querySelectorAll('[data-percent]').forEach((btn) => {
    btn.addEventListener('click', handlePercent);
  });

  document.getElementById('btn-sqrt')?.addEventListener('click', handleSquareRoot);
  document.getElementById('btn-clear')?.addEventListener('click', handleClear);
  document.getElementById('btn-equals')?.addEventListener('click', handleEquals);
  document.getElementById('btn-backspace')?.addEventListener('click', handleBackspace);
  document.getElementById('btn-sign')?.addEventListener('click', handleToggleSign);

  // Tap-to-position cursor on display box
  const calcDisplayBox = document.getElementById('calc-display-box');
  calcDisplayBox?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const token = target.closest('.char-token') as HTMLElement;
    if (token && token.dataset.idx !== undefined) {
      const idx = parseInt(token.dataset.idx, 10);
      const rect = token.getBoundingClientRect();
      const isRightHalf = (e as MouseEvent).clientX > (rect.left + rect.width / 2);
      setCursorPos(isRightHalf ? idx + 1 : idx);
    } else if (state.isResultDisplayed) {
      state.isResultDisplayed = false;
      setCursorPos(state.formula.length);
      updateDisplay();
    } else {
      setCursorPos(state.formula.length);
    }
  });

  // Constants Modal logic
  const modalConstants = document.getElementById('modal-constants');
  const btnOpenConst = document.getElementById('btn-open-const');
  const btnCloseConst = document.getElementById('btn-close-constants');
  const constSearchInput = document.getElementById('const-search-input') as HTMLInputElement;
  const constantsList = document.getElementById('constants-list');

  function renderConstantsList(filter: string = '') {
    if (!constantsList) return;
    const q = filter.trim().toLowerCase();
    const filtered = EXTENDED_CONSTANTS.filter((c) =>
      !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );

    constantsList.innerHTML = filtered.map((c) => `
      <div class="constant-item" data-symbol="${c.symbol}">
        <div class="constant-left">
          <div class="constant-symbol-badge">${c.symbol}</div>
          <div class="constant-info">
            <span class="constant-name">${c.name}</span>
            <span class="constant-val">${c.value} ${c.unit}</span>
          </div>
        </div>
        <span style="font-size: 12px; color: var(--accent-color, #ff9f0a); font-weight: 600;">Insert ↵</span>
      </div>
    `).join('');

    constantsList.querySelectorAll('[data-symbol]').forEach((item) => {
      item.addEventListener('click', () => {
        const sym = item.getAttribute('data-symbol');
        if (sym) {
          handleConstant(sym);
          modalConstants?.classList.remove('open');
        }
      });
    });
  }

  btnOpenConst?.addEventListener('click', () => {
    renderConstantsList();
    if (constSearchInput) constSearchInput.value = '';
    modalConstants?.classList.add('open');
  });

  btnCloseConst?.addEventListener('click', () => {
    modalConstants?.classList.remove('open');
  });

  modalConstants?.addEventListener('click', (e) => {
    if (e.target === modalConstants) modalConstants.classList.remove('open');
  });

  constSearchInput?.addEventListener('input', () => {
    renderConstantsList(constSearchInput.value);
  });

  // Scientific keypad toggle (fx)
  const btnToggleSci = document.getElementById('btn-toggle-sci');
  const sciKeypad = document.getElementById('sci-keypad');
  btnToggleSci?.addEventListener('click', () => {
    triggerHaptic();
    state.isScientificOpen = !state.isScientificOpen;
    btnToggleSci.classList.toggle('active', state.isScientificOpen);
    if (sciKeypad) {
      sciKeypad.style.display = state.isScientificOpen ? 'grid' : 'none';
    }
  });

  // Angle mode button toggle (DEG / RAD)
  const btnAngle = document.getElementById('btn-angle-mode');
  btnAngle?.addEventListener('click', () => {
    triggerHaptic();
    const newMode = userSettings.angleMode === 'DEG' ? 'RAD' : 'DEG';
    userSettings.angleMode = newMode;
    updateSettings({ angleMode: newMode });
    updateDisplay();
  });

  // Drawer modal controls & Desktop Sidebar collapse toggle
  const modalMenu = document.getElementById('modal-menu');
  const btnMenu = document.getElementById('btn-menu');
  const btnCloseMenu = document.getElementById('btn-close-menu');
  const desktopShell = document.querySelector('.desktop-shell');
  const btnCollapseSidebar = document.getElementById('btn-collapse-sidebar');

  function toggleDesktopSidebar(forceState?: boolean): void {
    if (!desktopShell) return;
    const isCollapsed = desktopShell.classList.contains('sidebar-collapsed');
    const targetState = typeof forceState === 'boolean' ? forceState : !isCollapsed;
    desktopShell.classList.toggle('sidebar-collapsed', targetState);
    if (btnCollapseSidebar) {
      btnCollapseSidebar.textContent = targetState ? '▶' : '◀';
      btnCollapseSidebar.title = targetState ? 'Expand sidebar' : 'Collapse sidebar';
    }
    try {
      localStorage.setItem('everycalc-sidebar-collapsed', targetState ? 'true' : 'false');
    } catch {}
  }

  // Restore remembered sidebar state on widescreen / foldables (DEFAULT TO COLLAPSED ICON RAIL like ChatGPT)
  try {
    const savedState = localStorage.getItem('everycalc-sidebar-collapsed');
    const shouldCollapse = savedState === null || savedState === 'true';
    if (shouldCollapse && desktopShell) {
      desktopShell.classList.add('sidebar-collapsed');
      if (btnCollapseSidebar) {
        btnCollapseSidebar.textContent = '▶';
        btnCollapseSidebar.title = 'Expand sidebar';
      }
    } else if (btnCollapseSidebar) {
      btnCollapseSidebar.textContent = '◀';
      btnCollapseSidebar.title = 'Collapse sidebar';
    }
  } catch {}

  btnCollapseSidebar?.addEventListener('click', () => {
    toggleDesktopSidebar();
  });

  const sidebarSearch = document.querySelector('.desktop-sidebar-search') as HTMLElement;
  const desktopSearchInput = document.getElementById('desktop-search-input') as HTMLInputElement;
  sidebarSearch?.addEventListener('click', () => {
    if (desktopShell?.classList.contains('sidebar-collapsed')) {
      toggleDesktopSidebar(false);
      setTimeout(() => desktopSearchInput?.focus(), 250);
    }
  });

  // Touch swipe gestures to expand and collapse sidebar and mobile drawers
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwipingSidebar = false;

  window.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      const target = e.target as HTMLElement;

      const isMobile = window.innerWidth < 700;
      const inSidebar = !!target.closest('.desktop-sidebar');
      const inDrawer = !!target.closest('#modal-menu');
      const drawerIsOpen = !!modalMenu?.classList.contains('open');

      if (isMobile) {
        // On folded/mobile screen: allow swipe-open from left half (<= 45% or 160px),
        // and allow swipe-close from anywhere when drawer is open
        isSwipingSidebar = drawerIsOpen || inDrawer || touchStartX <= Math.max(160, window.innerWidth * 0.45);
      } else {
        // Desktop / Foldable widescreen (>=700px)
        const nearLeftEdge = touchStartX <= 100;
        isSwipingSidebar = inSidebar || nearLeftEdge;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    (e: TouchEvent) => {
      if (!isSwipingSidebar || e.changedTouches.length !== 1) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Trigger if predominantly horizontal swipe (> 1.15x vertical and > 38px distance)
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.15 && Math.abs(deltaX) > 38) {
        if (window.innerWidth >= 700) {
          // Desktop / Unfolded screen (>=700px)
          if (deltaX > 0 && desktopShell?.classList.contains('sidebar-collapsed')) {
            // Swipe right -> Expand sidebar
            toggleDesktopSidebar(false);
          } else if (deltaX < 0 && !desktopShell?.classList.contains('sidebar-collapsed')) {
            // Swipe left -> Collapse sidebar
            toggleDesktopSidebar(true);
          }
        } else {
          // Folded mobile screen (<700px)
          if (deltaX > 0 && !modalMenu?.classList.contains('open')) {
            // Swipe right from anywhere on left side -> Open mobile drawer
            modalMenu?.classList.add('open');
          } else if (deltaX < 0 && modalMenu?.classList.contains('open')) {
            // Swipe left -> Close mobile drawer
            modalMenu?.classList.remove('open');
          }
        }
      }
      isSwipingSidebar = false;
    },
    { passive: true }
  );

  btnMenu?.addEventListener('click', () => {
    if (window.innerWidth >= 700) {
      toggleDesktopSidebar();
    } else {
      modalMenu?.classList.add('open');
    }
  });
  btnCloseMenu?.addEventListener('click', () => modalMenu?.classList.remove('open'));
  modalMenu?.addEventListener('click', (e) => {
    if (e.target === modalMenu) modalMenu.classList.remove('open');
  });

  // History modal controls
  const modalHistory = document.getElementById('modal-history');
  const btnHistory = document.getElementById('btn-history');
  const btnCloseHistory = document.getElementById('btn-close-history');
  const btnClearHistory = document.getElementById('btn-clear-history');

  btnHistory?.addEventListener('click', () => {
    renderHistoryList();
    modalHistory?.classList.add('open');
  });
  btnCloseHistory?.addEventListener('click', () => modalHistory?.classList.remove('open'));
  modalHistory?.addEventListener('click', (e) => {
    if (e.target === modalHistory) modalHistory.classList.remove('open');
  });

  btnClearHistory?.addEventListener('click', () => {
    clearHistory();
    renderHistoryList();
  });

  // Settings modal controls
  const modalSettings = document.getElementById('modal-settings');
  const btnSettings = document.getElementById('btn-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');

  btnSettings?.addEventListener('click', () => modalSettings?.classList.add('open'));
  btnCloseSettings?.addEventListener('click', () => modalSettings?.classList.remove('open'));
  modalSettings?.addEventListener('click', (e) => {
    if (e.target === modalSettings) modalSettings.classList.remove('open');
  });

  const setDeg = document.getElementById('set-deg');
  const setRad = document.getElementById('set-rad');
  setDeg?.addEventListener('click', () => {
    userSettings.angleMode = 'DEG';
    updateSettings({ angleMode: 'DEG' });
    setDeg.classList.add('active');
    setRad?.classList.remove('active');
    updateDisplay();
  });
  setRad?.addEventListener('click', () => {
    userSettings.angleMode = 'RAD';
    updateSettings({ angleMode: 'RAD' });
    setRad.classList.add('active');
    setDeg?.classList.remove('active');
    updateDisplay();
  });

  const setHapticOn = document.getElementById('set-haptic-on');
  const setHapticOff = document.getElementById('set-haptic-off');
  setHapticOn?.addEventListener('click', () => {
    userSettings.hapticFeedback = true;
    updateSettings({ hapticFeedback: true });
    setHapticOn.classList.add('active');
    setHapticOff?.classList.remove('active');
  });
  setHapticOff?.addEventListener('click', () => {
    userSettings.hapticFeedback = false;
    updateSettings({ hapticFeedback: false });
    setHapticOff.classList.add('active');
    setHapticOn?.classList.remove('active');
  });

  const setSoundOn = document.getElementById('set-sound-on');
  const setSoundOff = document.getElementById('set-sound-off');
  setSoundOn?.addEventListener('click', () => {
    userSettings.soundFeedback = true;
    updateSettings({ soundFeedback: true });
    setSoundOn.classList.add('active');
    setSoundOff?.classList.remove('active');
    playKeyClick();
  });
  setSoundOff?.addEventListener('click', () => {
    userSettings.soundFeedback = false;
    updateSettings({ soundFeedback: false });
    setSoundOff.classList.add('active');
    setSoundOn?.classList.remove('active');
  });

  const setDefaultTool = document.getElementById('set-default-tool') as HTMLSelectElement;
  setDefaultTool?.addEventListener('change', () => {
    userSettings.defaultCalculatorId = setDefaultTool.value;
    updateSettings({ defaultCalculatorId: setDefaultTool.value });
  });

  const setNumberFormat = document.getElementById('set-number-format') as HTMLSelectElement;
  setNumberFormat?.addEventListener('change', () => {
    const val = setNumberFormat.value as any;
    userSettings.numberFormat = val;
    updateSettings({ numberFormat: val });
    updateDisplay();
    switchMode(state.activeCalculatorId);
    showToast(`Number format: ${setNumberFormat.options[setNumberFormat.selectedIndex].text}`);
  });

  const setPrecision = document.getElementById('set-precision') as HTMLSelectElement;
  setPrecision?.addEventListener('change', () => {
    const val: 'auto' | number = setPrecision.value === 'auto' ? 'auto' : parseInt(setPrecision.value, 10);
    userSettings.precision = val;
    userSettings.masterPrecision = val;
    updateSettings({ precision: val, masterPrecision: val });
    updateDisplay();
    switchMode(state.activeCalculatorId);
    showToast(`Precision: ${setPrecision.options[setPrecision.selectedIndex].text}`);
  });


  const modalLanguage = document.getElementById('modal-language');
  const btnCloseLanguage = document.getElementById('btn-close-language');
  const languageOptionsList = document.getElementById('language-options-list');

  function renderLanguageOptions(): void {
    if (!languageOptionsList) return;
    const currentLang = getLanguage();
    languageOptionsList.innerHTML = SUPPORTED_LANGUAGES.map((l) => `
      <div class="language-option ${l.code === currentLang ? 'active' : ''}" data-lang="${l.code}">
        <div class="language-option-info">
          <span class="language-flag">${l.flag}</span>
          <span>${l.nativeName} <small style="opacity: 0.65; font-size: 0.85em;">(${l.name})</small></span>
        </div>
        ${l.code === currentLang ? '<span class="language-check">✓</span>' : ''}
      </div>
    `).join('');

    languageOptionsList.querySelectorAll('[data-lang]').forEach((item) => {
      item.addEventListener('click', () => {
        const selectedCode = item.getAttribute('data-lang') as SupportedLanguage;
        if (selectedCode) {
          applyLanguageChange(selectedCode);
          modalLanguage?.classList.remove('open');
        }
      });
    });
  }

  function applyLanguageChange(newLang: SupportedLanguage): void {
    setLanguage(newLang);
    userSettings.language = newLang;
    updateSettings({ language: newLang });
    renderCalculatorLists();
    switchMode(state.activeCalculatorId);
    updateDefaultToolOptions();
    renderLanguageOptions();

    if (setLanguageSelect) setLanguageSelect.value = newLang;

    const searchInput = document.getElementById('desktop-search-input') as HTMLInputElement;
    if (searchInput) searchInput.placeholder = t('searchPlaceholder');

    const drawerTitle = document.querySelector('#modal-menu .drawer-header span');
    if (drawerTitle) drawerTitle.textContent = t('calculators');

    const historyDrawerTitle = document.querySelector('#modal-history .drawer-header span');
    if (historyDrawerTitle) historyDrawerTitle.textContent = t('history');

    const clearHistoryBtn = document.getElementById('btn-clear-history');
    if (clearHistoryBtn) clearHistoryBtn.textContent = t('clearHistory');

    const desktopHistoryHeader = document.querySelector('.desktop-history-header span');
    if (desktopHistoryHeader) desktopHistoryHeader.textContent = t('historyTape');

    const clearTapeBtn = document.getElementById('btn-clear-desktop-history');
    if (clearTapeBtn) clearTapeBtn.textContent = t('clear');

    const settingsTitle = document.getElementById('settings-title');
    if (settingsTitle) settingsTitle.textContent = t('settings');

    const langModalTitle = document.getElementById('language-title');
    if (langModalTitle) langModalTitle.textContent = `🌐 ${t('language')} / Idioma`;

    const lblLang = document.getElementById('lbl-language');
    if (lblLang) lblLang.textContent = `${t('language')} / Idioma`;

    const lblAngle = document.getElementById('lbl-angle-mode');
    if (lblAngle) lblAngle.textContent = t('angleMode');

    const lblHaptic = document.getElementById('lbl-haptic');
    if (lblHaptic) lblHaptic.textContent = t('hapticFeedback');

    const lblSound = document.getElementById('lbl-sound');
    if (lblSound) lblSound.textContent = t('soundFeedback');

    const lblDefault = document.getElementById('lbl-default-tool');
    if (lblDefault) lblDefault.textContent = t('defaultCalculator');

    const langName = SUPPORTED_LANGUAGES.find((l) => l.code === newLang)?.nativeName || newLang;
    showToast(`${t('language')}: ${langName}`);
  }

  const setLanguageSelect = document.getElementById('set-language') as HTMLSelectElement;
  setLanguageSelect?.addEventListener('change', () => {
    const newLang = setLanguageSelect.value as SupportedLanguage;
    applyLanguageChange(newLang);
  });

  renderLanguageOptions();

  const btnLang = document.getElementById('btn-lang');
  btnLang?.addEventListener('click', () => {
    renderLanguageOptions();
    modalLanguage?.classList.add('open');
  });
  btnCloseLanguage?.addEventListener('click', () => modalLanguage?.classList.remove('open'));
  modalLanguage?.addEventListener('click', (e) => {
    if (e.target === modalLanguage) modalLanguage.classList.remove('open');
  });

  // Theme toggle
  const btnTheme = document.getElementById('btn-theme');
  btnTheme?.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
    localStorage.setItem('everycalc-theme', isLight ? 'dark' : 'light');
  });

  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('theme');
  if (themeParam === 'light' || themeParam === 'dark') {
    document.documentElement.setAttribute('data-theme', themeParam);
  } else {
    const savedTheme = localStorage.getItem('everycalc-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  // Display box click to copy
  const displayBox = document.getElementById('calc-display-box');
  displayBox?.addEventListener('click', () => {
    copyCurrentResult();
  });

  // Desktop history clear
  const btnClearDesktopHistory = document.getElementById('btn-clear-desktop-history');
  btnClearDesktopHistory?.addEventListener('click', () => {
    clearHistory();
    renderHistoryList();
    showToast('History tape cleared');
  });

  // Desktop sidebar search filter
  const searchInput = document.getElementById('desktop-search-input') as HTMLInputElement;
  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    document.querySelectorAll('.sidebar-item').forEach((item) => {
      const text = item.textContent?.toLowerCase() || '';
      (item as HTMLElement).style.display = !q || text.includes(q) ? 'flex' : 'none';
    });
    document.querySelectorAll('.sidebar-cat-header').forEach((hdr) => {
      (hdr as HTMLElement).style.display = q ? 'none' : 'flex';
    });
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstVisible = document.querySelector('.sidebar-item:not([style*="display: none"])') as HTMLElement;
      if (firstVisible) {
        firstVisible.click();
        searchInput.blur();
      }
    }
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.blur();
    }
  });

  // Global Ctrl+K / Cmd+K to focus search
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      searchInput?.focus();
      searchInput?.select();
    }
  });

  // Keyboard setup
  setupKeyboard();

  // Check URL hash or search param for direct tool deep-linking (e.g. #GST or ?tool=GST)
  const toolParam = urlParams.get('tool') || window.location.hash.replace('#', '');
  if (toolParam) {
    const p = toolParam.toLowerCase();
    const targetMode = CALCULATOR_MODES.find(
      (m) => m.id.toLowerCase() === p || m.name.toLowerCase().includes(p)
    );
    if (targetMode) {
      switchMode(targetMode.id, getModuleName(targetMode.id));
    }
  } else if (userSettings.defaultCalculatorId && userSettings.defaultCalculatorId !== 'NOR') {
    const defaultMode = CALCULATOR_MODES.find((m) => m.id === userSettings.defaultCalculatorId);
    if (defaultMode) {
      switchMode(defaultMode.id, getModuleName(defaultMode.id));
    }
  } else {
    switchMode('NOR', getModuleName('NOR'));
  }
}

// Register Service Worker for offline PWA functionality & auto-update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        // Actively check for service worker updates on app load
        registration.update().catch(() => {});

        // Re-check when app regains focus/visibility
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
      })
      .catch((err) => {
        console.warn('PWA service worker registration failed:', err);
      });

    // Auto-reload once the new service worker activates and claims the client
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// Initialize UI
setupApp();
updateDisplay();
