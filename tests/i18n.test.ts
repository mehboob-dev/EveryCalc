import { describe, it, expect, beforeEach } from 'vitest';
import {
  isSupportedLanguage,
  getLanguage,
  setLanguage,
  t,
  SUPPORTED_LANGUAGES,
  updatePageSEO
} from '../src/core/i18n.ts';

// In-memory mock storage and DOM for headless node environment
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

const mockElements: Record<string, any> = {};
if (typeof (globalThis as any).document === 'undefined') {
  const mockDoc = {
    title: '',
    documentElement: { lang: 'en' },
    head: {
      appendChild: (el: any) => {
        if (el.attributes?.name === 'description') {
          mockElements['meta[name="description"]'] = el;
        }
        return el;
      }
    },
    querySelector: (selector: string) => mockElements[selector] || null,
    createElement: (tag: string) => {
      const el = {
        tagName: tag,
        attributes: {} as Record<string, string>,
        setAttribute: (k: string, v: string) => {
          el.attributes[k] = v;
        },
        getAttribute: (k: string) => el.attributes[k] || null
      };
      return el;
    }
  };
  Object.defineProperty(globalThis, 'document', {
    value: mockDoc,
    writable: true
  });
}

describe('i18n Core Module', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setLanguage('en', false);
    document.title = 'Initial Title';
    delete mockElements['meta[name="description"]'];
  });

  it('provides a complete list of 6 supported languages', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(['en', 'es', 'pt-BR', 'hi', 'de', 'fr']);
    expect(isSupportedLanguage('en')).toBe(true);
    expect(isSupportedLanguage('es')).toBe(true);
    expect(isSupportedLanguage('pt-BR')).toBe(true);
    expect(isSupportedLanguage('hi')).toBe(true);
    expect(isSupportedLanguage('de')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(true);
    expect(isSupportedLanguage('invalid')).toBe(false);
    expect(isSupportedLanguage(null)).toBe(false);
  });

  it('translates keys accurately in English default', () => {
    setLanguage('en', false);
    expect(t('history')).toBe('History');
    expect(t('settings')).toBe('Settings');
    expect(t('calculators')).toBe('Calculators');
    expect(t('historyTape')).toBe('Calculation History Tape');
    expect(t('clear')).toBe('Clear');
    expect(t('result')).toBe('Result');
    expect(t('from')).toBe('From');
    expect(t('to')).toBe('To');
    expect(t('swapUnits')).toBe('⇅ Swap Units');
    expect(t('NOR_name')).toBe('General Calculator');
  });

  it('translates keys accurately in Spanish (es)', () => {
    setLanguage('es', false);
    expect(t('history')).toBe('Historial');
    expect(t('settings')).toBe('Ajustes');
    expect(t('calculators')).toBe('Calculadoras');
    expect(t('PER_name')).toBe('Calculadora de Porcentajes');
  });

  it('translates keys accurately in Brazilian Portuguese (pt-BR)', () => {
    setLanguage('pt-BR', false);
    expect(t('history')).toBe('Histórico');
    expect(t('settings')).toBe('Configurações');
    expect(t('calculators')).toBe('Calculadoras');
    expect(t('PER_name')).toBe('Calculadora de Porcentagem');
    expect(t('DCT_name')).toBe('Calculadora de Desconto');
  });

  it('translates keys accurately in Hindi (hi)', () => {
    setLanguage('hi', false);
    expect(t('history')).toBe('इतिहास');
    expect(t('settings')).toBe('सेटिंग्स');
    expect(t('PER_name')).toBe('प्रतिशत कैलकुलेटर');
  });

  it('translates keys accurately in German (de) and French (fr)', () => {
    setLanguage('de', false);
    expect(t('history')).toBe('Verlauf');
    expect(t('PER_name')).toBe('Prozentrechner');

    setLanguage('fr', false);
    expect(t('history')).toBe('Historique');
    expect(t('PER_name')).toBe('Calculateur de Pourcentage');
  });

  it('interpolates parameters correctly', () => {
    setLanguage('en', false);
    expect(t('copiedToClipboard', { value: '42' })).toBe('Copied 42 to clipboard');

    setLanguage('es', false);
    expect(t('copiedToClipboard', { value: '99' })).toBe('Copiado 99 al portapapeles');
  });

  it('falls back to English when a key is missing in another language', () => {
    setLanguage('es', false);
    expect(t('some_unknown_key')).toBe('some_unknown_key');
  });

  it('updates document.documentElement.lang and localStorage when language is changed', () => {
    setLanguage('pt-BR', false);
    expect(getLanguage()).toBe('pt-BR');
    expect(document.documentElement.lang).toBe('pt-BR');
    expect(localStorageMock.getItem('everycalc_language')).toBe('pt-BR');
  });

  it('updates page title and meta description dynamically with updatePageSEO', () => {
    setLanguage('pt-BR', false);
    updatePageSEO('PER');

    expect(document.title).toContain('Calculadora de Porcentagem');
    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute('content')).toContain('porcentagens');
  });
});
