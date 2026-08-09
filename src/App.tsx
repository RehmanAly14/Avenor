import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import MissionControlPage from './pages/MissionControlPage'
import InvestigationWorkspacePage from './pages/InvestigationWorkspacePage'
import InvestigationHistoryPage from './pages/InvestigationHistoryPage'
import KnowledgeGraphPage from './pages/KnowledgeGraphPage'
import KnowledgeGraphProPage from './pages/KnowledgeGraphProPage'
import AssetIntelligencePage from './pages/AssetIntelligencePage'
import ImpactStudioPage from './pages/ImpactStudioPage'
import CodeStudioPage from './pages/CodeStudioPage'
import WorkspaceSettingsPage from './pages/WorkspaceSettingsPage'
import AppLayout from './layouts/AppLayout' // Note: Layout is in layouts/AppLayout.tsx

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Routes with Layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<MissionControlPage />} />
          
          {/* Investigations Routes */}
          <Route path="/investigations/workspace" element={<InvestigationWorkspacePage />} />
          <Route path="/investigations/history" element={<InvestigationHistoryPage />} />
          
          {/* Knowledge Graph Routes */}
          <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
          <Route path="/knowledge-graph/pro" element={<KnowledgeGraphProPage />} />
          
          {/* Other Routes */}
          <Route path="/assets" element={<AssetIntelligencePage />} />
          <Route path="/impact-studio" element={<ImpactStudioPage />} />
          <Route path="/code-studio" element={<CodeStudioPage />} />
          <Route path="/settings" element={<WorkspaceSettingsPage />} />
        </Route>

        {/* 404 - Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App