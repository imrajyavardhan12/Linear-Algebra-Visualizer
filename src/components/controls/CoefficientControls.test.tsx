import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CoefficientControls } from './CoefficientControls';
import type { LinearCombinationEvaluation } from '../../math';

const evaluation: LinearCombinationEvaluation = {
  coefficients: { a: 2, b: -1 },
  firstScaled: { x: 4, y: 2 },
  secondScaled: { x: 1, y: -2 },
  result: { x: 5, y: 0 },
};

describe('CoefficientControls', () => {
  it('shows the worked combination when the construction is enabled', () => {
    render(<CoefficientControls coefficients={{ a: 2, b: -1 }} evaluation={evaluation} enabled onToggle={vi.fn()} onChange={vi.fn()} />);

    const equation = screen.getByText((_content, element) => element?.classList.contains('combination-equation') ?? false);
    expect(equation).toHaveTextContent('w = 2u₁ − u₂ = (5, 0)');
    expect(screen.getByText('2u₁ = (4, 2)')).toBeInTheDocument();
    expect(screen.getByText('−u₂ = (1, -2)')).toBeInTheDocument();
  });

  it('emits coefficient changes from both the slider and exact input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CoefficientControls coefficients={{ a: 1, b: 1 }} evaluation={{ ...evaluation, coefficients: { a: 1, b: 1 } }} enabled={false} onToggle={vi.fn()} onChange={onChange} />);

    const exactInput = screen.getByRole('spinbutton', { name: 'a exact value' });
    await user.clear(exactInput);
    await user.type(exactInput, '-0.5');
    fireEvent.change(screen.getByRole('slider', { name: 'Coefficient b' }), { target: { value: '1.5' } });

    expect(onChange).toHaveBeenCalledWith('a', -0.5);
    expect(onChange).toHaveBeenCalledWith('b', expect.any(Number));
  });
});
