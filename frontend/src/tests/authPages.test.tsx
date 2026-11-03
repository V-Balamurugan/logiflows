import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ActivationPage from '../pages/auth/ActivationPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import AuthContext from '../context/AuthContext';
import * as authApi from '../api/auth';

describe('Auth Pages Component Suite', () => {
  const mockAuthContext = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LoginPage', () => {
    it('renders login form inputs and brand header', () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByRole('heading', { name: /sign in to logiflows/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    });

    it('submits valid credentials through login context', async () => {
      mockAuthContext.login.mockResolvedValueOnce({
        id: '123',
        email: 'test@example.com',
        full_name: 'Test',
        role: 'CUSTOMER',
      } as any);

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(mockAuthContext.login).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'Password123!',
        });
      });
    });

    it('displays server error alert when authentication fails', async () => {
      mockAuthContext.login.mockRejectedValueOnce({
        response: {
          data: {
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password.',
            },
          },
        },
      });

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'wrong@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'WrongPassword123!' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
      });
    });
  });

  describe('RegisterPage', () => {
    it('renders customer registration form fields', () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <MemoryRouter>
            <RegisterPage />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByRole('heading', { name: /create customer account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('renders confirmation card upon successful customer registration', async () => {
      mockAuthContext.register.mockResolvedValueOnce({
        message: 'Registration successful',
        email: 'registered@example.com',
      });

      render(
        <AuthContext.Provider value={mockAuthContext}>
          <MemoryRouter>
            <RegisterPage />
          </MemoryRouter>
        </AuthContext.Provider>
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'registered@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'StrongPass2026!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'StrongPass2026!' },
      });
      fireEvent.click(screen.getByRole('button', { name: /register account/i }));

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
        expect(screen.getByText('registered@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('ActivationPage', () => {
    it('activates account and displays success card when token is valid', async () => {
      vi.spyOn(authApi, 'activateApi').mockResolvedValueOnce({
        message: 'Account activated successfully!',
        email: 'activated@example.com',
      });

      render(
        <MemoryRouter initialEntries={['/activate?token=valid-test-token']}>
          <ActivationPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Account Activated!')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /proceed to sign in/i })).toBeInTheDocument();
      });
    });

    it('displays error card when token is invalid or expired', async () => {
      vi.spyOn(authApi, 'activateApi').mockRejectedValueOnce({
        response: {
          data: {
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'This link has expired.',
            },
          },
        },
      });

      render(
        <MemoryRouter initialEntries={['/activate?token=expired-token']}>
          <ActivationPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Activation Failed')).toBeInTheDocument();
        expect(screen.getByText('This link has expired.')).toBeInTheDocument();
      });
    });
  });

  describe('ForgotPasswordPage and ResetPasswordPage', () => {
    it('renders forgot password request form', () => {
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      );
      expect(screen.getByText('Forgot Your Password?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('renders reset password confirmation form', () => {
      render(
        <MemoryRouter initialEntries={['/reset-password?token=sample-reset-token']}>
          <ResetPasswordPage />
        </MemoryRouter>
      );
      expect(screen.getByText('Set New Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });
  });
});
