import { createBrowserRouter } from 'react-router-dom';

import { GuestRoute } from '@/core/routes/GuestRoute';
import { NutritionistOnboardingGuard } from '@/core/routes/NutritionistOnboardingGuard';
import { OnboardingGuard } from '@/core/routes/OnboardingGuard';
import { PatientOnboardingGuard } from '@/core/routes/PatientOnboardingGuard';
import { ProtectedRoute } from '@/core/routes/ProtectedRoute';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { OAuth2CallbackPage } from '@/features/auth/pages/OAuth2CallbackPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { SignUpPage } from '@/features/auth/pages/SignUpPage';
import { VerifyCodePage } from '@/features/auth/pages/VerifyCodePage';
import { HomePage } from '@/features/dashboard/pages/HomePage';
import { NutritionistAgendaPage } from '@/features/nutritionist/pages/NutritionistAgendaPage';
import { NutritionistAvailabilityPage } from '@/features/nutritionist/pages/NutritionistAvailabilityPage';
import { NutritionistDashboardPage } from '@/features/nutritionist/pages/NutritionistDashboardPage';
import { NutritionistGenerateQrPage } from '@/features/nutritionist/pages/NutritionistGenerateQrPage';
import { NutritionistPatientFilePage } from '@/features/nutritionist/pages/NutritionistPatientFilePage';
import { NutritionistPatientsPage } from '@/features/nutritionist/pages/NutritionistPatientsPage';
import { NutritionistProfilePage } from '@/features/nutritionist/pages/NutritionistProfilePage';
import { NutritionistReportsPage } from '@/features/nutritionist/pages/NutritionistReportsPage';
import { NutritionistOnboardingPage } from '@/features/onboarding/pages/NutritionistOnboardingPage';
import { PatientOnboardingPage } from '@/features/onboarding/pages/PatientOnboardingPage';
import { PatientAppointmentsPage } from '@/features/patient/pages/PatientAppointmentsPage';
import { PatientDashboardPage } from '@/features/patient/pages/PatientDashboardPage';
import { PatientHistoryPage } from '@/features/patient/pages/PatientHistoryPage';
import { PatientPlanPage } from '@/features/patient/pages/PatientPlanPage';
import { PatientProfilePage } from '@/features/patient/pages/PatientProfilePage';
import { PatientScanningPage } from '@/features/patient/pages/PatientScanningPage';
import { LogFoodPage } from '@/features/tracking/pages/LogFoodPage';
import { ErrorBoundaryPage } from '@/shared/components/ErrorBoundaryPage';
import { NotFoundPage } from '@/shared/components/NotFoundPage';

export const appRouter = createBrowserRouter([
  {
    errorElement: <ErrorBoundaryPage />,
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignUpPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/verify-code', element: <VerifyCodePage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    errorElement: <ErrorBoundaryPage />,
    element: <ProtectedRoute />,
    children: [{ path: '/', element: <HomePage /> }],
  },
  {
    errorElement: <ErrorBoundaryPage />,
    element: <ProtectedRoute allowedRoles={['PATIENT']} />,
    children: [
      {
        element: <PatientOnboardingGuard />,
        children: [
          { path: '/dashboard/patient', element: <PatientDashboardPage /> },
          { path: '/history/patient', element: <PatientHistoryPage /> },
          { path: '/appointments/patient', element: <PatientAppointmentsPage /> },
          { path: '/plan/patient', element: <PatientPlanPage /> },
          { path: '/profile', element: <PatientProfilePage /> },
          { path: '/profile/edit/patient', element: <PatientOnboardingPage mode="edit" /> },
          { path: '/tracking/log-food', element: <LogFoodPage /> },
          { path: '/scanning/patient', element: <PatientScanningPage /> },
        ],
      },
      {
        path: '/onboarding',
        element: <OnboardingGuard />,
        children: [{ path: '/onboarding/patient', element: <PatientOnboardingPage mode="create" /> }],
      },
    ],
  },
  {
    errorElement: <ErrorBoundaryPage />,
    element: <ProtectedRoute allowedRoles={['NUTRITIONIST']} />,
    children: [
      {
        element: <NutritionistOnboardingGuard />,
        children: [
          { path: '/dashboard/nutritionist', element: <NutritionistDashboardPage /> },
          { path: '/patients/nutritionist', element: <NutritionistPatientsPage /> },
          { path: '/qr/nutritionist', element: <NutritionistGenerateQrPage /> },
          { path: '/patients/nutritionist/:id', element: <NutritionistPatientFilePage /> },
          { path: '/agenda/nutritionist', element: <NutritionistAgendaPage /> },
          { path: '/agenda/nutritionist/availability', element: <NutritionistAvailabilityPage /> },
          { path: '/reports/nutritionist', element: <NutritionistReportsPage /> },
          { path: '/profile/nutritionist', element: <NutritionistProfilePage /> },
          { path: '/profile/nutritionist/edit', element: <NutritionistOnboardingPage mode="edit" /> },
        ],
      },
      {
        path: '/onboarding',
        element: <OnboardingGuard />,
        children: [
          { path: '/onboarding/nutritionist', element: <NutritionistOnboardingPage mode="create" /> },
        ],
      },
    ],
  },
  {
    path: '/oauth2/callback',
    element: <OAuth2CallbackPage />,
    errorElement: <ErrorBoundaryPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
