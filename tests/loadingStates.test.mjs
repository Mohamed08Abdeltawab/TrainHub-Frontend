import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Objective 2: Loading States Production Readiness', () => {
  const rootDir = path.resolve('src');

  describe('Skeleton Primitives & Exports', () => {
    it('should export CourseCardSkeleton, TableSkeleton, and DashboardSkeleton from UI index', () => {
      const indexContent = fs.readFileSync(path.join(rootDir, 'components/ui/index.ts'), 'utf-8');
      assert.ok(indexContent.includes('CourseCardSkeleton'), 'UI index must export CourseCardSkeleton');
      assert.ok(indexContent.includes('CourseCardSkeletonGrid'), 'UI index must export CourseCardSkeletonGrid');
      assert.ok(indexContent.includes('TableSkeleton'), 'UI index must export TableSkeleton');
      assert.ok(indexContent.includes('DashboardSkeleton'), 'UI index must export DashboardSkeleton');
    });

    it('TableSkeleton should accept configurable rows and columns and declare accessible status', () => {
      const tableSkeletonContent = fs.readFileSync(path.join(rootDir, 'components/ui/TableSkeleton.tsx'), 'utf-8');
      assert.ok(tableSkeletonContent.includes('columns = 5'), 'TableSkeleton should have default columns prop');
      assert.ok(tableSkeletonContent.includes('rows = 5'), 'TableSkeleton should have default rows prop');
      assert.ok(tableSkeletonContent.includes('role="status"'), 'TableSkeleton should declare role="status"');
      assert.ok(tableSkeletonContent.includes('aria-busy="true"'), 'TableSkeleton should declare aria-busy="true"');
    });

    it('CourseCardSkeletonGrid should accept configurable count and render responsive grid', () => {
      const cardSkeletonContent = fs.readFileSync(path.join(rootDir, 'components/ui/CourseCardSkeleton.tsx'), 'utf-8');
      assert.ok(cardSkeletonContent.includes('count = 6'), 'CourseCardSkeletonGrid should have default count');
      assert.ok(cardSkeletonContent.includes('role="status"'), 'CourseCardSkeletonGrid should declare role="status"');
      assert.ok(cardSkeletonContent.includes('aria-busy="true"'), 'CourseCardSkeletonGrid should declare aria-busy="true"');
    });
  });

  describe('Feature Loading Replacements (No Jarring Plain-Text Loaders)', () => {
    it('CoursesList should render CourseCardSkeletonGrid while loading courses', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/courses/components/CoursesList.tsx'), 'utf-8');
      assert.ok(content.includes('<CourseCardSkeletonGrid count={6} />'), 'CoursesList must use CourseCardSkeletonGrid');
      assert.ok(!content.includes('<p>Loading courses...</p>'), 'CoursesList must not use plain text loader');
    });

    it('MyCourses should render CourseCardSkeletonGrid while loading learner or instructor courses', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/courses/components/MyCourses.tsx'), 'utf-8');
      assert.ok(content.includes('<CourseCardSkeletonGrid'), 'MyCourses must use CourseCardSkeletonGrid');
      assert.ok(!content.includes('<p>Loading your courses...</p>'), 'MyCourses must not use plain text loader');
    });

    it('GroupsList should render TableSkeleton while loading cohorts', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/courses/components/GroupsList.tsx'), 'utf-8');
      assert.ok(content.includes('<TableSkeleton columns={6} rows={5} />'), 'GroupsList must use TableSkeleton');
      assert.ok(!content.includes('<p>Loading cohorts...</p>'), 'GroupsList must not use plain text loader');
    });

    it('SessionsList should render TableSkeleton while loading sessions', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/sessions/components/SessionsList.tsx'), 'utf-8');
      assert.ok(content.includes('<TableSkeleton columns={6} rows={5} />'), 'SessionsList must use TableSkeleton');
      assert.ok(!content.includes('{t(\'Loading sessions...\')}'), 'SessionsList must not use plain text loader');
    });

    it('AttendancePage should render TableSkeleton and metric skeletons while loading attendance', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/sessions/components/AttendancePage.tsx'), 'utf-8');
      assert.ok(content.includes('<TableSkeleton columns={5} rows={5} />'), 'AttendancePage must use TableSkeleton');
      assert.ok(content.includes('att-skel-'), 'AttendancePage must render metric skeletons');
      assert.ok(!content.includes('{t(\'Loading attendance...\')}'), 'AttendancePage must not use plain text loader');
    });

    it('ScheduleView should render day card skeletons while loading weekly schedule', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/sessions/components/ScheduleView.tsx'), 'utf-8');
      assert.ok(content.includes('sched-skeleton-'), 'ScheduleView must render skeleton day cards');
      assert.ok(!content.includes('{t(\'Loading schedule...\')}'), 'ScheduleView must not use plain text loader');
    });

    it('DashboardSection should render DashboardSkeleton for pending dashboard queries', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/dashboard/components/DashboardSection.tsx'), 'utf-8');
      assert.ok(content.includes('<DashboardSkeleton />'), 'DashboardSection must display DashboardSkeleton while pending');
    });
  });

  describe('Metric Cards Skeleton State', () => {
    it('StudentsList should render Skeleton placeholders in metric cards when loading', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/students/components/StudentsList.tsx'), 'utf-8');
      assert.ok(content.includes('<Skeleton className="mt-1.5 h-6 w-12 rounded" />'), 'StudentsList must render skeleton in metric card');
    });

    it('InstructorsList should render Skeleton placeholders in metric cards when loading', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/instructors/components/InstructorsList.tsx'), 'utf-8');
      assert.ok(content.includes('<Skeleton className="mt-1.5 h-6 w-12 rounded" />'), 'InstructorsList must render skeleton in metric card');
    });
  });

  describe('Button Pending / Mutation Loading Contract', () => {
    it('Button component should support loading spinner and loadingLabel', () => {
      const buttonContent = fs.readFileSync(path.join(rootDir, 'components/ui/Button.tsx'), 'utf-8');
      assert.ok(buttonContent.includes('loading?: boolean'), 'Button must declare loading prop');
      assert.ok(buttonContent.includes('loadingLabel?: string'), 'Button must declare loadingLabel prop');
      assert.ok(buttonContent.includes('Loader2Icon'), 'Button must render spinner when loading');
    });

    const mutationForms = [
      { name: 'CoursesList modal', path: 'features/courses/components/CoursesList.tsx', marker: 'loading={saving}' },
      { name: 'StudentsList modal', path: 'features/students/components/StudentsList.tsx', marker: 'loading={saving}' },
      { name: 'InstructorsList modal', path: 'features/instructors/components/InstructorsList.tsx', marker: 'loading={saving}' },
      { name: 'SessionsList modal', path: 'features/sessions/components/SessionsList.tsx', marker: 'loading={saving}' },
      { name: 'GroupsList modal', path: 'features/courses/components/GroupsList.tsx', marker: 'loading={saving}' },
    ];

    for (const form of mutationForms) {
      it(`${form.name} should pass loading={saving} to submit button`, () => {
        const content = fs.readFileSync(path.join(rootDir, form.path), 'utf-8');
        assert.ok(content.includes(form.marker), `${form.name} must wire loading state to button`);
      });
    }
  });
});
