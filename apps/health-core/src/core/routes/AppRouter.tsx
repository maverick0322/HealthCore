import { createBrowserRouter } from "react-router-dom";
import { SamplePage } from "@/features/sample/pages/SamplePage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SignUpPage } from "@/features/auth/pages/SignUpPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { VerifyCodePage } from "@/features/auth/pages/VerifyCodePage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <SamplePage />,
  },
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
]);
