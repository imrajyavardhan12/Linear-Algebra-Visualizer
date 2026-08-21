import { formatAdaptiveNumber, formatAdaptiveVector, type BasisCoordinatesEvaluation } from '../../math';
import { Icon } from '../Icon';
import { VectorPairSelector, type VectorPairOption } from './VectorPairSelector';

interface BasisCoordinatesControlsProps {
  evaluation: BasisCoordinatesEvaluation | null;
  enabled: boolean;
  options: VectorPairOption[];
  firstId?: string;
  secondId?: string;
  targetId?: string;
  firstLabel?: string;
  secondLabel?: string;
  targetLabel?: string;
  onPairChange: (slot: 'first' | 'second', id: string) => void;
  onTargetChange: (id: string) => void;
  onToggle: () => void;
}

function adaptiveEquationTerm(coefficient: number, symbol: string, isFirst = false): string {
  const magnitude = Math.abs(coefficient);
  const coefficientText = magnitude === 1 ? '' : formatAdaptiveNumber(magnitude);
  if (isFirst) return `${coefficient < 0 ? '−' : ''}${coefficientText}${symbol}`;
  return `${coefficient < 0 ? '−' : '+'} ${coefficientText}${symbol}`;
}

function coordinatesAreRounded(evaluation: BasisCoordinatesEvaluation): boolean {
  if (!evaluation.coordinates) return false;
  return Number(formatAdaptiveNumber(evaluation.coordinates.x)) !== evaluation.coordinates.x
    || Number(formatAdaptiveNumber(evaluation.coordinates.y)) !== evaluation.coordinates.y;
}

function reconstructionExpression(
  evaluation: BasisCoordinatesEvaluation,
  targetLabel: string,
  firstLabel: string,
  secondLabel: string,
): string | null {
  if (!evaluation.coordinates) return null;
  const relation = coordinatesAreRounded(evaluation) ? '≈' : '=';
  return `${targetLabel} ${relation} ${adaptiveEquationTerm(evaluation.coordinates.x, firstLabel, true)} ${adaptiveEquationTerm(evaluation.coordinates.y, secondLabel)}`;
}

export function BasisCoordinatesControls({
  evaluation,
  enabled,
  options,
  firstId,
  secondId,
  targetId,
  firstLabel = 'u₁',
  secondLabel = 'u₂',
  targetLabel = 'v',
  onPairChange,
  onTargetChange,
  onToggle,
}: BasisCoordinatesControlsProps) {
  const hasSelection = evaluation !== null && firstId && secondId && targetId;
  const reconstruction = evaluation
    ? reconstructionExpression(evaluation, targetLabel, firstLabel, secondLabel)
    : null;

  return <section className={`control-section basis-coordinate-section ${enabled ? 'is-open' : ''}`} aria-labelledby="basis-coordinate-heading">
    <div className="section-heading-row">
      <div>
        <span className="section-kicker">Change the coordinate language</span>
        <h3 id="basis-coordinate-heading">Change of basis</h3>
      </div>
      <button className={`toggle-switch ${enabled ? 'on' : ''}`} type="button" role="switch" aria-checked={enabled} onClick={onToggle} aria-label="Show change of basis">
        <span />
      </button>
    </div>

    {!hasSelection && <p className="muted-copy">Add two visible vectors to define an ordered basis.</p>}
    {hasSelection && evaluation && firstId && secondId && targetId && <>
      <VectorPairSelector
        options={options}
        firstId={firstId}
        secondId={secondId}
        firstLabel="Basis b₁"
        secondLabel="Basis b₂"
        firstAriaLabel="First basis vector"
        secondAriaLabel="Second basis vector"
        separator=","
        onChange={onPairChange}
      />
      <label className="basis-target-selector">
        <span>Vector to express</span>
        <select aria-label="Vector to express in basis" value={targetId} onChange={(event) => onTargetChange(event.target.value)}>
          {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      {options.length === 2 && <p className="basis-target-hint">Add a third vector to express a direction outside the selected basis pair.</p>}

      <div className="basis-coordinate-status" role="status" aria-live="polite" aria-atomic="true">
        {!evaluation.isBasis
          ? <p className="basis-coordinate-warning">These directions do not form a basis, so B-coordinates are undefined.</p>
          : evaluation.coordinates && <div className="basis-coordinate-formula" aria-label={`${targetLabel} in basis B ${coordinatesAreRounded(evaluation) ? 'is approximately' : 'equals'} ${formatAdaptiveVector(evaluation.coordinates)}`}><span>[{targetLabel}]<sub>B</sub></span> {coordinatesAreRounded(evaluation) ? '≈' : '='} <strong>{formatAdaptiveVector(evaluation.coordinates)}</strong></div>}
      </div>
      {evaluation.isBasis && evaluation.coordinates && <>
          {enabled
            ? <div className="basis-coordinate-calculation">
              <div><span>Ordered basis B</span><strong>({firstLabel}, {secondLabel})</strong></div>
              <div><span>det(B)</span><strong>{formatAdaptiveNumber(evaluation.determinant)}</strong></div>
              {reconstruction && <div className="basis-reconstruction"><span>Reconstruction</span><strong>{reconstruction}</strong></div>}
              <p>Standard coordinates locate the arrow; B-coordinates count steps along the selected basis directions.</p>
            </div>
            : <button className="text-action" type="button" onClick={onToggle}><Icon name="arrow" size={14} /> Reveal the basis grid</button>}
        </>}
    </>}
  </section>;
}
