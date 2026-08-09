import { buildExplanation } from '../explanations';
import type { Vector2, VectorSetAnalysis } from '../math';
import { Icon } from './Icon';

interface ExplanationPanelProps {
  vectors: Vector2[];
  names: string[];
  analysis: VectorSetAnalysis;
}

export function ExplanationPanel({ vectors, names, analysis }: ExplanationPanelProps) {
  const explanation = buildExplanation(vectors, analysis, names);
  return <section className="why-card" aria-labelledby="why-heading">
    <div className="why-heading"><span className="why-icon"><Icon name="book" size={17} /></span><div><span className="section-kicker">Concept note</span><h3 id="why-heading">Why this happens</h3></div></div>
    <p>{explanation.span}</p>
    <div className="inline-definition"><span>Definition</span><strong>{explanation.basis}</strong></div>
  </section>;
}
