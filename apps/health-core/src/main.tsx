import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from '@/core/routes/AppRouter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { applyTheme, useSettingsStore } from '@/core/store/useSettingsStore'
import { setupInterceptors } from '@/core/http/httpClient'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import '@/core/i18n'
import './index.css'

// Wire auth store into HTTP interceptors (breaks circular dependency)
setupInterceptors({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokensRefreshed: (tokens) => useAuthStore.getState().setTokens(tokens),
  onSessionExpired: () => useAuthStore.getState().clearSession(),
});

// Apply theme on load
applyTheme(useSettingsStore.getState().theme);

// If tokens survive a page refresh, re-fetch the user profile
if (useAuthStore.getState().isAuthenticated) {
  useAuthStore.getState().fetchCurrentUser();
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={appRouter} />
    </QueryClientProvider>
  </StrictMode>,
)
