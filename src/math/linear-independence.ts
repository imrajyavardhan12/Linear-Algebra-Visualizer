import { EPSILON, NEAR_DEPENDENCE_EPSILON } from './numerical';
import { determinant2D, magnitude, scalarMultipleFactor } from './vector';
import type { PairDependence, ScalarMultiple, Vector2 } from './types';

export function pairDependence(
  first: Vector2,
  second: Vector2,
  tolerance = EPSILON,
  nearTolerance = NEAR_DEPENDENCE_EPSILON,
): PairDependence {
  const determinant = determinant2D(first, second);
  const denominator = magnitude(first) * magnitude(second);
  const normalizedDeterminant = denominator <= tolerance ? 0 : Math.abs(determinant) / denominator;

  if (normalizedDeterminant <= tolerance) {
    return { kind: 'dependent', determinant, normalizedDeterminant };
  }
  if (normalizedDeterminant <= nearTolerance) {
    return { kind: 'nearly-dependent', determinant, normalizedDeterminant };
  }
  return { kind: 'independent', determinant, normalizedDeterminant };
}

export function rankOfVectors(vectors: Vector2[], tolerance = EPSILON): number {
  const nonZero = vectors.filter((vector) => magnitude(vector) > tolerance);
  if (nonZero.length === 0) return 0;
  if (nonZero.length === 1) return 1;

  for (let first = 0; first < nonZero.length; first += 1) {
    for (let second = first + 1; second < nonZero.length; second += 1) {
      const result = pairDependence(nonZero[first]!, nonZero[second]!, tolerance, tolerance);
      if (result.kind === 'independent') return 2;
    }
  }
  return 1;
}

export function linearlyIndependent(vectors: Vector2[], tolerance = EPSILON): boolean {
  if (vectors.length > 2) return false;
  if (vectors.some((vector) => magnitude(vector) <= tolerance)) return false;
  if (vectors.length < 2) return true;
  return pairDependence(vectors[0]!, vectors[1]!, tolerance, tolerance).kind === 'independent';
}

export function linearlyDependent(vectors: Vector2[], tolerance = EPSILON): boolean {
  return vectors.length > 2 || !linearlyIndependent(vectors, tolerance);
}

export function findScalarMultiple(
  vectors: Vector2[],
  tolerance = EPSILON,
): ScalarMultiple | null {
  for (let baseIndex = 0; baseIndex < vectors.length; baseIndex += 1) {
    for (let targetIndex = baseIndex + 1; targetIndex < vectors.length; targetIndex += 1) {
      const factor = scalarMultipleFactor(vectors[baseIndex]!, vectors[targetIndex]!, tolerance);
      if (factor !== null) return { baseIndex, targetIndex, factor };
    }
  }
  return null;
}
