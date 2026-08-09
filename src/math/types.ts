export interface Vector2 {
  x: number;
  y: number;
}

export type DependenceStatus = 'independent' | 'dependent' | 'nearly-dependent' | 'empty';
export type SpanKind = 'zero' | 'line' | 'plane';

export interface ScalarMultiple {
  baseIndex: number;
  targetIndex: number;
  factor: number;
}

export interface DependencyRelation {
  coefficients: number[];
  /** The index of the vector isolated on the right-hand side, when available. */
  isolatedIndex: number | null;
}

export interface PairDependence {
  kind: 'independent' | 'dependent' | 'nearly-dependent';
  normalizedDeterminant: number;
  determinant: number;
}

export interface VectorSetAnalysis {
  count: number;
  rank: number;
  spanDimension: number;
  spanKind: SpanKind;
  independent: boolean;
  dependent: boolean;
  status: DependenceStatus;
  scalarMultiple: ScalarMultiple | null;
  determinant: number | null;
  formsBasisOfR2: boolean;
  dependencyRelation: DependencyRelation | null;
}
