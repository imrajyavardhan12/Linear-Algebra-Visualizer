import { useCallback, useEffect, useReducer } from 'react';
import { clamp } from '../math';
import type { Vector2 } from '../math';
import { VECTOR_IDS, vectorVisualDefinition } from '../scene';
import { EXAMPLE_SCENES, type ExampleName } from './examples';

export type Theme = 'dark' | 'light';

export interface VectorItem {
  id: string;
  label: string;
  value: Vector2;
  visible: boolean;
  locked: boolean;
}

export interface VectorPairSelection {
  firstId: string | null;
  secondId: string | null;
}

export interface BasisCoordinateSelection extends VectorPairSelection {
  targetId: string | null;
}

export interface PlaygroundState {
  vectors: VectorItem[];
  coefficients: { a: number; b: number };
  combinationPair: VectorPairSelection;
  projectionPair: VectorPairSelection;
  basisCoordinateSelection: BasisCoordinateSelection;
  showCombination: boolean;
  showStandardBasis: boolean;
  showProjection: boolean;
  showBasisCoordinates: boolean;
  theme: Theme;
}

type Action =
  | { type: 'set-vector'; id: string; value: Vector2 }
  | { type: 'toggle-visible'; id: string }
  | { type: 'toggle-locked'; id: string }
  | { type: 'add-vector' }
  | { type: 'remove-vector'; id: string }
  | { type: 'set-coefficient'; key: 'a' | 'b'; value: number }
  | { type: 'set-combination-vector'; slot: 'first' | 'second'; id: string }
  | { type: 'set-projection-vector'; slot: 'first' | 'second'; id: string }
  | { type: 'set-coordinate-basis-vector'; slot: 'first' | 'second'; id: string }
  | { type: 'set-coordinate-target'; id: string }
  | { type: 'toggle-combination' }
  | { type: 'toggle-standard-basis' }
  | { type: 'toggle-projection' }
  | { type: 'toggle-basis-coordinates' }
  | { type: 'load-example'; example: ExampleName }
  | { type: 'set-theme'; theme: Theme }
  | { type: 'reset' };

const MAX_COORDINATE = 12;
const MAX_COEFFICIENT = 5;
const SHARE_SCHEMA_VERSION = '1';

export const DEFAULT_VECTOR_VALUES: Vector2[] = [
  { x: 2, y: 1 },
  { x: -1, y: 2 },
];

function makeVector(id: string, value: Vector2, fallbackIndex = 0): VectorItem {
  const definition = vectorVisualDefinition(id, fallbackIndex);
  return {
    id: definition.id,
    label: definition.label,
    value: { x: value.x, y: value.y },
    visible: true,
    locked: false,
  };
}

function makeDefaultVectors(values = DEFAULT_VECTOR_VALUES): VectorItem[] {
  return values.map((value, index) => makeVector(VECTOR_IDS[index] ?? `u${index + 1}`, value, index));
}

function finiteCoordinate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp(value, -MAX_COORDINATE, MAX_COORDINATE);
}

function sanitizeVector(value: Vector2): Vector2 {
  return { x: finiteCoordinate(value.x), y: finiteCoordinate(value.y) };
}

function parseVector(value: string | null): Vector2 | null {
  if (!value) return null;
  const parts = value.split(',');
  const x = Number(parts[0] ?? NaN);
  const y = Number(parts[1] ?? NaN);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return sanitizeVector({ x, y });
}

function parseVectorIds(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter((id, index, ids): id is string => VECTOR_IDS.includes(id) && ids.indexOf(id) === index);
}

function reconcilePairSelection(pair: VectorPairSelection, vectors: VectorItem[]): VectorPairSelection {
  const activeIds = vectors.filter((vector) => vector.visible).map((vector) => vector.id);
  const pairIsActive = pair.firstId !== null
    && pair.secondId !== null
    && pair.firstId !== pair.secondId
    && activeIds.includes(pair.firstId)
    && activeIds.includes(pair.secondId);
  if (pairIsActive) return pair;
  return { firstId: activeIds[0] ?? null, secondId: activeIds[1] ?? null };
}

function initialPairFromUrl(name: 'comboPair' | 'projectionPair', vectors: VectorItem[]): VectorPairSelection {
  if (typeof window === 'undefined') return reconcilePairSelection({ firstId: null, secondId: null }, vectors);
  const params = new URLSearchParams(window.location.search);
  const ids = params.get('scene') === SHARE_SCHEMA_VERSION ? parseVectorIds(params.get(name)) : [];
  return reconcilePairSelection({ firstId: ids[0] ?? null, secondId: ids[1] ?? null }, vectors);
}

