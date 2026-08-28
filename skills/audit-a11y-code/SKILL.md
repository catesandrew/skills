---
name: audit-a11y-code
description: Use when you need a static accessibility review of a component, template, or markup file — checks semantic structure, ARIA usage, keyboard access, forms, tables, and contrast against WCAG 2.1 AA.
---

# audit-a11y-code

Perform a lightweight, source-code accessibility review on any component or template. No browser required — analysis is static. For live runtime checks, use `chrome-inspect-a11y`.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:componentPath}` | Path to the component/template file | `src/components/modal/modal.component.html` |
| `${input:context}` | Optional context | `Storybook story route`, `feature name`, `Figma frame URL` |

## Tasks

### 1. Structural audit
- Verify semantic landmarks: `<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, `<section aria-label>`.
- Check heading order: `h1` → `h2` → `h3` (no skips, no decorative headings).
- Confirm correct element roles: `<button>` for actions, `<a href>` for navigation, no `<div onClick>` without `role`/`tabindex`.

### 2. ARIA usage
- Every `aria-labelledby` and `aria-describedby` must reference an **existing, visible** element id.
- `aria-label` should only be used when there is no visible label.
- No redundant ARIA (e.g., `<button role="button">` is unnecessary).
- `aria-hidden="true"` must not be applied to focusable elements.

### 3. Interactive controls
- All focusable elements must have a visible focus indicator.
- Custom interactive elements (`[role="button"]`, `[role="menuitem"]`, etc.) must be keyboard operable (Enter/Space to activate).
- Dropdowns and menus: Arrow keys for navigation, Escape to close.
- Tab/focus order must follow visual reading order.

### 4. Dialogs and overlays
- Dialogs require `role="dialog"` (or `<dialog>`), `aria-modal="true"`, and `aria-labelledby` pointing to a visible title.
- Focus must be trapped inside the dialog when open.
- Escape key must close the dialog.

### 5. Forms and validation
- Every input must have an associated `<label for>` or `aria-labelledby`.
- Required fields: visible asterisk `*` **and** `aria-required="true"`.
- Error messages: appear adjacent to the input and linked via `aria-describedby` or `role="alert"`.
- `placeholder` is not a substitute for a label.

### 6. Tables
- Data tables use `<th scope="col|row">` for headers.
- Complex tables with multi-level headers use `headers` + `id` associations.
- Add `aria-sort` on sortable column headers.
- Layout tables use `role="presentation"` to remove table semantics.

### 7. Media and icons
- Images: meaningful `alt` text describing content/function; decorative images use `alt=""`.
- Icon-only buttons: `aria-label` or visually hidden text (not tooltip-only).
- SVGs used as images: `role="img"` + `aria-label` or `<title>` element.

### 8. Motion and announcements
- Animated content: respects `prefers-reduced-motion` media query.
- Status updates (loading, success, error): use `aria-live="polite"` or `role="status"`.
- Urgent alerts: `role="alert"` or `aria-live="assertive"` (use sparingly).

### 9. Contrast (heuristic)
- Text contrast must be ≥ 4.5:1 (AA) for normal text, ≥ 3:1 for large text (≥18pt or 14pt bold).
- UI component boundaries (focus rings, button borders) must be ≥ 3:1 against adjacent colors.

## Output Format

### ✅ Passes
Bullet list of elements/patterns already correctly implemented.

### ⚠️ Issues
For each problem:
- **What:** describe the violation
- **Where:** exact file + element (line number if possible)
- **WCAG criterion:** e.g., SC 1.3.1, SC 4.1.2
- **How to fix:** minimal HTML/ARIA snippet

### 🛠 Recommended fixes (diff-style)
Minimal patches with exact file paths:
```diff
- <div (click)="save()">Save</div>
+ <button type="button" (click)="save()">Save</button>
```

## WCAG 2.1 AA Quick Reference

| Criterion | Requirement |
|-----------|-------------|
| 1.1.1 Non-text content | Alt text for images |
| 1.3.1 Info and relationships | Semantic structure |
| 1.3.2 Meaningful sequence | Reading order |
| 1.4.3 Contrast (minimum) | 4.5:1 text, 3:1 large text |
| 1.4.11 Non-text contrast | 3:1 for UI components |
| 2.1.1 Keyboard | All functionality by keyboard |
| 2.4.3 Focus order | Logical focus sequence |
| 2.4.7 Focus visible | Visible focus indicator |
| 3.3.2 Labels or instructions | Inputs have labels |
| 4.1.2 Name, role, value | ARIA roles/states correct |

## Common Mistakes
- **Using `aria-label` on non-interactive elements** — it only works reliably on interactive and landmark roles.
- **Duplicate ids** — `aria-labelledby` becomes ambiguous; ids must be unique per page.
- **Focus trap missing in modals** — users can tab outside the dialog to background content.
- **Error message not linked** — screen readers won't associate the message with the input without `aria-describedby`.
