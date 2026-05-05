import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner Component
 *
 * Simple loading indicator spinner.
 * Used throughout the app for async operations.
 */
export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  );
};
