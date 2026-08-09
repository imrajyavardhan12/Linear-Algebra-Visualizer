import { useCallback, useEffect, useReducer } from 'react';
import { clamp } from '../math';
import type { Vector2 } from '../math';

export type Theme = 'dark' | 'light';

export interface VectorItem {
  id: string;
  label: string;
  value: Vector2;
  visible: boolean;
  locked: boolean;
}

export interface PlaygroundState {
  vectors: VectorItem[];
  coefficients: { a: number; b: number };
  showCombination: boolean;
  showStandardBasis: boolean;
  theme: Theme;
}

type Action =
  | { type: 'set-vector'; id: string; value: Vector2 }
  | { type: 'toggle-visible'; id: string }
  | { type: 'toggle-locked'; id: string }
  | { type: 'add-vector' }
  | { type: 'remove-vector'; id: string }
  | { type: 'set-coefficient'; key: 'a' | 'b'; value: number }
  | { type: 'toggle-combination' }
  | { type: 'toggle-standard-basis' }
  | { type: 'set-theme'; theme: Theme }
  | { type: 'reset' };

const MAX_COORDINATE = 12;
const LABELS = ['u₁', 'u₂', 'u₃'];
const IDS = ['u1', 'u2', 'u3'];

export const DEFAULT_VECTOR_VALUES: Vector2[] = [
  { x: 2, y: 1 },
  { x: -1, y: 2 },
];

function makeVector(index: number, value: Vector2): VectorItem {
  return {
    id: IDS[index] ?? `u${index + 1}`,
    label: LABELS[index] ?? `u${index + 1}`,
    value: { x: value.x, y: value.y },
    visible: true,
    locked: false,
  };
}

function makeDefaultVectors(values = DEFAULT_VECTOR_VALUES): VectorItem[] {
  return values.map((value, index) => makeVector(index, value));
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

function initialVectorsFromUrl(): VectorItem[] {
  if (typeof window === 'undefined') return makeDefaultVectors();
  const params = new URLSearchParams(window.location.search);
  const values: Vector2[] = [];
  for (const id of IDS) {
    const parsed = parseVector(params.get(id));
    if (!parsed) break;
    values.push(parsed);
  }
  return values.length > 0 ? makeDefaultVectors(values) : makeDefaultVectors();
}

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('lap-theme');
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

const initialState: PlaygroundState = {
  vectors: initialVectorsFromUrl(),
  coefficients: { a: 1, b: 1 },
  showCombination: false,
  showStandardBasis: false,
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
    case 'toggle-visible':
      return {
        ...state,
        vectors: state.vectors.map((vector) => vector.id === action.id
          ? { ...vector, visible: !vector.visible }
          : vector),
      };
    case 'toggle-locked':
      return {
        ...state,
        vectors: state.vectors.map((vector) => vector.id === action.id
          ? { ...vector, locked: !vector.locked }
          : vector),
      };
    case 'add-vector': {
      if (state.vectors.length >= 3) return state;
      const nextIndex = IDS.findIndex((id) => !state.vectors.some((vector) => vector.id === id));
      const index = nextIndex >= 0 ? nextIndex : state.vectors.length;
      const defaults: Vector2[] = [{ x: 1, y: 1 }, { x: 2, y: -1 }, { x: -1, y: 1 }];
      return { ...state, vectors: [...state.vectors, makeVector(index, defaults[index] ?? { x: 1, y: 1 })] };
    }
    case 'remove-vector':
      return { ...state, vectors: state.vectors.filter((vector) => vector.id !== action.id) };
    case 'set-coefficient':
      return {
        ...state,
        coefficients: { ...state.coefficients, [action.key]: Number.isFinite(action.value) ? clamp(action.value, -5, 5) : 0 },
      };
    case 'toggle-combination':
      return { ...state, showCombination: !state.showCombination };
    case 'toggle-standard-basis':
      return { ...state, showStandardBasis: !state.showStandardBasis };
    case 'set-theme':
      return { ...state, theme: action.theme };
    case 'reset':
      return { ...state, vectors: makeDefaultVectors(), coefficients: { a: 1, b: 1 }, showCombination: false };
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
    const params = new URLSearchParams(window.location.search);
    state.vectors.forEach((vector) => params.set(vector.id, `${vector.value.x},${vector.value.y}`));
    IDS.filter((id) => !state.vectors.some((vector) => vector.id === id)).forEach((id) => params.delete(id));
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [state.vectors]);

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
      toggleCombination: () => dispatch({ type: 'toggle-combination' }),
      toggleStandardBasis: () => dispatch({ type: 'toggle-standard-basis' }),
      setTheme: (theme: Theme) => dispatch({ type: 'set-theme', theme }),
      reset: () => dispatch({ type: 'reset' }),
    },
  };
}
