import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Production Readiness & Complete User Flows Regression Suite', () => {
  const rootDir = path.resolve('src');
  const enLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'i18n/locales/en.json'), 'utf-8'));
  const arLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'i18n/locales/ar.json'), 'utf-8'));

  describe('1. Multi-Role User Flows & Routing Architecture', () => {
    it('should have complete and distinct navigation items for all 4 personas', async () => {
      const { roleNavigation, roleLabels } = await import('../src/config/navigation.ts');

      // Verify all 4 roles exist in labels
      assert.strictEqual(roleLabels.STUDENT, 'Student');
      assert.strictEqual(roleLabels.INSTRUCTOR, 'Instructor');
      assert.strictEqual(roleLabels.ORG_ADMIN, 'Org Admin');
      assert.strictEqual(roleLabels.SUPER_ADMIN, 'Super Admin');

      // Verify Student items
      const studentLabels = roleNavigation.STUDENT.map((i) => i.label);
      assert.ok(studentLabels.includes('Overview'));
      assert.ok(studentLabels.includes('My courses'));
      assert.ok(studentLabels.includes('My schedule'));
      assert.ok(studentLabels.includes('Attendance'));
      assert.ok(studentLabels.includes('User profile'));
      assert.ok(!studentLabels.includes('Organizations'), 'Student must not see platform organizations');
      assert.ok(!studentLabels.includes('Instructors'), 'Student must not have instructor admin view');

      // Verify Instructor items
      const instructorLabels = roleNavigation.INSTRUCTOR.map((i) => i.label);
      assert.ok(instructorLabels.includes('Overview'));
      assert.ok(instructorLabels.includes('My courses'));
      assert.ok(instructorLabels.includes('My cohorts'));
      assert.ok(instructorLabels.includes('Sessions'));
      assert.ok(instructorLabels.includes('Attendance'));
      assert.ok(instructorLabels.includes('Schedule'));
      assert.ok(instructorLabels.includes('Learners'));
      assert.ok(instructorLabels.includes('User profile'));

      // Verify Org Admin items
      const orgAdminLabels = roleNavigation.ORG_ADMIN.map((i) => i.label);
      assert.ok(orgAdminLabels.includes('Courses'));
      assert.ok(orgAdminLabels.includes('Cohorts'));
      assert.ok(orgAdminLabels.includes('Sessions'));
      assert.ok(orgAdminLabels.includes('Attendance'));
      assert.ok(orgAdminLabels.includes('Schedule'));
      assert.ok(orgAdminLabels.includes('Learners'));
      assert.ok(orgAdminLabels.includes('Instructors'));
      assert.ok(orgAdminLabels.includes('Organization profile'));
      assert.ok(orgAdminLabels.includes('Organization settings'));
      assert.ok(orgAdminLabels.includes('User profile'));

      // Verify Super Admin items
      const superAdminLabels = roleNavigation.SUPER_ADMIN.map((i) => i.label);
      assert.ok(superAdminLabels.includes('Overview'));
      assert.ok(superAdminLabels.includes('Organizations'));
      assert.ok(superAdminLabels.includes('Platform users'));
      assert.ok(superAdminLabels.includes('User profile'));
      assert.ok(!superAdminLabels.includes('Subscriptions'), 'Subscriptions must be stripped (out-of-scope)');
      assert.ok(!superAdminLabels.includes('Reports'), 'Reports must be stripped (out-of-scope)');
      assert.ok(!superAdminLabels.includes('Settings'), 'Settings must be stripped (out-of-scope)');
    });

    it('should configure demo users with correct paths and avatar tokens', async () => {
      const { demoUsers } = await import('../src/config/demoUsers.ts');

      assert.strictEqual(demoUsers.STUDENT.path, '/student');
      assert.strictEqual(demoUsers.INSTRUCTOR.path, '/instructor');
      assert.strictEqual(demoUsers.ORG_ADMIN.path, '/admin/organizations/demo');
      assert.strictEqual(demoUsers.SUPER_ADMIN.path, '/admin/organizations/demo');

      for (const [role, user] of Object.entries(demoUsers)) {
        assert.ok(user.email.includes('@trainhub.io'), `${role} email must be valid`);
        assert.ok(user.name.length >= 3, `${role} name must be defined`);
        assert.ok(user.avatarColor.startsWith('bg-'), `${role} must have a valid Tailwind avatar color`);
      }
    });

    it('OrganizationTenantGuard should grant unrestricted platform access to SUPER_ADMIN', () => {
      const guardContent = fs.readFileSync(path.join(rootDir, 'auth/OrganizationTenantGuard.tsx'), 'utf-8');
      assert.ok(
        guardContent.includes("user?.role === 'SUPER_ADMIN'") || guardContent.includes('isPlatformAdmin'),
        'Tenant guard must explicitly recognize Super Admin privileges'
      );
    });

    it('DashboardSection should route SUPER_ADMIN to PlatformOrganizations component', () => {
      const sectionContent = fs.readFileSync(
        path.join(rootDir, 'features/dashboard/components/DashboardSection.tsx'),
        'utf-8'
      );
      assert.ok(
        sectionContent.includes("active === 'Organizations' && role === 'SUPER_ADMIN'"),
        'DashboardSection must render PlatformOrganizations for Super Admin'
      );
      assert.ok(
        sectionContent.includes('<PlatformOrganizations />'),
        'DashboardSection must instantiate PlatformOrganizations component'
      );
    });

    it('DashboardSection should grant SUPER_ADMIN access to core management sections', () => {
      const sectionContent = fs.readFileSync(
        path.join(rootDir, 'features/dashboard/components/DashboardSection.tsx'),
        'utf-8'
      );
      assert.ok(
        sectionContent.includes("active === 'Learners'") && sectionContent.includes("role === 'SUPER_ADMIN'"),
        'Super Admin must have access to Learners list'
      );
      assert.ok(
        sectionContent.includes("active === 'Instructors'") && sectionContent.includes("role === 'SUPER_ADMIN'"),
        'Super Admin must have access to Instructors list'
      );
      assert.ok(
        sectionContent.includes("active === 'Courses'") && sectionContent.includes("role === 'SUPER_ADMIN'"),
        'Super Admin must have access to Courses list'
      );
      assert.ok(
        sectionContent.includes("active === 'Cohorts'") && sectionContent.includes("role === 'SUPER_ADMIN'"),
        'Super Admin must have access to Cohorts list'
      );
    });
  });

  describe('2. Login Screen & Role Switcher Integration', () => {
    it('Login screen should provide quick access links and credential buttons for all 4 roles', () => {
      const loginContent = fs.readFileSync(path.join(rootDir, 'pages/Login.tsx'), 'utf-8');

      // Check demoLinks contains all 4 roles
      assert.ok(loginContent.includes("'SUPER_ADMIN' as DashboardRole"), 'demoLinks must include Super Admin');
      assert.ok(loginContent.includes("'ORG_ADMIN' as DashboardRole"), 'demoLinks must include Org Admin');
      assert.ok(loginContent.includes("'INSTRUCTOR' as DashboardRole"), 'demoLinks must include Instructor');
      assert.ok(loginContent.includes("'STUDENT' as DashboardRole"), 'demoLinks must include Student');

      // Check quick-fill buttons exist for all 4 roles
      assert.ok(loginContent.includes("setValue('email', demoUsers.SUPER_ADMIN.email)"), 'Must have Super Admin quick-fill');
      assert.ok(loginContent.includes("setValue('email', demoUsers.ORG_ADMIN.email)"), 'Must have Org Admin quick-fill');
      assert.ok(loginContent.includes("setValue('email', demoUsers.INSTRUCTOR.email)"), 'Must have Instructor quick-fill');
      assert.ok(loginContent.includes("setValue('email', demoUsers.STUDENT.email)"), 'Must have Learner quick-fill');
    });

    it('UserNav should cleanly trigger role transition without URL query pollution', () => {
      const userNavContent = fs.readFileSync(path.join(rootDir, 'components/layout/UserNav.tsx'), 'utf-8');
      assert.ok(
        userNavContent.includes('onSelectRole(user.role);'),
        'UserNav must invoke onSelectRole directly'
      );
      assert.ok(
        !userNavContent.includes('navigate(`${user.path}?view=overview`)'),
        'UserNav must not append redundant ?view=overview query parameter'
      );
    });

    it('Out-of-scope notifications component should not be present in header layout', () => {
      const headerContent = fs.readFileSync(path.join(rootDir, 'components/layout/AppHeader.tsx'), 'utf-8');
      assert.ok(!headerContent.includes('NotificationMenu'), 'NotificationMenu must not be mounted in AppHeader');
    });
  });

  describe('3. Bilingual Localization Completeness', () => {
    it('should have parity between English and Arabic for all navigation groups and labels', async () => {
      const { roleNavigation } = await import('../src/config/navigation.ts');

      const expectedLabels = new Set();
      const expectedGroups = new Set();

      Object.values(roleNavigation).forEach((list) => {
        list.forEach((item) => {
          expectedLabels.add(item.label);
          if (item.group) expectedGroups.add(item.group);
        });
      });

      for (const label of expectedLabels) {
        assert.ok(label in enLocale, `en.json must contain label "${label}"`);
        assert.ok(label in arLocale, `ar.json must contain label "${label}"`);
        assert.ok(arLocale[label].length > 0, `Arabic translation for "${label}" must not be empty`);
      }

      for (const group of expectedGroups) {
        assert.ok(group in enLocale, `en.json must contain group "${group}"`);
        assert.ok(group in arLocale, `ar.json must contain group "${group}"`);
        assert.ok(arLocale[group].length > 0, `Arabic translation for group "${group}" must not be empty`);
      }
    });

    it('should localize platform management keys for Super Admin', () => {
      const platformKeys = [
        'Platform Organizations',
        'Active training centers',
        'Total organizations',
        'Open workspace',
        'Manage and monitor all tenant training centers across TrainHub.',
      ];

      for (const key of platformKeys) {
        assert.ok(key in enLocale, `en.json must contain "${key}"`);
        assert.ok(key in arLocale, `ar.json must contain "${key}"`);
        assert.ok(arLocale[key].length > 0, `Arabic translation for "${key}" must not be empty`);
      }
    });
  });

  describe('4. Responsive Design Contracts', () => {
    it('PlatformOrganizations should provide mobile-stacking filters and horizontal scrolling table', () => {
      const compContent = fs.readFileSync(
        path.join(rootDir, 'features/dashboard/components/PlatformOrganizations.tsx'),
        'utf-8'
      );

      assert.ok(
        compContent.includes('flex flex-col gap-3 sm:flex-row') ||
          compContent.includes('flex flex-col gap-2 sm:flex-row'),
        'PlatformOrganizations filter toolbar must adapt from vertical to horizontal'
      );
      assert.ok(
        compContent.includes('overflow-x-auto') && compContent.includes('min-w-[700px]'),
        'PlatformOrganizations table must feature horizontal scroll wrapper and min-width'
      );
    });

    it('MyCourses should scale across mobile, tablet, and desktop breakpoints', () => {
      const myCoursesContent = fs.readFileSync(
        path.join(rootDir, 'features/courses/components/MyCourses.tsx'),
        'utf-8'
      );

      assert.ok(
        myCoursesContent.includes('sm:grid-cols-2') && myCoursesContent.includes('xl:grid-cols-3'),
        'MyCourses grid must be 1 col on mobile, 2 cols on sm, 3 cols on xl'
      );
    });

    it('UserProfile should scale from single column on mobile to split sidebar on xl', () => {
      const userProfileContent = fs.readFileSync(
        path.join(rootDir, 'features/dashboard/components/UserProfile.tsx'),
        'utf-8'
      );

      assert.ok(
        userProfileContent.includes('xl:grid-cols-[minmax(0,1fr)_280px]') ||
          userProfileContent.includes('grid gap-5 xl:grid-cols-'),
        'UserProfile must use responsive grid'
      );
    });
  });

  describe('5. Production Deployment Readiness Artifacts', () => {
    it('should provide SPA redirect rule for Netlify and static hosting', () => {
      const redirectsPath = path.resolve('public/_redirects');
      assert.ok(fs.existsSync(redirectsPath), 'public/_redirects must exist');
      const content = fs.readFileSync(redirectsPath, 'utf-8');
      assert.ok(content.includes('/*') && content.includes('/index.html') && content.includes('200'));
    });

    it('should provide vercel.json with SPA rewrite and asset caching headers', () => {
      const vercelPath = path.resolve('vercel.json');
      assert.ok(fs.existsSync(vercelPath), 'vercel.json must exist');
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
      assert.ok(Array.isArray(vercelConfig.rewrites), 'vercel.json must have rewrites array');
      assert.ok(vercelConfig.rewrites.some((r) => r.destination === '/index.html'));
    });

    it('should provide production nginx.conf with SPA fallback and gzip', () => {
      const nginxPath = path.resolve('nginx.conf');
      assert.ok(fs.existsSync(nginxPath), 'nginx.conf must exist');
      const content = fs.readFileSync(nginxPath, 'utf-8');
      assert.ok(content.includes('try_files $uri $uri/ /index.html;'), 'nginx.conf must have try_files fallback');
      assert.ok(content.includes('gzip on;'), 'nginx.conf must enable gzip compression');
    });

    it('should provide Dockerfile for containerized build and serving', () => {
      const dockerfilePath = path.resolve('Dockerfile');
      assert.ok(fs.existsSync(dockerfilePath), 'Dockerfile must exist');
      const content = fs.readFileSync(dockerfilePath, 'utf-8');
      assert.ok(content.includes('FROM node:20-alpine AS builder'), 'Dockerfile must use multi-stage build');
      assert.ok(content.includes('FROM nginx:alpine'), 'Dockerfile must serve via nginx');
    });

    it('should have documented .env.example with API base URL', () => {
      const envPath = path.resolve('.env.example');
      assert.ok(fs.existsSync(envPath), '.env.example must exist');
      const content = fs.readFileSync(envPath, 'utf-8');
      assert.ok(content.includes('VITE_API_BASE_URL='), '.env.example must declare VITE_API_BASE_URL');
    });
  });
});
