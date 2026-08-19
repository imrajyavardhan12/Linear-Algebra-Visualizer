import type { Vector2 } from '../math';

export type ExampleName = 'standard' | 'dependent' | 'nearly-dependent' | 'three-vector';

export interface ExampleScene {
  vectors: Vector2[];
  coefficients: { a: number; b: number };
  showCombination: boolean;
  showStandardBasis: boolean;
  showProjection?: boolean;
}

export const EXAMPLE_SCENES: Record<ExampleName, ExampleScene> = {
  standard: {
    vectors: [{ x: 1, y: 0 }, { x: 0, y: 1 }],
    coefficients: { a: 2, b: -1 },
    showCombination: true,
    showStandardBasis: true,
    showProjection: true,
  },
  dependent: {
    vectors: [{ x: 1, y: 2 }, { x: 2, y: 4 }],
    coefficients: { a: 1, b: 1 },
    showCombination: false,
    showStandardBasis: false,
  },
  'nearly-dependent': {
    vectors: [{ x: 1, y: 0 }, { x: 1, y: 0.02 }],
    coefficients: { a: 1, b: 1 },
    showCombination: false,
    showStandardBasis: false,
  },
  'three-vector': {
    vectors: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    coefficients: { a: 1, b: 1 },
    showCombination: true,
    showStandardBasis: false,
  },
};

export const EXAMPLE_LABELS: Record<ExampleName, string> = {
  standard: 'Standard basis',
  dependent: 'Dependent pair',
  'nearly-dependent': 'Nearly dependent',
  'three-vector': 'Three-vector relation',
};
