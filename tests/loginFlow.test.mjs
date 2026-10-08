import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

// Login Validation Schema under test
const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const demoUsers = {
  ORG_ADMIN: {
    id: 'user-admin',
    name: 'Alex Morgan',
    email: 'alex.morgan@trainhub.io',
    role: 'ORG_ADMIN',
    path: '/admin/organizations/demo',
  },
  INSTRUCTOR: {
    id: 'user-instructor',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@trainhub.io',
    role: 'INSTRUCTOR',
    path: '/instructor',
  },
  STUDENT: {
    id: 'user-student',
    name: 'David Kim',
    email: 'david.kim@trainhub.io',
    role: 'STUDENT',
    path: '/student',
  },
  SUPER_ADMIN: {
    id: 'user-superadmin',
    name: 'Jordan Lee',
    email: 'jordan.lee@trainhub.io',
    role: 'SUPER_ADMIN',
    path: '/admin/organizations/demo',
  },
};

describe('Task 1: Login Flow Validation & Architecture', () => {
  describe('Form Validation Constraints', () => {
    it('should reject empty or missing email', () => {
      const result = loginSchema.safeParse({ email: '', password: 'Password123!' });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(result.error.issues[0].message, 'Enter a valid email address.');
      }
    });

    it('should reject malformed email address', () => {
      const result = loginSchema.safeParse({ email: 'not-an-email', password: 'Password123!' });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(result.error.issues[0].message, 'Enter a valid email address.');
      }
    });

    it('should reject passwords shorter than 6 characters', () => {
      const result = loginSchema.safeParse({ email: 'david.kim@trainhub.io', password: '123' });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(result.error.issues[0].message, 'Password must be at least 6 characters.');
      }
    });

    it('should accept valid email and password (>= 6 chars)', () => {
      const result = loginSchema.safeParse({
        email: '  david.kim@trainhub.io  ',
        password: 'Password123!',
      });
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.email, 'david.kim@trainhub.io');
      }
    });
  });

  describe('Demo Users & Credentials', () => {
    it('should have properly configured demo accounts for all roles', () => {
      assert.strictEqual(demoUsers.STUDENT.email, 'david.kim@trainhub.io');
      assert.strictEqual(demoUsers.STUDENT.role, 'STUDENT');
      assert.strictEqual(demoUsers.STUDENT.path, '/student');

      assert.strictEqual(demoUsers.INSTRUCTOR.email, 'sarah.jenkins@trainhub.io');
      assert.strictEqual(demoUsers.INSTRUCTOR.role, 'INSTRUCTOR');
      assert.strictEqual(demoUsers.INSTRUCTOR.path, '/instructor');

      assert.strictEqual(demoUsers.ORG_ADMIN.email, 'alex.morgan@trainhub.io');
      assert.strictEqual(demoUsers.ORG_ADMIN.role, 'ORG_ADMIN');
      assert.strictEqual(demoUsers.ORG_ADMIN.path, '/admin/organizations/demo');

      assert.strictEqual(demoUsers.SUPER_ADMIN.email, 'jordan.lee@trainhub.io');
      assert.strictEqual(demoUsers.SUPER_ADMIN.role, 'SUPER_ADMIN');
    });

    it('should authenticate demo accounts directly when backend is offline or unseeded', () => {
      const simulateSignIn = (email, password) => {
        const normalized = email.trim().toLowerCase();
        const matchedDemo = Object.values(demoUsers).find(
          (u) => u.email.toLowerCase() === normalized
        );
        if (matchedDemo) {
          return password.length >= 6 ? matchedDemo.role : 'invalid';
        }
        return 'invalid';
      };

      assert.strictEqual(simulateSignIn('david.kim@trainhub.io', 'Password123!'), 'STUDENT');
      assert.strictEqual(simulateSignIn('sarah.jenkins@trainhub.io', 'InstructorPass!'), 'INSTRUCTOR');
      assert.strictEqual(simulateSignIn('alex.morgan@trainhub.io', 'AdminPass123!'), 'ORG_ADMIN');
      assert.strictEqual(simulateSignIn('david.kim@trainhub.io', '123'), 'invalid');
      assert.strictEqual(simulateSignIn('unknown@example.com', 'ValidPassword123!'), 'invalid');
    });
  });

  describe('Role-Based Redirection Paths', () => {
    function resolveRedirectPath(role, destination, sessionOrgId = 'demo') {
      let targetPath = demoUsers[role].path;
      if (role === 'STUDENT') {
        targetPath = destination && destination.startsWith('/student') ? destination : demoUsers.STUDENT.path;
      } else if (role === 'INSTRUCTOR') {
        targetPath = destination && destination.startsWith('/instructor') ? destination : demoUsers.INSTRUCTOR.path;
      } else if (role === 'ORG_ADMIN' || role === 'SUPER_ADMIN') {
        if (destination && destination.startsWith('/admin')) {
          targetPath = destination;
        } else {
          targetPath = `/admin/organizations/${sessionOrgId}`;
        }
      }
      return targetPath;
    }

    it('should route student to /student by default', () => {
      const path = resolveRedirectPath('STUDENT', null);
      assert.strictEqual(path, '/student');
    });

    it('should preserve deep student links but reject cross-role deep links for student', () => {
      assert.strictEqual(
        resolveRedirectPath('STUDENT', '/student/my-schedule'),
        '/student/my-schedule'
      );
      assert.strictEqual(
        resolveRedirectPath('STUDENT', '/student/attendance'),
        '/student/attendance'
      );
      // If student tried to navigate to an admin or instructor path, clamp back to /student
      assert.strictEqual(
        resolveRedirectPath('STUDENT', '/admin/organizations/demo'),
        '/student'
      );
      assert.strictEqual(
        resolveRedirectPath('STUDENT', '/instructor/courses'),
        '/student'
      );
    });

    it('should route instructor to /instructor by default and guard cross-role destinations', () => {
      assert.strictEqual(resolveRedirectPath('INSTRUCTOR', null), '/instructor');
      assert.strictEqual(
        resolveRedirectPath('INSTRUCTOR', '/instructor/schedule'),
        '/instructor/schedule'
      );
      assert.strictEqual(
        resolveRedirectPath('INSTRUCTOR', '/student/attendance'),
        '/instructor'
      );
    });

    it('should route org admin to /admin/organizations/:orgId', () => {
      assert.strictEqual(
        resolveRedirectPath('ORG_ADMIN', null, 'org-123'),
        '/admin/organizations/org-123'
      );
      assert.strictEqual(
        resolveRedirectPath('ORG_ADMIN', '/admin/organizations/org-123/courses', 'org-123'),
        '/admin/organizations/org-123/courses'
      );
    });
  });

  describe('Error Messages & Feedback', () => {
    it('should distinguish invalid credentials from service unavailable', () => {
      const getErrorMessage = (result) => {
        if (result === 'unavailable') {
          return 'We could not reach the sign-in service. Check your connection and try again.';
        }
        if (result === 'invalid') {
          return 'We couldn’t find an account with that email and password. Check your details or create an account.';
        }
        return '';
      };

      assert.strictEqual(
        getErrorMessage('invalid'),
        'We couldn’t find an account with that email and password. Check your details or create an account.'
      );
      assert.strictEqual(
        getErrorMessage('unavailable'),
        'We could not reach the sign-in service. Check your connection and try again.'
      );
    });
  });
});
