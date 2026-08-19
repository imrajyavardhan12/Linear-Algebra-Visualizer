import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../../math';
import type { Vector2 } from '../../math';
import type { VectorItem } from '../../state/usePlaygroundState';
import { vectorVisualDefinition } from '../../scene';
import { Icon } from '../Icon';

interface VectorEditorProps {
  vectors: VectorItem[];
  onChange: (id: string, value: Vector2) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

type Drafts = Record<string, { x: string; y: string }>;

function initialDrafts(vectors: VectorItem[]): Drafts {
  return Object.fromEntries(vectors.map((vector) => [vector.id, {
    x: formatNumber(vector.value.x),
    y: formatNumber(vector.value.y),
  }]));
}

export function VectorEditor({ vectors, onChange, onToggleVisible, onToggleLocked, onAdd, onRemove }: VectorEditorProps) {
  const [drafts, setDrafts] = useState<Drafts>(() => initialDrafts(vectors));
  const focusedFieldRef = useRef<string | null>(null);

  useEffect(() => {
    setDrafts((current) => {
      const next: Drafts = {};
      vectors.forEach((vector) => {
        const currentDraft = current[vector.id];
        next[vector.id] = {
          x: focusedFieldRef.current === `${vector.id}.x` ? currentDraft?.x ?? formatNumber(vector.value.x) : formatNumber(vector.value.x),
          y: focusedFieldRef.current === `${vector.id}.y` ? currentDraft?.y ?? formatNumber(vector.value.y) : formatNumber(vector.value.y),
        };
      });
      return next;
    });
  }, [vectors]);

  const updateCoordinate = (vector: VectorItem, axis: 'x' | 'y', rawValue: string) => {
    setDrafts((current) => {
      const previous = current[vector.id] ?? { x: formatNumber(vector.value.x), y: formatNumber(vector.value.y) };
      return { ...current, [vector.id]: { ...previous, [axis]: rawValue } };
    });
    if (rawValue.trim() === '') return;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    onChange(vector.id, { ...vector.value, [axis]: value });
  };

  const commitCoordinate = (vector: VectorItem, axis: 'x' | 'y') => {
    const rawValue = drafts[vector.id]?.[axis] ?? '';
    if (rawValue.trim() === '') {
      setDrafts((current) => {
        const previous = current[vector.id] ?? { x: formatNumber(vector.value.x), y: formatNumber(vector.value.y) };
        return { ...current, [vector.id]: { ...previous, [axis]: formatNumber(vector.value[axis]) } };
      });
      return;
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      setDrafts((current) => {
        const previous = current[vector.id] ?? { x: formatNumber(vector.value.x), y: formatNumber(vector.value.y) };
        return { ...current, [vector.id]: { ...previous, [axis]: formatNumber(vector.value[axis]) } };
      });
      return;
    }
    const committedValue = Math.max(-12, Math.min(12, value));
    if (committedValue !== value) onChange(vector.id, { ...vector.value, [axis]: committedValue });
    setDrafts((current) => {
      const previous = current[vector.id] ?? { x: formatNumber(vector.value.x), y: formatNumber(vector.value.y) };
      return { ...current, [vector.id]: { ...previous, [axis]: formatNumber(committedValue) } };
    });
  };

  return <section className="control-section vector-section" aria-labelledby="vectors-heading">
    <div className="section-heading-row">
      <div>
        <span className="section-kicker">Scene objects</span>
        <h3 id="vectors-heading">Vectors <span className="count-pill">{vectors.length}/3</span></h3>
      </div>
      <button className="icon-button subtle" type="button" onClick={onAdd} disabled={vectors.length >= 3} aria-label="Add a vector" title="Add vector">
        <Icon name="plus" size={17} />
      </button>
    </div>
    <div className="vector-list">
      {vectors.map((vector, index) => {
        const draft = drafts[vector.id] ?? { x: formatNumber(vector.value.x), y: formatNumber(vector.value.y) };
        const colorClass = vectorVisualDefinition(vector.id, index).editorClass;
        return <article className={`vector-editor-card ${!vector.visible ? 'is-hidden' : ''}`} key={vector.id}>
          <div className="vector-card-topline">
            <div className="vector-name"><span className={`vector-swatch ${colorClass}`} /> <strong>{vector.label}</strong><span className="vector-card-coordinates">({formatNumber(vector.value.x)}, {formatNumber(vector.value.y)})</span></div>
            <div className="vector-card-actions">
              <button className="mini-icon-button" type="button" onClick={() => onToggleVisible(vector.id)} aria-label={`${vector.visible ? 'Hide' : 'Show'} ${vector.label}`} title={`${vector.visible ? 'Hide' : 'Show'} ${vector.label}`}>
                <Icon name={vector.visible ? 'eye' : 'eye-off'} size={15} />
              </button>
              <button className={`mini-icon-button ${vector.locked ? 'active' : ''}`} type="button" onClick={() => onToggleLocked(vector.id)} aria-label={`${vector.locked ? 'Unlock' : 'Lock'} ${vector.label}`} title={`${vector.locked ? 'Unlock' : 'Lock'} ${vector.label}`}>
                <Icon name={vector.locked ? 'lock' : 'unlock'} size={15} />
              </button>
              <button className="mini-icon-button danger" type="button" onClick={() => onRemove(vector.id)} aria-label={`Remove ${vector.label}`} title={`Remove ${vector.label}`}><Icon name="x" size={15} /></button>
            </div>
          </div>
          <div className="coordinate-fields">
            <label className="number-field">
              <span>x</span>
              <input aria-label={`${vector.label} x coordinate`} inputMode="decimal" type="number" step="0.1" min="-12" max="12" disabled={vector.locked} value={draft.x} onFocus={() => { focusedFieldRef.current = `${vector.id}.x`; }} onChange={(event) => updateCoordinate(vector, 'x', event.target.value)} onBlur={() => { commitCoordinate(vector, 'x'); focusedFieldRef.current = null; }} />
            </label>
            <label className="number-field">
              <span>y</span>
              <input aria-label={`${vector.label} y coordinate`} inputMode="decimal" type="number" step="0.1" min="-12" max="12" disabled={vector.locked} value={draft.y} onFocus={() => { focusedFieldRef.current = `${vector.id}.y`; }} onChange={(event) => updateCoordinate(vector, 'y', event.target.value)} onBlur={() => { commitCoordinate(vector, 'y'); focusedFieldRef.current = null; }} />
            </label>
          </div>
        </article>;
      })}
    </div>
    <p className="control-helper"><span className="helper-key">↗</span> Drag an endpoint on the plane, or type exact coordinates here.</p>
    <p className="control-helper"><span className="helper-key">◌</span> Hidden vectors stay saved but are excluded from the live analysis.</p>
  </section>;
}
