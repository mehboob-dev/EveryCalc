export interface AffiliateOffer {
  id: string;
  toolId: string; // 'IRA' | 'LON' | 'ITX' | 'GLD' | 'TAX' or any module ID
  enabled?: boolean; // defaults to true if omitted
  title: string;
  partnerName: string;
  badgeText?: string;
  description: string;
  ctaText: string;
  url: string;
  icon?: string;
}

export interface SponsorBanner {
  enabled: boolean;
  toolId?: string; // specific tool ID or '*' for all
  badge?: string;
  text: string;
  ctaText: string;
  url: string;
}

export interface AdPlaceholderConfig {
  enabled?: boolean; // defaults to true if omitted
  badge?: string;
  icon?: string;
  title: string;
  description: string;
  ctaText: string;
  url: string;
}

export interface AdSenseConfig {
  enabled: boolean;
  client: string;
  slot: string;
  testMode?: boolean;
  placeholder?: AdPlaceholderConfig;
}

export interface MonetizationConfig {
  version: number;
  updatedAt: string;
  adsense: AdSenseConfig;
  sponsors: SponsorBanner[];
  affiliates: Record<string, AffiliateOffer>;
}
