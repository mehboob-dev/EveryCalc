import { describe, it, expect, beforeEach } from 'vitest';
import { getSettings, updateSettings } from '../src/core/settings.ts';

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

describe('User Settings Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('loads default settings when empty', () => {
    const s = getSettings();
    expect(s.angleMode).toBe('DEG');
    expect(s.hapticFeedback).toBe(true);
    expect(s.defaultCalculatorId).toBe('NOR');
  });

  it('persists and updates partial settings', () => {
    updateSettings({ angleMode: 'RAD' });
    let s = getSettings();
    expect(s.angleMode).toBe('RAD');
    expect(s.hapticFeedback).toBe(true);

    updateSettings({ hapticFeedback: false, defaultCalculatorId: 'CUR' });
    s = getSettings();
    expect(s.angleMode).toBe('RAD');
    expect(s.hapticFeedback).toBe(false);
    expect(s.defaultCalculatorId).toBe('CUR');
  });
});
