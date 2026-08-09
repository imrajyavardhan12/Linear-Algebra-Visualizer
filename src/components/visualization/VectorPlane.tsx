import { memo, useMemo, useRef } from 'react';
import { formatNumber } from '../../math';
import { add, magnitude, normalize, scale } from '../../math';
import type { Vector2, VectorSetAnalysis } from '../../math';

export interface PlaneVector {
  id: string;
  label: string;
  value: Vector2;
  visible: boolean;
  locked: boolean;
  color: string;
}

export interface CombinationOverlay {
  enabled: boolean;
  coefficients: { a: number; b: number };
  result: Vector2;
}

interface VectorPlaneProps {
  vectors: PlaneVector[];
  analysis: VectorSetAnalysis;
  onChange: (id: string, value: Vector2) => void;
  showStandardBasis: boolean;
  combination?: CombinationOverlay;
}

const WIDTH = 760;
const HEIGHT = 640;
const ORIGIN = { x: WIDTH / 2, y: HEIGHT / 2 };
const UNIT = 58;
const PLANE_LIMIT = 6;
const GRID_X = Array.from({ length: 13 }, (_, index) => index - PLANE_LIMIT);
const GRID_Y = Array.from({ length: 11 }, (_, index) => index - 5);
const COLORS = ['#ffb86b', '#9b8cff', '#5eead4'];
const STANDARD_COLORS = ['#f4c47a', '#8bd6ca'];

function toScreen(vector: Vector2): { x: number; y: number } {
  return { x: ORIGIN.x + vector.x * UNIT, y: ORIGIN.y - vector.y * UNIT };
}

function fromPointer(event: React.PointerEvent<SVGSVGElement>): Vector2 {
  const rect = event.currentTarget.getBoundingClientRect();
  const screenX = ((event.clientX - rect.left) / rect.width) * WIDTH;
  const screenY = ((event.clientY - rect.top) / rect.height) * HEIGHT;
  const x = (screenX - ORIGIN.x) / UNIT;
  const y = (ORIGIN.y - screenY) / UNIT;
  return {
    x: Math.max(-12, Math.min(12, Number(x.toFixed(2)))),
    y: Math.max(-12, Math.min(12, Number(y.toFixed(2)))),
  };
}

function arrowMarker(id: string, color: string) {
  return <marker id={id} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 9 4.5 0 9Z" fill={color} /></marker>;
}

function SpanOverlay({ vectors, analysis }: { vectors: PlaneVector[]; analysis: VectorSetAnalysis }) {
  if (analysis.spanKind === 'plane') {
    return <>
      <rect className="span-plane" x="20" y="20" width={WIDTH - 40} height={HEIGHT - 40} rx="18" />
      <text className="span-label span-label-plane" x={WIDTH - 34} y={HEIGHT - 36} textAnchor="end">span = R²</text>
    </>;
  }

  if (analysis.spanKind !== 'line') return null;
  const direction = vectors.map((vector) => vector.value).find((vector) => magnitude(vector) > 1e-8);
  if (!direction) return null;
  const unit = normalize(direction);
  const start = toScreen(scale(unit, -12));
  const end = toScreen(scale(unit, 12));
  return <>
    <line className="span-line" x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
    <text className="span-label" x={WIDTH - 34} y={HEIGHT - 36} textAnchor="end">span = line</text>
  </>;
}

function StandardBasisOverlay() {
  const e1 = toScreen({ x: 2.7, y: 0 });
  const e2 = toScreen({ x: 0, y: 2.7 });
  return <g className="standard-basis-overlay" aria-label="Standard basis vectors">
    <line x1={ORIGIN.x} y1={ORIGIN.y} x2={e1.x} y2={e1.y} markerEnd="url(#arrow-e1)" />
    <line x1={ORIGIN.x} y1={ORIGIN.y} x2={e2.x} y2={e2.y} markerEnd="url(#arrow-e2)" />
    <text x={e1.x + 11} y={e1.y + 19}>e₁</text>
    <text x={e2.x + 12} y={e2.y - 10}>e₂</text>
  </g>;
}

