import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  passwordChangeSchema,
  passwordResetConfirmSchema,
  profileUpdateSchema,
} from '../lib/validations/auth';

describe('Authentication Validation Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'ValidPassword123!',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email formats', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'ValidPassword123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('valid email');
      }
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates strong password with matching confirmation', () => {
      const result = registerSchema.safeParse({
        email: 'customer@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        password: 'StrongPass123!',
        confirm_password: 'StrongPass123!',
      });
      expect(result.success).toBe(true);
    });

    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        email: 'customer@example.com',
        password: 'StrongPass123!',
        confirm_password: 'DifferentPass123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Passwords do not match');
      }
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'customer@example.com',
        password: 'Pass1!',
        confirm_password: 'Pass1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 8 characters');
      }
    });

    it('rejects passwords without special symbols', () => {
      const result = registerSchema.safeParse({
        email: 'customer@example.com',
        password: 'Password123',
        confirm_password: 'Password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('special character');
      }
    });
  });

  describe('passwordChangeSchema', () => {
    it('requires current password and valid matching new password', () => {
      const result = passwordChangeSchema.safeParse({
        current_password: 'OldPassword123!',
        new_password: 'BrandNewPass2026!',
        confirm_password: 'BrandNewPass2026!',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('passwordResetConfirmSchema', () => {
    it('requires non-empty token and strong password', () => {
      const result = passwordResetConfirmSchema.safeParse({
        token: 'valid-reset-token-xyz',
        new_password: 'BrandNewPass2026!',
        confirm_password: 'BrandNewPass2026!',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('profileUpdateSchema', () => {
    it('validates optional phone, bio, and avatar url', () => {
      const result = profileUpdateSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1 555-123-4567',
        avatar_url: 'https://images.example.com/avatar.png',
        bio: 'Senior Logistics Specialist',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid avatar URLs', () => {
      const result = profileUpdateSchema.safeParse({
        avatar_url: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('valid URL');
      }
    });
  });
});
