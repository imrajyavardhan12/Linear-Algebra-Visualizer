# Linear Algebra Playground

> Learn linear algebra by manipulating it.

**Live app:** [linear-algebra-visualizer.pages.dev](https://linear-algebra-visualizer.pages.dev/)

Linear Algebra Playground is a client-side interactive learning tool for building intuition around vectors in **R²**. Drag arrowheads, edit exact coordinates, change coefficients, and watch the geometry, equations, and explanations stay synchronized.

The first release focuses on the ideas beginners most often need to see:

- linear combinations: `w = a·u₁ + b·u₂`
- span as a line or the full plane
- determinant as parallelogram area
- dot products, angles, orthogonality, and projection
- coordinates in a selected ordered basis
- linear dependence and scalar multiples
- linear independence
- basis and dimension of R²
- the standard basis
- three-vector dependency relations

## Product tour

- **Playground** — one focused interactive coordinate plane, vector editors, live status cards, span overlays, combination construction, and deterministic explanations.
- **Manipulate** — drag endpoints, type coordinates, choose explicit vector pairs for combinations, projections, and basis coordinates, toggle the standard basis, add a third vector, and lock or hide scene objects.
- **Share** — copy a versioned scene link that reproduces vectors, selected pairs and coordinate target, coefficients, visibility, locks, and visual toggles.
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

There is no backend and no analytics. The current scene is serializable in a versioned URL such as `/?scene=1&ids=u1%2Cu2&u1=1%2C0&u2=0%2C1&a=2&b=-1&comboPair=u1%2Cu2&projectionPair=u1%2Cu2&coordinateBasis=u1%2Cu2&coordinateTarget=u1&combo=1`.

## Quick start

Requirements: Node 20.19+ and pnpm 11.20 (the project is developed with Node 24).

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

Dependency lifecycle scripts are denied by default except for the reviewed `esbuild` entry in `pnpm-workspace.yaml`. Do not blanket-approve dependency build scripts; review and narrowly allow any future additions.

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
    change-of-basis.ts            ordered-basis coordinates and reconstruction
    projection.ts                 dot product, angle, projection, and rejection
    span.ts                       span dimension/kind
    basis.ts                      basis checks
    analysis.ts                   one derived result for the UI
  state/usePlaygroundState.ts     serializable client-side reducer and URL/theme persistence
  scene.ts                        stable vector identity, labels, and visual tokens
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
- Hidden vectors are excluded from the active analysis but remain saved in the scene.
- Three or more vectors in R² are dependent, even when they still span the entire plane.
- A basis of R² is exactly two linearly independent vectors: independent and spanning are shown as separate checks.
- Basis coordinates are ordered: swapping `(b₁, b₂)` swaps the meaning and order of the coordinate components.
- Basis-coordinate displays preserve small non-zero values and use `≈` whenever coefficients are rounded for presentation.
- Projection onto the zero vector is undefined because it has no direction; the zero vector has no geometric angle.

See [the architecture notes](docs/ARCHITECTURE.md) for the derivation and [the roadmap](docs/ROADMAP.md) for R³, transformations, determinants, projections, and eigenvectors.

## Accessibility and responsive behavior

The plane has an accessible SVG label, keyboard-focusable arrowheads, arrow-key nudging, visible focus states, and coordinate inputs for users who cannot or do not want to drag. The interface stacks the visualization before controls on small screens, keeps touch targets generous, and supports light/dark themes. Playwright runs automated Axe checks against default and expanded scenes in both themes; manual keyboard and screen-reader checks remain part of release QA.

## Deployment

The production site is deployed on Cloudflare Pages at [linear-algebra-visualizer.pages.dev](https://linear-algebra-visualizer.pages.dev/).

The app is a static Vite build. Deploy the `dist/` directory to Vercel, Netlify, Cloudflare Pages, GitHub Pages (with the appropriate SPA fallback), or any static host:

```bash
pnpm build
pnpm preview
```

No environment variables are required for V1. The included CI workflow runs type checking, lint, unit/component tests, production build, and Playwright tests.

The application ships a restrictive browser CSP and self-hosted fonts, so it makes no third-party runtime requests. `public/_headers` adds clickjacking, MIME-sniffing, referrer, browser-permission, and cross-origin protections on hosts that support the `_headers` convention (including Netlify and Cloudflare Pages). Configure equivalent response headers—and HSTS at the HTTPS host—when deploying elsewhere. Development and preview servers bind to loopback by default; use `pnpm dev --host 0.0.0.0` only when LAN access is intentional and trusted.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Mathematical behavior belongs in pure, tested modules; React components should consume analysis results rather than reimplementing linear algebra.

## License

Released under the [MIT License](LICENSE).

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md). The current priority is polishing the R² experience before adding advanced visual modules.
