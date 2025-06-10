import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import NotFound from "./src/pages/NotFound";
import Home from "./src/pages/Home";
import BundlesPage from "./src/pages/BundlesPage";
import AnalyticsPage from "./src/pages/AnalyticsPage";
import CreateBundlePage from "./src/pages/CreateBundlePage";
import ViewBundlePage from "./src/pages/ViewBundlePage";

const router = createBrowserRouter([
  {
    path: "/company/:company_id/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "bundles",
        element: <BundlesPage />,
      },
      {
        path: "bundles/create",
        element: <CreateBundlePage />,
      },
      {
        path: "bundles/:bundle_id",
        element: <ViewBundlePage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
    ],
  },
  {
    path: "/company/:company_id/application/:application_id",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "bundles",
        element: <BundlesPage />,
      },
      {
        path: "bundles/create",
        element: <CreateBundlePage />,
      },
      {
        path: "bundles/:bundle_id",
        element: <ViewBundlePage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
    ],
  },
  {
    path: "/*",
    element: <NotFound />,
  },
]);

export default router;

// import { createBrowserRouter } from "react-router-dom";
// import App from "./App";
// import NotFound from "./src/pages/NotFound";

// const router = createBrowserRouter([
//   {
//     path: "/company/:company_id/",
//     element: <App />,
//   },
//   {
//     path: "/company/:company_id/application/:application_id",
//     element: <App />,
//   },
//   {
//     path: "/*", // Fallback route for all unmatched paths
//     element: <NotFound />, // Component to render for unmatched paths
//   },
// ]);

// export default router;
