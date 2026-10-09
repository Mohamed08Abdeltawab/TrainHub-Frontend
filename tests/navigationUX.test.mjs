import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Objective 3: Navigation UX Production Readiness', () => {
  const rootDir = path.resolve('src');
  const enLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'i18n/locales/en.json'), 'utf-8'));
  const arLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'i18n/locales/ar.json'), 'utf-8'));

  describe('Active Navigation State & Visual Indicators', () => {
    it('AppSidebar should apply aria-current="page" to active item', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/layout/AppSidebar.tsx'), 'utf-8');
      assert.ok(content.includes("aria-current={isActive ? 'page' : undefined}"), 'AppSidebar must set aria-current="page" for active item');
    });

    it('AppSidebar should apply active pill accent classes with ring and shadow', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/layout/AppSidebar.tsx'), 'utf-8');
      assert.ok(content.includes('bg-primary/10 text-primary font-semibold ring-1 ring-primary/20 shadow-sm'), 'Active item must receive primary accent ring and pill styling');
    });

    it('AppSidebar should render distinct icon colors for active vs inactive items', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/layout/AppSidebar.tsx'), 'utf-8');
      assert.ok(content.includes("isActive ? 'text-primary' : 'group-hover:text-primary'"), 'Active item icon must use primary color');
    });
  });

  describe('Mobile Navigation Drawer & Auto-Dismissal', () => {
    it('MobileNav should render sheet with direction-aware slide-in side', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/layout/MobileNav.tsx'), 'utf-8');
      assert.ok(content.includes("side={direction === 'rtl' ? 'right' : 'left'}"), 'Drawer must open from right in RTL and left in LTR');
    });

    it('MobileNav should auto-dismiss drawer when navigating to a section', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/layout/MobileNav.tsx'), 'utf-8');
      assert.ok(content.includes('onNavigate(label);'), 'MobileNav must trigger onNavigate');
      assert.ok(content.includes('onClose();'), 'MobileNav must invoke onClose to dismiss sheet upon item click');
    });
  });

  describe('Header Navigation & Breadcrumbs Accessibility', () => {
    it('AppHeader should declare accessible breadcrumb with aria-current="page"', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/layout/AppHeader.tsx'), 'utf-8');
      assert.ok(content.includes('aria-label={t(\'Breadcrumb\')}'), 'Breadcrumb nav must have localized aria-label');
      assert.ok(content.includes('aria-current="page"'), 'Current breadcrumb item must have aria-current="page"');
    });

    it('AppHeader should support RTL chevron rotation in breadcrumbs', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/layout/AppHeader.tsx'), 'utf-8');
      assert.ok(content.includes("direction === 'rtl' ? 'rotate-180' : ''"), 'Breadcrumb separators must mirror in RTL mode');
    });

    it('AppHeader mobile trigger button should have localized accessible label', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/layout/AppHeader.tsx'), 'utf-8');
      assert.ok(content.includes("aria-label={t('Open navigation menu')}"), 'Mobile hamburger button must have localized label');
    });
  });

  describe('Role-Scoped Navigation Contracts', () => {
    it('should configure complete and segregated navigation items for each role', async () => {
      const { roleNavigation, roleLabels } = await import('../src/config/navigation.ts');

      assert.ok(roleNavigation.STUDENT.some((item) => item.label === 'My schedule'));
      assert.ok(roleNavigation.STUDENT.some((item) => item.label === 'Attendance'));
      assert.ok(!roleNavigation.STUDENT.some((item) => item.label === 'Organizations'), 'Students must not see organization administration');

      assert.ok(roleNavigation.INSTRUCTOR.some((item) => item.label === 'My courses'));
      assert.ok(roleNavigation.INSTRUCTOR.some((item) => item.label === 'Teaching' || item.group === 'Teaching'));

      assert.ok(roleNavigation.ORG_ADMIN.some((item) => item.label === 'Courses'));
      assert.ok(roleNavigation.ORG_ADMIN.some((item) => item.label === 'Cohorts'));
      assert.ok(roleNavigation.ORG_ADMIN.some((item) => item.label === 'Sessions'));
      assert.ok(roleNavigation.ORG_ADMIN.some((item) => item.label === 'Attendance'));
      assert.ok(roleNavigation.ORG_ADMIN.some((item) => item.label === 'Learners'));
      assert.ok(roleNavigation.ORG_ADMIN.some((item) => item.label === 'Instructors'));

      assert.ok(roleNavigation.SUPER_ADMIN.some((item) => item.label === 'Organizations'));

      assert.equal(roleLabels.STUDENT, 'Student');
      assert.equal(roleLabels.INSTRUCTOR, 'Instructor');
      assert.equal(roleLabels.ORG_ADMIN, 'Org Admin');
      assert.equal(roleLabels.SUPER_ADMIN, 'Super Admin');
    });
  });

  describe('Bilingual Localization for Navigation Components', () => {
    it('should have navigation and breadcrumb strings localized in English and Arabic', () => {
      const navKeys = [
        'Breadcrumb',
        'Open navigation menu',
        'Training Center Engine',
        'Active context',
        'Main navigation',
        'Expand sidebar',
        'Collapse sidebar',
      ];
      for (const key of navKeys) {
        assert.ok(key in enLocale, `en.json must contain "${key}"`);
        assert.ok(key in arLocale, `ar.json must contain "${key}"`);
        assert.ok(typeof arLocale[key] === 'string' && arLocale[key].trim().length > 0, `ar translation for "${key}" must not be empty`);
      }
    });
  });
});
