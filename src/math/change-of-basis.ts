import { solveTwoVectorCombination } from './linear-combination';
import type { Vector2 } from './types';
import { add, determinant2D, scale } from './vector';

export interface BasisCoordinatesEvaluation {
  basis: { first: Vector2; second: Vector2 };
  target: Vector2;
  determinant: number;
  isBasis: boolean;
  coordinates: Vector2 | null;
  firstComponent: Vector2 | null;
  secondComponent: Vector2 | null;
  reconstructed: Vector2 | null;
}

/** Express a target vector in an ordered R² basis and expose its geometric reconstruction. */
export function evaluateBasisCoordinates(
  first: Vector2,
  second: Vector2,
  target: Vector2,
): BasisCoordinatesEvaluation {
  const coefficients = solveTwoVectorCombination(first, second, target);
  const determinant = determinant2D(first, second);
  if (!coefficients) {
    return {
      basis: { first, second },
      target,
      determinant,
      isBasis: false,
      coordinates: null,
      firstComponent: null,
      secondComponent: null,
      reconstructed: null,
    };
  }

  const firstComponent = scale(first, coefficients.a);
  const secondComponent = scale(second, coefficients.b);
  return {
    basis: { first, second },
    target,
    determinant,
    isBasis: true,
    coordinates: { x: coefficients.a, y: coefficients.b },
    firstComponent,
    secondComponent,
    reconstructed: add(firstComponent, secondComponent),
  };
}
