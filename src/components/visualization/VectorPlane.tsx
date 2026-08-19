import { memo, useMemo, useRef, useState } from 'react';
import { add, formatNumber, magnitude, normalize, scale } from '../../math';
import type { LinearCombinationEvaluation, ProjectionEvaluation, Vector2, VectorSetAnalysis } from '../../math';

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
  evaluation: LinearCombinationEvaluation;
  firstLabel: string;
  secondLabel: string;
}

export interface ProjectionOverlay {
  enabled: boolean;
  evaluation: ProjectionEvaluation;
  sourceLabel: string;
  ontoLabel: string;
}

interface VectorPlaneProps {
  vectors: PlaneVector[];
  analysis: VectorSetAnalysis;
  onChange: (id: string, value: Vector2) => void;
  showStandardBasis: boolean;
  combination?: CombinationOverlay;
  projection?: ProjectionOverlay;
}

const WIDTH = 760;
const HEIGHT = 640;
const ORIGIN = { x: WIDTH / 2, y: HEIGHT / 2 };
const UNIT = 58;
const PLANE_LIMIT = 6;
const GRID_X = Array.from({ length: 13 }, (_, index) => index - PLANE_LIMIT);
const GRID_Y = Array.from({ length: 11 }, (_, index) => index - 5);
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
  return <marker key={id} id={id} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0 9 4.5 0 9Z" fill={color} /></marker>;
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

const COMBINATION_PADDING = 28;

function isOutsidePlane(point: { x: number; y: number }): boolean {
  return point.x < COMBINATION_PADDING || point.x > WIDTH - COMBINATION_PADDING
    || point.y < COMBINATION_PADDING || point.y > HEIGHT - COMBINATION_PADDING;
}

function clampScreenPoint(point: { x: number; y: number }): { x: number; y: number } {
  return {
    x: Math.max(COMBINATION_PADDING, Math.min(WIDTH - COMBINATION_PADDING, point.x)),
    y: Math.max(COMBINATION_PADDING, Math.min(HEIGHT - COMBINATION_PADDING, point.y)),
  };
}

function DeterminantAreaOverlay({ vectors, analysis }: { vectors: PlaneVector[]; analysis: VectorSetAnalysis }) {
  if (vectors.length !== 2 || analysis.determinant === null) return null;
  const first = vectors[0];
  const second = vectors[1];
  if (!first || !second) return null;

  const originPoint = toScreen({ x: 0, y: 0 });
  const firstPoint = toScreen(first.value);
  const secondPoint = toScreen(second.value);
  const resultPoint = toScreen(add(first.value, second.value));
  const rawPoints = [originPoint, firstPoint, resultPoint, secondPoint];
  const points = rawPoints.map(clampScreenPoint);
  const isClipped = rawPoints.some((point) => isOutsidePlane(point));
  const area = Math.abs(analysis.determinant);

  return <g className="determinant-overlay" role="group" aria-label={`Parallelogram area ${formatNumber(area)}`}>
    <title>Parallelogram area equals the absolute determinant: {formatNumber(area)}</title>
    <polygon className="determinant-parallelogram" points={points.map((point) => `${point.x},${point.y}`).join(' ')} />
    <g className="determinant-area-label">
      <rect x="31" y="31" width="150" height="23" rx="5" />
      <text x="40" y="46">area = |det| = {formatNumber(area)}</text>
    </g>
    {isClipped && <g className="determinant-overflow-note"><rect x="31" y="59" width="150" height="22" rx="5" /><text x="106" y="74" textAnchor="middle">area continues outside view</text></g>}
  </g>;
}

function screenDirection(vector: Vector2): { x: number; y: number } {
  const unit = normalize(vector);
  return { x: unit.x, y: -unit.y };
}

function angleArcPath(first: Vector2, second: Vector2, radius: number): string | null {
  if (magnitude(first) <= 1e-8 || magnitude(second) <= 1e-8) return null;
  const firstAngle = Math.atan2(-first.y, first.x);
  const secondAngle = Math.atan2(-second.y, second.x);
  let delta = secondAngle - firstAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  const start = { x: ORIGIN.x + radius * Math.cos(firstAngle), y: ORIGIN.y + radius * Math.sin(firstAngle) };
  const end = { x: ORIGIN.x + radius * Math.cos(firstAngle + delta), y: ORIGIN.y + radius * Math.sin(firstAngle + delta) };
  return `M${start.x} ${start.y}A${radius} ${radius} 0 0 ${delta >= 0 ? 1 : 0} ${end.x} ${end.y}`;
}

