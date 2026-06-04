import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  readonly message?: string | null;
  readonly id?: string;
}

/**
 * Renders an inline validation error below a form field.
 * Returns null when `message` is falsy — safe to render unconditionally.
 */
export const FieldError = ({ message, id }: Readonly<FieldErrorProps>) => {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className="flex items-center gap-1.5 text-xs text-destructive mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <AlertCircle size={12} className="shrink-0" />
      {message}
    </p>
  );
};
