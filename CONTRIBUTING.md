# Contributing

Thanks for helping make linear algebra more visual.

## Development setup

```bash
pnpm install
pnpm dev
```

Use Node 20+ and pnpm. Bun can run the same scripts, but keep `pnpm-lock.yaml` authoritative for dependency changes.

## Before opening a PR

Run the full local check:

```bash
pnpm check
pnpm e2e
```

If Playwright browsers are not installed:

```bash
pnpm exec playwright install chromium
```

## Design principles

1. **Interaction creates intuition.** Prefer a clear geometric state over adding more text.
2. **Three synchronized views.** Important concepts need a visual, a mathematical expression, and a plain-language explanation.
3. **Correctness is deterministic.** Do not use an LLM for core mathematical status or explanations.
4. **Pure math stays separate.** Add operations to `src/math/` and test edge cases before wiring UI.
5. **Accessible by default.** A drag interaction must have a keyboard or numeric-input equivalent. Never make color the only distinction.
6. **R² first.** Avoid adding a superficial advanced module at the expense of the core playground.

## Adding a mathematical operation

- Put the operation in the smallest relevant file under `src/math/`.
- Use `EPSILON` or a documented tolerance rather than direct equality for numerical decisions.
- Decide behavior for zero vectors, empty sets, near-dependent vectors, non-finite input, and overcomplete sets.
- Export it through `src/math/index.ts`.
- Add unit tests with both ordinary and boundary cases.
- Update `docs/ARCHITECTURE.md` if the public analysis contract changes.

## Adding contextual explanations

Explanation wording lives in `src/explanations.ts`. Keep it deterministic, short, and grounded in the typed `VectorSetAnalysis` result. Prefer intuition-first language and expose formal notation without turning the playground into a separate lesson flow.

## UI changes

Keep components small and use the existing CSS variables and primitives. Test important behavior with accessible queries (`getByRole`, labels, and visible text). Add a Playwright workflow when a user journey crosses multiple components.

## Commit checklist

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm e2e` when interaction or routing changes
- [ ] responsive behavior checked at mobile and desktop widths
- [ ] keyboard path checked for new interactions
- [ ] docs/roadmap updated for intentionally deferred work
