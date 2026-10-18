export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

const STORAGE_KEY = 'everycalc_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Retrieves the stored calculation history from localStorage.
 */
export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new calculation item to history.
 */
export function addHistory(expression: string, result: string): HistoryItem {
  const items = getHistory();
  const newItem: HistoryItem = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    expression,
    result,
    timestamp: Date.now()
  };

  const updated = [newItem, ...items].slice(0, MAX_HISTORY_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Gracefully handle storage quota errors
  }
  return newItem;
}

/**
 * Clears all calculation history.
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore error
  }
}

/**
 * Deletes a single history item by ID.
 */
export function deleteHistoryItem(id: string): void {
  const items = getHistory();
  const filtered = items.filter((it) => it.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore error
  }
}
