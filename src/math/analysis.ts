import { EPSILON, NEAR_DEPENDENCE_EPSILON } from './numerical';
import { solveTwoVectorCombination } from './linear-combination';
import { findScalarMultiple, linearlyIndependent, pairDependence, rankOfVectors } from './linear-independence';
import { spanKind } from './span';
import { determinant2D, magnitude } from './vector';
import type { DependencyRelation, Vector2, VectorSetAnalysis } from './types';

function dependencyForThree(vectors: Vector2[], tolerance: number): DependencyRelation | null {
  if (vectors.length < 3) return null;

  const pairs: Array<[number, number, number]> = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 2, 0],
  ];

  for (const [first, second, target] of pairs) {
    const coefficients = solveTwoVectorCombination(vectors[first]!, vectors[second]!, vectors[target]!, tolerance);
    if (coefficients) {
      const relation = vectors.map(() => 0);
      relation[first] = coefficients.a;
      relation[second] = coefficients.b;
      relation[target] = -1;
      return { coefficients: relation, isolatedIndex: target };
    }
  }

  const zeroIndex = vectors.findIndex((vector) => magnitude(vector) <= tolerance);
  if (zeroIndex >= 0) {
    const relation = vectors.map(() => 0);
    relation[zeroIndex] = 1;
    return { coefficients: relation, isolatedIndex: zeroIndex };
  }

  // If all pairs are parallel, expose the first scalar-multiple relation.
  for (let first = 0; first < vectors.length; first += 1) {
    for (let second = first + 1; second < vectors.length; second += 1) {
      const pair = pairDependence(vectors[first]!, vectors[second]!, tolerance, tolerance);
      if (pair.kind === 'dependent') {
        const multiple = findScalarMultiple([vectors[first]!, vectors[second]!], tolerance);
        if (multiple) {
          const relation = vectors.map(() => 0);
          relation[first] = multiple.factor;
          relation[second] = -1;
          return { coefficients: relation, isolatedIndex: second };
        }
      }
    }
  }
  return null;
}

export function analyzeVectorSet(vectors: Vector2[], tolerance = EPSILON): VectorSetAnalysis {
  const count = vectors.length;
  const rank = rankOfVectors(vectors, tolerance);
  const independent = count === 0 ? true : linearlyIndependent(vectors, tolerance);
  const dependent = count > 0 && !independent;
  const pair = count === 2 ? pairDependence(vectors[0]!, vectors[1]!, tolerance, NEAR_DEPENDENCE_EPSILON) : null;
  const status = count === 0
    ? 'empty'
    : pair?.kind === 'nearly-dependent'
      ? 'nearly-dependent'
      : dependent
        ? 'dependent'
        : 'independent';

  return {
    count,
    rank,
    spanDimension: rank,
    spanKind: spanKind(vectors, tolerance),
    independent,
    dependent,
    status,
    scalarMultiple: findScalarMultiple(vectors, tolerance),
    determinant: count === 2 ? determinant2D(vectors[0]!, vectors[1]!) : null,
    formsBasisOfR2: count === 2 && rank === 2 && independent,
    dependencyRelation: dependencyForThree(vectors, tolerance),
  };
}
