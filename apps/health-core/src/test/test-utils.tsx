import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/core/i18n';

// Force English in test environment for deterministic assertions
i18n.changeLanguage('en');

/**
 * Custom render that wraps components with the providers they need:
 * - MemoryRouter (for react-router hooks)
 * - I18nextProvider (for translation hooks)
 *
 * Pass `initialEntries` via wrapper options to control route state.
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

export const renderWithProviders = (
  ui: ReactElement,
  { initialEntries = ['/'], ...options }: CustomRenderOptions = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </I18nextProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

export * from '@testing-library/react';
export { renderWithProviders as render };
