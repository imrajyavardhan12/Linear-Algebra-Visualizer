import { EPSILON } from './numerical';
import { magnitude } from './vector';
import { rankOfVectors } from './linear-independence';
import type { SpanKind, Vector2 } from './types';

export function spanDimension(vectors: Vector2[], tolerance = EPSILON): number {
  return rankOfVectors(vectors, tolerance);
}

export function spanKind(vectors: Vector2[], tolerance = EPSILON): SpanKind {
  const rank = spanDimension(vectors, tolerance);
  if (rank === 0 || vectors.every((vector) => magnitude(vector) <= tolerance)) return 'zero';
  return rank === 1 ? 'line' : 'plane';
}
