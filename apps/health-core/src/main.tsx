import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from '@/core/routes/AppRouter'
import { applyTheme, useSettingsStore } from '@/core/store/useSettingsStore'
import '@/core/i18n'
import './index.css'

// Apply theme on load
applyTheme(useSettingsStore.getState().theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={appRouter} />
  </StrictMode>,
)
