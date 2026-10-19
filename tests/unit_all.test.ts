import { describe, it, expect, beforeEach } from 'vitest';
import {
  UNIT_CATEGORIES,
  convertAllUnits,
  getPinnedUnits,
  togglePinnedUnit
} from '../src/modules/unit.ts';

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

describe('Unit Converter - All Units Live Preview & Pinning', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('converts all units simultaneously for length category', () => {
    const lenCat = UNIT_CATEGORIES.find((c) => c.id === 'length')!;
    const all = convertAllUnits('1000', lenCat, 'm');

    expect(all.length).toBe(lenCat.units.length);

    const km = all.find((i) => i.unit.id === 'km')!;
    expect(km.value).toBe('1');

    const cm = all.find((i) => i.unit.id === 'cm')!;
    expect(cm.value).toBe('100000');

    const mm = all.find((i) => i.unit.id === 'mm')!;
    expect(mm.value).toBe('1000000');
  });

  it('pins and unpins units with persistent storage', () => {
    expect(getPinnedUnits('mass')).toEqual([]);

    togglePinnedUnit('mass', 'tola');
    expect(getPinnedUnits('mass')).toContain('tola');

    togglePinnedUnit('mass', 'g');
    expect(getPinnedUnits('mass')).toEqual(['tola', 'g']);

    // Toggle again removes it
    togglePinnedUnit('mass', 'tola');
    expect(getPinnedUnits('mass')).toEqual(['g']);
  });

  it('sorts pinned units to the top of all units preview', () => {
    const massCat = UNIT_CATEGORIES.find((c) => c.id === 'mass')!;
    togglePinnedUnit('mass', 'tola');

    const all = convertAllUnits('1', massCat, 'kg');
    expect(all[0].unit.id).toBe('tola');
    expect(all[0].isPinned).toBe(true);

    // Other non-pinned units follow
    expect(all[1].isPinned).toBe(false);
  });
});
