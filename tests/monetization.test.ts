import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMonetizationConfig,
  setMonetizationConfig,
  syncRemoteMonetizationConfig,
  getAffiliateCardHtml,
  getSponsorBannerHtml,
  createAffiliateCardElement,
  createSponsorBannerElement,
  createAdSenseContainer,
  getAdPlaceholderHtml
} from '../src/core/monetization/engine.ts';
import { DEFAULT_MONETIZATION_CONFIG } from '../src/core/monetization/defaults.ts';
import { updateSettings } from '../src/core/settings.ts';

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

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      let innerHTML = '';
      return {
        tagName: tag.toUpperCase(),
        className: '',
        id: '',
        get innerHTML() {
          return innerHTML;
        },
        set innerHTML(val: string) {
          innerHTML = val;
        },
        firstElementChild: {
          tagName: 'DIV',
          className: ''
        }
      };
    }
  };
}

describe('3-Tier Monetization & Ads Engine', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setMonetizationConfig({ ...DEFAULT_MONETIZATION_CONFIG });
    updateSettings({ showAdsAndOffers: true });
    vi.restoreAllMocks();
  });

  it('loads default monetization config with IRA, LON, ITX, GLD, TAX offers', () => {
    const config = getMonetizationConfig();
    expect(config.version).toBe(1);
    expect(config.affiliates.IRA).toBeDefined();
    expect(config.affiliates.LON).toBeDefined();
    expect(config.affiliates.ITX).toBeDefined();
    expect(config.affiliates.GLD).toBeDefined();
    expect(config.affiliates.TAX).toBeDefined();
    expect(config.affiliates.IRA.title).toContain('SIP');
  });

  it('generates affiliate card HTML with safe link attributes', () => {
    const html = getAffiliateCardHtml('IRA');
    expect(html).not.toBeNull();
    expect(html).toContain('affiliate-card');
    expect(html).toContain('data-tool-id="IRA"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('https://bitli.in/nh7R7Op');
  });

  it('generates affiliate card for Loan EMI (LON) with proper headline and partner info', () => {
    const html = getAffiliateCardHtml('LON');
    expect(html).not.toBeNull();
    expect(html).toContain('Kotak League Platinum Credit Card');
    expect(html).toContain('Kotak Mahindra Bank');
    expect(html).toContain('https://bitli.in/JvX8L60');
  });

  it('returns null when user disables promotional offers & ads in settings', () => {
    updateSettings({ showAdsAndOffers: false });

    const htmlCard = getAffiliateCardHtml('IRA');
    expect(htmlCard).toBeNull();

    const htmlBanner = getSponsorBannerHtml('ITX');
    expect(htmlBanner).toBeNull();

    const card = createAffiliateCardElement('IRA');
    expect(card).toBeNull();

    const banner = createSponsorBannerElement('ITX');
    expect(banner).toBeNull();

    const adContainer = createAdSenseContainer('desktop-pane');
    expect(adContainer).toBeNull();
  });

  it('gracefully handles offline or network failures in syncRemoteMonetizationConfig', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error / offline'));

    const res = await syncRemoteMonetizationConfig('https://invalid.url/config.json', 100);
    expect(res).toBeDefined();
    expect(res.version).toBe(1);
    expect(res.affiliates.IRA.id).toBe('aff-ira-angelone');
  });

  it('updates local config when remote version is higher', async () => {
    const updatedPayload = {
      ...DEFAULT_MONETIZATION_CONFIG,
      version: 2,
      affiliates: {
        ...DEFAULT_MONETIZATION_CONFIG.affiliates,
        IRA: {
          ...DEFAULT_MONETIZATION_CONFIG.affiliates.IRA,
          title: 'Special Diwaly 0% Brokerage Offer'
        }
      }
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => updatedPayload
    });

    const res = await syncRemoteMonetizationConfig('https://valid.url/config.json');
    expect(res.version).toBe(2);
    expect(res.affiliates.IRA.title).toBe('Special Diwaly 0% Brokerage Offer');

    // Confirm persisted in localStorage
    const saved = JSON.parse(mockStorage['everycalc_monetization_config']);
    expect(saved.version).toBe(2);
  });

  describe('AdSense Real Ads vs. Configurable Placeholder', () => {
    it('renders real AdSense ins element when adsense is enabled and testMode is false', () => {
      setMonetizationConfig({
        ...DEFAULT_MONETIZATION_CONFIG,
        adsense: {
          enabled: true,
          client: 'ca-pub-1234567890123456',
          slot: '9876543210',
          testMode: false
        }
      });

      const container = createAdSenseContainer('desktop-pane');
      expect(container).not.toBeNull();
      expect(container?.className).toContain('adsense-desktop-pane');
      expect(container?.innerHTML).toContain('adsbygoogle');
      expect(container?.innerHTML).toContain('data-ad-client="ca-pub-1234567890123456"');
      expect(container?.innerHTML).toContain('data-ad-slot="9876543210"');
    });

    it('renders AdSense test badge when adsense is enabled and testMode is true', () => {
      setMonetizationConfig({
        ...DEFAULT_MONETIZATION_CONFIG,
        adsense: {
          enabled: true,
          client: 'ca-pub-1234567890123456',
          slot: '9876543210',
          testMode: true
        }
      });

      const container = createAdSenseContainer('desktop-pane');
      expect(container).not.toBeNull();
      expect(container?.innerHTML).toContain('adsense-test-placeholder');
      expect(container?.innerHTML).toContain('Google AdSense Auto-Responsive Slot');
    });

    it('renders configurable placeholder card when adsense is disabled', () => {
      setMonetizationConfig({
        ...DEFAULT_MONETIZATION_CONFIG,
        adsense: {
          enabled: false,
          client: 'ca-pub-0000000000000000',
          slot: '0000000000',
          placeholder: {
            enabled: true,
            badge: 'Exclusive Sponsor',
            icon: '🚀',
            title: 'Grow Your Investments with Partner X',
            description: 'Get exclusive cashback and zero fee trading today.',
            ctaText: 'Claim Bonus',
            url: 'https://earnkaro.com/partner-x'
          }
        }
      });

      const placeholderHtml = getAdPlaceholderHtml();
      expect(placeholderHtml).not.toBeNull();
      expect(placeholderHtml).toContain('ad-placeholder-card');
      expect(placeholderHtml).toContain('Exclusive Sponsor');
      expect(placeholderHtml).toContain('Grow Your Investments with Partner X');
      expect(placeholderHtml).toContain('Claim Bonus');
      expect(placeholderHtml).toContain('https://earnkaro.com/partner-x');

      const container = createAdSenseContainer('desktop-pane');
      expect(container).not.toBeNull();
      expect(container?.innerHTML).toContain('ad-placeholder-card');
      expect(container?.innerHTML).toContain('Claim Bonus');
    });

    it('returns null when adsense is disabled and placeholder is explicitly disabled', () => {
      setMonetizationConfig({
        ...DEFAULT_MONETIZATION_CONFIG,
        adsense: {
          enabled: false,
          client: 'ca-pub-0000000000000000',
          slot: '0000000000',
          placeholder: {
            enabled: false,
            badge: 'Sponsor',
            title: 'Ad Space',
            description: 'Description',
            ctaText: 'Click',
            url: 'https://earnkaro.com'
          }
        }
      });

      expect(getAdPlaceholderHtml()).toBeNull();
      expect(createAdSenseContainer('desktop-pane')).toBeNull();
    });
  });
});
