# Architecture

## Shape of the application

```text
URL / local storage
        │
        ▼
usePlaygroundState ── serializable vector + scene state
        │
        ├── vectors + coefficients
        │          │
        │          ▼
        │     math/analysis.ts ── VectorSetAnalysis
        │          │                    │
        │          │                    ├── StatusPanel
        │          │                    ├── ExplanationPanel
        │          │                    └── VectorPlane (SVG)
        │          ▼
        │     controls ── coordinate and coefficient input
        │
        └── theme / scene options
```

`App.tsx` composes one focused playground and derives view data. It intentionally does not calculate determinants, rank, or dependence itself. `math/` is usable without React and is the source of truth for both UI and tests.

## Math module boundaries

- `vector.ts`: arithmetic, magnitude, normalization, dot product, determinant, scalar-multiple factor.
- `numerical.ts`: finite checks, scale-aware approximate equality, clamp, tolerances.
- `linear-independence.ts`: pair classification, rank in R², independence, dependence, scalar-multiple search.
- `linear-combination.ts`: arbitrary finite combinations and a stable 2-vector solve.
- `span.ts`: rank-to-span interpretation (`zero`, `line`, `plane`).
- `basis.ts`: basis checks and the two visible basis criteria.
- `analysis.ts`: one coherent `VectorSetAnalysis` snapshot, including a concrete three-vector relation.
- `format.ts`: UI formatting only; it is not used for mathematical decisions.

### Numerical policy

The determinant is normalized by `‖u‖‖v‖` when classifying a pair. This avoids making large coordinate vectors look dependent just because their raw determinant is large or small. Exact mathematical decisions use `EPSILON = 1e-9`. A separate `NEAR_DEPENDENCE_EPSILON = 0.035` creates the educational warning state without changing rank or basis correctness.

Input and drag coordinates are finite and clamped to ±12 at the state boundary. This prevents `NaN`, `Infinity`, and unrenderable values from entering the scene.

## State

`PlaygroundState` contains only serializable values:

- vector IDs, labels, coordinates, visibility, and lock state
- coefficients `a` and `b`
- theme and scene toggles

`usePlaygroundState` owns transitions. The URL effect serializes `u1`, `u2`, and optional `u3` as comma-separated coordinates. Theme is a client preference; no account or backend is involved.

## SVG visualization

`VectorPlane` uses a fixed logical viewBox (`760 × 640`) with the origin at its center and `58` pixels per mathematical unit. The CSS keeps the same aspect ratio at every viewport size. Pointer coordinates are mapped from the SVG bounding rectangle into the logical viewBox, then clamped and rounded to two decimals.

Rendering layers are ordered deliberately:

1. plane background and grid
2. span line or subtle full-plane overlay
3. standard basis
4. optional linear-combination construction
5. original vectors and accessible handles
6. origin marker

SVG is appropriate for the current small scene and keeps labels, focus, and hit areas inspectable. A future R³ renderer can implement a parallel scene interface without changing the math or state model.

## Explanation engine

`src/explanations.ts` maps the typed analysis result to short, deterministic content. It prioritizes beginner-friendly reasoning:

- scalar multiples are named explicitly when detected;
- three-vector dependence leads with `dim(R²) = 2` and can show a concrete relation;
- determinants are exposed as a metric, not forced into every explanation;
- near-dependence is described as a turning point rather than silently classified as exact dependence.

This keeps the visual playground educational without creating a separate curriculum or task workflow.

## Extension seams

- **R³:** add a `Vector3` type and dimension-aware rank/space analysis. Keep R² functions stable and introduce a generic vector-space layer where the shared behavior is real.
- **Matrices:** add pure matrix operations under `src/math/matrix.ts`, then a separate transformation scene mode. Do not add matrix logic to `VectorPlane`.
- **Saved examples:** the current URL serialization can become a versioned share schema.
- **Analytics:** no analytics are present. If privacy-friendly events are added, inject a narrow adapter rather than calling a vendor from components.
