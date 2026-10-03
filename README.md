# hard-reset

A hard element reset. Every browser default a design system would otherwise
fight is set back to nothing, so every style on the page is one you wrote, the
engines agree as far as they can, and no element surprises you.

It ships two ways:

- **Prebuilt CSS** in a cascade layer named `reset`, for a page to use as it is.
- **A Sass mixin** with no layer of its own, for a UI kit that compiles the
  reset into its own layer order.

## Use the CSS

```css
@import 'hard-reset/css';
```

or from JavaScript, through a bundler:

```ts
import 'hard-reset/css';
```

Every rule sits in `@layer reset`, the weakest place in the cascade, so your
own unlayered CSS beats all of it. If you use layers yourself, name `reset`
first in your order statement:

```css
@layer reset, base, components, utilities;
```

## Use the mixin

```scss
@use 'pkg:hard-reset' as reset;

@layer kit.reset {
  @include reset.rules;
}
```

`pkg:` is Sass's Node package importer (`NodePackageImporter`, Dart Sass 1.71
or later); a build without it can put `node_modules` on its load path and
`@use 'hard-reset/src/index' as reset`.

`rules` takes two arguments, each with a default that leaves the reset as the
prebuilt CSS has it:

- **`$cursor-property`**, the custom property the link cursor is set through
  (default `--reset--cursor`). A kit whose own rules claim that property
  passes its own name.
- **`$appearance`** takes controls out of the browser's own drawing, one
  control at a time: a map from a control to what it becomes. A control left
  out stays native, as it is in the prebuilt CSS.

  ```scss
  @include reset.rules($appearance: (checkbox: none, radio: none, select: base));
  ```

  Every control takes `none`, which sets `appearance: none` and clears each
  part an engine draws as a pseudo-element of its own, like any element, in a
  rule of its own. A select also takes `base` or `base-closed`.

  - **`checkbox`, `radio`:** `none` draws nothing at all, and the reset's zero
    border and padding leave no size either; the component gives them one.
  - **`range`:** `none` clears the track and the thumb.
  - **`number`:** `none` drops the spin buttons (`appearance: textfield`, and
    the buttons themselves cleared in Chromium and WebKit).
  - **`search`:** `none` drops the cancel button and the search decoration.
  - **`color`:** `none` takes the frame away; the color stays, since it is the
    field's value.
  - **`progress`, `meter`:** `none` clears the bar and its fill.
  - **`select`**, three ways:
    - `none`: no arrow, and in every browser no inner inset, no forced
      line-height and no Safari radius either (see Known limitations); the
      system's own menu still opens.
    - `base-closed`: the customizable select, `appearance: base-select`, for
      the closed select alone, where a browser has it (Chromium and Edge 135
      and later; Safari 26 does not yet), and native elsewhere. Its text sits
      at the left edge with the page's line-height and a disclosure icon after
      it, and it still opens the system's own menu.
    - `base`: `base-closed`, with the picker drawn in the page instead of a
      system menu, and cleared like any element: no border, no background, no
      padding. The options keep their checkmark; their hover and selected
      states are the component's to draw, and the keyboard focus ring stays.

    A customizable select lays out its text and icon in a row of its own;
    `display: block` breaks that row, so a component that changes its display
    uses `flex` or `inline-flex`.

  Date and time fields are not among them: their pickers stay under
  `appearance: none`.

  **A kit that opts in owns forced colors for those controls.** In Windows'
  high contrast mode a native control redraws itself in the system colors; a
  control out of the browser's drawing does not, so the kit styles it under
  `@media (forced-colors: active)`.

## Browser support

Every browser with cascade layers: Chrome and Edge 99, Firefox 97, Safari
15.4, and everything since. A browser without layers drops the whole
stylesheet, since every rule sits in one, so there is no older version for
the reset to reach. The rules are measured in Chromium from 101, Firefox from
97 and WebKit from 15.4 to the current versions, and the current ones on
Linux, Windows and macOS, with Edge on Windows and Safari on macOS. What
differs:

