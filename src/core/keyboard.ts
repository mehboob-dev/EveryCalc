export interface KeyboardHandlers {
  onNumber: (num: string) => void;
  onOperation: (op: string) => void;
  onEquals: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onPercent: () => void;
  onParenthesis: (paren: string) => void;
  onFunction?: (fn: string) => void;
  onConstant?: (c: string) => void;
  onSquareRoot?: () => void;
  onToggleSign?: () => void;
  onPostfix?: (p: string) => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
}

export function handleKeyboardEvent(
  e: { key: string; ctrlKey?: boolean; metaKey?: boolean; preventDefault?: () => void },
  handlers: KeyboardHandlers,
  isInputFocused: boolean = false
): boolean {
  // Never hijack keystrokes when the user is typing into an HTML input or textarea
  if (isInputFocused) {
    return false;
  }

  // Allow standard Ctrl/Cmd shortcuts (like Ctrl+C, Ctrl+V, Ctrl+R, etc.)
  if (e.ctrlKey || e.metaKey) {
    return false;
  }

  const key = e.key;

  // Digits 0-9 and 00 (support numeric keypad 00)
  if (/^[0-9]$/.test(key) || key === '00') {
    handlers.onNumber(key);
    e.preventDefault?.();
    return true;
  }

  // Decimal separator
  if (key === '.' || key === ',') {
    handlers.onNumber('.');
    e.preventDefault?.();
    return true;
  }

  // Basic Operators
  if (key === '+') {
    handlers.onOperation('+');
    e.preventDefault?.();
    return true;
  }
  if (key === '-') {
    handlers.onOperation('−');
    e.preventDefault?.();
    return true;
  }
  if (key === '*' || key === 'x' || key === 'X') {
    handlers.onOperation('×');
    e.preventDefault?.();
    return true;
  }
  if (key === '/') {
    handlers.onOperation('÷');
    e.preventDefault?.();
    return true;
  }
  if (key === '^') {
    handlers.onOperation('^');
    e.preventDefault?.();
    return true;
  }

  // Equals / Enter
  if (key === 'Enter' || key === '=') {
    handlers.onEquals();
    e.preventDefault?.();
    return true;
  }

  // Backspace
  if (key === 'Backspace') {
    handlers.onBackspace();
    e.preventDefault?.();
    return true;
  }

  // Clear (Escape or Delete)
  if (key === 'Escape' || key === 'Delete') {
    handlers.onClear();
    e.preventDefault?.();
    return true;
  }

  // Percent
  if (key === '%') {
    handlers.onPercent();
    e.preventDefault?.();
    return true;
  }

  // Parentheses
  if (key === '(' || key === ')') {
    handlers.onParenthesis(key);
    e.preventDefault?.();
    return true;
  }

  // Math constants & functions
  if (key === 'p' || key === 'P') {
    handlers.onConstant?.('π');
    e.preventDefault?.();
    return true;
  }
  if (key === 'e' || key === 'E') {
    handlers.onConstant?.('e');
    e.preventDefault?.();
    return true;
  }
  if (key === 'r' || key === 'R' || key === '@') {
    handlers.onSquareRoot?.();
    e.preventDefault?.();
    return true;
  }
  if (key === '!') {
    handlers.onPostfix?.('!');
    e.preventDefault?.();
    return true;
  }

  // Cursor navigation keys
  if (key === 'ArrowLeft') {
    handlers.onArrowLeft?.();
    e.preventDefault?.();
    return true;
  }
  if (key === 'ArrowRight') {
    handlers.onArrowRight?.();
    e.preventDefault?.();
    return true;
  }
  if (key === 'Home') {
    handlers.onHome?.();
    e.preventDefault?.();
    return true;
  }
  if (key === 'End') {
    handlers.onEnd?.();
    e.preventDefault?.();
    return true;
  }
  if (key === '_' || key === '±') {
    handlers.onToggleSign?.();
    e.preventDefault?.();
    return true;
  }

  return false;
}
