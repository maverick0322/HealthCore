import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "@/core/routes/ProtectedRoute";
import { GuestRoute } from "@/core/routes/GuestRoute";
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
import { NotFoundPage } from "@/shared/components/NotFoundPage";
import { ErrorBoundaryPage } from "@/shared/components/ErrorBoundaryPage";

export const appRouter = createBrowserRouter([
  // ── Guest-only routes (redirect to / if already authenticated) ──
  {
    errorElement: <ErrorBoundaryPage />,
    element: <GuestRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/signup",
        element: <SignUpPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/verify-code",
        element: <VerifyCodePage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
  // ── Protected routes (redirect to /login if not authenticated) ──
  {
    errorElement: <ErrorBoundaryPage />,
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <HomePage />,
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
        path: "/onboarding/patient",
        element: <PatientOnboardingPage />,
      },
      // ── NUTRITIONIST ROUTES ──
      {
        path: "/dashboard/nutritionist",
        element: <NutritionistDashboardPage />,
      },
      {
        path: "/patients/nutritionist",
        element: <NutritionistPatientsPage />,
      },
      {
        path: "/patients/nutritionist/:id",
        element: <NutritionistPatientFilePage />,
      },
      {
        path: "/profile",
        element: <PatientProfilePage />,
      },
    ],
  },
  // ── OAuth2 callback (outside guards — user arrives mid-auth flow) ──
  {
    path: "/oauth2/callback",
    element: <OAuth2CallbackPage />,
    errorElement: <ErrorBoundaryPage />,
  },
  // ── Catch-all 404 ──
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
