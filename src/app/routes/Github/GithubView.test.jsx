// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import '@/i18n/index.js';
import { externalLinks } from '@/config/externalLinks.js';
import { GithubView } from './GithubView.jsx';

afterEach(cleanup);

describe('GithubView external repository link', () => {
  it('adopts the intermediate route with one configured external destination', () => {
    render(<GithubView />);

    expect(screen.getByRole('heading', { name: 'GitHub' })).toBeInTheDocument();
    const repositoryLink = screen.getByRole('link', { name: 'Open repository' });

    expect(repositoryLink).toHaveAttribute('href', externalLinks.repository);
    expect(repositoryLink).toHaveAttribute('target', '_blank');
    expect(repositoryLink).toHaveAttribute('rel', 'noreferrer');
    expect(repositoryLink).toHaveClass('min-w-11');
  });
});
