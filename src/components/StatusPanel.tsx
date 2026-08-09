import { buildExplanation } from '../explanations';
import { formatNumber } from '../math';
import type { Vector2, VectorSetAnalysis } from '../math';
import { Icon } from './Icon';

interface StatusPanelProps {
  vectors: Vector2[];
  names: string[];
  analysis: VectorSetAnalysis;
}

export function StatusPanel({ vectors, names, analysis }: StatusPanelProps) {
  const explanation = buildExplanation(vectors, analysis, names);
  const statusLabel = analysis.status === 'independent' ? 'Linearly independent'
    : analysis.status === 'nearly-dependent' ? 'Nearly dependent'
      : analysis.status === 'empty' ? 'Waiting for vectors' : 'Linearly dependent';
  const relation = analysis.dependencyRelation;
  const relationTerms = relation?.coefficients
    .map((coefficient, index) => ({ coefficient, index }))
    .filter(({ coefficient }) => Math.abs(coefficient) > 1e-8)
    .map(({ coefficient, index }, termIndex) => `${termIndex === 0 && coefficient < 0 ? '−' : termIndex === 0 ? '' : coefficient < 0 ? ' − ' : ' + '}${formatNumber(Math.abs(coefficient)) === '1' ? '' : formatNumber(Math.abs(coefficient))}${names[index] ?? `u${index + 1}`}`);

  return <div className="insight-stack">
    <section className={`status-card status-${analysis.status}`} aria-live="polite">
      <div className="status-card-topline"><span className="status-eyebrow">Current relationship</span><span className="status-signal"><span /> live</span></div>
      <div className="status-title-row"><span className="status-icon">{analysis.status === 'independent' ? <Icon name="check" size={18} strokeWidth={2.3} /> : analysis.status === 'empty' ? <Icon name="plus" size={18} /> : <Icon name="x" size={18} strokeWidth={2.3} />}</span><h2>{statusLabel}</h2></div>
      <p className="status-body">{explanation.body}</p>
      <div className="highlight-list">{explanation.highlights.map((highlight) => <div className="highlight-item" key={highlight}><span className="highlight-mark">{analysis.dependent ? '↳' : '→'}</span><span>{highlight}</span></div>)}</div>
    </section>

    <section className="metric-grid" aria-label="Vector set metrics">
      <div className="metric-card"><span className="metric-label">Span</span><strong>{analysis.spanKind === 'plane' ? 'R²' : analysis.spanKind === 'line' ? 'Line' : '{0}'}</strong><span className="metric-detail">dimension {analysis.spanDimension}</span></div>
      <div className="metric-card"><span className="metric-label">Basis of R²</span><strong className={analysis.formsBasisOfR2 ? 'positive' : ''}>{analysis.formsBasisOfR2 ? 'Yes' : 'No'}</strong><span className="metric-detail">independent + spanning</span></div>
    </section>

    {relationTerms && relationTerms.length > 0 && <section className="relation-card"><div className="relation-heading"><span className="section-kicker">A relation you can see</span><Icon name="code" size={16} /></div><div className="relation-equation">{relationTerms.join('')} = 0</div>{relation?.isolatedIndex !== null && relation?.isolatedIndex !== undefined && <p>One vector is a combination of the others.</p>}</section>}

    <section className="basis-card">
      <div className="basis-heading"><div><span className="section-kicker">The two tests</span><h3>Basis of R²</h3></div><Icon name="basis" size={20} /></div>
      <div className={`basis-check ${analysis.independent && analysis.count > 0 ? 'passed' : ''}`}><span>{analysis.independent && analysis.count > 0 ? '✓' : '×'}</span><div><strong>Linearly independent</strong><small>{analysis.independent && analysis.count > 0 ? 'No vector is redundant.' : 'A direction is redundant.'}</small></div></div>
      <div className={`basis-check ${analysis.spanKind === 'plane' ? 'passed' : ''}`}><span>{analysis.spanKind === 'plane' ? '✓' : '×'}</span><div><strong>Spans R²</strong><small>{analysis.spanKind === 'plane' ? 'Can reach every point in the plane.' : 'Only reaches a line so far.'}</small></div></div>
      <div className={`basis-result ${analysis.formsBasisOfR2 ? 'passed' : ''}`}><span>{analysis.formsBasisOfR2 ? '✓' : '—'}</span><strong>{analysis.formsBasisOfR2 ? 'This is a basis of R²' : 'Not a basis yet'}</strong></div>
    </section>
  </div>;
}
