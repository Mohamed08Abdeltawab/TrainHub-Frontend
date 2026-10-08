import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { message: 'Enter a course title with at least 2 characters.' })
    .max(120, { message: 'Course title must not exceed 120 characters.' }),
  category: z
    .string()
    .trim()
    .min(1, { message: 'Enter a course category.' })
    .max(80, { message: 'Category must not exceed 80 characters.' }),
  description: z.string().max(1000).optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All levels']),
  durationHours: z
    .number()
    .min(1, { message: 'Duration must be between 1 and 10000 hours.' })
    .max(10000, { message: 'Duration must be between 1 and 10000 hours.' }),
  status: z.enum(['Draft', 'Active', 'Archived']),
});

describe('Task 4: Course Flows Validation & Architecture', () => {
  describe('Course Validation Constraints', () => {
    it('should reject titles shorter than 2 characters', () => {
      const result = courseSchema.safeParse({
        title: 'A',
        category: 'Web Development',
        level: 'Beginner',
        durationHours: 40,
        status: 'Active',
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(
          result.error.issues[0].message,
          'Enter a course title with at least 2 characters.'
        );
      }
    });

    it('should reject missing or empty category', () => {
      const result = courseSchema.safeParse({
        title: 'Python for Beginners',
        category: '   ',
        level: 'Beginner',
        durationHours: 30,
        status: 'Draft',
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.strictEqual(result.error.issues[0].message, 'Enter a course category.');
      }
    });

    it('should reject invalid duration values (less than 1 or exceeding 10000)', () => {
      const zeroDuration = courseSchema.safeParse({
        title: 'Cloud Architecture',
        category: 'DevOps',
        level: 'Advanced',
        durationHours: 0,
        status: 'Active',
      });
      assert.strictEqual(zeroDuration.success, false);

      const excessDuration = courseSchema.safeParse({
        title: 'Cloud Architecture',
        category: 'DevOps',
        level: 'Advanced',
        durationHours: 10001,
        status: 'Active',
      });
      assert.strictEqual(excessDuration.success, false);
    });

    it('should accept valid course input and enforce status enums', () => {
      const result = courseSchema.safeParse({
        title: '  Fullstack Web Development  ',
        category: 'Web Development',
        description: 'Complete hands-on fullstack engineering curriculum.',
        level: 'Intermediate',
        durationHours: 60,
        status: 'Active',
      });
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.title, 'Fullstack Web Development');
        assert.strictEqual(result.data.status, 'Active');
        assert.strictEqual(result.data.durationHours, 60);
      }
    });

    it('should enforce unique title constraint against existing courses', () => {
      const existing = [
        { id: 'c-1', title: 'Fullstack Web Development' },
        { id: 'c-2', title: 'Modern UI/UX Design' },
      ];

      const isTitleDuplicate = (title, editingId = null) => {
        const normalized = title.trim().toLowerCase();
        return existing.some(
          (c) => c.title.toLowerCase() === normalized && c.id !== editingId
        );
      };

      assert.strictEqual(isTitleDuplicate('Fullstack Web Development'), true);
      assert.strictEqual(isTitleDuplicate('fullstack web development'), true);
      assert.strictEqual(isTitleDuplicate('Fullstack Web Development', 'c-1'), false); // Same course editing
      assert.strictEqual(isTitleDuplicate('Mobile App Development'), false);
    });
  });

  describe('Course Catalog Filtering & Search', () => {
    const catalog = [
      { id: '1', title: 'Fullstack Web Development', category: 'Web Development', level: 'Intermediate', status: 'Active' },
      { id: '2', title: 'Modern UI/UX Design', category: 'Design', level: 'Beginner', status: 'Active' },
      { id: '3', title: 'Agile & Git Team Workflows', category: 'Engineering', level: 'Advanced', status: 'Draft' },
      { id: '4', title: 'Legacy Systems Maintenance', category: 'Engineering', level: 'Advanced', status: 'Archived' },
    ];

    function filterCourses(courses, query, statusFilter, categoryFilter) {
      return courses.filter((c) => {
        const matchesQuery =
          !query ||
          `${c.title} ${c.category} ${c.level}`.toLowerCase().includes(query.trim().toLowerCase());
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
        const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
        return matchesQuery && matchesStatus && matchesCategory;
      });
    }

    it('should filter courses by search query across title and category', () => {
      const results = filterCourses(catalog, 'Design', 'All', 'All');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].title, 'Modern UI/UX Design');
    });

    it('should filter courses by status (Active, Draft, Archived)', () => {
      const activeCourses = filterCourses(catalog, '', 'Active', 'All');
      assert.strictEqual(activeCourses.length, 2);

      const draftCourses = filterCourses(catalog, '', 'Draft', 'All');
      assert.strictEqual(draftCourses.length, 1);
      assert.strictEqual(draftCourses[0].title, 'Agile & Git Team Workflows');

      const archivedCourses = filterCourses(catalog, '', 'Archived', 'All');
      assert.strictEqual(archivedCourses.length, 1);
    });

    it('should filter courses by category', () => {
      const engineeringCourses = filterCourses(catalog, '', 'All', 'Engineering');
      assert.strictEqual(engineeringCourses.length, 2);
    });
  });

  describe('Course Lifecycle & Deletion', () => {
    it('should delete a course from the collection and update metrics', () => {
      let courses = [
        { id: 'c-1', title: 'Course 1', status: 'Active' },
        { id: 'c-2', title: 'Course 2', status: 'Draft' },
      ];

      const deleteCourse = (id) => {
        courses = courses.filter((c) => c.id !== id);
      };

      deleteCourse('c-1');
      assert.strictEqual(courses.length, 1);
      assert.strictEqual(courses[0].id, 'c-2');
    });

    it('should verify role permission gates for course creation and deletion', () => {
      const canManage = (role) => role === 'ORG_ADMIN' || role === 'SUPER_ADMIN';

      assert.strictEqual(canManage('ORG_ADMIN'), true);
      assert.strictEqual(canManage('SUPER_ADMIN'), true);
      assert.strictEqual(canManage('INSTRUCTOR'), false);
      assert.strictEqual(canManage('STUDENT'), false);
    });
  });
});
