import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusPanel } from './StatusPanel';
import { analyzeVectorSet } from '../math';

describe('StatusPanel', () => {
  it('explains an independent pair as a basis of R²', () => {
    const vectors = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
    render(<StatusPanel vectors={vectors} names={['u₁', 'u₂']} analysis={analyzeVectorSet(vectors)} />);
    expect(screen.getByRole('heading', { name: 'Linearly independent' })).toBeInTheDocument();
    expect(screen.getByText('This is a basis of R²')).toBeInTheDocument();
    expect(screen.getByText('R²')).toBeInTheDocument();
  });

  it('names a scalar multiple for a dependent pair', () => {
    const vectors = [{ x: 1, y: 2 }, { x: 2, y: 4 }];
    render(<StatusPanel vectors={vectors} names={['u₁', 'u₂']} analysis={analyzeVectorSet(vectors)} />);
    expect(screen.getByText('Linearly dependent')).toBeInTheDocument();
    expect(screen.getByText(/u₂ = 2u₁/)).toBeInTheDocument();
    expect(screen.getByText('Line')).toBeInTheDocument();
  });
});
