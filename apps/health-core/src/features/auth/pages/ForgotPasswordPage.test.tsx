import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ForgotPasswordPage } from './ForgotPasswordPage';

describe('ForgotPasswordPage', () => {
  it('renders the heading', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  it('renders the email input', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders the send instructions button', () => {
    render(<ForgotPasswordPage />);

    const button = screen.getByRole('button', { name: /send instructions/i });
    expect(button).toBeInTheDocument();
  });

  it('renders back to login link', () => {
    render(<ForgotPasswordPage />);

    const link = screen.getByRole('link', { name: /back to log in/i });
    expect(link).toHaveAttribute('href', '/login');
  });
});
