interface LegendProps {
  showCombination: boolean;
}

export function Legend({ showCombination }: LegendProps) {
  return <div className="plane-legend" aria-label="Vector legend">
    <span><i className="legend-line legend-u1" /> u₁</span>
    <span><i className="legend-line legend-u2" /> u₂</span>
    <span><i className="legend-line legend-u3" /> u₃</span>
    {showCombination && <span><i className="legend-line legend-w" /> w resultant</span>}
  </div>;
}
