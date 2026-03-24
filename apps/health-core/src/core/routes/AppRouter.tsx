import { createBrowserRouter } from "react-router-dom";
import { SamplePage } from "@/features/sample/pages/SamplePage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SignUpPage } from "@/features/auth/pages/SignUpPage";

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
]);
