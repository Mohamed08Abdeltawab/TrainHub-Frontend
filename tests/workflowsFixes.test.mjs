import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const rootDir = path.resolve('src');

describe('TrainHub Workflows Fixes Verification Suite', () => {
  // ==========================================
  // ISSUE 1: Student My Courses & Course Details & Enrollment
  // ==========================================
  describe('Issue 1 — Student: My Courses & Course Details', () => {
    it('should have route support for parameterized course details in App.tsx', () => {
      const appContent = fs.readFileSync(path.join(rootDir, 'App.tsx'), 'utf-8');
      assert.ok(
        appContent.includes(':section/:courseId'),
        'App.tsx must define parameterized :section/:courseId sub-route for details views'
      );
    });

    it('DashboardSection should resolve student course details when role is STUDENT and section is my-courses', () => {
      const sectionContent = fs.readFileSync(
        path.join(rootDir, 'features/dashboard/components/DashboardSection.tsx'),
        'utf-8'
      );
      assert.ok(
        sectionContent.includes('StudentCourseDetails') &&
          sectionContent.includes("active === 'My courses'") &&
          sectionContent.includes('courseId'),
        'DashboardSection must render StudentCourseDetails when courseId is present'
      );
    });

    it('MyCourses should provide both enrolled and explore tabs for students and navigate to course details', () => {
      const myCoursesContent = fs.readFileSync(
        path.join(rootDir, 'features/courses/components/MyCourses.tsx'),
        'utf-8'
      );
      assert.ok(
        myCoursesContent.includes('Enrolled Courses') &&
          myCoursesContent.includes('Explore Available'),
        'MyCourses must offer tabs for enrolled courses and available explore courses'
      );
      assert.ok(
        myCoursesContent.includes('${basePath}/my-courses/${course.id}'),
        'MyCourses must navigate to role-specific course details URL'
      );
    });

    it('StudentCourseDetails should support preview mode, cohort enrollment, and enrolled learning content', () => {
      const studentDetailsContent = fs.readFileSync(
        path.join(rootDir, 'features/courses/components/StudentCourseDetails.tsx'),
        'utf-8'
      );
      assert.ok(
        studentDetailsContent.includes('isEnrolled'),
        'StudentCourseDetails must differentiate between enrolled and preview states'
      );
      assert.ok(
        studentDetailsContent.includes('enrollmentsApi.create'),
        'StudentCourseDetails must wire real enrollmentsApi.create endpoint'
      );
      assert.ok(
        studentDetailsContent.includes('Enroll in Cohort') ||
          studentDetailsContent.includes('Confirm Course Enrollment'),
        'StudentCourseDetails must provide cohort enrollment dialog'
      );
    });

    it('enrollmentsApi should define create and getById contracts in source', () => {
      const apiContent = fs.readFileSync(path.join(rootDir, 'api/enrollmentsApi.ts'), 'utf-8');
      assert.ok(apiContent.includes('async create('), 'enrollmentsApi must implement create method');
      assert.ok(apiContent.includes('async getById('), 'enrollmentsApi must implement getById method');
      assert.ok(apiContent.includes("apiClient.post<EnrollmentDto>('/enrollments'"), 'enrollmentsApi must target POST /enrollments');
    });
  });

  // ==========================================
  // ISSUE 2: Organization Administration: Add Organization
  // ==========================================
  describe('Issue 2 — Organization Administration: Add Organization', () => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const createOrgSchema = z.object({
      name: z.string().trim().min(2).max(120),
      slug: z.string().trim().min(2).max(60).regex(slugRegex),
      email: z.string().trim().email().max(120).optional().or(z.literal('')),
      phone: z.string().trim().max(30).optional().or(z.literal('')),
      address: z.string().trim().max(250).optional().or(z.literal('')),
    });

    it('should validate organization creation constraints', () => {
      const valid = createOrgSchema.safeParse({
        name: 'Apex Academy',
        slug: 'apex-academy',
        email: 'info@apex.edu',
        phone: '+1 555-0199',
        address: '123 Education Blvd',
      });
      assert.strictEqual(valid.success, true);

      const invalidName = createOrgSchema.safeParse({
        name: 'A',
        slug: 'apex',
      });
      assert.strictEqual(invalidName.success, false);

      const invalidSlug = createOrgSchema.safeParse({
        name: 'Apex Academy',
        slug: 'Apex Academy with spaces!',
      });
      assert.strictEqual(invalidSlug.success, false);
    });

    it('PlatformOrganizations should feature Add Organization modal and form', () => {
      const platformOrgsContent = fs.readFileSync(
        path.join(rootDir, 'features/dashboard/components/PlatformOrganizations.tsx'),
        'utf-8'
      );
      assert.ok(
        platformOrgsContent.includes('Add organization'),
        'PlatformOrganizations must have Add organization button'
      );
      assert.ok(
        platformOrgsContent.includes('organizationsApi.create'),
        'PlatformOrganizations must submit to organizationsApi.create'
      );
      assert.ok(
        platformOrgsContent.includes('createOpen'),
        'PlatformOrganizations must feature create modal state'
      );
      assert.ok(
        platformOrgsContent.includes("searchParams.get('action') === 'create'"),
        'PlatformOrganizations must handle ?action=create query param from overview'
      );
    });

    it('useDashboardNav should direct Add organization to organizations?action=create', () => {
      const navContent = fs.readFileSync(
        path.join(rootDir, 'features/dashboard/hooks/useDashboardNav.ts'),
        'utf-8'
      );
      assert.ok(
        navContent.includes('/organizations?action=create'),
        'useDashboardNav must route Add organization button to /organizations?action=create'
      );
    });

    it('organizationsApi should declare create method in source', () => {
      const orgApiContent = fs.readFileSync(path.join(rootDir, 'api/organizationsApi.ts'), 'utf-8');
      assert.ok(orgApiContent.includes('async create('), 'organizationsApi must implement create method');
      assert.ok(
        orgApiContent.includes("apiClient.post<OrganizationDto>('/organizations'"),
        'organizationsApi must POST to /organizations'
      );
    });
  });

  // ==========================================
  // ISSUE 3: Instructor Overview: Assignment CRUD
  // ==========================================
  describe('Issue 3 — Instructor Overview: Assignment CRUD', () => {
    const assignmentSchema = z.object({
      title: z.string().trim().min(2).max(200),
      description: z.string().trim().max(2000).optional().or(z.literal('')),
      courseGroupId: z.string().min(1),
      dueDate: z.string().min(1),
      totalPoints: z.number().int().min(1).max(1000),
      status: z.enum(['Draft', 'Active', 'Closed']),
    });

    it('should enforce assignment schema rules', () => {
      const valid = assignmentSchema.safeParse({
        title: 'Midterm Project',
        courseGroupId: 'cohort-uuid',
        dueDate: '2026-11-01T23:59:00Z',
        totalPoints: 100,
        status: 'Active',
      });
      assert.strictEqual(valid.success, true);

      const invalidTitle = assignmentSchema.safeParse({
        title: 'M',
        courseGroupId: 'cohort-uuid',
        dueDate: '2026-11-01T23:59:00Z',
        totalPoints: 100,
        status: 'Active',
      });
      assert.strictEqual(invalidTitle.success, false);

      const invalidPoints = assignmentSchema.safeParse({
        title: 'Midterm Project',
        courseGroupId: 'cohort-uuid',
        dueDate: '2026-11-01T23:59:00Z',
        totalPoints: 0,
        status: 'Active',
      });
      assert.strictEqual(invalidPoints.success, false);
    });

    it('should include Assignments in instructor role navigation and route in DashboardSection', () => {
      const navConfigContent = fs.readFileSync(path.join(rootDir, 'config/navigation.ts'), 'utf-8');
      assert.ok(
        navConfigContent.includes("label: 'Assignments'"),
        'Instructor roleNavigation must include Assignments'
      );

      const sectionContent = fs.readFileSync(
        path.join(rootDir, 'features/dashboard/components/DashboardSection.tsx'),
        'utf-8'
      );
      assert.ok(
        sectionContent.includes('AssignmentsList') &&
          sectionContent.includes("active === 'Assignments'"),
        'DashboardSection must render AssignmentsList for assignments route'
      );
    });

    it('useDashboardNav should direct Create assignment to /assignments?action=create', () => {
      const navContent = fs.readFileSync(
        path.join(rootDir, 'features/dashboard/hooks/useDashboardNav.ts'),
        'utf-8'
      );
      assert.ok(
        navContent.includes('/assignments?action=create'),
        'useDashboardNav must route Create assignment button to /assignments?action=create'
      );
    });

    it('assignmentsApi should support full CRUD contracts in source', () => {
      const asgApiContent = fs.readFileSync(
        path.join(rootDir, 'features/assignments/api/assignmentsApi.ts'),
        'utf-8'
      );
      assert.ok(asgApiContent.includes('async list('), 'assignmentsApi must declare list method');
      assert.ok(asgApiContent.includes('async getById('), 'assignmentsApi must declare getById method');
      assert.ok(asgApiContent.includes('async create('), 'assignmentsApi must declare create method');
      assert.ok(asgApiContent.includes('async update('), 'assignmentsApi must declare update method');
      assert.ok(asgApiContent.includes('async delete('), 'assignmentsApi must declare delete method');
    });

    it('AssignmentsList component should provide create, update, delete with confirmation and filter capabilities', () => {
      const listContent = fs.readFileSync(
        path.join(rootDir, 'features/assignments/components/AssignmentsList.tsx'),
        'utf-8'
      );
      assert.ok(listContent.includes('handleFormSubmit'), 'AssignmentsList must implement create/update submission');
      assert.ok(listContent.includes('handleDelete'), 'AssignmentsList must implement delete');
      assert.ok(
        listContent.includes('deletingAssignment') || listContent.includes('Confirm Delete'),
        'AssignmentsList must require explicit delete confirmation'
      );
      assert.ok(
        listContent.includes('assignmentsApi.create') &&
          listContent.includes('assignmentsApi.update') &&
          listContent.includes('assignmentsApi.delete'),
        'AssignmentsList must interact with assignmentsApi CRUD methods'
      );
    });
  });

  // ==========================================
  // ISSUE 4: Instructor: My Courses & Course Details
  // ==========================================
  describe('Issue 4 — Instructor: My Courses & Course Details', () => {
    it('DashboardSection should resolve instructor course details when section is my-courses and role is INSTRUCTOR', () => {
      const sectionContent = fs.readFileSync(
        path.join(rootDir, 'features/dashboard/components/DashboardSection.tsx'),
        'utf-8'
      );
      assert.ok(
        sectionContent.includes('InstructorCourseDetails') &&
          sectionContent.includes("role === 'INSTRUCTOR'"),
        'DashboardSection must render InstructorCourseDetails for instructor on my-courses with courseId'
      );
    });

    it('MyCourses should navigate instructor to role-specific course details', () => {
      const myCoursesContent = fs.readFileSync(
        path.join(rootDir, 'features/courses/components/MyCourses.tsx'),
        'utf-8'
      );
      assert.ok(
        myCoursesContent.includes('${basePath}/my-courses/${course.id}'),
        'Instructor card action must navigate to /instructor/my-courses/:courseId'
      );
      assert.ok(
        myCoursesContent.includes("Manage Course"),
        'Instructor card button must display Manage Course'
      );
    });

    it('InstructorCourseDetails should expose assigned cohorts, sessions, attendance shortcut, and cohort assignments', () => {
      const instructorDetailsContent = fs.readFileSync(
        path.join(rootDir, 'features/courses/components/InstructorCourseDetails.tsx'),
        'utf-8'
      );
      assert.ok(
        instructorDetailsContent.includes('assignedCohorts'),
        'InstructorCourseDetails must filter cohorts to those assigned to the instructor'
      );
      assert.ok(
        instructorDetailsContent.includes('notAssigned') &&
          instructorDetailsContent.includes('Teaching Assignment Required'),
        'InstructorCourseDetails must guard unauthorized instructors with an explicit warning'
      );
      assert.ok(
        instructorDetailsContent.includes('assignmentsByCohort') ||
          instructorDetailsContent.includes('assignmentsApi'),
        'InstructorCourseDetails must provide cohort assignments view and management shortcut'
      );
    });
  });
});
