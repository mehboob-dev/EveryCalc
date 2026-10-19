import { CalculatorModule } from './types.ts';
import { shareText } from '../core/share.ts';

export type DDayCategory = 'Anniversary' | 'Birthday' | 'Holiday' | 'Goal' | 'Custom';

export interface DDayEvent {
  id: string;
  title: string;
  dateStr: string; // YYYY-MM-DD
  category: DDayCategory;
  isRecurringYearly: boolean;
}

export interface DDayCalculationResult {
  daysDiff: number; // 0 = today, >0 = future, <0 = passed
  dDayBadge: string; // 'D-Day', 'D-42', 'D+15'
  badgeType: 'today' | 'future' | 'passed';
  formattedTargetDate: string;
  statusText: string;
  milestoneYears?: number;
}

export const STARTER_DDAY_EVENTS: DDayEvent[] = [
  {
    id: 'starter-republic-day',
    title: 'Republic Day of India',
    dateStr: '1950-01-26',
    category: 'Holiday',
    isRecurringYearly: true
  },
  {
    id: 'starter-diwali-2026',
    title: 'Diwali 2026',
    dateStr: '2026-11-08',
    category: 'Holiday',
    isRecurringYearly: false
  },
  {
    id: 'starter-anniversary',
    title: 'Wedding Anniversary',
    dateStr: '2020-12-15',
    category: 'Anniversary',
    isRecurringYearly: true
  }
];

const DDAY_STORAGE_KEY = 'everycalc_dday_events';

export function getDDayEvents(): DDayEvent[] {
  try {
    if (typeof localStorage === 'undefined') return [...STARTER_DDAY_EVENTS];
    const raw = localStorage.getItem(DDAY_STORAGE_KEY);
    if (!raw) {
      saveDDayEvents(STARTER_DDAY_EVENTS);
      return [...STARTER_DDAY_EVENTS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...STARTER_DDAY_EVENTS];
  } catch {
    return [...STARTER_DDAY_EVENTS];
  }
}

export function saveDDayEvents(events: DDayEvent[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DDAY_STORAGE_KEY, JSON.stringify(events));
    }
  } catch {
    // Ignore storage errors
  }
}

export function calculateDDay(
  eventDateStr: string,
  isRecurringYearly: boolean = false,
  referenceDate: Date = new Date()
): DDayCalculationResult {
  try {
    const [yStr, mStr, dStr] = eventDateStr.split('-');
    const origYear = parseInt(yStr, 10);
    const origMonth = parseInt(mStr, 10) - 1; // 0-indexed
    const origDay = parseInt(dStr, 10);

    // Normalize reference date to midnight
    const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0, 0);

    let targetDate: Date;
    let milestoneYears: number | undefined;

    if (isRecurringYearly) {
      const curYear = ref.getFullYear();
      let candidate = new Date(curYear, origMonth, origDay, 0, 0, 0, 0);

      // If already passed this year, the next recurrence is next year
      if (candidate.getTime() < ref.getTime()) {
        candidate = new Date(curYear + 1, origMonth, origDay, 0, 0, 0, 0);
      }
      targetDate = candidate;
      milestoneYears = targetDate.getFullYear() - origYear;
    } else {
      targetDate = new Date(origYear, origMonth, origDay, 0, 0, 0, 0);
    }

    const diffMs = targetDate.getTime() - ref.getTime();
    const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let dDayBadge = 'D-Day';
    let badgeType: 'today' | 'future' | 'passed' = 'today';
    let statusText = 'Today is the day! 🎉';

    if (daysDiff === 0) {
      dDayBadge = 'D-Day';
      badgeType = 'today';
      statusText = 'Today is the day! 🎉';
    } else if (daysDiff > 0) {
      dDayBadge = `D-${daysDiff}`;
      badgeType = 'future';
      statusText = `${daysDiff} day${daysDiff > 1 ? 's' : ''} remaining`;
    } else {
      dDayBadge = `D+${Math.abs(daysDiff)}`;
      badgeType = 'passed';
      const absDays = Math.abs(daysDiff);
      statusText = `${absDays} day${absDays > 1 ? 's' : ''} passed`;
    }

    const formattedTargetDate = targetDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return {
      daysDiff,
      dDayBadge,
      badgeType,
      formattedTargetDate,
      statusText,
      milestoneYears
    };
  } catch {
    return {
      daysDiff: 0,
      dDayBadge: 'D-Day',
      badgeType: 'today',
      formattedTargetDate: eventDateStr,
      statusText: 'Invalid date'
    };
  }
}

