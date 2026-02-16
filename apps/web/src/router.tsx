import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Overview } from "./pages/client/Overview";
import { Instance } from "./pages/client/Instance";
import { Channels } from "./pages/client/Channels";
import { AISettings } from "./pages/client/AISettings";
import { Skills } from "./pages/client/Skills";
import { Analytics } from "./pages/client/Analytics";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminInstances } from "./pages/admin/Instances";
import { SSOCallback } from "./pages/auth/SSOCallback";

export const router = createBrowserRouter([
  {
    path: "/auth/sso",
    element: <SSOCallback />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      // Client routes
      { index: true, element: <Overview /> },
      { path: "instance", element: <Instance /> },
      { path: "channels", element: <Channels /> },
      { path: "ai-settings", element: <AISettings /> },
      { path: "skills", element: <Skills /> },
      { path: "analytics", element: <Analytics /> },

      // Admin routes
      { path: "admin", element: <AdminDashboard /> },
      { path: "admin/instances", element: <AdminInstances /> },
    ],
  },
]);