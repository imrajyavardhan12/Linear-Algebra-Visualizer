import { describe, expect, it } from 'vitest';
import {
  add,
  analyzeVectorSet,
  basisChecks,
  determinant2D,
  dot,
  formsBasisOfR2,
  linearlyDependent,
  linearlyIndependent,
  magnitude,
  normalize,
  pairDependence,
  rankOfVectors,
  scalarMultipleFactor,
  solveTwoVectorCombination,
  spanDimension,
  spanKind,
} from './index';
import type { Vector2 } from './types';

const zero: Vector2 = { x: 0, y: 0 };

describe('vector operations', () => {
  it('adds, measures, normalizes, and dots vectors', () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: -1 })).toEqual({ x: 4, y: 1 });
    expect(magnitude({ x: 3, y: 4 })).toBe(5);
    expect(normalize({ x: 3, y: 4 }).x).toBeCloseTo(0.6);
    expect(normalize({ x: 3, y: 4 }).y).toBeCloseTo(0.8);
    expect(dot({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11);
  });

  it('keeps the zero vector safe when normalizing', () => {
    expect(normalize(zero)).toEqual(zero);
  });

  it('finds scalar multiples without relying on exact component equality', () => {
    expect(scalarMultipleFactor({ x: 1, y: 2 }, { x: 2, y: 4 })).toBe(2);
    expect(scalarMultipleFactor({ x: 0, y: 2 }, { x: 0, y: -1 })).toBe(-0.5);
    expect(scalarMultipleFactor({ x: 1, y: 2 }, { x: 2, y: 5 })).toBeNull();
    expect(scalarMultipleFactor(zero, zero)).toBe(0);
  });

  it('computes the signed 2D determinant', () => {
    expect(determinant2D({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1);
    expect(determinant2D({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(-1);
  });
});

describe('dependence, span, and basis', () => {
  it.each([
    [{ x: 1, y: 2 }, { x: 2, y: 4 }],
    [{ x: 1, y: 0 }, { x: -3, y: 0 }],
  ])('detects dependent pairs %o and %o', (first, second) => {
    expect(pairDependence(first, second).kind).toBe('dependent');
    expect(linearlyDependent([first, second])).toBe(true);
    expect(linearlyIndependent([first, second])).toBe(false);
    expect(spanDimension([first, second])).toBe(1);
    expect(spanKind([first, second])).toBe('line');
  });

  it.each([
    [{ x: 1, y: 0 }, { x: 0, y: 1 }],
    [{ x: 1, y: 1 }, { x: -1, y: 1 }],
  ])('detects independent pairs %o and %o', (first, second) => {
    expect(pairDependence(first, second).kind).toBe('independent');
    expect(linearlyIndependent([first, second])).toBe(true);
    expect(linearlyDependent([first, second])).toBe(false);
    expect(spanDimension([first, second])).toBe(2);
    expect(spanKind([first, second])).toBe('plane');
    expect(formsBasisOfR2([first, second])).toBe(true);
  });

  it('treats a zero vector as dependent and non-spanning', () => {
    expect(linearlyDependent([zero, { x: 1, y: 0 }])).toBe(true);
    expect(linearlyIndependent([zero])).toBe(false);
    expect(spanDimension([zero, { x: 1, y: 0 }])).toBe(1);
    expect(basisChecks([zero, { x: 1, y: 0 }])).toEqual({ independent: false, spansR2: false, isBasis: false });
  });

  it('recognizes that three vectors in R² are dependent', () => {
    const vectors = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
    const result = analyzeVectorSet(vectors);
    expect(linearlyDependent(vectors)).toBe(true);
    expect(linearlyIndependent(vectors)).toBe(false);
    expect(rankOfVectors(vectors)).toBe(2);
    expect(result.dependencyRelation?.coefficients).toEqual([1, 1, -1]);
    expect(result.formsBasisOfR2).toBe(false);
  });

  it('handles empty sets as zero-dimensional and not a basis', () => {
    const result = analyzeVectorSet([]);
    expect(result.status).toBe('empty');
    expect(result.spanKind).toBe('zero');
    expect(result.formsBasisOfR2).toBe(false);
    expect(linearlyIndependent([])).toBe(true);
  });

  it('flags a near-line without turning it into exact dependence', () => {
    const result = analyzeVectorSet([{ x: 1, y: 0 }, { x: 1, y: 0.01 }]);
    expect(result.status).toBe('nearly-dependent');
    expect(result.independent).toBe(true);
    expect(result.formsBasisOfR2).toBe(true);
  });
});

describe('linear combinations', () => {
  it('solves coefficients for a spanning pair', () => {
    expect(solveTwoVectorCombination({ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 3, y: -2 })).toEqual({ a: 3, b: -2 });
    expect(solveTwoVectorCombination({ x: 2, y: 1 }, { x: -1, y: 2 }, { x: 5, y: 0 })).toEqual({ a: 2, b: -1 });
  });

  it('returns null for a pair that only spans a line', () => {
    expect(solveTwoVectorCombination({ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 1, y: 0 })).toBeNull();
  });
});
