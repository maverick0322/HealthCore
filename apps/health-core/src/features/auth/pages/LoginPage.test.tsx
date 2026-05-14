import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders the login button', () => {
    render(<LoginPage />);

    const button = screen.getByRole('button', { name: /log in/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders the forgot password link', () => {
    render(<LoginPage />);

    const link = screen.getByRole('link', { name: /forgot/i });
    expect(link).toHaveAttribute('href', '/forgot-password');
  });

  it('renders the signup link', () => {
    render(<LoginPage />);

    const link = screen.getByRole('link', { name: /sign up now/i });
    expect(link).toHaveAttribute('href', '/signup');
  });

  it('renders the social login button', () => {
    render(<LoginPage />);

    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
  });

  it('renders the patient/nutritionist role toggle', () => {
    render(<LoginPage />);

    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('Nutritionist')).toBeInTheDocument();
  });
});
