import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Calculator Resultant & Live Preview Layout Invariants', () => {
  const cssPath = path.resolve(__dirname, '../src/style.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  const mainTsPath = path.resolve(__dirname, '../src/main.ts');
  const mainTs = fs.readFileSync(mainTsPath, 'utf8');

  it('keeps evaluated resultant at fixed font size with single-line horizontal scroll for large numbers', () => {
    expect(css).toContain('.calc-display .display-main.is-result');
    expect(css).toContain('white-space: nowrap');
    expect(css).toContain('overflow-x: auto');
    expect(css).toContain('overflow-y: hidden');
  });

  it('maintains identical balanced font size for both live preview and evaluated result', () => {
    expect(css).toContain('.calc-display .display-main.is-result');
    expect(css).toContain('.display-preview');
    // Both share clamp(24px, 6.5vw, 30px)
    expect(css).toContain('font-size: clamp(24px, 6.5vw, 30px)');
  });

  it('maintains a fixed, non-collapsible slot for live preview resultant (= ...) during multiline typing', () => {
    expect(css).toContain('.display-preview');
    expect(css).toContain('flex-shrink: 0');
    expect(css).toContain('min-height: 32px');
  });

  it('configures display-main with flex: 1 1 auto and min-height: 0 to scroll cleanly without compressing preview', () => {
    expect(css).toContain('.display-main');
    expect(css).toContain('flex: 1 1 auto');
    expect(css).toContain('min-height: 0');
  });

  it('toggles is-result class and clears auto-shrink classes when result is displayed in main.ts', () => {
    expect(mainTs).toContain("displayMain.classList.add('is-result')");
    expect(mainTs).toContain("displayMain.classList.remove('len-compact', 'len-floor')");
    expect(mainTs).toContain("displayMain.classList.remove('is-result')");
  });

  it('preserves auto-shrink and vertical cursor scrolling while entering formulas', () => {
    expect(mainTs).toContain("displayMain.classList.add('len-floor')");
    expect(mainTs).toContain("displayMain.classList.add('len-compact')");
    expect(mainTs).toContain("cursor.scrollIntoView({ block: 'nearest', behavior: 'auto' })");
  });
});
