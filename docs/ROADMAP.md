# Roadmap

The R² playground is intentionally the V1 focus. These are the next modules, in order of educational value—not promises to ship them all at once.

## Near term: deepen R²

- [x] Add dot-product and projection exploration with angle and shadow overlays.
- [x] Add stable-ID pair selectors for linear combinations and directional projections.
- [x] Add a determinant/area visualization showing the parallelogram area scale.
- [ ] Add an in-place change-of-basis exploration using two selectable bases.
- [x] Add a versioned URL copy/share affordance.
- [ ] Add a small in-place example gallery.
- [x] Improve touch drag affordances with a visible active-handle state and larger hit target.
- [x] Add screenshot-based visual regression coverage for the main scene.

## R³

- [ ] Generalize vector types and rank to `R^n` where useful.
- [ ] Add a Three.js scene for vectors, line spans, and plane spans in R³.
- [ ] Teach why two independent vectors in R³ span a plane, while three independent vectors span the volume.
- [ ] Preserve the same visual / mathematical / explanation contract.

## Matrix transformations

- [ ] Add pure matrix multiplication, inverse, rank, and determinant modules with tests.
- [ ] Render a coordinate grid transformed by a 2×2 matrix.
- [ ] Provide presets for rotation, scale, reflection, shear, projection, and singular maps.
- [ ] Animate basis vectors and arbitrary vectors through the transformation.

## Eigenvectors and eigenvalues

- [ ] Build on the transformation scene rather than duplicating it.
- [ ] Highlight directions that remain on their own line.
- [ ] Explain eigenvalue as the scale factor along an eigenvector.
- [ ] Add real/complex and repeated-eigenvalue edge cases only with careful beginner framing.

## Platform capabilities

- [ ] Add versioned share links and local example saving.
- [ ] Add optional progress persistence behind a storage interface.
- [ ] Add privacy-respecting, opt-in analytics only if a product question requires it.
- [ ] Consider a server-rendered shell/SEO strategy if the explanation library becomes content-heavy.

## Non-goals for the next increment

- No authentication before saved progress is genuinely needed.
- No LLM-generated mathematical status or explanations.
- No WebGL optimization while the scene contains only a few SVG vectors.
- No large component library where existing accessible primitives are enough.