function CombinationGeometry({ combination, firstVector, secondVector }: {
  combination: CombinationOverlay;
  firstVector: Vector2;
  secondVector: Vector2;
}) {
  const firstScaled = scale(firstVector, combination.coefficients.a);
  const secondScaled = scale(secondVector, combination.coefficients.b);
  const result = add(firstScaled, secondScaled);
  const firstPoint = toScreen(firstScaled);
  const secondPoint = toScreen(secondScaled);
  const resultPoint = toScreen(result);
  const coefficientA = formatNumber(combination.coefficients.a);
  const coefficientB = formatNumber(combination.coefficients.b);

  return <g className="combination-overlay" aria-label="Linear combination construction">
    <line className="scaled-vector scaled-vector-a" x1={ORIGIN.x} y1={ORIGIN.y} x2={firstPoint.x} y2={firstPoint.y} markerEnd="url(#arrow-combination-a)" />
    <line className="scaled-vector scaled-vector-b" x1={ORIGIN.x} y1={ORIGIN.y} x2={secondPoint.x} y2={secondPoint.y} markerEnd="url(#arrow-combination-b)" />
    <line className="parallelogram-edge" x1={firstPoint.x} y1={firstPoint.y} x2={resultPoint.x} y2={resultPoint.y} />
    <line className="parallelogram-edge" x1={secondPoint.x} y1={secondPoint.y} x2={resultPoint.x} y2={resultPoint.y} />
    <line className="resultant-vector" x1={ORIGIN.x} y1={ORIGIN.y} x2={resultPoint.x} y2={resultPoint.y} markerEnd="url(#arrow-resultant)" />
    <text className="overlay-label overlay-label-a" x={firstPoint.x + 10} y={firstPoint.y - 12}>a·u₁ = {coefficientA}u₁</text>
    <text className="overlay-label overlay-label-b" x={secondPoint.x + 10} y={secondPoint.y + 22}>b·u₂ = {coefficientB}u₂</text>
    <text className="resultant-label" x={resultPoint.x + 12} y={resultPoint.y - 12}>w</text>
  </g>;
}

