// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CommandErrorBanner } from './GameView.jsx';

describe('CommandErrorBanner', () => {
  it('is announced without intercepting essential mobile controls', () => {
    render(<CommandErrorBanner message="It is not your turn yet." />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-placement', 'non-blocking-mobile');
    expect(alert).toHaveClass('pointer-events-none', 'right-3');
  });
});
