// The reset's guarantees, held against the compiled output.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss, { type AtRule, type Rule } from 'postcss';
import * as sass from 'sass';
import { describe, expect, test } from 'vitest';

const css = readFileSync(resolve(__dirname, '../dist/reset.css'), 'utf8');

function layerOf(rule: Rule): string | undefined {
  for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
    if (parent.type === 'atrule' && (parent as AtRule).name === 'layer') return (parent as AtRule).params;
  }
  return undefined;
}

describe('the prebuilt stylesheet', () => {
  test('every rule sits in the reset layer', () => {
    const outside: string[] = [];
    postcss.parse(css).walkRules((rule) => {
      if (layerOf(rule) !== 'reset') outside.push(rule.selector);
    });
    expect(outside).toEqual([]);
  });

  test("no !important: in the weakest layer it would outrank a consumer's own", () => {
    expect(css).not.toContain('!important');
  });

  test('no literal color: the reset states no palette', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
  });

  test('outline, appearance and white-space are never reset', () => {
    const touched: string[] = [];
    postcss.parse(css).walkDecls(/^(outline|appearance|white-space)$/, (declaration) => touched.push(declaration.prop));
    expect(touched).toEqual([]);
  });

  test('no display map: display is set only on replaced media', () => {
    const displays: string[] = [];
    postcss.parse(css).walkDecls('display', (declaration) => displays.push(...(declaration.parent as Rule).selectors));
    expect(displays).toEqual(['img', 'picture', 'video', 'canvas', 'svg']);
  });
});

// Each rule a browser default would otherwise survive past the universal
// rule, closed on purpose.
describe('the gaps the universal rule leaves', () => {
  const declarations = (selector: string) => {
    const found: Record<string, string> = {};
    postcss.parse(css).walkRules((rule) => {
      if (rule.selectors.includes(selector)) rule.walkDecls((declaration) => (found[declaration.prop] = declaration.value));
    });
    return found;
  };

  test('the file input button takes the full universal list, in a rule of its own', () => {
    const own = declarations('::file-selector-button');
    const universal = declarations('*');
    expect(own).toEqual(universal);
  });

  test("and so does Safari's older name for it", () => {
    expect(declarations('::-webkit-file-upload-button')).toEqual(declarations('*'));
  });

  test('the body is a viewport tall, in vh where dvh is unknown', () => {
    const heights: string[] = [];
    postcss.parse(css).walkRules('body', (rule) => rule.walkDecls('min-height', (declaration) => heights.push(declaration.value)));
    expect(heights).toEqual(['100vh', '100dvh']);
  });

  test('the placeholder takes the text color', () => {
    expect(declarations('::placeholder')).toEqual({ color: 'inherit', opacity: '1' });
  });

  test('a backdrop is clear', () => {
    expect(declarations('::backdrop')).toEqual({ background: 'none' });
  });

  test('every open dialog is centered, modal or not', () => {
    expect(declarations('dialog')).toEqual({ margin: 'auto' });
  });

  test('a recent selector stands in a rule of its own, so a browser that does not know it drops nothing else', () => {
    const shared: string[] = [];
    postcss.parse(css).walkRules((rule) => {
      if (rule.selectors.length > 1 && rule.selectors.some((selector) => /:popover-open|::file-selector-button|::-webkit-|::-moz-|::picker\(/.test(selector))) shared.push(rule.selector);
    });
    expect(shared).toEqual([]);
  });

  test('table cells sit edge to edge', () => {
    expect(declarations('table')).toEqual({ 'border-collapse': 'collapse', 'border-spacing': '0' });
  });

  test('a text field is twenty characters wide unless it says otherwise', () => {
    const fields = declarations('textarea:not([cols])');
    expect(fields).toEqual({ 'inline-size': '20ch' });
    postcss.parse(css).walkRules((rule) => {
      if (rule.selectors.includes('textarea:not([cols])')) expect(rule.selectors[0]).toMatch(/^input:is\(.*\):not\(\[size\]\)$/);
    });
  });

  test('q adds no quotation marks', () => {
    expect(declarations('q::before')).toEqual({ content: 'none' });
    expect(declarations('q::after')).toEqual({ content: 'none' });
  });
});

describe('the mixin', () => {
  const compile = (source: string) =>
    sass.compileString(source, { loadPaths: [resolve(__dirname, '../src')] }).css;

  test('emits into the layer the kit names, and nothing outside it', () => {
    const output = compile('@use "index" as reset; @layer kit.reset { @include reset.rules; }');
    const outside: string[] = [];
    postcss.parse(output).walkRules((rule) => {
      if (layerOf(rule) !== 'kit.reset') outside.push(rule.selector);
    });
    expect(outside).toEqual([]);
  });

  const appearances = (appearance: string) => {
    const output = compile(`@use "index" as reset; @layer kit.reset { @include reset.rules($appearance: ${appearance}); }`);
    const found: Record<string, string> = {};
    postcss.parse(output).walkDecls('appearance', (declaration) => (found[(declaration.parent as Rule).selector] = declaration.value));
    return found;
  };

  test('leaves every control native unless the kit opts in', () => {
    expect(compile('@use "index" as reset; @layer kit.reset { @include reset.rules; }')).not.toContain('appearance');
  });

  test('takes a control out of the browser\'s drawing only when the kit names it', () => {
    expect(appearances('(checkbox: none)')).toEqual({ 'input[type=checkbox]': 'none' });
  });

  test('clears the parts an engine draws as pseudo-elements, each in a rule of its own', () => {
    const found = appearances('(number: none, search: none, range: none)');
    expect(found).toMatchObject({
      'input[type=number]': 'textfield',
      'input[type=number]::-webkit-inner-spin-button': 'none',
      'input[type=search]::-webkit-search-cancel-button': 'none',
      'input[type=range]::-webkit-slider-thumb': 'none',
    });
    for (const selector of Object.keys(found)) expect(selector).not.toContain(',');
  });

  test('with select: base-closed, makes the closed select customizable and leaves its menu native', () => {
    expect(appearances('(select: base-closed)')).toEqual({ select: 'base-select' });
  });

  test('with select: base, also draws the picker in the page and clears it, in a rule of its own', () => {
    const output = compile('@use "index" as reset; @layer kit.reset { @include reset.rules($appearance: (select: base)); }');
    const picker: Record<string, string> = {};
    postcss.parse(output).walkRules((rule) => {
      if (rule.selector === '::picker(select)') rule.walkDecls((declaration) => (picker[declaration.prop] = declaration.value));
    });
    expect(picker).toMatchObject({ appearance: 'base-select', background: 'none', border: '0 solid', padding: '0', margin: '0' });
  });

  test('with select: none, draws no arrow', () => {
    expect(appearances('(select: none)')).toEqual({ select: 'none' });
  });

  test('refuses a control it does not know, a value a control does not take, and anything but a map', () => {
    expect(() => compile('@use "index" as reset; @include reset.rules($appearance: (knob: none));')).toThrow(/no control knob/);
    expect(() => compile('@use "index" as reset; @include reset.rules($appearance: (checkbox: base));')).toThrow(/checkbox becomes none, not base/);
    expect(() => compile('@use "index" as reset; @include reset.rules($appearance: true);')).toThrow(/is a map from a control/);
  });

  test("takes the kit's name for the cursor property", () => {
    const output = compile('@use "index" as reset; @layer kit.reset { @include reset.rules($cursor-property: --kit--cursor); }');
    expect(output).toContain('cursor: var(--kit--cursor, inherit)');
    expect(output).not.toContain('--reset--cursor');
  });
});
