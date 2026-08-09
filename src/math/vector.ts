import { approximatelyZero, EPSILON } from './numerical';
import type { Vector2 } from './types';

export const ZERO_VECTOR: Vector2 = { x: 0, y: 0 };

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(vector: Vector2, scalar: number): Vector2 {
  return { x: vector.x * scalar, y: vector.y * scalar };
}

export function magnitude(vector: Vector2): number {
  return Math.hypot(vector.x, vector.y);
}

export function magnitudeSquared(vector: Vector2): number {
  return vector.x * vector.x + vector.y * vector.y;
}

export function normalize(vector: Vector2, tolerance = EPSILON): Vector2 {
  const length = magnitude(vector);
  if (approximatelyZero(length, tolerance)) return { ...ZERO_VECTOR };
  return scale(vector, 1 / length);
}

export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

/** The signed area scale of the parallelogram formed by two vectors. */
export function determinant2D(a: Vector2, b: Vector2): number {
  return a.x * b.y - a.y * b.x;
}

/**
 * Returns k when target is approximately k * base.
 * The dominant component is used to avoid dividing by a tiny coordinate.
 */
export function scalarMultipleFactor(
  base: Vector2,
  target: Vector2,
  tolerance = EPSILON,
): number | null {
  const baseLength = magnitude(base);
  const targetLength = magnitude(target);

  if (baseLength <= tolerance) {
    return targetLength <= tolerance ? 0 : null;
  }

  const factor = Math.abs(base.x) >= Math.abs(base.y)
    ? target.x / base.x
    : target.y / base.y;

  if (!Number.isFinite(factor)) return null;
  const residual = subtract(target, scale(base, factor));
  const residualLength = magnitude(residual);
  const scaleForTolerance = Math.max(1, targetLength, baseLength * Math.abs(factor));
  return residualLength <= tolerance * scaleForTolerance ? factor : null;
}
