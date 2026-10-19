import { describe, it, expect, beforeEach } from 'vitest';
import { getHistory, addHistory, clearHistory, deleteHistoryItem } from '../src/core/history.ts';

// In-memory localStorage mock for node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  }
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('History Tape Manager', () => {
  beforeEach(() => {
    clearHistory();
  });

  it('starts with an empty history list', () => {
    expect(getHistory()).toEqual([]);
  });

  it('adds and retrieves calculation history', () => {
    addHistory('12 + 8', '20');
    const history = getHistory();
    expect(history.length).toBe(1);
    expect(history[0].expression).toBe('12 + 8');
    expect(history[0].result).toBe('20');
  });

  it('limits history to MAX_HISTORY_ITEMS (50 items)', () => {
    for (let i = 0; i < 60; i++) {
      addHistory(`1 + ${i}`, `${1 + i}`);
    }
    const history = getHistory();
    expect(history.length).toBe(50);
  });

  it('deletes individual items by ID', () => {
    const item1 = addHistory('2 * 2', '4');
    const item2 = addHistory('3 * 3', '9');
    expect(getHistory().length).toBe(2);

    deleteHistoryItem(item1.id);
    const history = getHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe(item2.id);
  });

  it('clears all history items', () => {
    addHistory('5 + 5', '10');
    addHistory('6 + 6', '12');
    expect(getHistory().length).toBe(2);

    clearHistory();
    expect(getHistory()).toEqual([]);
  });
});
