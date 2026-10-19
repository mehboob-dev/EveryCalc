import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateDDay,
  STARTER_DDAY_EVENTS,
  getDDayEvents,
  saveDDayEvents,
  DDayEvent
} from '../src/modules/anniversary.ts';

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

describe('Anniversary & D-Day Event Tracker (ANN)', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('calculates D-Day for today exact match', () => {
    const today = new Date(2026, 9, 18); // Oct 18, 2026
    const res = calculateDDay('2026-10-18', false, today);
    expect(res.daysDiff).toBe(0);
    expect(res.dDayBadge).toBe('D-Day');
    expect(res.badgeType).toBe('today');
    expect(res.statusText).toContain('Today is the day');
  });

  it('calculates future countdown D-X accurately', () => {
    const today = new Date(2026, 9, 18); // Oct 18, 2026
    const res = calculateDDay('2026-11-08', false, today); // Diwali 2026 (21 days away)
    expect(res.daysDiff).toBe(21);
    expect(res.dDayBadge).toBe('D-21');
    expect(res.badgeType).toBe('future');
    expect(res.statusText).toBe('21 days remaining');
  });

  it('calculates passed days D+X accurately', () => {
    const today = new Date(2026, 9, 18);
    const res = calculateDDay('2026-10-08', false, today); // 10 days ago
    expect(res.daysDiff).toBe(-10);
    expect(res.dDayBadge).toBe('D+10');
    expect(res.badgeType).toBe('passed');
    expect(res.statusText).toBe('10 days passed');
  });

  it('handles annual recurring anniversaries and milestones', () => {
    const today = new Date(2026, 9, 18); // Oct 18, 2026
    // Republic Day of India: 1950-01-26
    // Since Oct 18 > Jan 26, next recurrence is Jan 26, 2027 (milestone: 2027 - 1950 = 77)
    const res = calculateDDay('1950-01-26', true, today);
    expect(res.daysDiff).toBeGreaterThan(90);
    expect(res.dDayBadge).toMatch(/^D-\d+$/);
    expect(res.milestoneYears).toBe(77);
  });

  it('provides starter events and persists custom events to localStorage', () => {
    const initial = getDDayEvents();
    expect(initial.length).toBe(STARTER_DDAY_EVENTS.length);
    expect(initial[0].title).toBe('Republic Day of India');

    const newEv: DDayEvent = {
      id: 'custom-event-1',
      title: 'Company Launch',
      dateStr: '2026-12-01',
      category: 'Goal',
      isRecurringYearly: false
    };

    saveDDayEvents([newEv, ...initial]);
    const updated = getDDayEvents();
    expect(updated.length).toBe(initial.length + 1);
    expect(updated[0].title).toBe('Company Launch');
  });
});
