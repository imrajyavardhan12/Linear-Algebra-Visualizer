import type { Vector2 } from './types';

export function formatNumber(value: number, precision = 2): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.abs(value) < 0.005 ? 0 : Number(value.toFixed(precision));
  return rounded.toString();
}

export function formatVector(vector: Vector2): string {
  return `(${formatNumber(vector.x)}, ${formatNumber(vector.y)})`;
}

export function formatAdaptiveNumber(value: number, significantDigits = 4): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) < 1e-12) return '0';
  return Number(value.toPrecision(significantDigits)).toString();
}

export function formatAdaptiveVector(vector: Vector2, significantDigits = 4): string {
  return `(${formatAdaptiveNumber(vector.x, significantDigits)}, ${formatAdaptiveNumber(vector.y, significantDigits)})`;
}

export function formatSignedTerm(coefficient: number, symbol: string): string {
  const magnitude = Math.abs(coefficient);
  const coefficientText = magnitude === 1 ? '' : formatNumber(magnitude);
  return `${coefficient < 0 ? '−' : '+'} ${coefficientText}${symbol}`;
}

export function formatEquationTerm(coefficient: number, symbol: string, isFirst = false): string {
  const magnitude = Math.abs(coefficient);
  const coefficientText = magnitude === 1 ? '' : formatNumber(magnitude);
  if (isFirst) return `${coefficient < 0 ? '−' : ''}${coefficientText}${symbol}`;
  return `${coefficient < 0 ? '−' : '+'} ${coefficientText}${symbol}`;
}
