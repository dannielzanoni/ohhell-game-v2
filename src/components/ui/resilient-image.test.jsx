// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ResilientImage } from './resilient-image.jsx';

afterEach(cleanup);

describe('ResilientImage', () => {
  it('replaces a failed asset with an accessible visual fallback', () => {
    render(<ResilientImage src="/missing.png" alt="Game card" className="size-20" />);
    fireEvent.error(screen.getByRole('img', { name: 'Game card' }));
    const fallback = screen.getByRole('img', { name: 'Game card' });
    expect(fallback.tagName).toBe('SPAN');
    expect(fallback).toHaveClass('size-20');
  });
});
