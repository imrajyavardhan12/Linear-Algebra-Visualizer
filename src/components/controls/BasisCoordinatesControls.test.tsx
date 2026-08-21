import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { evaluateBasisCoordinates } from '../../math';
import { BasisCoordinatesControls } from './BasisCoordinatesControls';

const options = [
  { id: 'u1', label: 'u₁' },
  { id: 'u2', label: 'u₂' },
  { id: 'u3', label: 'u₃' },
];

describe('BasisCoordinatesControls', () => {
  it('shows coordinates and reconstruction in an ordered basis', () => {
    render(
      <BasisCoordinatesControls
        evaluation={evaluateBasisCoordinates({ x: 2, y: 1 }, { x: -1, y: 2 }, { x: 5, y: 0 })}
        enabled
        options={options}
        firstId="u1"
        secondId="u2"
        targetId="u3"
        firstLabel="u₁"
        secondLabel="u₂"
        targetLabel="u₃"
        onPairChange={vi.fn()}
        onTargetChange={vi.fn()}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Change of basis' })).toBeInTheDocument();
    expect(screen.getByText((_content, element) => element?.classList.contains('basis-coordinate-formula') ?? false)).toHaveTextContent('[u₃]B = (2, -1)');
    expect(screen.getByText('u₃ = 2u₁ − u₂')).toBeInTheDocument();
  });

  it('preserves small determinants and marks rounded coordinates as approximate', () => {
    render(
      <BasisCoordinatesControls
        evaluation={evaluateBasisCoordinates({ x: 1, y: 0 }, { x: 0, y: 0.004 }, { x: 1, y: 0.004 / 3 })}
        enabled
        options={options}
        firstId="u1"
        secondId="u2"
        targetId="u3"
        firstLabel="u₁"
        secondLabel="u₂"
        targetLabel="u₃"
        onPairChange={vi.fn()}
        onTargetChange={vi.fn()}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText((_content, element) => element?.classList.contains('basis-coordinate-formula') ?? false)).toHaveTextContent('[u₃]B ≈ (1, 0.3333)');
    expect(screen.getByText('0.004')).toBeInTheDocument();
    expect(screen.getByText(/u₃ ≈ u₁ \+ 0.3333u₂/)).toBeInTheDocument();
  });

  it('explains why dependent directions cannot define coordinates', () => {
    render(
      <BasisCoordinatesControls
        evaluation={evaluateBasisCoordinates({ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 1 })}
        enabled
        options={options}
        firstId="u1"
        secondId="u2"
        targetId="u3"
        firstLabel="u₁"
        secondLabel="u₂"
        targetLabel="u₃"
        onPairChange={vi.fn()}
        onTargetChange={vi.fn()}
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText('These directions do not form a basis, so B-coordinates are undefined.')).toBeInTheDocument();
  });

  it('emits basis and target selections by stable ID', async () => {
    const user = userEvent.setup();
    const onPairChange = vi.fn();
    const onTargetChange = vi.fn();
    render(
      <BasisCoordinatesControls
        evaluation={evaluateBasisCoordinates({ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })}
        enabled={false}
        options={options}
        firstId="u1"
        secondId="u2"
        targetId="u3"
        firstLabel="u₁"
        secondLabel="u₂"
        targetLabel="u₃"
        onPairChange={onPairChange}
        onTargetChange={onTargetChange}
        onToggle={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'First basis vector' }), 'u2');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Vector to express in basis' }), 'u1');

    expect(onPairChange).toHaveBeenCalledWith('first', 'u2');
    expect(onTargetChange).toHaveBeenCalledWith('u1');
  });
});
