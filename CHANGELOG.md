# Changelog

All notable changes to hard-reset are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
follows [Semantic Versioning](https://semver.org/) from 1.0; before it, a minor
version may break.

## [Unreleased]

## [0.1.0] - 2026-10-03

The first release.

### Added

- `hard-reset/css`, the reset prebuilt in `@layer reset`.
- `hard-reset/scss`, the `rules` mixin with no layer of its own, for a
  kit to include inside its own layer; `$cursor-property` names the link
  cursor's custom property.
- Rules the universal list cannot reach: the file input's button, the
  placeholder, a modal dialog's backdrop, table spacing, every open dialog's
  centering (in a rule apart from the popover's, so a browser without
  popovers still centers it), and `<q>`'s quotation marks.
- Text fields twenty characters wide in `ch`, the same in every engine, unless
  `size` or `cols` says otherwise.
- `text-decoration-skip-ink` inherits, like the other text properties.
- `text-size-adjust: 100%` beside the `-webkit-` form, for Chromium.
- `::-webkit-file-upload-button` reset like `::file-selector-button`, for
  Safari before 16.4, and a `100vh` body height before `100dvh`, for the
  browsers that predate it.
- A browser support section in the README: every browser with cascade layers
  (Chrome and Edge 99, Firefox 97, Safari 15.4).
- `$appearance` on the mixin takes controls out of the browser's drawing,
  one at a time: `none` for checkbox, radio, range, number, search, color,
  progress, meter and select, clearing the parts each engine draws as
  pseudo-elements; `base` or `base-closed` for select, the customizable
  select with or without its picker.
- A known limitations section in the README: what browsers set after the
  cascade, out of any stylesheet's reach.