- An open popover is centered only where popovers exist; an open `<dialog>`
  is centered everywhere.
- `select: base` and `base-closed` take effect in Chromium and Edge 135 and
  later; elsewhere a select stays native. Every `none` is measured clear
  from Chromium 101, Firefox 97 and WebKit 15.4 to the current versions, and
  in Safari, Chrome, Edge and Firefox on macOS, Linux and Windows.
- What a browser sets after the cascade differs from engine to engine, and
  more in older versions; see Known limitations.

## What it does

The reset is one universal rule, an explicit list of properties, plus a few
element rules for what that list cannot say.

- **Box and spacing:** `box-sizing: border-box`, and no margin, padding,
  border or radius. The border is `0 solid` rather than `none`, so a rule that
  wants an edge sets a width alone.
- **Type:** `font: inherit` and `color: inherit` on every element, so the type
  comes from wherever you state it on the page, and `text-transform`,
  `letter-spacing`, `word-spacing` and `text-decoration-skip-ink` inherit too
  (WebKit's `<ins>` and `<del>` otherwise draw their lines through the
  descenders). `text-decoration`,
  `text-indent`, `text-align` and `vertical-align` go back to their plain
  values.
- **Text-level elements carry no look of their own.** `<strong>` is not bold,
  `<em>` is not italic, `<h1>` is the size of the text around it. What an
  element *means* stays in the markup, where assistive technology reads it;
  what it *looks like* is its class's job. Outside rich text, a `<strong>` with
  a class is styled by that class, and a theme is free to make emphasis
  something other than bold. Rich text, the place where arbitrary author HTML
  appears, restores the formatting in its own scope.
- **Lists:** no markers. Give a list whose markers were its meaning
  `role="list"`, and style the markers you want.
- **Cursor:** `inherit` everywhere, which ends at `html` as `auto`, so the
  browser hands out no pointer on its own. Links get `default` by name,
  because WebKit alone turns `auto` into a hand on a link. A control that
  wants a pointer declares one.
- **Flex and grid items** floor at zero rather than at their content's
  width: `min-width: 0` and `min-height: 0`.
- **Media:** `img`, `picture`, `video`, `canvas` and `svg` are blocks capped at
  their container's width, which removes the gap under an inline image.
- **What comes back by name:** the `<summary>` disclosure marker (an
  affordance, not formatting), the centering of an open `<dialog>`, modal or
  not, and of an open popover (which the universal `margin: 0` would otherwise
  pin to a corner; the popover has a rule of its own, so a browser without
  popovers still centers the dialog), and `<fieldset>`'s ability to shrink.
- **What the universal rule cannot reach, reset by name:** the file input's
  button (`::file-selector-button` takes the whole property list, in a rule of
  its own, since one pseudo-element a browser does not know would drop a
  selector list with it, and so does `::-webkit-file-upload-button`, its name
  in Safari before 16.4), the placeholder (the text color, at full opacity),
  and a modal dialog's backdrop (clear).
- **Text fields** are twenty characters wide, the width `size` and `cols`
  default to, measured in `ch`: an `<input>` that takes text (text, search,
  email, url, tel, password, number) and a `<textarea>`. Left to the browser,
  that default comes out anywhere from 187 to 241 pixels in the same font,
  since each engine averages a character its own way; in `ch` it is the same
  everywhere. A field given `size` or `cols` keeps the browser's measure.
- **Tables:** collapsed borders and no spacing between cells.
- **`<q>`** adds no quotation marks of its own.
- **Long words** in paragraphs and headings wrap rather than overflow.
- **Browsers on small screens** do not inflate text on rotation or in a
  narrow column (`text-size-adjust`, and the `-webkit-` form iOS Safari still
  needs).
- **`body`** is at least the height of the viewport (`100dvh`, with `100vh`
  before it for the browsers that predate `dvh`).

## What it leaves alone, on purpose

- **`outline`.** Removing it removes the keyboard focus indicator from every
  control on the page. Browsers already scope their ring to `:focus-visible`,
  so there is no reason left to strip it; a control that draws its own focus
  cue removes the ring itself.
