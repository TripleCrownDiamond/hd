---
name: holzkraft-frontend
description: Implement or review HOLZKRAFT storefront, account, legal, checkout, responsive UI, accessibility, design tokens, and frontend tests. Use for any change under src/app public routes, src/components, src/features frontend code, Tailwind theme, visual fixtures, or Playwright storefront journeys.
---

# HOLZKRAFT Frontend

Build the Next.js interface from the locked design without redesigning it.

## Workflow

1. Read repository `AGENTS.md`.
2. Read `.ulpi/design/DESIGN.md` completely.
3. Read the relevant section of `.ulpi/design/storefront.md`.
4. Read the matching PRD/UIUX sections with `rg`; do not load unrelated legal templates.
5. Inspect existing components and tests before adding a component.
6. Implement the smallest complete vertical slice.
7. Add loading, empty, partial, error, unauthorized and success states where applicable.
8. Verify keyboard, focus, screen-reader announcements, reduced motion and mobile layout.
9. Run targeted tests, then lint, typecheck and build when the slice integrates.
10. Update `docs/PROJECT_STATUS.md` and `docs/IMPLEMENTATION_PLAN.md`.

## Non-negotiable rules

- Use Radix primitives and shadcn/ui for behavioral primitives; theme them with locked tokens.
- Use only values declared in `.ulpi/design/DESIGN.md`. Flag a missing token before adding it.
- Keep Server Components by default and minimize client boundaries.
- All visible customer copy is German `de-DE`.
- Accept money as integer cents and render locale-aware EUR.
- Do not present fixture stock, certification, reviews or delivery as real.
- Do not use supplier media without documented permission.
- Keep legal copy factual and preserve placeholders until validated.
- Do not create nested cards, generic glassmorphism, gradient text or extra icon families.

## Verification

- Component tests for variants and state changes.
- Accessibility assertions for dialogs, drawers, filters and checkout.
- Playwright smoke path: home → catalogue → product → delivery quote → cart → checkout.
- Visual checks at 390, 768, 1024 and 1440 px.
- Confirm no global horizontal overflow and no focus hidden by sticky UI.

If the required script does not yet exist, add it during the scaffold and update `AGENTS.md` with the exact command.
