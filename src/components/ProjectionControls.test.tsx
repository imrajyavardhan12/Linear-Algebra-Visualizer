import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { evaluateProjection } from '../math';
import { ProjectionControls } from './ProjectionControls';

describe('ProjectionControls', () => {
  it('explains an orthogonal pair and its zero projection', () => {
    render(
      <ProjectionControls
        evaluation={evaluateProjection({ x: 1, y: 0 }, { x: 0, y: 1 })}
        enabled
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText('u₁ · u₂')).toBeInTheDocument();
    expect(screen.getByText('Orthogonal')).toBeInTheDocument();
    expect(screen.getByText('90°')).toBeInTheDocument();
    expect(screen.getByText('Projection of u₁ onto u₂')).toBeInTheDocument();
    expect(screen.getByText('(0, 0)')).toBeInTheDocument();
  });

  it('lets the user choose a directional source and target', async () => {
    const user = userEvent.setup();
    const onPairChange = vi.fn();
    render(
      <ProjectionControls
        evaluation={evaluateProjection({ x: 1, y: 0 }, { x: 0, y: 1 })}
        enabled
        pairOptions={[
          { id: 'u1', label: 'u₁' },
          { id: 'u2', label: 'u₂' },
          { id: 'u3', label: 'u₃' },
        ]}
        sourceId="u1"
        ontoId="u2"
        onPairChange={onPairChange}
        onToggle={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Projection target' }), 'u3');

    expect(onPairChange).toHaveBeenCalledWith('second', 'u3');
  });

  it('explains when the target has no direction', () => {
    render(
      <ProjectionControls
        evaluation={evaluateProjection({ x: 1, y: 2 }, { x: 0, y: 0 })}
        enabled
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByText('Projection needs a non-zero target direction.')).toBeInTheDocument();
    expect(screen.getByText('Angle undefined')).toBeInTheDocument();
  });
});
