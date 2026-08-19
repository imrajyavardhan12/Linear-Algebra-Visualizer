import { useEffect, useRef, useState } from 'react';
import { formatEquationTerm, formatNumber, formatVector, type LinearCombinationEvaluation } from '../../math';
import { Icon } from '../Icon';
import { VectorPairSelector, type VectorPairOption } from './VectorPairSelector';

interface CoefficientControlsProps {
  coefficients: { a: number; b: number };
  evaluation: LinearCombinationEvaluation | null;
  enabled: boolean;
  firstLabel?: string;
  secondLabel?: string;
  pairOptions?: VectorPairOption[];
  firstId?: string;
  secondId?: string;
  onPairChange?: (slot: 'first' | 'second', id: string) => void;
  onToggle: () => void;
  onChange: (key: 'a' | 'b', value: number) => void;
}

type CoefficientKey = 'a' | 'b';
type Drafts = Record<CoefficientKey, string>;

function expressionFor(
  coefficients: { a: number; b: number },
  firstLabel = 'u₁',
  secondLabel = 'u₂',
): string {
  return `w = ${formatEquationTerm(coefficients.a, firstLabel, true)} ${formatEquationTerm(coefficients.b, secondLabel)}`;
}

function scaledExpression(coefficient: number, symbol: string): string {
  const magnitudeText = Math.abs(coefficient) === 1 ? '' : formatNumber(Math.abs(coefficient));
  return `${coefficient < 0 ? '−' : ''}${magnitudeText}${symbol}`;
}

export function CoefficientControls({
  coefficients,
  evaluation,
  enabled,
  firstLabel = 'u₁',
  secondLabel = 'u₂',
  pairOptions = [],
  firstId,
  secondId,
  onPairChange,
  onToggle,
  onChange,
}: CoefficientControlsProps) {
  const hasPair = evaluation !== null;
  const activeCoefficients = evaluation?.coefficients ?? coefficients;
  const [drafts, setDrafts] = useState<Drafts>(() => ({ a: formatNumber(coefficients.a), b: formatNumber(coefficients.b) }));
  const focusedFieldRef = useRef<CoefficientKey | null>(null);

  useEffect(() => {
    setDrafts((current) => ({
      a: focusedFieldRef.current === 'a' ? current.a : formatNumber(activeCoefficients.a),
      b: focusedFieldRef.current === 'b' ? current.b : formatNumber(activeCoefficients.b),
    }));
  }, [activeCoefficients]);

  const update = (key: CoefficientKey, raw: string) => {
    setDrafts((current) => ({ ...current, [key]: raw }));
    if (raw.trim() === '') return;
    const value = Number(raw);
    if (Number.isFinite(value)) onChange(key, value);
  };

  const commit = (key: CoefficientKey) => {
    const raw = drafts[key];
    const value = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(value)) {
      setDrafts((current) => ({ ...current, [key]: formatNumber(activeCoefficients[key]) }));
      focusedFieldRef.current = null;
      return;
    }
    const committed = Math.max(-5, Math.min(5, value));
    if (committed !== value) onChange(key, committed);
    setDrafts((current) => ({ ...current, [key]: formatNumber(committed) }));
    focusedFieldRef.current = null;
  };

  const expression = expressionFor(activeCoefficients, firstLabel, secondLabel);

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
      {pairOptions.length >= 2 && firstId && secondId && onPairChange && <VectorPairSelector
        options={pairOptions}
        firstId={firstId}
        secondId={secondId}
        firstLabel="Coefficient a"
        secondLabel="Coefficient b"
        firstAriaLabel="Vector for coefficient a"
        secondAriaLabel="Vector for coefficient b"
        separator="+"
        onChange={onPairChange}
      />}
      <div className="formula-display" aria-label={expression}><span>w</span> = <em>a</em>{firstLabel} + <em>b</em>{secondLabel}</div>
      <div className="coefficient-grid">
        {(['a', 'b'] as const).map((key, index) => <label className="coefficient-control" key={key}>
          <div className="coefficient-label"><span className={`coefficient-dot coefficient-dot-${index}`} /> <strong>{key}</strong><output>{formatNumber(activeCoefficients[key])}</output></div>
          <input aria-label={`Coefficient ${key}`} type="range" min="-5" max="5" step="0.1" value={activeCoefficients[key]} onChange={(event) => onChange(key, Number(event.target.value))} />
          <input className="coefficient-number" aria-label={`${key} exact value`} type="number" min="-5" max="5" step="0.1" value={drafts[key]} onFocus={() => { focusedFieldRef.current = key; }} onChange={(event) => update(key, event.target.value)} onBlur={() => commit(key)} />
        </label>)}
      </div>
      {enabled && evaluation && <div className="combination-calculation" aria-live="polite">
        <div className="combination-equation"><span>w</span> = {expression.replace('w = ', '')} = {formatVector(evaluation.result)}</div>
        <div className="calculation-line"><span className="calculation-key">Scaled</span><span>{scaledExpression(activeCoefficients.a, firstLabel)} = {formatVector(evaluation.firstScaled)}</span></div>
        <div className="calculation-line"><span className="calculation-key">Scaled</span><span>{scaledExpression(activeCoefficients.b, secondLabel)} = {formatVector(evaluation.secondScaled)}</span></div>
        <div className="calculation-line result-line"><span className="calculation-key">Result w</span><strong>{formatVector(evaluation.result)}</strong></div>
      </div>}
      {!enabled && <button className="text-action" type="button" onClick={onToggle}><Icon name="arrow" size={14} /> Reveal the construction</button>}
    </>}
  </section>;
}
