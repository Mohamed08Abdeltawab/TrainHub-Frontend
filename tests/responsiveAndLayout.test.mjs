import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Objective 1: Responsive UI Production Readiness', () => {
  const rootDir = path.resolve('src');

  describe('Dashboard Shell & OrgBadge Responsive Layout', () => {
    it('should include responsive mobile padding and full-width button classes in DashboardShell', () => {
      const shellContent = fs.readFileSync(path.join(rootDir, 'components/layout/DashboardShell.tsx'), 'utf-8');
      assert.ok(shellContent.includes('p-3.5 sm:p-6 lg:p-8'), 'DashboardShell should use responsive padding for mobile <640px');
      assert.ok(shellContent.includes('w-full sm:w-auto'), 'DashboardShell primary action button should expand on mobile');
      assert.ok(shellContent.includes('flex flex-col gap-4 sm:flex-row'), 'DashboardShell header should stack on mobile and row on sm+');
    });

    it('should apply progressive max-width truncation on OrgBadge across screen breakpoints', () => {
      const orgBadgeContent = fs.readFileSync(path.join(rootDir, 'components/layout/OrgBadge.tsx'), 'utf-8');
      assert.ok(
        orgBadgeContent.includes('max-w-[110px]') && orgBadgeContent.includes('sm:max-w-[180px]'),
        'OrgBadge should prevent mobile header crowding with progressive max-width'
      );
    });
  });

  describe('Filter Toolbar Responsive Patterns', () => {
    const listComponents = [
      { name: 'CoursesList', path: 'features/courses/components/CoursesList.tsx' },
      { name: 'StudentsList', path: 'features/students/components/StudentsList.tsx' },
      { name: 'InstructorsList', path: 'features/instructors/components/InstructorsList.tsx' },
      { name: 'SessionsList', path: 'features/sessions/components/SessionsList.tsx' },
      { name: 'GroupsList', path: 'features/courses/components/GroupsList.tsx' },
    ];

    for (const comp of listComponents) {
      it(`${comp.name} should use mobile-stacking filter toolbars`, () => {
        const content = fs.readFileSync(path.join(rootDir, comp.path), 'utf-8');
        assert.ok(
          content.includes('flex w-full flex-col') && content.includes('sm:w-auto sm:flex-row'),
          `${comp.name} filter toolbar must stack vertically on mobile and horizontally on tablet/desktop`
        );
      });
    }
  });

  describe('Responsive Table Horizontal Scroll Wrappers', () => {
    it('DataTable component should encapsulate tables in an overflow container', () => {
      const tablePrimitive = fs.readFileSync(path.join(rootDir, 'components/ui/table.tsx'), 'utf-8');
      assert.ok(
        tablePrimitive.includes('overflow-x-auto'),
        'table.tsx must wrap table elements with overflow-x-auto to prevent mobile viewport blowout'
      );
    });

    const customTableComponents = [
      { name: 'SessionsList', path: 'features/sessions/components/SessionsList.tsx', minWidth: 'min-w-[750px]' },
      { name: 'AttendancePage', path: 'features/sessions/components/AttendancePage.tsx', minWidth: 'min-w-[700px]' },
    ];

    for (const comp of customTableComponents) {
      it(`${comp.name} custom table should have overflow-x-auto and explicit min-width`, () => {
        const content = fs.readFileSync(path.join(rootDir, comp.path), 'utf-8');
        assert.ok(
          content.includes('overflow-x-auto') && content.includes(comp.minWidth),
          `${comp.name} table must have overflow-x-auto and min-width to support mobile horizontal scroll`
        );
      });
    }
  });

  describe('Modal / Dialog Responsive Actions', () => {
    const modalComponents = [
      { name: 'CoursesList', path: 'features/courses/components/CoursesList.tsx' },
      { name: 'StudentsList', path: 'features/students/components/StudentsList.tsx' },
      { name: 'InstructorsList', path: 'features/instructors/components/InstructorsList.tsx' },
      { name: 'SessionsList', path: 'features/sessions/components/SessionsList.tsx' },
      { name: 'GroupsList', path: 'features/courses/components/GroupsList.tsx' },
    ];

    for (const comp of modalComponents) {
      it(`${comp.name} modal footers should stack buttons on mobile and align on sm+`, () => {
        const content = fs.readFileSync(path.join(rootDir, comp.path), 'utf-8');
        assert.ok(
          content.includes('flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end') ||
            content.includes('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'),
          `${comp.name} modal footer must use flex-col-reverse for easy thumb reach on mobile`
        );
      });
    }
  });

  describe('Grid Breakpoint Scalability', () => {
    it('Course grids should scale from 1 column on mobile to 2 on sm and 3 on xl', () => {
      const coursesContent = fs.readFileSync(path.join(rootDir, 'features/courses/components/CoursesList.tsx'), 'utf-8');
      assert.ok(
        coursesContent.includes('sm:grid-cols-2') && coursesContent.includes('xl:grid-cols-3'),
        'CoursesList grid should scale adaptively'
      );
    });

    it('Schedule week view should scale across breakpoints', () => {
      const scheduleContent = fs.readFileSync(path.join(rootDir, 'features/sessions/components/ScheduleView.tsx'), 'utf-8');
      assert.ok(
        scheduleContent.includes('md:grid-cols-2') && scheduleContent.includes('xl:grid-cols-4'),
        'ScheduleView day grid must adapt across mobile, tablet, and desktop'
      );
    });
  });
});
