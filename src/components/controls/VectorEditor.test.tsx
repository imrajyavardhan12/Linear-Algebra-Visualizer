import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VectorEditor } from './VectorEditor';
import type { VectorItem } from '../../state/usePlaygroundState';

const vectors: VectorItem[] = [
  { id: 'u1', label: 'u₁', value: { x: 1, y: 2 }, visible: true, locked: false },
  { id: 'u2', label: 'u₂', value: { x: 2, y: 4 }, visible: true, locked: false },
];

describe('VectorEditor', () => {
  it('sends numeric coordinate edits to the state owner', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VectorEditor vectors={vectors} onChange={onChange} onToggleVisible={vi.fn()} onToggleLocked={vi.fn()} onAdd={vi.fn()} onRemove={vi.fn()} />);

    const xInput = screen.getByRole('spinbutton', { name: 'u₁ x coordinate' });
    await user.clear(xInput);
    await user.type(xInput, '3.5');

    expect(onChange).toHaveBeenLastCalledWith('u1', { x: 3.5, y: 2 });
  });

  it('exposes visibility, locking, add, and remove controls', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onToggleLocked = vi.fn();
    render(<VectorEditor vectors={vectors} onChange={vi.fn()} onToggleVisible={vi.fn()} onToggleLocked={onToggleLocked} onAdd={onAdd} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: 'Add a vector' }));
    await user.click(screen.getByRole('button', { name: 'Lock u₁' }));
    await user.click(screen.getByRole('button', { name: 'Remove u₂' }));
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onToggleLocked).toHaveBeenCalledWith('u1');
    expect(onRemove).toHaveBeenCalledWith('u2');
  });
});
