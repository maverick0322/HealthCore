import { createBrowserRouter } from "react-router-dom";
import { SamplePage } from "@/features/sample/pages/SamplePage";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <SamplePage />,
  },
]);
