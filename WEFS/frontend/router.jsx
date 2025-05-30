import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import NotFound from "./src/pages/NotFound";
import Home from "./src/pages/Home";
import ProductsPage from "./src/pages/ProductsPage";
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
        path: "products",
        element: <ProductsPage />,
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
        path: "products",
        element: <ProductsPage />,
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
