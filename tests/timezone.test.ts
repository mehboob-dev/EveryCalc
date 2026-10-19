import { describe, it, expect, beforeEach } from 'vitest';
import {
  GLOBAL_CITIES,
  DEFAULT_ACTIVE_CITY_IDS,
  getActiveCities,
  saveActiveCityIds,
  calculateCityTime
} from '../src/modules/advanced.ts';

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

describe('World Timezone Converter & Scrubber', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('provides a comprehensive global database of cities across all major continents', () => {
    expect(GLOBAL_CITIES.length).toBeGreaterThanOrEqual(30);
    const cityIds = GLOBAL_CITIES.map((c) => c.id);
    expect(cityIds).toContain('delhi');
    expect(cityIds).toContain('dubai');
    expect(cityIds).toContain('london');
    expect(cityIds).toContain('newyork');
    expect(cityIds).toContain('tokyo');
    expect(cityIds).toContain('singapore');
    expect(cityIds).toContain('sydney');
    expect(cityIds).toContain('paris');
    expect(cityIds).toContain('berlin');
    expect(cityIds).toContain('zurich');
  });

  it('loads default active cities and saves updated city lists in localStorage', () => {
    const initial = getActiveCities();
    expect(initial.length).toBe(DEFAULT_ACTIVE_CITY_IDS.length);

    // Save customized list
    saveActiveCityIds(['delhi', 'paris', 'tokyo']);
    const custom = getActiveCities();
    expect(custom.map((c) => c.id)).toEqual(['delhi', 'paris', 'tokyo']);
  });

  it('calculates city time and accurately detects day/night conditions', () => {
    const delhi = GLOBAL_CITIES.find((c) => c.id === 'delhi')!;
    // 2026-10-18 12:00:00 UTC = 17:30:00 IST (Daytime)
    const afternoonUtc = new Date(Date.UTC(2026, 9, 18, 12, 0, 0));
    const dayRes = calculateCityTime(afternoonUtc, delhi);
    expect(dayRes.timeStr).toBeDefined();
    expect(dayRes.hour).toBe(17);
    expect(dayRes.dayNightIcon).toBe('☀️');

    // 2026-10-18 18:00:00 UTC = 23:30:00 IST (Nighttime)
    const nightUtc = new Date(Date.UTC(2026, 9, 18, 18, 0, 0));
    const nightRes = calculateCityTime(nightUtc, delhi);
    expect(nightRes.hour).toBe(23);
    expect(nightRes.dayNightIcon).toBe('🌙');
  });
});
