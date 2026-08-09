# Implementation plan

## Decisions made before implementation

- Use Vite + React + strict TypeScript: the V1 is entirely client-side, so a static build keeps deployment and runtime simple.
- Use SVG for R²: the scene has few objects, needs crisp labels, accessible focusable handles, and responsive pointer mapping.
- Keep math pure and UI-agnostic: all status, span, rank, basis, and relation facts come from `src/math/`.
- Use a reducer-shaped serializable state: it is ready for share URLs, local persistence, and future saved examples.
- Use deterministic explanation templates: beginner wording changes from typed analysis, never from an LLM.

## Vertical slices delivered

1. **Foundation** — project setup, strict TypeScript, CSS design system, CI, pure vector math, coordinate plane, metadata.
2. **Interactive vectors** — SVG endpoint dragging, keyboard nudging, numeric editors, visibility, lock, add/remove, URL state.
3. **Dependence and span** — scale-aware determinant classification, scalar-multiple wording, near-dependent state, line/full-plane overlays, basis checks.
4. **Linear combinations** — coefficient sliders and exact fields, scaled vectors, parallelogram construction, resultant, calculation panel.
5. **Basis and dimension** — standard basis, third vector, theorem explanation, concrete dependency relations.
6. **Explanation-first UX** — deterministic status cards, basis checks, plain-language state explanations, and a contextual theorem prompt inside the playground.
7. **Production polish** — responsive layout, themes, keyboard/touch affordances, metadata, README, architecture/roadmap docs, unit/component/E2E coverage.

## Intentionally deferred

R³, matrix transformations, determinant-focused visualizations, projections, dot products, eigenvectors, accounts, and backend persistence are separated into the roadmap so they do not dilute the R² experience.
