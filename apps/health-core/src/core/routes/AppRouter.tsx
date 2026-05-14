import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "@/core/routes/ProtectedRoute";
import { GuestRoute } from "@/core/routes/GuestRoute";
import { OnboardingGuard } from "@/core/routes/OnboardingGuard";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SignUpPage } from "@/features/auth/pages/SignUpPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { VerifyCodePage } from "@/features/auth/pages/VerifyCodePage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { OAuth2CallbackPage } from "@/features/auth/pages/OAuth2CallbackPage";
import { PatientOnboardingPage } from "@/features/onboarding/pages/PatientOnboardingPage";
import { HomePage } from "@/features/dashboard/pages/HomePage";
import { PatientDashboardPage } from "@/features/patient/pages/PatientDashboardPage";
import { PatientHistoryPage } from "@/features/patient/pages/PatientHistoryPage";
import { PatientAppointmentsPage } from "@/features/patient/pages/PatientAppointmentsPage";
import { PatientPlanPage } from "@/features/patient/pages/PatientPlanPage";
import { PatientProfilePage } from "@/features/patient/pages/PatientProfilePage";
import { NutritionistDashboardPage } from "@/features/nutritionist/pages/NutritionistDashboardPage";
import { NutritionistPatientsPage } from "@/features/nutritionist/pages/NutritionistPatientsPage";
import { NutritionistPatientFilePage } from "@/features/nutritionist/pages/NutritionistPatientFilePage";
import { NutritionistAgendaPage } from "@/features/nutritionist/pages/NutritionistAgendaPage";
import { NutritionistReportsPage } from "@/features/nutritionist/pages/NutritionistReportsPage";
import { NutritionistAvailabilityPage } from "@/features/nutritionist/pages/NutritionistAvailabilityPage";
import { NutritionistProfilePage } from "@/features/nutritionist/pages/NutritionistProfilePage";
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage";
import { NotFoundPage } from "@/shared/components/NotFoundPage";
import { ErrorBoundaryPage } from "@/shared/components/ErrorBoundaryPage";
import { LogFoodPage } from "@/features/tracking/pages/LogFoodPage";
import { LandingPage } from "@/features/marketing/pages/LandingPage";
import { DemoPage } from "@/features/marketing/pages/DemoPage";
import { TermsPage } from "@/features/marketing/pages/TermsPage";
import { PrivacyPage } from "@/features/marketing/pages/PrivacyPage";
import { TourPage } from "@/features/marketing/pages/TourPage";
import { PatientOnboardingGuard } from "@/core/routes/PatientOnboardingGuard";
import { NutritionistOnboardingGuard } from "@/core/routes/NutritionistOnboardingGuard";
import { PatientScanningPage } from "@/features/patient/pages/PatientScanningPage";
import { NutritionistOnboardingPage } from "@/features/onboarding/pages/NutritionistOnboardingPage";
import {NutritionistGenerateQrPage} from "@/features/nutritionist/pages/NutritionistGenerateQrPage";

export const appRouter = createBrowserRouter([
  // ── Public marketing routes ──
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <ErrorBoundaryPage />,
  },
  {
    path: "/demo",
    element: <DemoPage />,
    errorElement: <ErrorBoundaryPage />,
  },
  {
    path: "/terms",
    element: <TermsPage />,
    errorElement: <ErrorBoundaryPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
    errorElement: <ErrorBoundaryPage />,
  },
  {
    path: "/tour",
    element: <TourPage />,
    errorElement: <ErrorBoundaryPage />,
  },
  // ── Guest-only routes (redirect to /home if already authenticated) ──
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
        path: "/home",
      },
      {
        path: "/dashboard/patient",
        element: <PatientDashboardPage />,
      },
      {
        path: "/history/patient",
        element: <PatientHistoryPage />,
      },
      {
        path: "/appointments/patient",
        element: <PatientAppointmentsPage />,
      },
      {
        path: "/plan/patient",
        element: <PatientPlanPage />,
      },
      {
        path: "/onboarding",
        element: <OnboardingGuard />,
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
        children: [
          { path: '/onboarding/patient', element: <PatientOnboardingPage mode="create" /> },
        ],
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
    errorElement: <ErrorBoundaryPage />,
    element: <ProtectedRoute allowedRoles={['ADMIN']} />,
    children: [{ path: '/dashboard/admin', element: <AdminDashboardPage /> }],
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