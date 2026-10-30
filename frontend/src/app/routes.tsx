import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AppShellLayout from '../layouts/AppShellLayout';
import LandingPage from '../pages/LandingPage';
import StatusPage from '../pages/StatusPage';
import ArchitecturePage from '../pages/ArchitecturePage';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* App Shell Pages */}
      <Route path="/app" element={<AppShellLayout />}>
        <Route index element={<StatusPage />} />
        <Route path="status" element={<StatusPage />} />
        <Route path="architecture" element={<ArchitecturePage />} />
      </Route>

      {/* Legacy/Direct Shortcut Route */}
      <Route path="/status" element={<AppShellLayout />}>
        <Route index element={<StatusPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
