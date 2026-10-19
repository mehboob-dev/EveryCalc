import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Responsive Breakpoints, Foldable Support, Keypad Ratio & Collapsible Sidebar', () => {
  const cssPath = path.resolve(__dirname, '../src/style.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  const mainTsPath = path.resolve(__dirname, '../src/main.ts');
  const mainTs = fs.readFileSync(mainTsPath, 'utf8');

  it('activates desktop widescreen layout at min-width: 700px for unfolded foldables (Vivo X Fold 3, Galaxy Z Fold, Pixel Fold)', () => {
    expect(css).toContain('@media (min-width: 700px)');
  });

  it('provides collapsible sidebar styling with transition effects and compact 58px icon-rail collapsed state like ChatGPT', () => {
    const desktopSection = css.slice(
      css.indexOf('@media (min-width: 700px)'),
      css.indexOf('@media (min-width: 1024px)')
    );

    expect(desktopSection).toContain('.desktop-sidebar');
    expect(desktopSection).toContain('.desktop-shell.sidebar-collapsed .desktop-sidebar');
    expect(desktopSection).toContain('width: 58px !important');
    expect(desktopSection).toContain('opacity: 1');
    expect(desktopSection).toContain('visibility: visible');
  });

  it('defaults sidebar to collapsed icon-rail mode on initial load unless explicitly expanded', () => {
    expect(mainTs).toContain('sidebar-collapsed');
    expect(mainTs).toContain('everycalc-sidebar-collapsed');
    expect(mainTs).toContain("savedState === null || savedState === 'true'");
  });

  it('allocates 60% height share to keypad grid and 40% height share to input display', () => {
    expect(css).toContain('.calc-display');
    expect(css).toContain('flex: 0 0 38%');
    expect(css).toContain('.calc-keypad');
    expect(css).toContain('grid-template-rows: repeat(5, 1fr)');
  });

  it('provides overflow-safe flexible preset pills and segmented pill toggle group', () => {
    expect(css).toContain('.pill-toggle-group');
    expect(css).toContain('.pill-toggle-btn');
    expect(css).toContain('.btn-preset');
    expect(css).toContain('min-width: max-content');
  });

  it('hides #btn-menu on desktop / unfolded screens to eliminate duplicate toggle buttons with sidebar collapse button', () => {
    const desktopSection = css.slice(
      css.indexOf('@media (min-width: 700px)'),
      css.indexOf('@media (min-width: 1024px)')
    );

    expect(desktopSection).toContain('.desktop-main-area .calc-header #btn-menu');
    expect(desktopSection).toContain('display: none !important');
    expect(desktopSection).toContain('.desktop-main-area .calc-header #btn-history');
  });

  it('provides touch swipe gesture support for expanding and collapsing sidebar and mobile drawers', () => {
    expect(mainTs).toContain('isSwipingSidebar');
    expect(mainTs).toContain('deltaX');
    expect(mainTs).toContain('deltaY');
    expect(mainTs).toContain("toggleDesktopSidebar(false)");
    expect(mainTs).toContain("toggleDesktopSidebar(true)");
  });

  it('configures desktop history pane with min-width: 0 to prevent off-screen horizontal blowout', () => {
    const desktopSection = css.slice(
      css.indexOf('@media (min-width: 700px)'),
      css.indexOf('@media (min-width: 1024px)')
    );

    expect(desktopSection).toContain('.desktop-history-pane');
    expect(desktopSection).toContain('min-width: 0');
    expect(desktopSection).toContain('flex: 1');
  });

  it('scales keypad column fluidly with clamp to maintain balance on 700px-880px foldables', () => {
    const desktopSection = css.slice(
      css.indexOf('@media (min-width: 700px)'),
      css.indexOf('@media (min-width: 1024px)')
    );

    expect(desktopSection).toContain('width: clamp(280px, 42vw, 320px)');
  });

  it('includes collapse sidebar button and toggle logic in main.ts with state persistence', () => {
    expect(mainTs).toContain('id="btn-collapse-sidebar"');
    expect(mainTs).toContain('toggleDesktopSidebar');
  });

  it('provides expanded dimensions for widescreen monitors at min-width: 1024px', () => {
    expect(css).toContain('@media (min-width: 1024px)');
    const wideSection = css.slice(css.indexOf('@media (min-width: 1024px)'));
    expect(wideSection).toContain('width: 250px');
    expect(wideSection).toContain('width: 400px');
  });

  it('includes landscape/short-viewport adaptation for foldables in landscape (max-height: 620px)', () => {
    expect(css).toContain('@media (max-height: 620px)');
  });
});
