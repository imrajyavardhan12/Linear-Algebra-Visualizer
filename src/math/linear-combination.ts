import { approximatelyZero, EPSILON } from './numerical';
import { add, determinant2D, scale } from './vector';
import type { Vector2 } from './types';

export function linearCombination(vectors: Vector2[], coefficients: number[]): Vector2 {
  return vectors.reduce(
    (result, vector, index) => add(result, scale(vector, coefficients[index] ?? 0)),
    { x: 0, y: 0 },
  );
}

/** Solve a*u + b*v = target. Returns null when the pair cannot span the plane. */
export function solveTwoVectorCombination(
  u: Vector2,
  v: Vector2,
  target: Vector2,
  tolerance = EPSILON,
): { a: number; b: number } | null {
  const determinant = determinant2D(u, v);
  const scaleFactor = Math.max(1, Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y));
  if (Math.abs(determinant) <= tolerance * scaleFactor) return null;

  return {
    a: (target.x * v.y - target.y * v.x) / determinant,
    b: (u.x * target.y - u.y * target.x) / determinant,
  };
}

export function isCombinationEqual(
  left: Vector2,
  right: Vector2,
  tolerance = EPSILON,
): boolean {
  return approximatelyZero(left.x - right.x, tolerance) && approximatelyZero(left.y - right.y, tolerance);
}
