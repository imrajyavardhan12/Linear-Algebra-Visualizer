import { formatNumber, formatVector, linearCombination, type Vector2 } from '../../math';
import { Icon } from '../Icon';

interface CoefficientControlsProps {
  vectors: Vector2[];
  coefficients: { a: number; b: number };
  enabled: boolean;
  result: Vector2;
  onToggle: () => void;
  onChange: (key: 'a' | 'b', value: number) => void;
}

export function CoefficientControls({ vectors, coefficients, enabled, result, onToggle, onChange }: CoefficientControlsProps) {
  const hasPair = vectors.length >= 2;
  const computedResult = hasPair ? linearCombination(vectors.slice(0, 2), [coefficients.a, coefficients.b]) : result;
  const update = (key: 'a' | 'b', raw: string) => {
    const value = Number(raw);
    if (Number.isFinite(value)) onChange(key, value);
  };

  return <section className={`control-section combination-section ${enabled ? 'is-open' : ''}`} aria-labelledby="combination-heading">
    <div className="section-heading-row">
      <div>
        <span className="section-kicker">Explore a recipe</span>
        <h3 id="combination-heading">Linear combination</h3>
      </div>
      <button className={`toggle-switch ${enabled ? 'on' : ''}`} type="button" role="switch" aria-checked={enabled} onClick={onToggle} aria-label="Show linear combination">
        <span />
      </button>
    </div>
    {!hasPair && <p className="muted-copy">Add a second vector to combine two directions.</p>}
    {hasPair && <>
      <div className="formula-display" aria-label="w equals a times u1 plus b times u2"><span>w</span> = <em>a</em>u₁ + <em>b</em>u₂</div>
      <div className="coefficient-grid">
        {(['a', 'b'] as const).map((key, index) => <label className="coefficient-control" key={key}>
          <div className="coefficient-label"><span className={`coefficient-dot coefficient-dot-${index}`} /> <strong>{key}</strong><output>{formatNumber(coefficients[key])}</output></div>
          <input aria-label={`Coefficient ${key}`} type="range" min="-3" max="3" step="0.1" value={coefficients[key]} onChange={(event) => update(key, event.target.value)} />
          <input className="coefficient-number" aria-label={`${key} exact value`} type="number" min="-5" max="5" step="0.1" value={coefficients[key]} onChange={(event) => update(key, event.target.value)} />
        </label>)}
      </div>
      {enabled && <div className="combination-calculation">
        <div className="calculation-line"><span className="calculation-key">Scaled</span><span>{formatNumber(coefficients.a)}u₁ = {formatVector({ x: vectors[0]!.x * coefficients.a, y: vectors[0]!.y * coefficients.a })}</span></div>
        <div className="calculation-line"><span className="calculation-key">Scaled</span><span>{formatNumber(coefficients.b)}u₂ = {formatVector({ x: vectors[1]!.x * coefficients.b, y: vectors[1]!.y * coefficients.b })}</span></div>
        <div className="calculation-line result-line"><span className="calculation-key">Result w</span><strong>{formatVector(computedResult)}</strong></div>
      </div>}
      {!enabled && <button className="text-action" type="button" onClick={onToggle}><Icon name="arrow" size={14} /> Reveal the construction</button>}
    </>}
  </section>;
}
