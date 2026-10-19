import { formatNumber, getIndianWords } from './core/math.ts';
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
import {
  syncRemoteMonetizationConfig,
  createAdSenseContainer
} from './core/monetization/engine.ts';
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
    moduleIds: ['TAX', 'GLD', 'LON', 'IRA', 'ITX', 'SAL', 'CUR']
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
    displayWords.textContent = getIndianWords(state.formula);
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

  const before = state.formula.slice(0, state.cursorPos);
  const after = state.formula.slice(state.cursorPos);

  const fnMatch = before.match(/(asin|acos|atan|sinh|cosh|tanh|sqrt|sin|cos|tan|log|ln)\($/);
  if (fnMatch) {
    state.formula = before.slice(0, -fnMatch[0].length) + after;
    state.cursorPos -= fnMatch[0].length;
  } else if (before.endsWith(' ') && before.length >= 3) {
    const opMatch = before.match(/\s[+\-−×*÷/^]\s$/);
    if (opMatch) {
      state.formula = before.slice(0, -opMatch[0].length) + after;
      state.cursorPos -= opMatch[0].length;
    } else {
      state.formula = before.slice(0, -1) + after;
      state.cursorPos--;
    }
  } else {
    state.formula = before.slice(0, -1) + after;
    state.cursorPos--;
  }

  if (state.formula === '') {
    state.formula = '0';
    state.cursorPos = 1;
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

  if (window.location.hash !== `#${modeId}`) {
    window.history.replaceState(null, '', `#${modeId}`);
  }

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

  refreshActiveAdSlots();
}

function refreshActiveAdSlots(): void {
  const desktopSidebarAd = document.getElementById('desktop-sidebar-ad');
  if (desktopSidebarAd) {
    desktopSidebarAd.innerHTML = '';
    const adContainer = createAdSenseContainer('desktop-pane');
    if (adContainer) {
      desktopSidebarAd.appendChild(adContainer);
    }
  }

  const drawerMenuAd = document.getElementById('drawer-menu-ad');
  if (drawerMenuAd) {
    drawerMenuAd.innerHTML = '';
    const adContainer = createAdSenseContainer('bottom-sticky');
    if (adContainer) {
      drawerMenuAd.appendChild(adContainer);
    }
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
          <span class="desktop-logo-icon">🧮</span>
          <span class="desktop-logo-text">EveryCalc</span>
        </div>
        <div class="desktop-sidebar-search">
          <span class="search-icon">🔍</span>
          <input type="text" id="desktop-search-input" class="desktop-search-input" placeholder="${t('searchPlaceholder')}" autocomplete="off" />
        </div>
        <div class="desktop-sidebar-list" id="desktop-sidebar-list"></div>
        <div id="desktop-sidebar-ad" class="desktop-sidebar-ad-container"></div>
      </aside>

      <!-- Main App Area -->
      <div class="desktop-main-area">
        <header class="calc-header">
          <div class="calc-title-group">
            <button id="btn-menu" class="btn-icon" aria-label="Open Menu">☰</button>
            <span id="header-title" class="calc-title">${state.activeCalculatorName}</span>
          </div>
          <div class="calc-actions">
            <button id="btn-install-app" class="btn-header-install" style="display: none;" title="Install PWA App (Save to Home Screen)">
              <span class="install-icon">📲</span>
              <span class="install-text">Install App</span>
            </button>
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
              <button class="btn-sub" id="btn-open-const-bar" style="font-weight: 700; color: var(--accent-color, #ff9f0a);" title="Constants (π, e, φ, etc.)">π/e</button>
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
        <div id="drawer-menu-ad" class="drawer-menu-ad-container"></div>
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
        <div class="module-view" style="padding: 16px;">
          <div class="input-card">
            <label class="input-label" id="lbl-language">${t('language')} / Idioma</label>
            <select id="set-language" class="form-select" style="width: 100%; margin-bottom: 14px;">
              ${SUPPORTED_LANGUAGES.map((l) => `<option value="${l.code}" ${l.code === getLanguage() ? 'selected' : ''}>${l.flag} ${l.nativeName} (${l.name})</option>`).join('')}
            </select>

            <label class="input-label" id="lbl-number-format">${t('numberFormat')}</label>
            <select id="set-number-format" class="form-select" style="width: 100%; margin-bottom: 14px;">
              <option value="auto" ${userSettings.numberFormat === 'auto' ? 'selected' : ''}>🌐 Auto (Locale Based)</option>
              <option value="international" ${userSettings.numberFormat === 'international' ? 'selected' : ''}>Standard International (1,234,567.89)</option>
              <option value="european" ${userSettings.numberFormat === 'european' ? 'selected' : ''}>European (1.234.567,89)</option>
              <option value="indian" ${userSettings.numberFormat === 'indian' ? 'selected' : ''}>Indian Lakhs & Crores (12,34,567.89)</option>
            </select>

            <label class="input-label" id="lbl-master-precision">${t('masterPrecision')}</label>
            <select id="set-master-precision" class="form-select" style="width: 100%; margin-bottom: 14px;">
              <option value="auto" ${userSettings.masterPrecision === 'auto' ? 'selected' : ''}>✨ Auto (Dynamic up to 8)</option>
              <option value="0" ${userSettings.masterPrecision === 0 ? 'selected' : ''}>0 (Integers)</option>
              <option value="2" ${userSettings.masterPrecision === 2 ? 'selected' : ''}>2 Decimals</option>
              <option value="4" ${userSettings.masterPrecision === 4 ? 'selected' : ''}>4 Decimals</option>
              <option value="6" ${userSettings.masterPrecision === 6 ? 'selected' : ''}>6 Decimals</option>
              <option value="8" ${userSettings.masterPrecision === 8 ? 'selected' : ''}>8 Decimals</option>
            </select>

            <label class="input-label" id="lbl-finance-precision">${t('financePrecision')}</label>
            <select id="set-finance-precision" class="form-select" style="width: 100%; margin-bottom: 14px;">
              <option value="2" ${userSettings.sectionPrecision?.finance === 2 ? 'selected' : ''}>2 Decimals (Standard Currency)</option>
              <option value="auto" ${userSettings.sectionPrecision?.finance === 'auto' ? 'selected' : ''}>Auto (Dynamic)</option>
              <option value="0" ${userSettings.sectionPrecision?.finance === 0 ? 'selected' : ''}>0 Decimals (Round to Whole)</option>
              <option value="4" ${userSettings.sectionPrecision?.finance === 4 ? 'selected' : ''}>4 Decimals (High Precision Forex)</option>
            </select>

            <label class="input-label" id="lbl-unit-precision">${t('unitPrecision')}</label>
            <select id="set-unit-precision" class="form-select" style="width: 100%; margin-bottom: 14px;">
              <option value="auto" ${userSettings.sectionPrecision?.unit === 'auto' ? 'selected' : ''}>Auto (Dynamic Trim)</option>
              <option value="2" ${userSettings.sectionPrecision?.unit === 2 ? 'selected' : ''}>2 Decimals</option>
              <option value="4" ${userSettings.sectionPrecision?.unit === 4 ? 'selected' : ''}>4 Decimals</option>
              <option value="6" ${userSettings.sectionPrecision?.unit === 6 ? 'selected' : ''}>6 Decimals</option>
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

            <label class="input-label">Promotional Offers & Partner Deals</label>
            <div class="segmented-control">
              <button id="set-ads-on" class="seg-btn ${userSettings.showAdsAndOffers ? 'active' : ''}">Enabled</button>
              <button id="set-ads-off" class="seg-btn ${!userSettings.showAdsAndOffers ? 'active' : ''}">Disabled</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PWA Install Guide Modal for Mobile & Browsers -->
    <div id="modal-install-guide" class="modal-overlay center-modal" style="display: none;">
      <div class="dialog-install" style="background: var(--bg-card, #1c1c1e); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; max-width: 380px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">📲</span>
            <h3 style="margin: 0; font-size: 16px; font-weight: 700;">Install EveryCalc</h3>
          </div>
          <button id="btn-close-install-guide" class="btn-icon">✕</button>
        </div>
        <div id="install-guide-body" style="font-size: 13.5px; line-height: 1.5; color: var(--text-secondary); margin-bottom: 16px;"></div>
        <button id="btn-install-guide-ok" class="seg-btn active" style="width: 100%; padding: 10px; font-weight: 600;">Got it!</button>
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

  function moveFavoriteRelative(id: string, dir: -1 | 1) {
    const favs = [...(userSettings.menuFavorites || ['NOR', 'LON', 'TAX', 'UNT'])];
    const idx = favs.indexOf(id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= favs.length) return;
    const moved = favs.splice(idx, 1)[0];
    favs.splice(newIdx, 0, moved);
    userSettings.menuFavorites = favs;
    updateSettings({ menuFavorites: favs });
    triggerHaptic();
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
    function createDrawerItem(mode: typeof CALCULATOR_MODES[0], isFavSection: boolean = false, favIndex: number = -1, favTotal: number = 0) {
      const localizedName = getModuleName(mode.id);
      const isFav = favorites.includes(mode.id);

      const item = document.createElement('div');
      item.setAttribute('data-id', mode.id);
      item.className = `drawer-item ${mode.id === state.activeCalculatorId ? 'active' : ''}`;
      item.draggable = isFavSection;

      item.innerHTML = `
        <div class="drawer-item-content">
          ${isFavSection ? '<span class="drawer-drag-handle" title="Drag to reorder" style="touch-action: none;">⋮⋮</span>' : ''}
          <span style="font-size: 18px;">${mode.icon}</span>
          <span class="drawer-item-title">${localizedName}</span>
        </div>
        <div class="drawer-item-actions">
          ${isFavSection ? `
            <button class="btn-reorder-fav btn-reorder-up" data-fav-id="${mode.id}" title="Move up" ${favIndex <= 0 ? 'disabled style="opacity:0.25; pointer-events:none;"' : ''}>▲</button>
            <button class="btn-reorder-fav btn-reorder-down" data-fav-id="${mode.id}" title="Move down" ${favIndex >= favTotal - 1 ? 'disabled style="opacity:0.25; pointer-events:none;"' : ''}>▼</button>
          ` : ''}
          <button class="btn-star-fav ${isFav ? 'active' : ''}" data-fav-id="${mode.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
            ${isFav ? '⭐' : '☆'}
          </button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.btn-star-fav') || target.closest('.btn-reorder-fav') || target.closest('.drawer-drag-handle')) return;
        switchMode(mode.id, localizedName);
      });

      const starBtn = item.querySelector('.btn-star-fav');
      starBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteMode(mode.id);
      });

      if (isFavSection) {
        const btnUp = item.querySelector('.btn-reorder-up');
        const btnDown = item.querySelector('.btn-reorder-down');

        btnUp?.addEventListener('click', (e) => {
          e.stopPropagation();
          moveFavoriteRelative(mode.id, -1);
        });

        btnDown?.addEventListener('click', (e) => {
          e.stopPropagation();
          moveFavoriteRelative(mode.id, 1);
        });

        // Desktop HTML5 drag events
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

        // Mobile Touch drag events
        const dragHandle = item.querySelector('.drawer-drag-handle') as HTMLElement | null;
        if (dragHandle) {
          let touchStartY = 0;
          let currentTargetEl: HTMLElement | null = null;

          dragHandle.addEventListener('touchstart', (e: TouchEvent) => {
            e.stopPropagation();
            const touch = e.touches[0];
            touchStartY = touch.clientY;
            draggedModeId = mode.id;
            item.classList.add('dragging');
            triggerHaptic();
          }, { passive: false });

          dragHandle.addEventListener('touchmove', (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const deltaY = touch.clientY - touchStartY;
            item.style.transform = `translateY(${deltaY}px) scale(1.02)`;
            item.style.zIndex = '1000';

            item.style.pointerEvents = 'none';
            const under = document.elementFromPoint(touch.clientX, touch.clientY);
            item.style.pointerEvents = '';

            const targetItem = under?.closest('.drawer-item[draggable="true"]') as HTMLElement | null;
            document.querySelectorAll('.drawer-item').forEach((el) => el.classList.remove('drag-over'));
            if (targetItem && targetItem !== item) {
              targetItem.classList.add('drag-over');
              currentTargetEl = targetItem;
            } else {
              currentTargetEl = null;
            }
          }, { passive: false });

          const finishTouch = () => {
            item.classList.remove('dragging');
            item.style.transform = '';
            item.style.zIndex = '';
            document.querySelectorAll('.drawer-item').forEach((el) => el.classList.remove('drag-over'));

            if (currentTargetEl && draggedModeId) {
              const targetId = currentTargetEl.getAttribute('data-id');
              if (targetId && targetId !== draggedModeId) {
                triggerHaptic();
                reorderFavorites(draggedModeId, targetId);
              }
            }
            draggedModeId = null;
            currentTargetEl = null;
          };

          dragHandle.addEventListener('touchend', finishTouch);
          dragHandle.addEventListener('touchcancel', finishTouch);
        }
      }

      return item;
    }

    // Helper to render Desktop Sidebar item
    function createSidebarItem(mode: typeof CALCULATOR_MODES[0]) {
      const localizedName = getModuleName(mode.id);
      const isFav = favorites.includes(mode.id);

      const item = document.createElement('div');
      item.setAttribute('data-id', mode.id);
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

      favoriteModes.forEach((mode, idx) => {
        drawerList.appendChild(createDrawerItem(mode, true, idx, favoriteModes.length));
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

  // PWA Install Button at Header (Visible if using from browser)
  const btnInstallApp = document.getElementById('btn-install-app');
  const modalInstallGuide = document.getElementById('modal-install-guide');
  const btnCloseInstallGuide = document.getElementById('btn-close-install-guide');
  const btnInstallGuideOk = document.getElementById('btn-install-guide-ok');
  const installGuideBody = document.getElementById('install-guide-body');

  function isStandalonePWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  // Display install button if running in any browser (not standalone PWA)
  if (btnInstallApp) {
    if (isStandalonePWA()) {
      btnInstallApp.style.display = 'none';
    } else {
      btnInstallApp.style.display = 'inline-flex';
    }
  }

  let deferredInstallPrompt: any = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (btnInstallApp && !isStandalonePWA()) {
      btnInstallApp.style.display = 'inline-flex';
    }
  });

  window.addEventListener('appinstalled', () => {
    if (btnInstallApp) btnInstallApp.style.display = 'none';
    showToast('EveryCalc installed successfully! 🎉');
  });

  function openInstallGuide() {
    if (!modalInstallGuide || !installGuideBody) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      installGuideBody.innerHTML = `
        <p style="margin: 0 0 10px; color: #fff; font-weight: 600;">To install EveryCalc on your iPhone or iPad:</p>
        <ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
          <li>Tap the <strong>Share</strong> button (<strong>⎋ / [↑]</strong>) at the bottom or top of Safari.</li>
          <li>Scroll down and tap <strong>"Add to Home Screen" ➕</strong>.</li>
          <li>Tap <strong>Add</strong> in the top-right corner to finish.</li>
        </ol>
      `;
    } else {
      installGuideBody.innerHTML = `
        <p style="margin: 0 0 10px; color: #fff; font-weight: 600;">To install EveryCalc from your browser:</p>
        <ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
          <li>Tap your browser menu (<strong>⋮</strong> or <strong>⋯</strong>) or the address bar install icon (<strong>⊕</strong>).</li>
          <li>Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.</li>
          <li>Launch directly from your home screen with offline support!</li>
        </ol>
      `;
    }
    modalInstallGuide.style.display = 'flex';
    modalInstallGuide.classList.add('open');
  }

  function closeInstallGuide() {
    if (!modalInstallGuide) return;
    modalInstallGuide.style.display = 'none';
    modalInstallGuide.classList.remove('open');
  }

  btnInstallApp?.addEventListener('click', async () => {
    triggerHaptic();
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      try {
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          if (btnInstallApp) btnInstallApp.style.display = 'none';
        }
      } catch {
        // Fallback to guide
        openInstallGuide();
      }
      deferredInstallPrompt = null;
    } else {
      openInstallGuide();
    }
  });

  btnCloseInstallGuide?.addEventListener('click', closeInstallGuide);
  btnInstallGuideOk?.addEventListener('click', closeInstallGuide);
  modalInstallGuide?.addEventListener('click', (e) => {
    if (e.target === modalInstallGuide) closeInstallGuide();
  });

  // Constants Modal logic
  const modalConstants = document.getElementById('modal-constants');
  const btnOpenConst = document.getElementById('btn-open-const');
  const btnOpenConstBar = document.getElementById('btn-open-const-bar');
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

  const openConstantsModal = () => {
    renderConstantsList();
    if (constSearchInput) constSearchInput.value = '';
    modalConstants?.classList.add('open');
  };

  btnOpenConst?.addEventListener('click', openConstantsModal);
  btnOpenConstBar?.addEventListener('click', openConstantsModal);

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

  // Drawer modal controls
  const modalMenu = document.getElementById('modal-menu');
  const btnMenu = document.getElementById('btn-menu');
  const btnCloseMenu = document.getElementById('btn-close-menu');

  btnMenu?.addEventListener('click', () => modalMenu?.classList.add('open'));
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

  const setAdsOn = document.getElementById('set-ads-on');
  const setAdsOff = document.getElementById('set-ads-off');
  setAdsOn?.addEventListener('click', () => {
    userSettings.showAdsAndOffers = true;
    updateSettings({ showAdsAndOffers: true });
    setAdsOn.classList.add('active');
    setAdsOff?.classList.remove('active');
    refreshActiveAdSlots();
  });
  setAdsOff?.addEventListener('click', () => {
    userSettings.showAdsAndOffers = false;
    updateSettings({ showAdsAndOffers: false });
    setAdsOff.classList.add('active');
    setAdsOn?.classList.remove('active');
    refreshActiveAdSlots();
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

  const setMasterPrecision = document.getElementById('set-master-precision') as HTMLSelectElement;
  setMasterPrecision?.addEventListener('change', () => {
    const val = setMasterPrecision.value === 'auto' ? 'auto' : parseInt(setMasterPrecision.value, 10);
    userSettings.masterPrecision = val;
    updateSettings({ masterPrecision: val });
    updateDisplay();
    switchMode(state.activeCalculatorId);
  });

  const setFinancePrecision = document.getElementById('set-finance-precision') as HTMLSelectElement;
  setFinancePrecision?.addEventListener('change', () => {
    const val: 'auto' | number = setFinancePrecision.value === 'auto' ? 'auto' : parseInt(setFinancePrecision.value, 10);
    const updatedSec = { ...userSettings.sectionPrecision, finance: val };
    userSettings.sectionPrecision = updatedSec;
    updateSettings({ sectionPrecision: updatedSec });
    switchMode(state.activeCalculatorId);
  });

  const setUnitPrecision = document.getElementById('set-unit-precision') as HTMLSelectElement;
  setUnitPrecision?.addEventListener('change', () => {
    const val: 'auto' | number = setUnitPrecision.value === 'auto' ? 'auto' : parseInt(setUnitPrecision.value, 10);
    const updatedSec = { ...userSettings.sectionPrecision, unit: val };
    userSettings.sectionPrecision = updatedSec;
    updateSettings({ sectionPrecision: updatedSec });
    switchMode(state.activeCalculatorId);
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
  function handleDeepLink() {
    const currentParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');
    const currentToolParam = currentParams.get('tool') || hash;
    if (currentToolParam) {
      const p = currentToolParam.toLowerCase();
      const targetMode = CALCULATOR_MODES.find(
        (m) => m.id.toLowerCase() === p || m.name.toLowerCase().includes(p)
      );
      if (targetMode) {
        switchMode(targetMode.id, getModuleName(targetMode.id));
        return true;
      }
    }
    return false;
  }

  window.addEventListener('hashchange', () => {
    handleDeepLink();
  });

  const deepLinked = handleDeepLink();
  if (!deepLinked) {
    if (userSettings.defaultCalculatorId && userSettings.defaultCalculatorId !== 'NOR') {
      const defaultMode = CALCULATOR_MODES.find((m) => m.id === userSettings.defaultCalculatorId);
      if (defaultMode) {
        switchMode(defaultMode.id, getModuleName(defaultMode.id));
      }
    } else {
      switchMode('NOR', getModuleName('NOR'));
    }
  }

  // Initial load of ad slots and background sync of remote configuration
  refreshActiveAdSlots();
  syncRemoteMonetizationConfig().catch(() => {});
}

// Register Service Worker for offline PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('PWA service worker registration failed:', err);
    });
  });
}

// Initialize UI
setupApp();
updateDisplay();