function rightAnglePath(projectionPoint: { x: number; y: number }, projection: Vector2, rejection: Vector2): string | null {
  if (magnitude(projection) <= 1e-8 || magnitude(rejection) <= 1e-8) return null;
  const along = screenDirection(scale(projection, -1));
  const perpendicular = screenDirection(rejection);
  const size = 12;
  const first = { x: projectionPoint.x + along.x * size, y: projectionPoint.y + along.y * size };
  const second = { x: first.x + perpendicular.x * size, y: first.y + perpendicular.y * size };
  const third = { x: projectionPoint.x + perpendicular.x * size, y: projectionPoint.y + perpendicular.y * size };
  return `M${first.x} ${first.y}L${second.x} ${second.y}L${third.x} ${third.y}`;
}

function ProjectionGeometry({ projection }: { projection: ProjectionOverlay }) {
  const { evaluation, sourceLabel, ontoLabel } = projection;
  const { source, onto, projection: projected, rejection } = evaluation;
  const noteX = WIDTH - 238;
  const noteY = HEIGHT - 62;

  if (evaluation.scalar === null) {
    return <g className="projection-overlay" role="group" aria-label={`Projection unavailable because ${ontoLabel} is the zero vector`}>
      <g className="projection-note"><rect x={noteX} y={noteY} width="210" height="23" rx="5" /><text x={noteX + 105} y={noteY + 15} textAnchor="middle">no projection: target has no direction</text></g>
    </g>;
  }

  const sourcePoint = clampScreenPoint(toScreen(source));
  const projectedPoint = clampScreenPoint(toScreen(projected));
  const projectedIsZero = magnitude(projected) <= 1e-8;
  const sourceIsZero = magnitude(source) <= 1e-8;
  const arc = angleArcPath(onto, source, 46);
  const rightAngle = rightAnglePath(projectedPoint, projected, rejection);
  const projectedLabel = labelPosition(projectedPoint, -14);
  const angleText = evaluation.angleRadians === null ? 'undefined' : `${formatNumber(evaluation.angleRadians * (180 / Math.PI))}°`;

  return <g className="projection-overlay" role="group" aria-label={`Projection of ${sourceLabel} onto ${ontoLabel}`}>
    {projectedIsZero
      ? <circle className="projection-zero-marker" cx={ORIGIN.x} cy={ORIGIN.y} r="5" />
      : <line className="projection-vector" x1={ORIGIN.x} y1={ORIGIN.y} x2={projectedPoint.x} y2={projectedPoint.y} markerEnd="url(#arrow-projection)" />}
    {!sourceIsZero && <line className="projection-drop" x1={projectedPoint.x} y1={projectedPoint.y} x2={sourcePoint.x} y2={sourcePoint.y} />}
    {rightAngle && <path className="projection-right-angle" d={rightAngle} />}
    {arc && <path className="projection-angle" d={arc} />}
    <text className="projection-label" x={projectedLabel.x} y={projectedLabel.y} textAnchor={projectedLabel.anchor}>proj₍{ontoLabel}₎ {sourceLabel}</text>
    <g className="projection-note"><rect x={noteX} y={noteY} width="210" height="23" rx="5" /><text x={noteX + 105} y={noteY + 15} textAnchor="middle">dot = {formatNumber(evaluation.dot)} · θ = {angleText}</text></g>
  </g>;
}

function labelPosition(point: { x: number; y: number }, verticalOffset: number): { x: number; y: number; anchor: 'start' | 'end' } {
  const nearRightEdge = point.x > WIDTH - 150;
  return {
    x: Math.max(COMBINATION_PADDING, Math.min(WIDTH - COMBINATION_PADDING, point.x + (nearRightEdge ? -12 : 12))),
    y: Math.max(COMBINATION_PADDING, Math.min(HEIGHT - COMBINATION_PADDING, point.y + verticalOffset)),
    anchor: nearRightEdge ? 'end' : 'start',
  };
}

