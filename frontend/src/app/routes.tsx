import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AppShell from '../components/layout/AppShell';
import LandingPage from '../pages/LandingPage';
import StatusPage from '../pages/StatusPage';
import DesignSystemPage from '../pages/DesignSystemPage';
import ArchitecturePage from '../pages/ArchitecturePage';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Shell */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Primary Routes Wrapped with AppShell */}
      <Route
        path="/status"
        element={
          <AppShell>
            <StatusPage />
          </AppShell>
        }
      />

      <Route
        path="/design-system"
        element={
          <AppShell>
            <DesignSystemPage />
          </AppShell>
        }
      />

      {/* App Namespace Shortcuts */}
      <Route
        path="/app/status"
        element={
          <AppShell>
            <StatusPage />
          </AppShell>
        }
      />

      <Route
        path="/app/architecture"
        element={
          <AppShell>
            <ArchitecturePage />
          </AppShell>
        }
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
