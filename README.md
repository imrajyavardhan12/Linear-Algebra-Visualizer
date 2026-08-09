# Linear Algebra Playground

> Learn linear algebra by manipulating it.

Linear Algebra Playground is a client-side interactive learning tool for building intuition around vectors in **R²**. Drag arrowheads, edit exact coordinates, change coefficients, and watch the geometry, equations, and explanations stay synchronized.

The first release focuses on the ideas beginners most often need to see:

- linear combinations: `w = a·u₁ + b·u₂`
- span as a line or the full plane
- linear dependence and scalar multiples
- linear independence
- basis and dimension of R²
- the standard basis
- three-vector dependency relations

## Product tour

- **Playground** — one focused interactive coordinate plane, vector editors, live status cards, span overlays, combination construction, and deterministic explanations.
- **Manipulate** — drag endpoints, type coordinates, toggle the standard basis, add a third vector, and lock or hide scene objects.
- **Understand** — every important state is shown visually, mathematically, and in plain language without leaving the playground.

The scene supports mouse, touch, keyboard arrow-key nudging, and exact coordinate inputs. Vector colors are paired with labels and text, so color is never the only signal.

## Screenshots

The repository includes `public/og-placeholder.svg` as a lightweight social-preview placeholder. The live coordinate plane is intentionally rendered by the application so the preview stays crisp at any size.

## Stack

- React 19 + TypeScript (strict)
- Vite 7
- SVG for the interactive R² visualization
- Vitest + Testing Library for unit/component tests
- Playwright for desktop and mobile workflows
- ESLint 9
- pnpm for package management

There is no backend and no analytics. The current scene is serializable in URL parameters such as `/?u1=1,2&u2=2,4`.

## Quick start

Requirements: Node 20+ and pnpm 9+ (the project is developed with Node 24 / pnpm 11).

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173>.

Bun can run the same package scripts if preferred:

```bash
bun install
bun run dev
```

## Commands

```bash
pnpm dev             # development server
pnpm build           # strict typecheck + production build
pnpm preview         # serve the production build
pnpm typecheck       # TypeScript only
pnpm lint            # ESLint
pnpm test            # unit and component tests
pnpm test:watch      # watch tests
pnpm e2e             # Playwright desktop + mobile tests
pnpm check           # typecheck, lint, tests, and build
```

For the first local install in a locked-down pnpm environment, approve the esbuild build script if prompted:

```bash
pnpm approve-builds --all
pnpm install
```

To run Playwright locally for the first time:

```bash
pnpm exec playwright install chromium
```

## Project structure

```text
src/
  App.tsx                         application composition and derived view state
  components/
    visualization/VectorPlane.tsx interactive SVG scene and pointer/keyboard input
    controls/                     vector, coefficient, and scene controls
    StatusPanel.tsx               live mathematical state
  explanations.ts                 deterministic beginner-friendly explanation templates
  math/
    vector.ts                     pure vector operations
    numerical.ts                  tolerance and finite-number helpers
    linear-independence.ts        rank, dependence, scalar-multiple detection
    linear-combination.ts         combinations and 2×2 solving
    span.ts                       span dimension/kind
    basis.ts                      basis checks
    analysis.ts                   one derived result for the UI
  state/usePlaygroundState.ts     serializable client-side reducer and URL/theme persistence
  styles.css                      design system and responsive layout

e2e/                              Playwright workflows
docs/ARCHITECTURE.md              module boundaries and extension seams
docs/IMPLEMENTATION_PLAN.md       product scope and implementation decisions
docs/ROADMAP.md                   intentionally deferred modules
.github/workflows/ci.yml          CI checks
```

## Mathematical conventions

- Vectors are columns conceptually, and every drawn vector starts at `(0, 0)`.
- `det(u, v) = uₓvᵧ − uᵧvₓ` is the oriented area scale of the pair.
- Exact dependence uses a scale-aware tolerance (`ε = 10⁻⁹`), not direct floating-point equality.
- A normalized determinant below `0.035` is shown as **Nearly dependent** to make numerical sensitivity visible; it remains mathematically independent unless it crosses the exact tolerance.
- A set containing the zero vector is dependent.
- Three or more vectors in R² are dependent, even when they still span the entire plane.
- A basis of R² is exactly two linearly independent vectors: independent and spanning are shown as separate checks.

See [the architecture notes](docs/ARCHITECTURE.md) for the derivation and [the roadmap](docs/ROADMAP.md) for R³, transformations, determinants, projections, and eigenvectors.

## Accessibility and responsive behavior

The plane has an accessible SVG label, keyboard-focusable arrowheads, arrow-key nudging, visible focus states, and coordinate inputs for users who cannot or do not want to drag. The interface stacks the visualization before controls on small screens, keeps touch targets generous, and supports light/dark themes.

## Deployment

The app is a static Vite build. Deploy the `dist/` directory to Vercel, Netlify, Cloudflare Pages, GitHub Pages (with the appropriate SPA fallback), or any static host:

```bash
pnpm build
pnpm preview
```

No environment variables are required for V1. The included CI workflow runs type checking, lint, unit/component tests, production build, and Playwright tests.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Mathematical behavior belongs in pure, tested modules; React components should consume analysis results rather than reimplementing linear algebra.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md). The current priority is polishing the R² experience before adding advanced visual modules.
