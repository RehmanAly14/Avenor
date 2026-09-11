import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ROUTES } from "./constants/routes";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import InvestigationsPage from "./pages/InvestigationsPage";
import NewInvestigationPage from "./pages/NewInvestigationPage";
import InvestigationDetailPage from "./pages/InvestigationDetailPage";
import MetadataPage from "./pages/MetadataPage";
import MetadataAssetDetailPage from "./pages/MetadataAssetDetailPage";
import DataSourcesPage from "./pages/DataSourcesPage";
import ProjectsPage from "./pages/ProjectsPage";
import WorkspacesPage from "./pages/WorkspacesPage";
import GitHubPage from "./pages/GitHubPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.landing} element={<LandingPage />} />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.investigations} element={<InvestigationsPage />} />
          <Route path={ROUTES.newInvestigation} element={<NewInvestigationPage />} />
          <Route path="/investigations/:id" element={<InvestigationDetailPage />} />
          <Route path={ROUTES.metadata} element={<MetadataPage />} />
          <Route path="/metadata/:id" element={<MetadataAssetDetailPage />} />
          <Route path={ROUTES.dataSources} element={<DataSourcesPage />} />
          <Route path={ROUTES.projects} element={<ProjectsPage />} />
          <Route path={ROUTES.workspaces} element={<WorkspacesPage />} />
          <Route path={ROUTES.github} element={<GitHubPage />} />
          <Route path={ROUTES.settings} element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
