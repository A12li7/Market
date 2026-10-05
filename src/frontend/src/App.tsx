import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { AnalysisSchoolsPage } from "./pages/AnalysisSchoolsPage";
import { ChartAnalysisPage } from "./pages/ChartAnalysisPage";
import { HistoryPage } from "./pages/HistoryPage";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const chartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ChartAnalysisPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});

const schoolsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schools",
  component: AnalysisSchoolsPage,
});

const routeTree = rootRoute.addChildren([
  chartRoute,
  historyRoute,
  schoolsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
