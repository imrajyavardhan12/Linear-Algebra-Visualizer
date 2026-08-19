# Architecture

## Shape of the application

```text
Versioned scene URL / local storage
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
- `linear-combination.ts`: arbitrary finite combinations, a shared two-vector evaluation (`firstScaled`, `secondScaled`, `result`), and a stable 2-vector solve.
- `projection.ts`: dot product, angle, projection, and perpendicular rejection evaluation.
- `span.ts`: rank-to-span interpretation (`zero`, `line`, `plane`).
- `basis.ts`: basis checks and the two visible basis criteria.
- `analysis.ts`: one coherent `VectorSetAnalysis` snapshot, including a concrete three-vector relation.
- `format.ts`: UI formatting only; it is not used for mathematical decisions.
- `src/scene.ts`: stable vector identity, labels, colors, and editor/legend tokens.

### Numerical policy

The determinant is normalized by `‖u‖‖v‖` when classifying a pair. This avoids making large coordinate vectors look dependent just because their raw determinant is large or small. Exact mathematical decisions use `EPSILON = 1e-9`. A separate `NEAR_DEPENDENCE_EPSILON = 0.035` creates the educational warning state without changing rank or basis correctness.

Input and drag coordinates are finite and clamped to ±12 at the state boundary. This prevents `NaN`, `Infinity`, and unrenderable values from entering the scene.

## State

`PlaygroundState` contains only serializable values:

- stable vector IDs, labels, coordinates, visibility, and lock state
- coefficients `a` and `b`
- independent stable-ID pair selections for linear combinations and directional projections
- theme and scene toggles, including projection visibility

`usePlaygroundState` owns transitions. Visible vectors are the active mathematical set; hidden vectors remain saved but are excluded from analysis, span, combinations, and the legend. Pair selections retain stable identities while both vectors remain active and fall back deterministically to the first two active vectors when a selected vector is hidden or removed. The URL effect writes a versioned `scene=1` schema containing vector order, coordinates, pair selections, coefficients, visibility, locks, and visual toggles. Theme is a client preference and is intentionally not shared; no account or backend is involved.

## SVG visualization

`VectorPlane` uses a fixed logical viewBox (`760 × 640`) with the origin at its center and `58` pixels per mathematical unit. The CSS keeps the same aspect ratio at every viewport size. Pointer coordinates are mapped from the SVG bounding rectangle into the logical viewBox, then clamped and rounded to two decimals.

Rendering layers are ordered deliberately:

1. plane background and grid
2. span line or subtle full-plane overlay
3. determinant/parallelogram area overlay
4. optional dot-product/projection overlay
5. standard basis
6. optional linear-combination construction
7. original vectors and accessible handles
8. origin marker

The combination construction consumes the same `LinearCombinationEvaluation` object as the control panel. The projection construction consumes one shared `ProjectionEvaluation` for its dot product, angle, projection vector, perpendicular rejection, and right-angle marker. Off-canvas endpoints are clamped to the plane edge and explicitly marked rather than silently disappearing. When exactly two vectors are active, a determinant overlay shows their parallelogram and `|det(u₁, u₂)|` as geometric area.

SVG is appropriate for the current small scene and keeps labels, focus, and hit areas inspectable. A future R³ renderer can implement a parallel scene interface without changing the math or state model.

## Explanation engine

`src/explanations.ts` maps the typed analysis result to short, deterministic content. It prioritizes beginner-friendly reasoning:

- scalar multiples are named explicitly when detected;
- three-vector dependence leads with `dim(R²) = 2` and can show a concrete relation;
- determinants are exposed as a metric, not forced into every explanation;
- dot products distinguish acute, obtuse, and orthogonal relationships;
- zero-vector projection and angle edge cases are stated explicitly;
- near-dependence is described as a turning point rather than silently classified as exact dependence.

This keeps the visual playground educational without creating a separate curriculum or task workflow.

## Extension seams

- **R³:** add a `Vector3` type and dimension-aware rank/space analysis. Keep R² functions stable and introduce a generic vector-space layer where the shared behavior is real.
- **Matrices:** add pure matrix operations under `src/math/matrix.ts`, then a separate transformation scene mode. Do not add matrix logic to `VectorPlane`.
- **Saved examples:** the versioned scene URL and Copy link control provide the first share/save seam without a backend.
- **Analytics:** no analytics are present. If privacy-friendly events are added, inject a narrow adapter rather than calling a vendor from components.
