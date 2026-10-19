import { MonetizationConfig } from './types.ts';
import { DEFAULT_MONETIZATION_CONFIG } from './defaults.ts';
import { getSettings } from '../settings.ts';

const MONETIZATION_STORAGE_KEY = 'everycalc_monetization_config';
let currentConfig: MonetizationConfig = { ...DEFAULT_MONETIZATION_CONFIG };

// Load cached config on initialization
try {
  if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem(MONETIZATION_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as MonetizationConfig;
      if (parsed && typeof parsed.version === 'number') {
        currentConfig = parsed;
      }
    }
  }
} catch {
  // Use default
}

export function getMonetizationConfig(): MonetizationConfig {
  return currentConfig;
}

export function setMonetizationConfig(config: MonetizationConfig): void {
  currentConfig = config;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MONETIZATION_STORAGE_KEY, JSON.stringify(config));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Fetches updated remote configuration in the background.
 * Falls back cleanly to current/cached configuration if network fails or times out.
 */
export async function syncRemoteMonetizationConfig(
  remoteUrl: string = 'https://raw.githubusercontent.com/mehboob-itqantrades/everycalc/main/public/ads-config.json',
  timeoutMs: number = 3000
): Promise<MonetizationConfig> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(remoteUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const remoteData = (await res.json()) as MonetizationConfig;
      if (remoteData && typeof remoteData.version === 'number') {
        if (remoteData.version >= currentConfig.version) {
          setMonetizationConfig(remoteData);
        }
      }
    }
  } catch {
    // Graceful offline fallback: keep cached/default config without throwing
  }
  return currentConfig;
}

/**
 * Generates the HTML template string for an affiliate card.
 */
export function getAffiliateCardHtml(toolId: string): string | null {
  const settings = getSettings();
  if (!settings.showAdsAndOffers) return null;

  const offer = currentConfig.affiliates[toolId];
  if (!offer || !offer.url || offer.enabled === false) return null;

  return `
    <div class="affiliate-card" data-tool-id="${toolId}">
      <div class="affiliate-card-header">
        <div class="affiliate-badge-row">
          <span class="affiliate-sponsor-tag">Partner Offer</span>
          ${offer.badgeText ? `<span class="affiliate-badge">${offer.badgeText}</span>` : ''}
        </div>
        <span class="affiliate-icon">${offer.icon || '⚡'}</span>
      </div>
      <div class="affiliate-title">${offer.title}</div>
      <div class="affiliate-desc">${offer.description}</div>
      <div class="affiliate-footer">
        <span class="affiliate-partner-name">via ${offer.partnerName}</span>
        <a href="${offer.url}" target="_blank" rel="noopener noreferrer" class="affiliate-btn">
          <span>${offer.ctaText}</span>
          <span class="affiliate-btn-arrow">➔</span>
        </a>
      </div>
    </div>
  `.trim();
}

/**
 * Builds a Claymorphic Contextual Affiliate Card for a given calculator.
 */
export function createAffiliateCardElement(toolId: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  const html = getAffiliateCardHtml(toolId);
  if (!html) return null;

  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.firstElementChild as HTMLElement;
}

/**
 * Generates HTML string for sponsor banner.
 */
export function getSponsorBannerHtml(toolId: string): string | null {
  const settings = getSettings();
  if (!settings.showAdsAndOffers) return null;

  const sponsor = currentConfig.sponsors.find((s) => s.enabled && (s.toolId === '*' || s.toolId === toolId));
  if (!sponsor) return null;

  return `
    <div class="sponsor-strip">
      <div class="sponsor-content">
        <span class="sponsor-badge">${sponsor.badge || 'Sponsored'}</span>
        <span class="sponsor-text">${sponsor.text}</span>
      </div>
      <a href="${sponsor.url}" target="_blank" rel="noopener noreferrer" class="sponsor-link">
        ${sponsor.ctaText} ➔
      </a>
    </div>
  `.trim();
}

/**
 * Builds a Sponsor Strip banner element if enabled.
 */
export function createSponsorBannerElement(toolId: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  const html = getSponsorBannerHtml(toolId);
  if (!html) return null;

  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.firstElementChild as HTMLElement;
}

/**
 * Generates the HTML string for the fallback AdSense placeholder card.
 */
export function getAdPlaceholderHtml(): string | null {
  const settings = getSettings();
  if (!settings.showAdsAndOffers) return null;

  const adConfig = currentConfig.adsense;
  if (!adConfig) return null;

  const placeholder = adConfig.placeholder;
  if (!placeholder || placeholder.enabled === false) return null;

  const badge = placeholder.badge || 'Sponsored';
  const icon = placeholder.icon || '📢';
  const title = placeholder.title || 'Advertise on EveryCalc';
  const desc = placeholder.description || '';
  const cta = placeholder.ctaText || 'Learn More';
  const url = placeholder.url || 'https://earnkaro.com';

  return `
    <div class="ad-placeholder-card">
      <div class="ad-placeholder-header">
        <div class="ad-placeholder-badge-row">
          <span class="ad-placeholder-badge">${badge}</span>
        </div>
        <span class="ad-placeholder-icon">${icon}</span>
      </div>
      <div class="ad-placeholder-title">${title}</div>
      ${desc ? `<div class="ad-placeholder-desc">${desc}</div>` : ''}
      <div class="ad-placeholder-footer">
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="ad-placeholder-btn">
          <span>${cta}</span>
          <span class="ad-placeholder-arrow">➔</span>
        </a>
      </div>
    </div>
  `.trim();
}

/**
 * Builds a Google AdSense / Banner container with responsive layout and graceful collapse.
 * When AdSense is enabled, injects Google adsbygoogle (or testMode badge).
 * When AdSense is disabled, injects the configurable fallback placeholder.
 */
export function createAdSenseContainer(placement: 'bottom-sticky' | 'desktop-pane'): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  const settings = getSettings();
  if (!settings.showAdsAndOffers) return null;

  const adConfig = currentConfig.adsense;
  if (!adConfig) return null;

  const container = document.createElement('div');
  container.className = `adsense-slot adsense-${placement}`;
  container.id = `adsense-${placement}`;

  if (adConfig.enabled) {
    if (adConfig.testMode) {
      container.innerHTML = `
        <div class="adsense-test-placeholder">
          <div class="adsense-test-badge">Sponsored Advertisement</div>
          <div class="adsense-test-info">Google AdSense Auto-Responsive Slot (${placement})</div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${adConfig.client}"
             data-ad-slot="${adConfig.slot}"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      `;
    }
    return container;
  }

  // When AdSense is disabled, render the configured placeholder
  const placeholderHtml = getAdPlaceholderHtml();
  if (!placeholderHtml) return null;

  container.innerHTML = placeholderHtml;
  return container;
}