function scaledLabel(coefficient: number, symbol: string): string {
  const magnitudeText = Math.abs(coefficient) === 1 ? '' : formatNumber(Math.abs(coefficient));
  return `${coefficient < 0 ? '−' : ''}${magnitudeText}${symbol}`;
}

function CombinationArrow({
  vector,
  point,
  className,
  markerEnd,
  label,
  labelOffset,
  labelClassName,
}: {
  vector: Vector2;
  point: { x: number; y: number };
  className: string;
  markerEnd: string;
  label: string;
  labelOffset: number;
  labelClassName?: string;
}) {
  const isZero = magnitude(vector) <= 1e-8;
  const isClipped = isOutsidePlane(point);
  const visiblePoint = clampScreenPoint(point);
  const textPosition = labelPosition(visiblePoint, labelOffset);

  return <g className={className}>
    {isZero
      ? <circle className="combination-zero-marker" cx={ORIGIN.x} cy={ORIGIN.y} r="5" />
      : <line className={`combination-arrow-line${isClipped ? ' is-clipped' : ''}`} x1={ORIGIN.x} y1={ORIGIN.y} x2={visiblePoint.x} y2={visiblePoint.y} markerEnd={markerEnd} />}
    {isClipped && <circle className="combination-overflow-marker" cx={visiblePoint.x} cy={visiblePoint.y} r="6" />}
    <text className={`overlay-label ${labelClassName ?? ''}`} x={textPosition.x} y={textPosition.y} textAnchor={textPosition.anchor}>{label}</text>
  </g>;
}

function CombinationGeometry({ combination }: { combination: CombinationOverlay }) {
  const { firstScaled, secondScaled, result, coefficients } = combination.evaluation;
  const { firstLabel, secondLabel } = combination;
  const firstPoint = toScreen(firstScaled);
  const secondPoint = toScreen(secondScaled);
  const resultPoint = toScreen(result);
  const hasBothComponents = magnitude(firstScaled) > 1e-8 && magnitude(secondScaled) > 1e-8;
  const anyPointClipped = isOutsidePlane(firstPoint) || isOutsidePlane(secondPoint) || isOutsidePlane(resultPoint);

  return <g className="combination-overlay" role="group" aria-label="Linear combination construction">
    <CombinationArrow vector={firstScaled} point={firstPoint} className="scaled-vector scaled-vector-a" markerEnd="url(#arrow-combination-a)" label={`a·${firstLabel} = ${scaledLabel(coefficients.a, firstLabel)}`} labelOffset={-12} />
    <CombinationArrow vector={secondScaled} point={secondPoint} className="scaled-vector scaled-vector-b" markerEnd="url(#arrow-combination-b)" label={`b·${secondLabel} = ${scaledLabel(coefficients.b, secondLabel)}`} labelOffset={22} />
    {hasBothComponents && <>
      <line className="parallelogram-edge" x1={clampScreenPoint(firstPoint).x} y1={clampScreenPoint(firstPoint).y} x2={clampScreenPoint(resultPoint).x} y2={clampScreenPoint(resultPoint).y} />
      <line className="parallelogram-edge" x1={clampScreenPoint(secondPoint).x} y1={clampScreenPoint(secondPoint).y} x2={clampScreenPoint(resultPoint).x} y2={clampScreenPoint(resultPoint).y} />
    </>}
    <CombinationArrow vector={result} point={resultPoint} className="resultant-vector" markerEnd="url(#arrow-resultant)" label="w" labelOffset={-12} labelClassName="resultant-label" />
    {anyPointClipped && <g className="combination-overflow-note"><rect x={WIDTH - 155} y="31" width="127" height="22" rx="5" /><text x={WIDTH - 91} y="46" textAnchor="middle">some vectors outside view</text></g>}
  </g>;
}

