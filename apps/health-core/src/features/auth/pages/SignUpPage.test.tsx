import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { SignUpPage } from './SignUpPage';

describe('SignUpPage', () => {
  it('renders email, password, and confirm password fields', () => {
    render(<SignUpPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Password and confirm password labels
    const passwordLabels = screen.getAllByLabelText(/password/i);
    expect(passwordLabels.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the create account button', () => {
    render(<SignUpPage />);

    const button = screen.getByRole('button', { name: /create account/i });
    expect(button).toBeInTheDocument();
  });

  it('renders the login link', () => {
    render(<SignUpPage />);

    const link = screen.getByRole('link', { name: /log in/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('renders the terms checkbox', () => {
    render(<SignUpPage />);

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders the role toggle', () => {
    render(<SignUpPage />);

    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('Nutritionist')).toBeInTheDocument();
  });
});
