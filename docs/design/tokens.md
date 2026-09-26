# Design tokens

Source: `DESIGN_SPEC.md` section 2 and `HANDOFF.md` section 7. Mirrored as CSS custom properties in `app/styles/app.css` under Tailwind v4's `@theme` block, so every token below is also a Tailwind utility (for example `--color-navy` gives `bg-navy`, `text-navy`, `border-navy`).

## Fonts

Bricolage Grotesque (headings), DM Sans (body), JetBrains Mono (prices, bill numbers, barcodes, numbers). Loaded from Google Fonts in `app/root.tsx`.

## Palette

| Token                         | Hex                   | Use                                                              |
| ----------------------------- | --------------------- | ---------------------------------------------------------------- |
| `navy`                        | `#0F2742`             | Headings, logo, icons, dark bars, sidebar                        |
| `navy-deep`                   | `#071A2D`             | Sign-in left panel                                               |
| `blue`                        | `#174A73`             | Primary buttons, links, active states, revenue and profit charts |
| `blue-mid`                    | `#1D3D60`             | Active nav item background on dark surfaces                      |
| `blue-mid-2`                  | `#24507A`             | Secondary accents on dark surfaces                               |
| `gold`                        | `#F4B43C`             | Logo accent, selected role, highlights, active sidebar item      |
| `gold-dark`                   | `#D99520`             | Hover and pressed gold                                           |
| `off-white`                   | `#F7F9FC`             | Page background                                                  |
| `border`                      | `#E4EBF2`             | Borders, dividers, inactive fields                               |
| `border-strong`               | `#C5CFDB`             | Secondary button and form field borders in Admin                 |
| `text`                        | `#12263F`             | Text primary                                                     |
| `text-secondary`              | `#61738A`             | Text secondary                                                   |
| `success`                     | `#20A86B`             | Online, success, in stock                                        |
| `success-text` / `success-bg` | `#167A4E` / `#E1F5EC` | Success text on a pale tint                                      |
| `error`                       | `#D94A4A`             | Errors, destructive buttons                                      |
| `error-text` / `error-bg`     | `#9B1C12` / `#FCE8E6` | Small error text on a pale tint                                  |
| `warning` / `warning-bg`      | `#8A4A08` / `#FDF0DC` | Low stock, cash difference                                       |

## Category tints

Grocery `#E3F3EA` (ink `#0A5C3C`), Dairy `#E4EEFB`, Beverages `#FCEBDD`, Snacks `#FBE6EE`, Personal care `#EDE6FA`, Household `#E2F1F3`, Bakery `#F6EBC9`. Only Grocery's ink is specified; other categories use the shared text tokens at the point of use.

## Money trail series

Sales blue, card `#6B9AC4` (`money-card`), wallet and stock bought gold, refunds red.

## Shape

Radius 10 to 16 px: inputs 10 (`radius-input`), cards 14 (`radius-card`), large surfaces 16 (`radius-lg`), sign-in and activate panels 24 (`radius-xl`), pills full (`radius-pill`).

## Touch targets

At least 44 px in Admin. 48 to 72 px with 16 to 22 px text in the cashier area. Inputs 46 to 48 px tall.

## Interaction states

Hover darkens 8% (`hover:brightness-95` on the shared UI primitives), gold uses Dark Gold when pressed, 2 px focus ring in MartDesk Blue.

## Tailwind theme snippet

```css
@import "tailwindcss";

@theme {
  --font-heading: "Bricolage Grotesque", sans-serif;
  --font-sans: "DM Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --color-navy: #0f2742;
  --color-navy-deep: #071a2d;
  --color-blue: #174a73;
  --color-blue-mid: #1d3d60;
  --color-blue-mid-2: #24507a;
  --color-gold: #f4b43c;
  --color-gold-dark: #d99520;
  --color-off-white: #f7f9fc;
  --color-border: #e4ebf2;
  --color-border-strong: #c5cfdb;
  --color-text: #12263f;
  --color-text-secondary: #61738a;
  --color-success: #20a86b;
  --color-success-text: #167a4e;
  --color-success-bg: #e1f5ec;
  --color-error: #d94a4a;
  --color-error-text: #9b1c12;
  --color-error-bg: #fce8e6;
  --color-warning: #8a4a08;
  --color-warning-bg: #fdf0dc;

  --color-category-grocery-bg: #e3f3ea;
  --color-category-grocery-ink: #0a5c3c;
  --color-category-dairy-bg: #e4eefb;
  --color-category-beverages-bg: #fcebdd;
  --color-category-snacks-bg: #fbe6ee;
  --color-category-personal-care-bg: #ede6fa;
  --color-category-household-bg: #e2f1f3;
  --color-category-bakery-bg: #f6ebc9;

  --color-money-card: #6b9ac4;

  --radius-input: 10px;
  --radius-card: 14px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 9999px;
}
```
