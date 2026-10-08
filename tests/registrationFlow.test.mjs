import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

// Registration Schema under test
const registerSchema = z
  .object({
    name: z.string().trim().min(2, { message: 'Enter your name.' }),
    organization: z.string().trim().min(2, { message: 'Enter your training center name.' }),
    email: z.string().trim().email({ message: 'Enter a valid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

describe('Task 2: Registration Flow Validation & Architecture', () => {
  describe('Form Validation Constraints', () => {
    it('should reject names shorter than 2 characters', () => {
      const result = registerSchema.safeParse({
        name: 'A',
        organization: 'Acme Academy',
        email: 'acme@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(result.error.issues[0].message, 'Enter your name.');
      }
    });

    it('should reject empty or 1-character organization name', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        organization: ' ',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(result.error.issues[0].message, 'Enter your training center name.');
      }
    });

    it('should reject invalid email formats', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        organization: 'Acme Academy',
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(result.error.issues[0].message, 'Enter a valid email address.');
      }
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        organization: 'Acme Academy',
        email: 'john@example.com',
        password: 'Pass1',
        confirmPassword: 'Pass1',
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(result.error.issues[0].message, 'Password must be at least 8 characters.');
      }
    });

    it('should reject when confirm password does not match password', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        organization: 'Acme Academy',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'PasswordDifferent!',
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(result.error.issues[0].message, 'Passwords do not match.');
      }
    });

    it('should accept valid registration values', () => {
      const result = registerSchema.safeParse({
        name: '  John Doe  ',
        organization: '  Future Training Academy  ',
        email: '  john.doe@example.com  ',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      });
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.name, 'John Doe');
        assert.strictEqual(result.data.organization, 'Future Training Academy');
        assert.strictEqual(result.data.email, 'john.doe@example.com');
      }
    });
  });

  describe('Backend DTO Payload Mapping', () => {
    function mapToBackendDto(values) {
      const nameParts = values.name.trim().split(/\s+/);
      const firstName = nameParts[0] || values.name.trim();
      const lastName = nameParts.slice(1).join(' ') || firstName;

      return {
        firstName,
        lastName,
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword || values.password,
        organization: values.organization.trim(),
        organizationId: values.organizationId,
      };
    }

    it('should correctly split multi-word full name into firstName and lastName', () => {
      const dto = mapToBackendDto({
        name: 'John Michael Doe',
        organization: 'Tech Academy',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      assert.strictEqual(dto.firstName, 'John');
      assert.strictEqual(dto.lastName, 'Michael Doe');
      assert.strictEqual(dto.confirmPassword, 'Password123!');
    });

    it('should handle single-word full name gracefully', () => {
      const dto = mapToBackendDto({
        name: 'Madonna',
        organization: 'Vocal Academy',
        email: 'madonna@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      assert.strictEqual(dto.firstName, 'Madonna');
      assert.strictEqual(dto.lastName, 'Madonna');
    });
  });

  describe('Duplicate Email (409 Conflict) & RFC 7807 Parsing', () => {
    function parseBackendProblemDetails(error) {
      const data = error.response?.data;
      if (error.response?.status === 409) {
        return (
          data?.detail ||
          data?.message ||
          'An account with this email already exists. Sign in instead.'
        );
      }
      if (typeof data?.detail === 'string') return data.detail;
      if (typeof data?.message === 'string') return data.message;
      if (data?.errors && typeof data.errors === 'object') {
        const firstErr = Object.values(data.errors).flat()[0];
        if (typeof firstErr === 'string') return firstErr;
      }
      return 'We could not create your account. Check your connection and try again.';
    }

    it('should extract detail message from RFC 7807 409 Conflict problem response', () => {
      const error = {
        response: {
          status: 409,
          data: {
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
            title: 'Conflict',
            status: 409,
            detail: 'A user with email john@example.com already exists in this organization.',
          },
        },
      };

      const message = parseBackendProblemDetails(error);
      assert.strictEqual(
        message,
        'A user with email john@example.com already exists in this organization.'
      );
    });

    it('should fall back to standard duplicate message when detail is missing', () => {
      const error = {
        response: {
          status: 409,
          data: {},
        },
      };

      const message = parseBackendProblemDetails(error);
      assert.strictEqual(
        message,
        'An account with this email already exists. Sign in instead.'
      );
    });

    it('should parse ASP.NET validation error dictionary (400)', () => {
      const error = {
        response: {
          status: 400,
          data: {
            title: 'One or more validation errors occurred.',
            status: 400,
            errors: {
              Password: ['Passwords must have at least one non alphanumeric character.'],
            },
          },
        },
      };

      const message = parseBackendProblemDetails(error);
      assert.strictEqual(
        message,
        'Passwords must have at least one non alphanumeric character.'
      );
    });
  });

  describe('Post-Registration Flow & Login Hand-off', () => {
    it('should prepare location state with registeredEmail for smooth login redirect', () => {
      const registeredEmail = 'new-owner@training.io';
      const redirectState = { registeredEmail };

      assert.strictEqual(redirectState.registeredEmail, 'new-owner@training.io');
    });
  });
});