function getCategoryIcon(cat: DDayCategory): string {
  switch (cat) {
    case 'Anniversary':
      return '💍';
    case 'Birthday':
      return '🎂';
    case 'Holiday':
      return '🎆';
    case 'Goal':
      return '🎯';
    default:
      return '📌';
  }
}

export const AnniversaryModule: CalculatorModule = {
  id: 'ANN',
  name: 'Anniversary & D-Day',
  icon: '🎉',
  render(container: HTMLElement) {
    let events = getDDayEvents();
    let currentFilter: string = 'All';

    container.innerHTML = `
      <div class="module-view">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">🎉</span>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">Anniversary & D-Day Tracker</h3>
              <span style="font-size: 11.5px; color: var(--text-secondary);">Count down to milestones and special days</span>
            </div>
          </div>
          <button id="btn-open-add-dday" class="seg-btn active" style="padding: 7px 14px; font-size: 12.5px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            <span>➕</span>
            <span>Add Event</span>
          </button>
        </div>

        <!-- Category Filter Pills -->
        <div class="category-scroll" id="dday-category-filters" style="margin-bottom: 16px;">
          <button class="cat-pill active" data-cat="All">All Events</button>
          <button class="cat-pill" data-cat="Anniversary">💍 Anniversaries</button>
          <button class="cat-pill" data-cat="Birthday">🎂 Birthdays</button>
          <button class="cat-pill" data-cat="Holiday">🎆 Holidays</button>
          <button class="cat-pill" data-cat="Goal">🎯 Goals</button>
        </div>

        <!-- Event Cards Container -->
        <div id="dday-events-list"></div>

        <!-- Add Event Modal -->
        <div id="modal-add-dday" class="modal-overlay center-modal" style="display: none;">
          <div class="dialog-dday">
            <div class="calc-header" style="border-bottom: 1px solid var(--border-color); padding: 12px 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🎉</span>
                <h3 style="margin: 0; font-size: 16px; font-weight: 700;">Add Special Event</h3>
              </div>
              <button id="btn-close-dday-modal" class="btn-icon">✕</button>
            </div>

            <div style="padding: 16px; display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label class="input-label" style="margin-top: 0;">Event Title</label>
                <input type="text" id="dday-title-input" class="form-input" placeholder="e.g. Wedding Anniversary, Rahul's Birthday" />
              </div>

              <div>
                <label class="input-label">Date</label>
                <input type="date" id="dday-date-input" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
              </div>

              <div>
                <label class="input-label">Category</label>
                <select id="dday-category-select" class="form-select" style="width: 100%;">
                  <option value="Anniversary">💍 Anniversary</option>
                  <option value="Birthday">🎂 Birthday</option>
                  <option value="Holiday">🎆 Holiday / Festival</option>
                  <option value="Goal">🎯 Target / Milestone Goal</option>
                  <option value="Custom">📌 Custom Event</option>
                </select>
              </div>

              <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
                <input type="checkbox" id="dday-recurring-input" checked style="width: 18px; height: 18px; accent-color: var(--accent-color, #ff9f0a); cursor: pointer;" />
                <label for="dday-recurring-input" style="font-size: 13.5px; font-weight: 600; color: var(--text-primary); cursor: pointer;">
                  Repeat yearly (Annual recurring celebration)
                </label>
              </div>
            </div>

            <div style="padding: 12px 16px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); background-color: var(--bg-secondary);">
              <button id="btn-cancel-dday" class="seg-btn" style="padding: 8px 16px;">Cancel</button>
              <button id="btn-save-dday" class="seg-btn active" style="padding: 8px 20px; font-weight: 700;">Save Event</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const eventsList = container.querySelector('#dday-events-list') as HTMLElement;
    const filterContainer = container.querySelector('#dday-category-filters') as HTMLElement;
    const btnOpenAdd = container.querySelector('#btn-open-add-dday') as HTMLButtonElement;
    const modalAdd = container.querySelector('#modal-add-dday') as HTMLElement;
    const btnCloseModal = container.querySelector('#btn-close-dday-modal') as HTMLButtonElement;
    const btnCancel = container.querySelector('#btn-cancel-dday') as HTMLButtonElement;
    const btnSave = container.querySelector('#btn-save-dday') as HTMLButtonElement;

    const inputTitle = container.querySelector('#dday-title-input') as HTMLInputElement;
    const inputDate = container.querySelector('#dday-date-input') as HTMLInputElement;
    const selectCategory = container.querySelector('#dday-category-select') as HTMLSelectElement;
    const checkRecurring = container.querySelector('#dday-recurring-input') as HTMLInputElement;

    function renderEvents() {
      const filtered = currentFilter === 'All'
        ? events
        : events.filter((e) => e.category === currentFilter);

      if (filtered.length === 0) {
        eventsList.innerHTML = `
          <div class="input-card" style="text-align: center; padding: 32px 16px;">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">🎉</span>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">No events found</div>
            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">Tap "Add Event" to track birthdays, anniversaries, and milestones.</div>
          </div>
        `;
        return;
      }

      eventsList.innerHTML = filtered.map((e) => {
        const res = calculateDDay(e.dateStr, e.isRecurringYearly);
        const icon = getCategoryIcon(e.category);
        const milestoneStr = res.milestoneYears && res.milestoneYears > 0 ? ` • ${res.milestoneYears} Year Milestone` : '';

        return `
          <div class="dday-card" data-event-id="${e.id}">
            <div class="dday-left">
              <span class="dday-icon-badge">${icon}</span>
              <div class="dday-info">
                <span class="dday-title">${e.title}</span>
                <span class="dday-date">${res.formattedTargetDate}${milestoneStr}</span>
                <span class="dday-status">${res.statusText}</span>
              </div>
            </div>
            <div class="dday-right">
              <span class="dday-badge ${res.badgeType}">${res.dDayBadge}</span>
              <button class="btn-icon btn-share-dday" data-share-id="${e.id}" title="Share on WhatsApp" style="font-size: 15px; width: 32px; height: 32px;">💬</button>
              <button class="btn-remove-city btn-delete-dday" data-delete-id="${e.id}" title="Delete event">✕</button>
            </div>
          </div>
        `;
      }).join('');

      // Wire Share buttons
      eventsList.querySelectorAll('.btn-share-dday').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const id = btn.getAttribute('data-share-id');
          const found = events.find((item) => item.id === id);
          if (found) {
            const res = calculateDDay(found.dateStr, found.isRecurringYearly);
            const text = `🎉 *${found.title}* (${found.category})
Date: ${res.formattedTargetDate}
Countdown: *${res.dDayBadge}* (${res.statusText})
---
Calculated with EveryCalc`;
            shareText(text, found.title);
          }
        });
      });

      // Wire Delete buttons
      eventsList.querySelectorAll('.btn-delete-dday').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const id = btn.getAttribute('data-delete-id');
          if (id) {
            events = events.filter((item) => item.id !== id);
            saveDDayEvents(events);
            renderEvents();
          }
        });
      });
    }

    // Filter pills click
    filterContainer.querySelectorAll('.cat-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        filterContainer.querySelectorAll('.cat-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-cat') || 'All';
        renderEvents();
      });
    });

    function openModal() {
      inputTitle.value = '';
      inputDate.value = new Date().toISOString().split('T')[0];
      selectCategory.value = 'Anniversary';
      checkRecurring.checked = true;
      modalAdd.style.display = 'flex';
      modalAdd.classList.add('open');
      inputTitle.focus();
    }

    function closeModal() {
      modalAdd.style.display = 'none';
      modalAdd.classList.remove('open');
    }

    btnOpenAdd.addEventListener('click', openModal);
    btnCloseModal.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    modalAdd.addEventListener('click', (e) => {
      if (e.target === modalAdd) closeModal();
    });

    btnSave.addEventListener('click', () => {
      const title = inputTitle.value.trim();
      const dateStr = inputDate.value;
      if (!title || !dateStr) return;

      const newEvent: DDayEvent = {
        id: `dday-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        dateStr,
        category: selectCategory.value as DDayCategory,
        isRecurringYearly: checkRecurring.checked
      };

      events.unshift(newEvent);
      saveDDayEvents(events);
      closeModal();
      renderEvents();
    });

    renderEvents();
  }
};