function reconcileBasisCoordinateSelection(
  selection: BasisCoordinateSelection,
  vectors: VectorItem[],
  preferNonBasisTarget = false,
): BasisCoordinateSelection {
  const pair = reconcilePairSelection(selection, vectors);
  const activeIds = vectors.filter((vector) => vector.visible).map((vector) => vector.id);
  const selectedTarget = selection.targetId !== null && activeIds.includes(selection.targetId)
    ? selection.targetId
    : null;
  const nonBasisTarget = activeIds.find((id) => id !== pair.firstId && id !== pair.secondId) ?? null;
  return {
    ...pair,
    targetId: preferNonBasisTarget && nonBasisTarget
      ? nonBasisTarget
      : selectedTarget ?? nonBasisTarget ?? pair.firstId,
  };
}

function initialBasisCoordinateSelectionFromUrl(vectors: VectorItem[]): BasisCoordinateSelection {
  if (typeof window === 'undefined') {
    return reconcileBasisCoordinateSelection({ firstId: null, secondId: null, targetId: null }, vectors);
  }
  const params = new URLSearchParams(window.location.search);
  const basisIds = params.get('scene') === SHARE_SCHEMA_VERSION ? parseVectorIds(params.get('coordinateBasis')) : [];
  const targetIds = params.get('scene') === SHARE_SCHEMA_VERSION ? parseVectorIds(params.get('coordinateTarget')) : [];
  return reconcileBasisCoordinateSelection({
    firstId: basisIds[0] ?? null,
    secondId: basisIds[1] ?? null,
    targetId: targetIds[0] ?? null,
  }, vectors);
}

function updatePairSelection(
  pair: VectorPairSelection,
  slot: 'first' | 'second',
  id: string,
  vectors: VectorItem[],
): VectorPairSelection {
  if (!vectors.some((vector) => vector.id === id && vector.visible)) return pair;
  if (slot === 'first') {
    return reconcilePairSelection({
      firstId: id,
      secondId: pair.secondId === id ? pair.firstId : pair.secondId,
    }, vectors);
  }
  return reconcilePairSelection({
    firstId: pair.firstId === id ? pair.secondId : pair.firstId,
    secondId: id,
  }, vectors);
}

function applySceneFlags(vectors: VectorItem[], params: URLSearchParams): VectorItem[] {
  const hidden = new Set(parseVectorIds(params.get('hidden')));
  const locked = new Set(parseVectorIds(params.get('locked')));
  return vectors.map((vector) => ({
    ...vector,
    visible: !hidden.has(vector.id),
    locked: locked.has(vector.id),
  }));
}

function initialVectorsFromUrl(): VectorItem[] {
  if (typeof window === 'undefined') return makeDefaultVectors();
  const params = new URLSearchParams(window.location.search);
  if (params.get('scene') === SHARE_SCHEMA_VERSION && params.has('ids')) {
    const ids = parseVectorIds(params.get('ids'));
    const vectors = ids.map((id, index) => {
      const value = parseVector(params.get(id));
      return value ? makeVector(id, value, index) : null;
    });
    if (vectors.every((vector): vector is VectorItem => vector !== null)) {
      return applySceneFlags(vectors, params);
    }
  }

  const values: Vector2[] = [];
  for (const id of VECTOR_IDS) {
    const parsed = parseVector(params.get(id));
    if (!parsed) break;
    values.push(parsed);
  }
  return values.length > 0 ? makeDefaultVectors(values) : makeDefaultVectors();
}

function parseBoundedNumber(value: string | null, fallback: number, min: number, max: number): number {
  if (value === null || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
}

function initialCoefficientsFromUrl(): { a: number; b: number } {
  if (typeof window === 'undefined') return { a: 1, b: 1 };
  const params = new URLSearchParams(window.location.search);
  if (params.get('scene') !== SHARE_SCHEMA_VERSION) return { a: 1, b: 1 };
  return {
    a: parseBoundedNumber(params.get('a'), 1, -MAX_COEFFICIENT, MAX_COEFFICIENT),
    b: parseBoundedNumber(params.get('b'), 1, -MAX_COEFFICIENT, MAX_COEFFICIENT),
  };
}

function initialFlagFromUrl(name: 'combo' | 'basis' | 'projection' | 'changeBasis'): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('scene') === SHARE_SCHEMA_VERSION && params.get(name) === '1';
}

