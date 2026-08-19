import { clamp, EPSILON } from './numerical';
import { dot, magnitude, magnitudeSquared, scale, subtract, ZERO_VECTOR } from './vector';
import type { Vector2 } from './types';

export interface ProjectionEvaluation {
  source: Vector2;
  onto: Vector2;
  dot: number;
  cosine: number | null;
  angleRadians: number | null;
  scalar: number | null;
  projection: Vector2;
  rejection: Vector2;
}

/** Project `source` onto the line through the origin in the `onto` direction. */
export function projectOnto(source: Vector2, onto: Vector2, tolerance = EPSILON): Vector2 | null {
  const denominator = magnitudeSquared(onto);
  if (denominator <= tolerance * tolerance) return null;
  return scale(onto, dot(source, onto) / denominator);
}

/** Return the unsigned angle in radians, or null when either vector has no direction. */
export function angleBetween(first: Vector2, second: Vector2, tolerance = EPSILON): number | null {
  const denominator = magnitude(first) * magnitude(second);
  if (denominator <= tolerance) return null;
  return Math.acos(clamp(dot(first, second) / denominator, -1, 1));
}

export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/** Evaluate dot product, angle, projection, and the perpendicular residual together. */
export function evaluateProjection(
  source: Vector2,
  onto: Vector2,
  tolerance = EPSILON,
): ProjectionEvaluation {
  const sourceCopy = { ...source };
  const ontoCopy = { ...onto };
  const dotValue = dot(sourceCopy, ontoCopy);
  const sourceMagnitude = magnitude(sourceCopy);
  const ontoMagnitude = magnitude(ontoCopy);
  const projection = projectOnto(sourceCopy, ontoCopy, tolerance) ?? { ...ZERO_VECTOR };
  const angleRadians = angleBetween(sourceCopy, ontoCopy, tolerance);
  const cosine = sourceMagnitude > tolerance && ontoMagnitude > tolerance
    ? clamp(dotValue / (sourceMagnitude * ontoMagnitude), -1, 1)
    : null;

  return {
    source: sourceCopy,
    onto: ontoCopy,
    dot: dotValue,
    cosine,
    angleRadians,
    scalar: ontoMagnitude > tolerance ? dotValue / magnitudeSquared(ontoCopy) : null,
    projection,
    rejection: subtract(sourceCopy, projection),
  };
}
