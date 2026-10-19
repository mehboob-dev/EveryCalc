import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Responsive Breakpoints & Foldable Desktop Layout', () => {
  const cssPath = path.resolve(__dirname, '../src/style.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  it('activates desktop widescreen layout at min-width: 700px for unfolded foldables (Vivo X Fold 3, Galaxy Z Fold, Pixel Fold)', () => {
    expect(css).toContain('@media (min-width: 700px)');
  });

  it('renders permanent desktop sidebar and live history tape on unfolded screens (>=700px)', () => {
    const desktopSection = css.slice(
      css.indexOf('@media (min-width: 700px)'),
      css.indexOf('@media (min-width: 1024px)')
    );

    expect(desktopSection).toContain('.desktop-sidebar');
    expect(desktopSection).toContain('display: flex');
    expect(desktopSection).toContain('.desktop-history-pane');
    expect(desktopSection).toContain('display: flex');
  });

  it('hides mobile hamburger and history drawer buttons on unfolded screens (>=700px) to match desktop behavior', () => {
    const desktopSection = css.slice(
      css.indexOf('@media (min-width: 700px)'),
      css.indexOf('@media (min-width: 1024px)')
    );

    expect(desktopSection).toContain('.desktop-main-area .calc-header #btn-menu');
    expect(desktopSection).toContain('.desktop-main-area .calc-header #btn-history');
    expect(desktopSection).toContain('display: none !important');
  });

  it('scales desktop sidebar and keypad column proportionally for unfolded screens (<1024px) to prevent overflow', () => {
    const desktopSection = css.slice(
      css.indexOf('@media (min-width: 700px)'),
      css.indexOf('@media (min-width: 1024px)')
    );

    expect(desktopSection).toContain('width: 220px');
    expect(desktopSection).toContain('width: 340px');
  });

  it('provides expanded dimensions for widescreen monitors at min-width: 1024px', () => {
    expect(css).toContain('@media (min-width: 1024px)');
    const wideSection = css.slice(css.indexOf('@media (min-width: 1024px)'));
    expect(wideSection).toContain('width: 260px');
    expect(wideSection).toContain('width: 420px');
  });

  it('includes landscape/short-viewport adaptation for foldables in landscape (max-height: 620px)', () => {
    expect(css).toContain('@media (max-height: 620px)');
  });
});