export function serializeSceneState(state: Pick<PlaygroundState, 'vectors' | 'coefficients' | 'combinationPair' | 'projectionPair' | 'basisCoordinateSelection' | 'showCombination' | 'showStandardBasis' | 'showProjection' | 'showBasisCoordinates'>): URLSearchParams {
  const params = new URLSearchParams();
  params.set('scene', SHARE_SCHEMA_VERSION);
  params.set('ids', state.vectors.map((vector) => vector.id).join(','));
  state.vectors.forEach((vector) => params.set(vector.id, `${vector.value.x},${vector.value.y}`));
  params.set('a', String(state.coefficients.a));
  params.set('b', String(state.coefficients.b));
  if (state.combinationPair.firstId && state.combinationPair.secondId) {
    params.set('comboPair', `${state.combinationPair.firstId},${state.combinationPair.secondId}`);
  }
  if (state.projectionPair.firstId && state.projectionPair.secondId) {
    params.set('projectionPair', `${state.projectionPair.firstId},${state.projectionPair.secondId}`);
  }
  if (state.basisCoordinateSelection.firstId && state.basisCoordinateSelection.secondId) {
    params.set('coordinateBasis', `${state.basisCoordinateSelection.firstId},${state.basisCoordinateSelection.secondId}`);
  }
  if (state.basisCoordinateSelection.targetId) {
    params.set('coordinateTarget', state.basisCoordinateSelection.targetId);
  }
  if (state.showCombination) params.set('combo', '1');
  if (state.showStandardBasis) params.set('basis', '1');
  if (state.showProjection) params.set('projection', '1');
  if (state.showBasisCoordinates) params.set('changeBasis', '1');

  const hidden = state.vectors.filter((vector) => !vector.visible).map((vector) => vector.id);
  const locked = state.vectors.filter((vector) => vector.locked).map((vector) => vector.id);
  if (hidden.length > 0) params.set('hidden', hidden.join(','));
  if (locked.length > 0) params.set('locked', locked.join(','));
  return params;
}

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('lap-theme');
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

const initialVectors = initialVectorsFromUrl();

const initialState: PlaygroundState = {
  vectors: initialVectors,
  coefficients: initialCoefficientsFromUrl(),
  combinationPair: initialPairFromUrl('comboPair', initialVectors),
  projectionPair: initialPairFromUrl('projectionPair', initialVectors),
  basisCoordinateSelection: initialBasisCoordinateSelectionFromUrl(initialVectors),
  showCombination: initialFlagFromUrl('combo'),
  showStandardBasis: initialFlagFromUrl('basis'),
  showProjection: initialFlagFromUrl('projection'),
  showBasisCoordinates: initialFlagFromUrl('changeBasis'),
  theme: initialTheme(),
};