- **`appearance`.** `appearance: none` collapses a checkbox to nothing, so it
  belongs on the controls you actually restyle, with a size beside it.
- **`white-space`.** An inherited value would break `<pre>` and `<textarea>`.
- **`display`.** There is no `all:` in the reset and no table of display
  values to restore. `all: initial` would set `display: inline` on
  `<script>`, `<style>` and `<title>` and render their text on the page, and
  would drop the browser's `user-select: none` on buttons. Because the reset
  never touches `display`, the browser's own values stand.
- **`[hidden]`.** The only way to make it strong is `display: none
  !important`, and an important declaration in the weakest layer becomes the
  strongest thing on the page, outranking your own `!important`. The browser
  keeps that job, at the browser's strength: any class that sets `display`
  shows a hidden element again, so a component that sets `display` restates
  `display: none` for its own `[hidden]`.
- **Reduced motion.** A blanket `prefers-reduced-motion` guard would freeze a
  spinner that needs its own gentler animation. Motion belongs to the
  component that has it.

## Meaning that goes with the look

A few elements carry meaning through how they look, and the reset flattens
them anyway, because the rule has no exceptions: `<sub>` and `<sup>` sit on
the baseline ("H2O"), `<del>` and `<s>` carry no strike, `<hr>` is invisible,
and `<q>` adds no quotation marks. A reader of running text loses that
meaning until a class or a rich-text scope restores it, which is where
running text should be styled anyway. Assistive technology still reads the
elements.

## Native controls stay native

Checkboxes, radios, ranges, color and date pickers, the select arrow, number
spinners, the search field's clear button, `<progress>`, `<meter>` and media
controls keep the browser's own drawing (`appearance: auto`), in the system's
accent color. A component that restyles one sets `appearance: none` and a
size itself.

## Size controls with line-height and padding

Given a fixed `height`, a `<button>`, an `<input>` and a `<select>` center
their text vertically, while a `<div>`, a link, a `<label>` or a
`<summary>` put it at the top: in a box three lines tall, twelve pixels
apart. That comes from how the browser lays out a control's inner box, and no
property reaches it. Sized by content, with `line-height` and `padding` and
no `height`, the same elements line up within a pixel.

## Known limitations

Some of what a browser draws is set after the cascade, by its own theme code
for native controls, and no author style reaches it, `!important` included.
These are the leftovers measured in current engines:

- **`<select>`** keeps `line-height: normal` (Firefox forces it), and indents
  its text by its own inner padding: 4 pixels in Chromium, 8 in Safari. Safari
  also keeps a 5-pixel radius and an 18-pixel minimum height on it. Only
  `appearance: none`, or `appearance: base-select` where a browser supports
  it, takes these away. The prebuilt CSS leaves `appearance` alone; the mixin
  sets either when a kit asks for it (`$appearance`).
- **Controls drawn natively keep their own size:** checkboxes and radios (12
  to 14 pixels), date and time fields (24 to 28 pixels tall), color, range and
  file inputs, and `<audio>`, which Safari also gives a minimum size.
- **Inner layout of controls:** Safari 17 aligns a button's content to the
  start (`align-items: flex-start`) and lays a `<textarea>` out in a column.
  It shows only when a component turns the control into a flex container,
  which is the moment to set `align-items` anyway.

Older engines leave a few more, gone in current versions: Firefox up to 127
keeps a 2-pixel border on checkboxes and radios, Firefox 97 keeps its own
colors on `<option>`, and WebKit 15.4 centers `<th>` text. `<search>` is an
unknown element, inline rather than block, in engines older than it.

## Traps it does not set, but you might

- **`scrollbar-color` on `:root`** disables every `::-webkit-scrollbar` rule in
  Chromium, silently. Pick one mechanism per document.
- **Vendor pseudo-elements cannot share a selector list.** One unknown pseudo
  invalidates the whole rule, so `::-webkit-...` and `::-moz-...` need a rule
  each.
- **An unlayered reset of your own** beats every layered rule, this one and
  your components' alike. Wrap it in a layer.

## License

MIT
