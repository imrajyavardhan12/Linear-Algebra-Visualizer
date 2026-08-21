export interface VectorPairOption {
  id: string;
  label: string;
}

interface VectorPairSelectorProps {
  options: VectorPairOption[];
  firstId: string;
  secondId: string;
  firstLabel: string;
  secondLabel: string;
  firstAriaLabel: string;
  secondAriaLabel: string;
  separator: '+' | '→' | ',';
  onChange: (slot: 'first' | 'second', id: string) => void;
}

export function VectorPairSelector({
  options,
  firstId,
  secondId,
  firstLabel,
  secondLabel,
  firstAriaLabel,
  secondAriaLabel,
  separator,
  onChange,
}: VectorPairSelectorProps) {
  return <div className="vector-pair-selector">
    <label>
      <span>{firstLabel}</span>
      <select aria-label={firstAriaLabel} value={firstId} onChange={(event) => onChange('first', event.target.value)}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
    <span className="pair-direction" aria-hidden="true">{separator}</span>
    <label>
      <span>{secondLabel}</span>
      <select aria-label={secondAriaLabel} value={secondId} onChange={(event) => onChange('second', event.target.value)}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
  </div>;
}
