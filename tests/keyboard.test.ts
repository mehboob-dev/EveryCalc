import { describe, it, expect, vi } from 'vitest';
import { handleKeyboardEvent, KeyboardHandlers } from '../src/core/keyboard.ts';

describe('Desktop Keyboard Handler', () => {
  function createMockHandlers(): { handlers: KeyboardHandlers; calls: Record<string, any[]> } {
    const calls: Record<string, any[]> = {
      onNumber: [],
      onOperation: [],
      onEquals: [],
      onClear: [],
      onBackspace: [],
      onPercent: [],
      onParenthesis: [],
      onFunction: [],
      onConstant: [],
      onSquareRoot: [],
      onToggleSign: [],
      onPostfix: []
    };

    const handlers: KeyboardHandlers = {
      onNumber: (num) => calls.onNumber.push(num),
      onOperation: (op) => calls.onOperation.push(op),
      onEquals: () => calls.onEquals.push(true),
      onClear: () => calls.onClear.push(true),
      onBackspace: () => calls.onBackspace.push(true),
      onPercent: () => calls.onPercent.push(true),
      onParenthesis: (p) => calls.onParenthesis.push(p),
      onFunction: (fn) => calls.onFunction.push(fn),
      onConstant: (c) => calls.onConstant.push(c),
      onSquareRoot: () => calls.onSquareRoot.push(true),
      onToggleSign: () => calls.onToggleSign.push(true),
      onPostfix: (pf) => calls.onPostfix.push(pf)
    };

    return { handlers, calls };
  }

  it('handles number inputs 0-9, 00, and decimal point', () => {
    const { handlers, calls } = createMockHandlers();
    expect(handleKeyboardEvent({ key: '7' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '5' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '0' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '00' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '.' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: ',' }, handlers)).toBe(true);

    expect(calls.onNumber).toEqual(['7', '5', '0', '00', '.', '.']);
  });

  it('handles arithmetic operators (+, -, *, /, ^)', () => {
    const { handlers, calls } = createMockHandlers();
    expect(handleKeyboardEvent({ key: '+' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '-' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '*' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: 'x' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '/' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '^' }, handlers)).toBe(true);

    expect(calls.onOperation).toEqual(['+', '−', '×', '×', '÷', '^']);
  });

  it('handles Enter / Equals, Backspace, and Clear keys', () => {
    const { handlers, calls } = createMockHandlers();
    expect(handleKeyboardEvent({ key: 'Enter' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '=' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: 'Backspace' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: 'Escape' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: 'Delete' }, handlers)).toBe(true);

    expect(calls.onEquals.length).toBe(2);
    expect(calls.onBackspace.length).toBe(1);
    expect(calls.onClear.length).toBe(2);
  });

  it('handles parentheses and percent', () => {
    const { handlers, calls } = createMockHandlers();
    expect(handleKeyboardEvent({ key: '(' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: ')' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '%' }, handlers)).toBe(true);

    expect(calls.onParenthesis).toEqual(['(', ')']);
    expect(calls.onPercent.length).toBe(1);
  });

  it('handles math constants and square root shortcuts', () => {
    const { handlers, calls } = createMockHandlers();
    expect(handleKeyboardEvent({ key: 'p' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: 'e' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: 'r' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '!' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '_' }, handlers)).toBe(true);
    expect(handleKeyboardEvent({ key: '±' }, handlers)).toBe(true);

    expect(calls.onConstant).toEqual(['π', 'e']);
    expect(calls.onSquareRoot.length).toBe(1);
    expect(calls.onPostfix).toEqual(['!']);
    expect(calls.onToggleSign.length).toBe(2);
  });

  it('does NOT intercept keys when user is typing in an HTML input field', () => {
    const { handlers, calls } = createMockHandlers();
    const handled = handleKeyboardEvent({ key: '5' }, handlers, true);
    expect(handled).toBe(false);
    expect(calls.onNumber.length).toBe(0);
  });

  it('does NOT intercept Ctrl/Cmd hotkeys', () => {
    const { handlers, calls } = createMockHandlers();
    const handled = handleKeyboardEvent({ key: 'c', ctrlKey: true }, handlers, false);
    expect(handled).toBe(false);
    expect(calls.onNumber.length).toBe(0);
  });
});
