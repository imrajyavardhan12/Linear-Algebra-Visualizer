import { EPSILON } from './numerical';
import { linearlyIndependent, rankOfVectors } from './linear-independence';
import type { Vector2 } from './types';

export function formsBasisOfR2(vectors: Vector2[], tolerance = EPSILON): boolean {
  return vectors.length === 2 && rankOfVectors(vectors, tolerance) === 2 && linearlyIndependent(vectors, tolerance);
}

export function basisChecks(vectors: Vector2[], tolerance = EPSILON): {
  independent: boolean;
  spansR2: boolean;
  isBasis: boolean;
} {
  const independent = linearlyIndependent(vectors, tolerance);
  const spansR2 = vectors.length > 0 && rankOfVectors(vectors, tolerance) === 2;
  return { independent, spansR2, isBasis: formsBasisOfR2(vectors, tolerance) };
}
