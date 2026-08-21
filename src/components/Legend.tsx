interface LegendVector {
  id: string;
  label: string;
  legendClass: string;
}

interface LegendProps {
  vectors: LegendVector[];
  showCombination: boolean;
  showProjection: boolean;
  showBasisCoordinates: boolean;
}

export function Legend({ vectors, showCombination, showProjection, showBasisCoordinates }: LegendProps) {
  return <div className="plane-legend" aria-label="Vector legend">
    {vectors.map((vector) => <span key={vector.id}><i className={`legend-line ${vector.legendClass}`} /> {vector.label}</span>)}
    {showCombination && <span><i className="legend-line legend-w" /> w resultant</span>}
    {showProjection && <span><i className="legend-line legend-projection" /> projection</span>}
    {showBasisCoordinates && <span><i className="legend-line legend-basis-grid" /> basis grid</span>}
  </div>;
}