export const VectorPlane = memo(function VectorPlane({
  vectors,
  analysis,
  onChange,
  showStandardBasis,
  combination,
}: VectorPlaneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number } | null>(null);
  const visibleVectors = useMemo(() => vectors.filter((vector) => vector.visible), [vectors]);
  const firstTwo = vectors.slice(0, 2);

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const vector = vectors.find((item) => item.id === drag.id);
    if (!vector || vector.locked) return;
    onChange(drag.id, fromPointer(event));
  };

  const stopDragging = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already have been released by the browser.
      }
    }
  };

  const startDragging = (event: React.PointerEvent<SVGGElement>, vector: PlaneVector) => {
    if (vector.locked) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { id: vector.id, pointerId: event.pointerId };
    svgRef.current?.setPointerCapture(event.pointerId);
  };

  const nudge = (event: React.KeyboardEvent<SVGGElement>, vector: PlaneVector) => {
    if (vector.locked) return;
    const step = event.shiftKey ? 1 : 0.1;
    const delta = event.key === 'ArrowRight' ? { x: step, y: 0 }
      : event.key === 'ArrowLeft' ? { x: -step, y: 0 }
        : event.key === 'ArrowUp' ? { x: 0, y: step }
          : event.key === 'ArrowDown' ? { x: 0, y: -step }
            : null;
    if (!delta) return;
    event.preventDefault();
    onChange(vector.id, { x: vector.value.x + delta.x, y: vector.value.y + delta.y });
  };

  return <div className="plane-shell">
    <div className="plane-toolbar">
      <div>
        <span className="eyebrow">Interactive coordinate plane</span>
        <h2>Build the space</h2>
      </div>
      <div className="plane-toolbar-meta"><span className="live-dot" /> Drag arrowheads · <kbd>← ↑ ↓ →</kbd> nudge</div>
    </div>
    <div className="plane-canvas-wrap">
      <svg
        ref={svgRef}
        className="plane-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="group"
        aria-label="Interactive R2 coordinate plane with draggable vectors"
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <title>Interactive R² coordinate plane</title>
        <defs>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          {arrowMarker('arrow-u1', COLORS[0]!)}
          {arrowMarker('arrow-u2', COLORS[1]!)}
          {arrowMarker('arrow-u3', COLORS[2]!)}
          {arrowMarker('arrow-e1', STANDARD_COLORS[0]!)}
          {arrowMarker('arrow-e2', STANDARD_COLORS[1]!)}
          {arrowMarker('arrow-combination-a', '#ffcf91')}
          {arrowMarker('arrow-combination-b', '#b4abff')}
          {arrowMarker('arrow-resultant', '#f7f8fc')}
        </defs>
        <rect className="plane-background" x="0" y="0" width={WIDTH} height={HEIGHT} rx="20" />
        <g className="grid-lines" aria-hidden="true">
          {GRID_X.map((value) => { const point = toScreen({ x: value, y: 0 }); return <line key={`x-${value}`} x1={point.x} y1="20" x2={point.x} y2={HEIGHT - 20} />; })}
          {GRID_Y.map((value) => { const point = toScreen({ x: 0, y: value }); return <line key={`y-${value}`} x1="20" y1={point.y} x2={WIDTH - 20} y2={point.y} />; })}
        </g>
        <SpanOverlay vectors={vectors} analysis={analysis} />
        {showStandardBasis && <StandardBasisOverlay />}
        <g className="axes" aria-hidden="true">
          <line x1="20" y1={ORIGIN.y} x2={WIDTH - 20} y2={ORIGIN.y} />
          <line x1={ORIGIN.x} y1={HEIGHT - 20} x2={ORIGIN.x} y2="20" />
          <path d={`M${WIDTH - 20} ${ORIGIN.y}l-12 -6v12z`} />
          <path d={`M${ORIGIN.x} 20l-6 12h12z`} />
          <text x={WIDTH - 34} y={ORIGIN.y - 15}>x</text>
          <text x={ORIGIN.x + 13} y="37">y</text>
          <text x={ORIGIN.x + 10} y={ORIGIN.y + 22}>0</text>
          {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((value) => { const point = toScreen({ x: value, y: 0 }); return <text key={`xt-${value}`} x={point.x} y={ORIGIN.y + 22} textAnchor="middle">{value}</text>; })}
          {[-4, -3, -2, -1, 1, 2, 3, 4].map((value) => { const point = toScreen({ x: 0, y: value }); return <text key={`yt-${value}`} x={ORIGIN.x - 13} y={point.y + 4} textAnchor="end">{value}</text>; })}
        </g>
        {combination && combination.enabled && firstTwo.length === 2 && <CombinationGeometry combination={combination} firstVector={firstTwo[0]!.value} secondVector={firstTwo[1]!.value} />}
        {visibleVectors.map((vector, index) => {
          const point = toScreen(vector.value);
          const color = vector.color || COLORS[index] || COLORS[0]!;
          const markerId = `arrow-${vector.id}`;
          return <g className={`vector-g vector-${index + 1}`} key={vector.id}>
            <line className="vector-shadow" x1={ORIGIN.x} y1={ORIGIN.y} x2={point.x} y2={point.y} stroke={color} />
            <line className="vector-line" x1={ORIGIN.x} y1={ORIGIN.y} x2={point.x} y2={point.y} stroke={color} markerEnd={`url(#${markerId})`} />
            <circle className="vector-origin" cx={ORIGIN.x} cy={ORIGIN.y} r="4" fill={color} />
            <g
              className={`vector-handle${vector.locked ? ' is-locked' : ''}`}
              transform={`translate(${point.x} ${point.y})`}
              role="button"
              tabIndex={vector.locked ? -1 : 0}
              aria-label={`${vector.label} endpoint at (${formatNumber(vector.value.x)}, ${formatNumber(vector.value.y)})${vector.locked ? ', locked' : ', draggable'}`}
              aria-disabled={vector.locked}
              onPointerDown={(event) => startDragging(event, vector)}
              onKeyDown={(event) => nudge(event, vector)}
            >
              <circle className="handle-hit-area" r="22" />
              <circle className="vector-endpoint" r="7" fill={color} filter="url(#soft-glow)" />
              <circle className="vector-endpoint-core" r="3" />
              <text className="vector-label" x="13" y="-12">{vector.label}</text>
              <text className="vector-coordinate" x="13" y="5">({formatNumber(vector.value.x)}, {formatNumber(vector.value.y)})</text>
            </g>
          </g>;
        })}
        <g className="origin-marker" aria-hidden="true"><circle cx={ORIGIN.x} cy={ORIGIN.y} r="5" /><circle cx={ORIGIN.x} cy={ORIGIN.y} r="11" /></g>
      </svg>
      <div className="plane-corner-note"><span className="corner-dot" /> R² · vectors start at (0, 0)</div>
    </div>
  </div>;
});
