import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { serializeSceneState, usePlaygroundState, type PlaygroundState } from './usePlaygroundState';

const state: Pick<PlaygroundState, 'vectors' | 'coefficients' | 'combinationPair' | 'projectionPair' | 'showCombination' | 'showStandardBasis' | 'showProjection'> = {
  vectors: [
    { id: 'u2', label: 'u₂', value: { x: -1, y: 2 }, visible: true, locked: false },
    { id: 'u3', label: 'u₃', value: { x: 3, y: -4 }, visible: false, locked: true },
  ],
  coefficients: { a: 2.5, b: -1 },
  combinationPair: { firstId: 'u2', secondId: 'u3' },
  projectionPair: { firstId: 'u3', secondId: 'u2' },
  showCombination: true,
  showStandardBasis: true,
  showProjection: true,
};

describe('scene share state', () => {
  it('serializes the complete reproducible scene without theme preference', () => {
    const params = serializeSceneState(state);

    expect(params.get('scene')).toBe('1');
    expect(params.get('ids')).toBe('u2,u3');
    expect(params.get('u2')).toBe('-1,2');
    expect(params.get('u3')).toBe('3,-4');
    expect(params.get('a')).toBe('2.5');
    expect(params.get('b')).toBe('-1');
    expect(params.get('comboPair')).toBe('u2,u3');
    expect(params.get('projectionPair')).toBe('u3,u2');
    expect(params.get('combo')).toBe('1');
    expect(params.get('basis')).toBe('1');
    expect(params.get('projection')).toBe('1');
    expect(params.get('hidden')).toBe('u3');
    expect(params.get('locked')).toBe('u3');
    expect(params.has('theme')).toBe(false);
  });

  it('keeps explicit pair identities stable when unrelated vectors change', () => {
    const { result } = renderHook(() => usePlaygroundState());

    act(() => {
      result.current.actions.addVector();
      result.current.actions.setCombinationVector('first', 'u3');
      result.current.actions.setProjectionVector('second', 'u3');
    });

    expect(result.current.state.combinationPair).toEqual({ firstId: 'u3', secondId: 'u2' });
    expect(result.current.state.projectionPair).toEqual({ firstId: 'u1', secondId: 'u3' });

    act(() => result.current.actions.removeVector('u1'));

    expect(result.current.state.combinationPair).toEqual({ firstId: 'u3', secondId: 'u2' });
    expect(result.current.state.projectionPair).toEqual({ firstId: 'u2', secondId: 'u3' });
  });
});
