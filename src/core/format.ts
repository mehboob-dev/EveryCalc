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
 * Defaults to Indian Lakhs & Crores grouping so input and results match everywhere.
 */
export function resolveGrouping(groupingSetting?: GroupingMode, langCode?: string): 'international' | 'european' | 'indian' {
  const chosen = groupingSetting || getSettings().numberFormat || 'indian';
  if (chosen === 'international' || chosen === 'european' || chosen === 'indian') {
    return chosen;
  }

  const lang = (langCode || getLanguage() || 'en').toLowerCase();
  if (lang === 'de' || lang === 'fr' || lang === 'es' || lang.startsWith('pt')) {
    return 'european';
  }
  // Default to Indian numbering system everywhere
  return 'indian';
}

/**
 * Resolves the effective precision based on single global precision or overrides.
 */
export function resolvePrecision(section?: SectionType, explicitPrecision?: number | 'auto'): number | 'auto' {
  if (explicitPrecision !== undefined) {
    return explicitPrecision;
  }

  const settings = getSettings();
  if (settings.precision !== undefined) {
    return settings.precision;
  }
  if (settings.masterPrecision !== undefined) {
    return settings.masterPrecision;
  }
  if (section && settings.sectionPrecision && settings.sectionPrecision[section] !== undefined) {
    const secVal = settings.sectionPrecision[section];
    if (secVal !== undefined) return secVal;
  }

  return 'auto';
}

/**
 * Formats integer digits according to the specified grouping system.
 */
export function groupIntegerDigits(intPart: string, grouping: 'international' | 'european' | 'indian'): string {
  if (!intPart || intPart.length <= 3) {
    return intPart;
  }

  if (grouping === 'indian') {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherDigits = intPart.substring(0, intPart.length - 3);
    const withCommas = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return withCommas + ',' + lastThree;
  }

  if (grouping === 'european') {
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // international
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formats all numeric literals inside an expression or formula with grouping commas
 * according to the active grouping system (Indian Lakhs/Crores by default).
 */
export function formatExpressionGrouping(
  expr: string,
  groupingSetting?: GroupingMode
): string {
  if (!expr) return expr;
  const grouping = resolveGrouping(groupingSetting);

  // Match numbers (including those with commas or decimals)
  return expr.replace(/[\d,]+(?:\.\d+)?/g, (match) => {
    const raw = match.replace(/,/g, '');
    if (!/^\d+(\.\d+)?$/.test(raw)) return match;
    const parts = raw.split('.');
    const groupedInt = groupIntegerDigits(parts[0], grouping);
    return parts.length > 1 ? groupedInt + '.' + parts[1] : groupedInt;
  });
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
    // Fixed precision with half-up rounding (1 to 10 decimal places)
    const fixedStr = d.toFixed(precision, Decimal.ROUND_HALF_UP);
    const parts = fixedStr.split('.');
    const groupedInt = groupIntegerDigits(parts[0], grouping);

    if (parts.length > 1 && precision > 0) {
      formattedNumStr = groupedInt + decimalSep + parts[1];
    } else {
      formattedNumStr = groupedInt;
    }
  } else {
    // 'auto' precision: max 10 decimal places with trailing zero suppression
    const fixedStr = d.toFixed(10, Decimal.ROUND_HALF_UP);
    const parts = fixedStr.split('.');
    const groupedInt = groupIntegerDigits(parts[0], grouping);

    if (parts.length > 1) {
      const trimmedDecimals = parts[1].replace(/0+$/, '');
      formattedNumStr = trimmedDecimals.length > 0 ? groupedInt + decimalSep + trimmedDecimals : groupedInt;
    } else {
      formattedNumStr = groupedInt;
    }
  }

  const sign = isNegative && !d.isZero() ? '-' : '';
  const symbol = options?.currencySymbol ? options.currencySymbol + ' ' : '';

  return symbol + sign + formattedNumStr;
}
