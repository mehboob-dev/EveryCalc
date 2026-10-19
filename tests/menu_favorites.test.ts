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

describe('Menu Drawer Categories & Favoriting Engine', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('provides default pinned favorite tools in settings', () => {
    const s = getSettings();
    expect(s.menuFavorites).toBeDefined();
    expect(Array.isArray(s.menuFavorites)).toBe(true);
    expect(s.menuFavorites).toContain('NOR');
    expect(s.menuFavorites).toContain('LON');
    expect(s.menuFavorites).toContain('TAX');
    expect(s.menuFavorites).toContain('UNT');
  });

  it('allows adding and removing favorites dynamically', () => {
    const s1 = getSettings();
    const favs = s1.menuFavorites ? [...s1.menuFavorites] : [];

    // Add Anniversary tracker
    favs.push('ANN');
    updateSettings({ menuFavorites: favs });

    const s2 = getSettings();
    expect(s2.menuFavorites).toContain('ANN');

    // Remove Loan
    const updated = s2.menuFavorites!.filter((id) => id !== 'LON');
    updateSettings({ menuFavorites: updated });

    const s3 = getSettings();
    expect(s3.menuFavorites).not.toContain('LON');
    expect(s3.menuFavorites).toContain('ANN');
  });

  it('persists custom favorites order across reloads', () => {
    updateSettings({ menuFavorites: ['ANN', 'TAX', 'NOR'] });
    const s = getSettings();
    expect(s.menuFavorites).toEqual(['ANN', 'TAX', 'NOR']);
  });
});
