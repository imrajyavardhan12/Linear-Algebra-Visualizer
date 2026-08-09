import { formatEquationTerm, formatNumber, formatVector } from './math/format';
import { magnitude } from './math/vector';
import type { Vector2, VectorSetAnalysis } from './math';

export interface ExplanationContent {
  eyebrow: string;
  headline: string;
  body: string;
  highlights: string[];
  span: string;
  basis: string;
}

function vectorName(index: number, names: string[]): string {
  return names[index] ?? `u${index + 1}`;
}

function relationText(analysis: VectorSetAnalysis, names: string[]): string | null {
  const relation = analysis.dependencyRelation;
  if (!relation) return null;
  const terms = relation.coefficients
    .map((coefficient, index) => ({ coefficient, index }))
    .filter(({ coefficient }) => Math.abs(coefficient) > 1e-8)
    .map(({ coefficient, index }, termIndex) => formatEquationTerm(coefficient, vectorName(index, names), termIndex === 0));

  return terms.length > 0 ? `${terms.join(' ')} = 0` : null;
}

export function buildExplanation(
  vectors: Vector2[],
  analysis: VectorSetAnalysis,
  names: string[] = ['u₁', 'u₂', 'u₃'],
): ExplanationContent {
  if (analysis.count === 0) {
    return {
      eyebrow: 'Start with a direction',
      headline: 'Add a vector to the plane',
      body: 'A vector is an arrow with a direction and a length. Add one or two vectors to see how their directions build a space.',
      highlights: ['A vector is written as (x, y).', 'Every vector here starts at the origin.'],
      span: 'The span is empty until a non-zero direction is added.',
      basis: 'A basis of R² needs two independent vectors.',
    };
  }

  if (analysis.status === 'nearly-dependent') {
    return {
      eyebrow: 'Close to a turning point',
      headline: 'Nearly dependent',
      body: 'These vectors are almost on the same line. A small movement can change the area between them dramatically, so this is a useful place to notice numerical sensitivity.',
      highlights: [
        'The pair is still mathematically independent at this precision.',
        'Watch the span open up as you move one arrow away from the line.',
      ],
      span: 'The span is still R², but the two directions are very close to redundant.',
      basis: 'This pair is technically a basis of R², though it is a poorly conditioned one.',
    };
  }

  if (analysis.dependent) {
    if (analysis.count > 2) {
      const relation = relationText(analysis, names);
      return {
        eyebrow: 'One direction too many',
        headline: 'Linearly dependent',
        body: `R² has dimension 2, so three vectors cannot all introduce a new direction. At least one vector can be rebuilt from the others.`,
        highlights: [
          'More than 2 vectors in R² must be dependent.',
          ...(relation ? [`One visible relationship is ${relation}.`] : []),
        ],
        span: analysis.spanKind === 'plane'
          ? 'The set can still span R²; dependence means one vector is redundant, not that the span must be a line.'
          : 'These vectors only provide one direction, so their span is a line.',
        basis: 'This set is not a basis of R² because a basis cannot contain redundant vectors.',
      };
    }

    if (vectors.some((vector) => magnitude(vector) <= 1e-9)) {
      return {
        eyebrow: 'A zero direction contributes nothing',
        headline: 'Linearly dependent',
        body: 'A zero vector can be made with a coefficient of 1, without using any other direction. Any set containing it is dependent.',
        highlights: ['The zero vector has no direction or length.', 'Move the zero arrow away from the origin to restore a direction.'],
        span: analysis.spanKind === 'zero' ? 'span{0} = {0}.' : 'The non-zero vector still spans a line.',
        basis: 'Not a basis of R²: the zero vector cannot be part of a linearly independent set.',
      };
    }

    const multiple = analysis.scalarMultiple;
    if (multiple && vectors[multiple.baseIndex] && vectors[multiple.targetIndex]) {
      const base = vectorName(multiple.baseIndex, names);
      const target = vectorName(multiple.targetIndex, names);
      return {
        eyebrow: 'One direction repeated',
        headline: 'Linearly dependent',
        body: `${target} = ${formatNumber(multiple.factor)}${base}. It is only a scaled version of ${base}, so it does not introduce a new direction.`,
        highlights: [
          `Both arrows lie on the same line through the origin.`,
          'Scaling changes length and orientation, but not the underlying direction.',
        ],
        span: 'span{' + names.slice(0, 2).join(', ') + '} = a line.',
        basis: 'Not a basis of R²: the pair does not provide two independent directions.',
      };
    }
  }

  if (analysis.count === 1) {
    return {
      eyebrow: 'One direction',
      headline: 'Linearly independent',
      body: `${vectorName(0, names)} contributes a direction that cannot be made from an empty set.`,
      highlights: ['One non-zero vector spans a line through the origin.', 'A single direction is not enough to cover the plane.'],
      span: `span{${vectorName(0, names)}} = a line through the origin.`,
      basis: 'Not a basis of R² yet: one vector cannot provide two directions.',
    };
  }

  return {
    eyebrow: 'Two directions',
    headline: 'Linearly independent',
    body: `${vectorName(0, names)} and ${vectorName(1, names)} point in genuinely different directions. Neither vector can be created by scaling the other.`,
    highlights: [
      'Two independent directions can reach every point in R².',
      'Changing either coefficient changes where the combination lands.',
    ],
    span: 'span{' + names.slice(0, 2).join(', ') + '} = R².',
    basis: 'This pair is a basis of R²: it is both independent and spanning.',
  };
}

export function vectorDefinition(vector: Vector2, name: string): string {
  return `${name} = ${formatVector(vector)}`;
}