export const VectorPlane = memo(function VectorPlane({
  vectors,
  analysis,
  onChange,
  showStandardBasis,
  combination,
  projection,
}: VectorPlaneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number } | null>(null);
  const [activeVectorId, setActiveVectorId] = useState<string | null>(null);
  const visibleVectors = useMemo(() => vectors.filter((vector) => vector.visible), [vectors]);
  const activeVector = activeVectorId ? vectors.find((vector) => vector.id === activeVectorId) : null;
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
      setActiveVectorId(null);
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
    setActiveVectorId(vector.id);
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
    <span className="sr-only" id="vector-handle-instructions">Vector endpoints are keyboard controls. Use the arrow keys to nudge by 0.1 units, or hold Shift to nudge by 1 unit.</span>
    <div className="plane-toolbar">
      <div>
        <span className="eyebrow">Interactive coordinate plane</span>
        <h2>Build the space</h2>
      </div>
      <div className="plane-toolbar-meta"><span className="live-dot" /> {activeVector ? `Moving ${activeVector.label} · release to place` : <>Drag arrowheads · <kbd>← ↑ ↓ →</kbd> nudge</>}</div>
    </div>
    <div className="plane-canvas-wrap">
      <span className="sr-only" role="status">{activeVector ? `Moving ${activeVector.label}. Release to place it.` : ''}</span>
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
          {vectors.map((vector) => arrowMarker(`arrow-${vector.id}`, vector.color))}
          {arrowMarker('arrow-e1', STANDARD_COLORS[0]!)}
          {arrowMarker('arrow-e2', STANDARD_COLORS[1]!)}
          {arrowMarker('arrow-combination-a', '#ffcf91')}
          {arrowMarker('arrow-combination-b', '#b4abff')}
          {arrowMarker('arrow-projection', '#ffd27f')}
          {arrowMarker('arrow-resultant', '#f7f8fc')}
        </defs>
        <rect className="plane-background" x="0" y="0" width={WIDTH} height={HEIGHT} rx="20" />
        <g className="grid-lines" aria-hidden="true">
          {GRID_X.map((value) => { const point = toScreen({ x: value, y: 0 }); return <line key={`x-${value}`} x1={point.x} y1="20" x2={point.x} y2={HEIGHT - 20} />; })}
          {GRID_Y.map((value) => { const point = toScreen({ x: 0, y: value }); return <line key={`y-${value}`} x1="20" y1={point.y} x2={WIDTH - 20} y2={point.y} />; })}
        </g>
        <SpanOverlay vectors={visibleVectors} analysis={analysis} />
        <DeterminantAreaOverlay vectors={visibleVectors} analysis={analysis} />
        {projection?.enabled && <ProjectionGeometry projection={projection} />}
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
        {combination?.enabled && <CombinationGeometry combination={combination} />}
        {visibleVectors.map((vector, index) => {
          const point = toScreen(vector.value);
          const color = vector.color;
          const markerId = `arrow-${vector.id}`;
          const isActive = activeVectorId === vector.id;
          return <g className={`vector-g vector-${index + 1}`} key={vector.id}>
            <line className="vector-shadow" x1={ORIGIN.x} y1={ORIGIN.y} x2={point.x} y2={point.y} stroke={color} />
            <line className="vector-line" x1={ORIGIN.x} y1={ORIGIN.y} x2={point.x} y2={point.y} stroke={color} markerEnd={`url(#${markerId})`} />
            <circle className="vector-origin" cx={ORIGIN.x} cy={ORIGIN.y} r="4" fill={color} />
            <g
              className={`vector-handle${vector.locked ? ' is-locked' : ''}${isActive ? ' is-active' : ''}`}
              transform={`translate(${point.x} ${point.y})`}
              role="button"
              tabIndex={vector.locked ? -1 : 0}
              aria-roledescription="draggable vector endpoint"
              aria-describedby="vector-handle-instructions"
              aria-label={`${vector.label} endpoint at (${formatNumber(vector.value.x)}, ${formatNumber(vector.value.y)})${vector.locked ? ', locked' : ', draggable'}`}
              aria-disabled={vector.locked}
              onPointerDown={(event) => startDragging(event, vector)}
              onKeyDown={(event) => nudge(event, vector)}
            >
              <circle className="handle-hit-area" r={vector.locked ? 22 : 28} />
              {isActive && <circle className="vector-active-ring" r="14" />}
              <circle className="vector-endpoint" r={isActive ? 9 : 7} fill={color} filter="url(#soft-glow)" />
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
