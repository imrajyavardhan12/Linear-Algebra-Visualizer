import { formatNumber, formatVector, magnitude, radiansToDegrees, type ProjectionEvaluation } from '../math';
import { Icon } from './Icon';
import { VectorPairSelector, type VectorPairOption } from './controls/VectorPairSelector';

interface ProjectionControlsProps {
  evaluation: ProjectionEvaluation | null;
  enabled: boolean;
  sourceLabel?: string;
  ontoLabel?: string;
  pairOptions?: VectorPairOption[];
  sourceId?: string;
  ontoId?: string;
  onPairChange?: (slot: 'first' | 'second', id: string) => void;
  onToggle: () => void;
}

function relationshipLabel(evaluation: ProjectionEvaluation): string {
  if (evaluation.angleRadians === null) return 'Angle undefined';
  if (evaluation.cosine !== null && Math.abs(evaluation.cosine) <= 1e-9) return 'Orthogonal';
  return evaluation.dot > 0 ? 'Acute angle' : 'Obtuse angle';
}

export function ProjectionControls({
  evaluation,
  enabled,
  sourceLabel = 'u₁',
  ontoLabel = 'u₂',
  pairOptions = [],
  sourceId,
  ontoId,
  onPairChange,
  onToggle,
}: ProjectionControlsProps) {
  const hasPair = evaluation !== null;
  const targetHasDirection = evaluation !== null && magnitude(evaluation.onto) > 1e-9;
  const sourceHasDirection = evaluation !== null && magnitude(evaluation.source) > 1e-9;
  const angleText = evaluation?.angleRadians === null || !evaluation
    ? 'undefined'
    : `${formatNumber(radiansToDegrees(evaluation.angleRadians))}°`;

  return <section className={`control-section projection-section ${enabled ? 'is-open' : ''}`} aria-labelledby="projection-heading">
    <div className="section-heading-row">
      <div>
        <span className="section-kicker">Explore a relationship</span>
        <h3 id="projection-heading">Dot product &amp; projection</h3>
      </div>
      <button className={`toggle-switch ${enabled ? 'on' : ''}`} type="button" role="switch" aria-checked={enabled} onClick={onToggle} aria-label="Show dot product and projection">
        <span />
      </button>
    </div>
    {!hasPair && <p className="muted-copy">Add a second visible vector to compare directions.</p>}
    {hasPair && evaluation && <>
      {pairOptions.length >= 2 && sourceId && ontoId && onPairChange && <VectorPairSelector
        options={pairOptions}
        firstId={sourceId}
        secondId={ontoId}
        firstLabel="Source"
        secondLabel="Onto"
        firstAriaLabel="Projection source"
        secondAriaLabel="Projection target"
        separator="→"
        onChange={onPairChange}
      />}
      <div className="projection-formula" aria-label={`${sourceLabel} dot ${ontoLabel} equals ${formatNumber(evaluation.dot)}`}><span>{sourceLabel} · {ontoLabel}</span> = <strong>{formatNumber(evaluation.dot)}</strong></div>
      {enabled
        ? <>
          <div className="projection-metrics" aria-live="polite">
            <div><span>Relationship</span><strong>{relationshipLabel(evaluation)}</strong></div>
            <div><span>Angle θ</span><strong>{angleText}</strong></div>
          </div>
          {!targetHasDirection
            ? <p className="muted-copy projection-warning">Projection needs a non-zero target direction.</p>
            : <div className="projection-calculation">
              <div><span>Projection of {sourceLabel} onto {ontoLabel}</span><strong>{formatVector(evaluation.projection)}</strong></div>
              <div><span>Perpendicular part</span><strong>{formatVector(evaluation.rejection)}</strong></div>
              {!sourceHasDirection && <p className="projection-warning">The zero vector has no angle, but its projection is still zero.</p>}
            </div>}
        </>
        : <button className="text-action" type="button" onClick={onToggle}><Icon name="arrow" size={14} /> Reveal the relationship</button>}
    </>}
  </section>;
}
