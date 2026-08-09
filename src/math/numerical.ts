import type { Vector2 } from './types';

/** Base tolerance for exact mathematical decisions. */
export const EPSILON = 1e-9;
/** A human-facing warning threshold for configurations close to a line. */
export const NEAR_DEPENDENCE_EPSILON = 0.035;

export function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

export function isFiniteVector(vector: Vector2): boolean {
  return isFiniteNumber(vector.x) && isFiniteNumber(vector.y);
}

export function approxEqual(a: number, b: number, tolerance = EPSILON): boolean {
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return false;
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= tolerance * scale;
}

export function approximatelyZero(value: number, tolerance = EPSILON): boolean {
  return isFiniteNumber(value) && Math.abs(value) <= tolerance;
}

export function vectorApproximatelyEqual(a: Vector2, b: Vector2, tolerance = EPSILON): boolean {
  return approxEqual(a.x, b.x, tolerance) && approxEqual(a.y, b.y, tolerance);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function cleanZero(value: number, tolerance = EPSILON): number {
  return Math.abs(value) <= tolerance ? 0 : value;
}
