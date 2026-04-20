import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('renders 404 heading', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders translated title', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('renders translated subtitle', () => {
    render(<NotFoundPage />);
    expect(
      screen.getByText("The page you're looking for doesn't exist or has been moved."),
    ).toBeInTheDocument();
  });

  it('renders a back-to-home link', () => {
    render(<NotFoundPage />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/login');
  });
});
