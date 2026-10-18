export interface SectionPrecision {
  general?: number | 'auto';
  finance?: number | 'auto';
  unit?: number | 'auto';
}

export interface UserSettings {
  angleMode: 'DEG' | 'RAD';
  hapticFeedback: boolean;
  soundFeedback: boolean;
  defaultCalculatorId: string;
  language?: string;
  numberFormat?: 'auto' | 'international' | 'european' | 'indian';
  masterPrecision?: number | 'auto';
  sectionPrecision?: SectionPrecision;
  menuFavorites?: string[];
  menuOrder?: string[];
}

const SETTINGS_KEY = 'everycalc_user_settings';

const DEFAULT_SETTINGS: UserSettings = {
  angleMode: 'DEG',
  hapticFeedback: true,
  soundFeedback: true,
  defaultCalculatorId: 'NOR',
  numberFormat: 'auto',
  masterPrecision: 'auto',
  sectionPrecision: {
    general: 'auto',
    finance: 2,
    unit: 'auto'
  },
  menuFavorites: ['NOR', 'LON', 'TAX', 'UNT']
};

export function getSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      angleMode: parsed.angleMode === 'RAD' ? 'RAD' : 'DEG',
      hapticFeedback: typeof parsed.hapticFeedback === 'boolean' ? parsed.hapticFeedback : true,
      soundFeedback: typeof parsed.soundFeedback === 'boolean' ? parsed.soundFeedback : true,
      defaultCalculatorId: typeof parsed.defaultCalculatorId === 'string' ? parsed.defaultCalculatorId : 'NOR',
      language: typeof parsed.language === 'string' ? parsed.language : undefined,
      numberFormat: ['auto', 'international', 'european', 'indian'].includes(parsed.numberFormat) ? parsed.numberFormat : 'auto',
      masterPrecision: parsed.masterPrecision !== undefined ? parsed.masterPrecision : 'auto',
      sectionPrecision: parsed.sectionPrecision ? { ...DEFAULT_SETTINGS.sectionPrecision, ...parsed.sectionPrecision } : DEFAULT_SETTINGS.sectionPrecision,
      menuFavorites: Array.isArray(parsed.menuFavorites) ? parsed.menuFavorites : DEFAULT_SETTINGS.menuFavorites,
      menuOrder: Array.isArray(parsed.menuOrder) ? parsed.menuOrder : undefined
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function updateSettings(partial: Partial<UserSettings>): UserSettings {
  const current = getSettings();
  const updated: UserSettings = { ...current, ...partial };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
  return updated;
}
