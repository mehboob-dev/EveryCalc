import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Responsive Breakpoints & Foldable Layout', () => {
  const cssPath = path.resolve(__dirname, '../src/style.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  it('defines a dedicated foldable and tablet responsive breakpoint (600px - 1023px)', () => {
    expect(css).toContain('@media (min-width: 600px) and (max-width: 1023px)');
  });

  it('ensures hamburger menu and history buttons remain visible on foldable screens', () => {
    const foldableSection = css.slice(
      css.indexOf('@media (min-width: 600px) and (max-width: 1023px)'),
      css.indexOf('@media (min-width: 1024px)')
    );

    expect(foldableSection).toContain('.calc-header #btn-menu');
    expect(foldableSection).toContain('.calc-header #btn-history');
    expect(foldableSection).toContain('display: flex !important');
  });

  it('suppresses desktop permanent sidebar and desktop history pane on foldables (<1024px)', () => {
    const foldableSection = css.slice(
      css.indexOf('@media (min-width: 600px) and (max-width: 1023px)'),
      css.indexOf('@media (min-width: 1024px)')
    );

    expect(foldableSection).toContain('.desktop-sidebar');
    expect(foldableSection).toContain('.desktop-history-pane');
    expect(foldableSection).toContain('display: none !important');
  });

  it('moves the desktop widescreen dual-pane layout to min-width: 1024px', () => {
    expect(css).toContain('@media (min-width: 1024px)');
    expect(css).not.toMatch(/@media\s*\(\s*min-width:\s*768px\s*\)\s*\{[^}]*#app/);
  });

  it('includes landscape/short-viewport adaptation for unfolded foldables in landscape', () => {
    expect(css).toContain('@media (max-height: 620px)');
  });
});
