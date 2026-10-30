import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';
import AuthContext from '../context/AuthContext';
import { User, UserRole } from '../types/auth';

const createMockUser = (role: UserRole = 'CUSTOMER'): User => ({
  id: 'usr-12345',
  email: 'test@logiflows.test',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  role,
  is_active: true,
  created_at: new Date().toISOString(),
});

describe('ProtectedRoute and RoleGuard Suite', () => {
  describe('ProtectedRoute', () => {
    it('redirects unauthenticated users to /login with redirect query param', () => {
      const mockAuthValue = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshUser: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/profile']}>
            <Routes>
              <Route path="/login" element={<div>Login Page Target</div>} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <div>Secret Profile Area</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Login Page Target')).toBeInTheDocument();
      expect(screen.queryByText('Secret Profile Area')).not.toBeInTheDocument();
    });

    it('renders protected child component when user is authenticated', () => {
      const mockAuthValue = {
        user: createMockUser('CUSTOMER'),
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshUser: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/profile']}>
            <ProtectedRoute>
              <div>Secret Profile Area</div>
            </ProtectedRoute>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Secret Profile Area')).toBeInTheDocument();
    });
  });

  describe('RoleGuard', () => {
    it('allows access when user holds an allowed role', () => {
      const mockAuthValue = {
        user: createMockUser('ORGANIZATION_ADMIN'),
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshUser: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter>
            <RoleGuard allowedRoles={['ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER']}>
              <div>Admin Only Area</div>
            </RoleGuard>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Admin Only Area')).toBeInTheDocument();
    });

    it('allows access to PLATFORM_ADMIN unconditionally across any guarded view', () => {
      const mockAuthValue = {
        user: createMockUser('PLATFORM_ADMIN'),
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshUser: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter>
            <RoleGuard allowedRoles={['BRANCH_MANAGER']}>
              <div>Branch Manager Special View</div>
            </RoleGuard>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Branch Manager Special View')).toBeInTheDocument();
    });

    it('redirects to /unauthorized when user role is not permitted', () => {
      const mockAuthValue = {
        user: createMockUser('CUSTOMER'),
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshUser: vi.fn(),
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/manage']}>
            <Routes>
              <Route path="/unauthorized" element={<div>Access Denied 403</div>} />
              <Route
                path="/manage"
                element={
                  <RoleGuard allowedRoles={['ORGANIZATION_ADMIN']}>
                    <div>Org Admin Only</div>
                  </RoleGuard>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Access Denied 403')).toBeInTheDocument();
      expect(screen.queryByText('Org Admin Only')).not.toBeInTheDocument();
    });
  });
});
