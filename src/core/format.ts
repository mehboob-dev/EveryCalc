import Decimal from 'decimal.js';
import { getLanguage } from './i18n.ts';
import { getSettings } from './settings.ts';

export type GroupingMode = 'auto' | 'international' | 'european' | 'indian';
export type SectionType = 'general' | 'finance' | 'unit';

export interface FormatOptions {
  grouping?: GroupingMode;
  precision?: number | 'auto';
  section?: SectionType;
  trimTrailingZeros?: boolean;
  currencySymbol?: string;
}

/**
 * Determines the concrete grouping system based on user settings and language.
 */
export function resolveGrouping(groupingSetting?: GroupingMode, langCode?: string): 'international' | 'european' | 'indian' {
  const chosen = groupingSetting || getSettings().numberFormat || 'auto';
  if (chosen === 'international' || chosen === 'european' || chosen === 'indian') {
    return chosen;
  }

  const lang = (langCode || getLanguage() || 'en').toLowerCase();
  if (lang === 'hi' || lang.startsWith('hi-')) {
    return 'indian';
  }
  if (lang === 'de' || lang === 'fr' || lang === 'es' || lang.startsWith('pt')) {
    return 'european';
  }
  return 'international';
}

/**
 * Resolves the effective precision based on section-specific overrides or global settings.
 */
export function resolvePrecision(section?: SectionType, explicitPrecision?: number | 'auto'): number | 'auto' {
  if (explicitPrecision !== undefined) {
    return explicitPrecision;
  }

  const settings = getSettings();
  if (section && settings.sectionPrecision && settings.sectionPrecision[section] !== undefined) {
    const secVal = settings.sectionPrecision[section];
    if (secVal !== undefined) return secVal;
  }

  if (settings.masterPrecision !== undefined) {
    return settings.masterPrecision;
  }

  // Sensible default: 2 for finance, auto (up to 8) for general/unit
  return section === 'finance' ? 2 : 'auto';
}

/**
 * Formats integer digits according to the specified grouping system.
 */
function groupIntegerDigits(intPart: string, grouping: 'international' | 'european' | 'indian'): string {
  if (!intPart || intPart.length <= 3) {
    return intPart;
  }

  if (grouping === 'indian') {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherDigits = intPart.substring(0, intPart.length - 3);
    const withCommas = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return `${withCommas},${lastThree}`;
  }

  if (grouping === 'european') {
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // international
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Universal, cross-cutting number formatting function.
 */
export function formatNumber(
  val: string | number | Decimal,
  options?: FormatOptions
): string {
  if (val === undefined || val === null) return '';
  const strVal = typeof val === 'string' ? val.trim() : val.toString();

  if (!strVal || strVal === 'NaN' || strVal === 'Infinity' || strVal === '-Infinity' || strVal === 'Error') {
    return strVal;
  }

  const isNegative = strVal.startsWith('-');
  const rawPositive = isNegative ? strVal.slice(1) : strVal;

  let d: Decimal;
  try {
    d = new Decimal(rawPositive);
  } catch {
    // If not a parseable number, return as is
    return strVal;
  }

  const grouping = resolveGrouping(options?.grouping);
  const precision = resolvePrecision(options?.section, options?.precision);
  const decimalSep = grouping === 'european' ? ',' : '.';

  let formattedNumStr: string;

  if (typeof precision === 'number') {
    // Fixed precision with half-up rounding
    const fixedStr = d.toFixed(precision, Decimal.ROUND_HALF_UP);
    const parts = fixedStr.split('.');
    const groupedInt = groupIntegerDigits(parts[0], grouping);

    if (parts.length > 1 && precision > 0) {
      formattedNumStr = `${groupedInt}${decimalSep}${parts[1]}`;
    } else {
      formattedNumStr = groupedInt;
    }
  } else {
    // 'auto' precision: max 8 decimal places with trailing zero suppression
    const fixedStr = d.toFixed(8, Decimal.ROUND_HALF_UP);
    const parts = fixedStr.split('.');
    const groupedInt = groupIntegerDigits(parts[0], grouping);

    if (parts.length > 1) {
      const trimmedDecimals = parts[1].replace(/0+$/, '');
      formattedNumStr = trimmedDecimals.length > 0 ? `${groupedInt}${decimalSep}${trimmedDecimals}` : groupedInt;
    } else {
      formattedNumStr = groupedInt;
    }
  }

  const sign = isNegative && !d.isZero() ? '-' : '';
  const symbol = options?.currencySymbol ? `${options.currencySymbol} ` : '';

  return `${symbol}${sign}${formattedNumStr}`;
}
