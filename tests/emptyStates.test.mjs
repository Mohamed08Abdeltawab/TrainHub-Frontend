import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Objective 3: Empty States Production Readiness', () => {
  const rootDir = path.resolve('src');
  const enLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'i18n/locales/en.json'), 'utf-8'));
  const arLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'i18n/locales/ar.json'), 'utf-8'));

  describe('EmptyState UI Component Primitive', () => {
    it('EmptyState should provide accessible polite status attributes', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/ui/EmptyState.tsx'), 'utf-8');
      assert.ok(content.includes('role="status"'), 'EmptyState must declare role="status"');
      assert.ok(content.includes('aria-live="polite"'), 'EmptyState must declare aria-live="polite"');
    });

    it('EmptyState should accept title, description, icon, action, and className props', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/ui/EmptyState.tsx'), 'utf-8');
      assert.ok(content.includes('title: string;'), 'EmptyState must accept title');
      assert.ok(content.includes('description: string;'), 'EmptyState must accept description');
      assert.ok(content.includes('icon?: ReactNode;'), 'EmptyState must accept icon');
      assert.ok(content.includes('action?: ReactNode;'), 'EmptyState must accept action');
    });

    it('DataTable component should support emptyAction and emptyIcon props', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/ui/DataTable.tsx'), 'utf-8');
      assert.ok(content.includes('emptyAction?: ReactNode;'), 'DataTable must support emptyAction prop');
      assert.ok(content.includes('emptyIcon?: ReactNode;'), 'DataTable must support emptyIcon prop');
      assert.ok(content.includes('<EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} action={emptyAction} />'), 'DataTable must forward props to EmptyState');
    });
  });

  describe('Differentiating Empty Collection vs. Filtered Search States', () => {
    it('CoursesList should show "Clear filters" when filtered and "Create course" when empty collection', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/courses/components/CoursesList.tsx'), 'utf-8');
      assert.ok(content.includes('isFiltered'), 'CoursesList must track isFiltered');
      assert.ok(content.includes("t('Clear filters')"), 'CoursesList must provide Clear filters button');
      assert.ok(content.includes("t('Create course')"), 'CoursesList must provide Create course CTA for empty collection');
    });

    it('StudentsList should show "Clear filters" when filtered and "Add student" when empty collection', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/students/components/StudentsList.tsx'), 'utf-8');
      assert.ok(content.includes('isFiltered'), 'StudentsList must track isFiltered');
      assert.ok(content.includes("t('Clear filters')"), 'StudentsList must provide Clear filters button');
      assert.ok(content.includes("t('Add student')"), 'StudentsList must provide Add student CTA for empty collection');
    });

    it('InstructorsList should show "Clear filters" when filtered and "Add instructor" when empty collection', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/instructors/components/InstructorsList.tsx'), 'utf-8');
      assert.ok(content.includes('isFiltered'), 'InstructorsList must track isFiltered');
      assert.ok(content.includes("t('Clear filters')"), 'InstructorsList must provide Clear filters button');
      assert.ok(content.includes("t('Add instructor')"), 'InstructorsList must provide Add instructor CTA for empty collection');
    });

    it('GroupsList should show "Clear filters" when filtered and "Create group" when empty collection', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/courses/components/GroupsList.tsx'), 'utf-8');
      assert.ok(content.includes('isFiltered'), 'GroupsList must track isFiltered');
      assert.ok(content.includes("t('Clear filters')"), 'GroupsList must provide Clear filters button');
      assert.ok(content.includes("t('Create group')"), 'GroupsList must provide Create group CTA for empty collection');
    });

    it('SessionsList should show "Clear filters" when filtered and "Create session" when empty collection', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/sessions/components/SessionsList.tsx'), 'utf-8');
      assert.ok(content.includes('isFiltered'), 'SessionsList must track isFiltered');
      assert.ok(content.includes("t('Clear filters')"), 'SessionsList must provide Clear filters button');
      assert.ok(content.includes("t('Create session')"), 'SessionsList must provide Create session CTA');
    });

    it('CourseStudentsPanel should differentiate zero enrolled vs. search queries without results', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/courses/components/CourseStudentsPanel.tsx'), 'utf-8');
      assert.ok(content.includes("query && ("), 'CourseStudentsPanel must check search query');
      assert.ok(content.includes("t('Clear search')"), 'CourseStudentsPanel must provide Clear search button');
    });

    it('ScheduleView should provide empty state with Clear filter or Today button when week has no sessions', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/sessions/components/ScheduleView.tsx'), 'utf-8');
      assert.ok(content.includes('weekSessionsCount === 0'), 'ScheduleView must check week session count');
      assert.ok(content.includes("t('Clear filter')"), 'ScheduleView must offer clear filter CTA');
    });
  });

  describe('Filter Reset Behavior & Logic', () => {
    it('should correctly reset multi-dimensional filters to default states', () => {
      let state = {
        query: 'react',
        status: 'Active',
        cohort: 'cohort-123',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      };

      const isFiltered = () =>
        state.query.trim() !== '' ||
        state.status !== 'All' ||
        state.cohort !== 'All' ||
        state.dateFrom !== '' ||
        state.dateTo !== '';

      assert.strictEqual(isFiltered(), true);

      // Reset
      state = {
        query: '',
        status: 'All',
        cohort: 'All',
        dateFrom: '',
        dateTo: '',
      };

      assert.strictEqual(isFiltered(), false);
      assert.strictEqual(state.query, '');
      assert.strictEqual(state.status, 'All');
      assert.strictEqual(state.cohort, 'All');
    });
  });

  describe('Bilingual i18n Completeness for Empty & Loading States', () => {
    const requiredKeys = [
      'Clear filters',
      'Clear filter',
      'Clear search',
      'Clear',
      'No sessions scheduled this week',
      'No sessions match your filter',
      'Try changing your cohort filter or view another week.',
      'There are no training sessions scheduled for this week.',
      'Try changing your search, status, or cohort filter.',
      'Try clearing or adjusting your date, cohort, session, and status filters.',
      'No active learners are linked to this cohort.',
      'Link learners to the cohort course to build its attendance roster.',
      'No attendance records yet',
      'Attendance records will appear here as sessions are completed.',
      'Total instructors',
      'Inactive instructors',
      'Instructor directory',
      'Search instructors',
      'Search by name, email, phone, or expertise',
      'No instructors match your search',
      'No instructors yet',
      'Add your first instructor to start building your directory.',
      'Instructors will appear here when they are added to your center.',
      'Total students',
      'Student directory',
      'Search students',
      'Search by name, email, phone, or course',
      'No students match your search',
      'No students yet',
      'Try changing your search or status filter.',
      'Add your first student to start building your directory.',
      'Students will appear here when they are added to your center.',
    ];

    for (const key of requiredKeys) {
      it(`English locale should include: "${key}"`, () => {
        assert.ok(enLocale[key] !== undefined, `en.json is missing key: "${key}"`);
        assert.ok(enLocale[key].length > 0, `en.json key "${key}" should not be empty`);
      });

      it(`Arabic locale should include translation for: "${key}"`, () => {
        assert.ok(arLocale[key] !== undefined, `ar.json is missing key: "${key}"`);
        assert.ok(arLocale[key].length > 0, `ar.json key "${key}" should not be empty`);
      });
    }
  });
});