function reducer(state: PlaygroundState, action: Action): PlaygroundState {
  switch (action.type) {
    case 'set-vector':
      return {
        ...state,
        vectors: state.vectors.map((vector) => vector.id === action.id
          ? { ...vector, value: sanitizeVector(action.value) }
          : vector),
      };
    case 'toggle-visible': {
      const vectors = state.vectors.map((vector) => vector.id === action.id
        ? { ...vector, visible: !vector.visible }
        : vector);
      return {
        ...state,
        vectors,
        combinationPair: reconcilePairSelection(state.combinationPair, vectors),
        projectionPair: reconcilePairSelection(state.projectionPair, vectors),
        basisCoordinateSelection: reconcileBasisCoordinateSelection(state.basisCoordinateSelection, vectors),
      };
    }
    case 'toggle-locked':
      return {
        ...state,
        vectors: state.vectors.map((vector) => vector.id === action.id
          ? { ...vector, locked: !vector.locked }
          : vector),
      };
    case 'add-vector': {
      if (state.vectors.length >= 3) return state;
      const nextIndex = VECTOR_IDS.findIndex((id) => !state.vectors.some((vector) => vector.id === id));
      const index = nextIndex >= 0 ? nextIndex : state.vectors.length;
      const defaults: Vector2[] = [{ x: 1, y: 1 }, { x: 2, y: -1 }, { x: -1, y: 1 }];
      const id = VECTOR_IDS[index] ?? `u${index + 1}`;
      const vectors = [...state.vectors, makeVector(id, defaults[index] ?? { x: 1, y: 1 }, index)];
      return {
        ...state,
        vectors,
        combinationPair: reconcilePairSelection(state.combinationPair, vectors),
        projectionPair: reconcilePairSelection(state.projectionPair, vectors),
        basisCoordinateSelection: reconcileBasisCoordinateSelection(state.basisCoordinateSelection, vectors, true),
      };
    }
    case 'remove-vector': {
      const vectors = state.vectors.filter((vector) => vector.id !== action.id);
      return {
        ...state,
        vectors,
        combinationPair: reconcilePairSelection(state.combinationPair, vectors),
        projectionPair: reconcilePairSelection(state.projectionPair, vectors),
        basisCoordinateSelection: reconcileBasisCoordinateSelection(state.basisCoordinateSelection, vectors),
      };
    }
    case 'set-coefficient':
      return {
        ...state,
        coefficients: { ...state.coefficients, [action.key]: Number.isFinite(action.value) ? clamp(action.value, -5, 5) : 0 },
      };
    case 'set-combination-vector':
      return {
        ...state,
        combinationPair: updatePairSelection(state.combinationPair, action.slot, action.id, state.vectors),
      };
    case 'set-projection-vector':
      return {
        ...state,
        projectionPair: updatePairSelection(state.projectionPair, action.slot, action.id, state.vectors),
      };
    case 'set-coordinate-basis-vector': {
      const pair = updatePairSelection(state.basisCoordinateSelection, action.slot, action.id, state.vectors);
      return {
        ...state,
        basisCoordinateSelection: reconcileBasisCoordinateSelection({
          ...pair,
          targetId: state.basisCoordinateSelection.targetId,
        }, state.vectors),
      };
    }
    case 'set-coordinate-target':
      return state.vectors.some((vector) => vector.id === action.id && vector.visible)
        ? { ...state, basisCoordinateSelection: { ...state.basisCoordinateSelection, targetId: action.id } }
        : state;
    case 'toggle-combination':
      return { ...state, showCombination: !state.showCombination };
    case 'toggle-standard-basis':
      return { ...state, showStandardBasis: !state.showStandardBasis };
    case 'toggle-projection':
      return { ...state, showProjection: !state.showProjection };
    case 'toggle-basis-coordinates':
      return { ...state, showBasisCoordinates: !state.showBasisCoordinates };
    case 'load-example': {
      const example = EXAMPLE_SCENES[action.example];
      const vectors = makeDefaultVectors(example.vectors);
      const defaultPair = reconcilePairSelection({ firstId: null, secondId: null }, vectors);
      const basisCoordinateSelection = reconcileBasisCoordinateSelection({ firstId: null, secondId: null, targetId: null }, vectors, true);
      return {
        ...state,
        vectors,
        coefficients: { ...example.coefficients },
        combinationPair: defaultPair,
        projectionPair: defaultPair,
        basisCoordinateSelection,
        showCombination: example.showCombination,
        showStandardBasis: example.showStandardBasis,
        showProjection: example.showProjection ?? false,
        showBasisCoordinates: false,
      };
    }
    case 'set-theme':
      return { ...state, theme: action.theme };
    case 'reset': {
      const vectors = makeDefaultVectors();
      const defaultPair = reconcilePairSelection({ firstId: null, secondId: null }, vectors);
      const basisCoordinateSelection = reconcileBasisCoordinateSelection({ firstId: null, secondId: null, targetId: null }, vectors);
      return {
        ...state,
        vectors,
        coefficients: { a: 1, b: 1 },
        combinationPair: defaultPair,
        projectionPair: defaultPair,
        basisCoordinateSelection,
        showCombination: false,
        showStandardBasis: false,
        showProjection: false,
        showBasisCoordinates: false,
      };
    }
    default:
      return state;
  }
}

export function usePlaygroundState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    window.localStorage.setItem('lap-theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    const params = serializeSceneState(state);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [state]);

  const setVector = useCallback((id: string, value: Vector2) => dispatch({ type: 'set-vector', id, value }), []);
  const setCoefficient = useCallback((key: 'a' | 'b', value: number) => dispatch({ type: 'set-coefficient', key, value }), []);

  return {
    state,
    actions: {
      setVector,
      toggleVisible: (id: string) => dispatch({ type: 'toggle-visible', id }),
      toggleLocked: (id: string) => dispatch({ type: 'toggle-locked', id }),
      addVector: () => dispatch({ type: 'add-vector' }),
      removeVector: (id: string) => dispatch({ type: 'remove-vector', id }),
      setCoefficient,
      setCombinationVector: (slot: 'first' | 'second', id: string) => dispatch({ type: 'set-combination-vector', slot, id }),
      setProjectionVector: (slot: 'first' | 'second', id: string) => dispatch({ type: 'set-projection-vector', slot, id }),
      setCoordinateBasisVector: (slot: 'first' | 'second', id: string) => dispatch({ type: 'set-coordinate-basis-vector', slot, id }),
      setCoordinateTarget: (id: string) => dispatch({ type: 'set-coordinate-target', id }),
      toggleCombination: () => dispatch({ type: 'toggle-combination' }),
      toggleStandardBasis: () => dispatch({ type: 'toggle-standard-basis' }),
      toggleProjection: () => dispatch({ type: 'toggle-projection' }),
      toggleBasisCoordinates: () => dispatch({ type: 'toggle-basis-coordinates' }),
      loadExample: (example: ExampleName) => dispatch({ type: 'load-example', example }),
      setTheme: (theme: Theme) => dispatch({ type: 'set-theme', theme }),
      reset: () => dispatch({ type: 'reset' }),
    },
  };
}
