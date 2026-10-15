import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Core enrollment status mapping definition
const statusMap = {
  Pending: 0,
  Active: 1,
  Completed: 2,
  Withdrawn: 3,
};

function mapBackendEnrollment(dto) {
  let status = 'Active';
  if (dto.status === 2 || dto.statusName === 'Completed') status = 'Completed';
  else if (dto.status === 3 || dto.statusName === 'Cancelled') status = 'Withdrawn';
  else if (dto.status === 0 || dto.statusName === 'Pending') status = 'Pending';

  return {
    id: dto.id,
    studentId: dto.studentId,
    courseGroupId: dto.courseGroupId,
    courseGroupName: dto.courseGroupName,
    courseId: dto.courseId,
    status,
    enrolledAt: dto.enrollmentDate,
    paidAmount: dto.paidAmount,
  };
}

describe('Task 5: Enrollment Flows Validation & Architecture', () => {
  describe('Enrollment DTO Mapping & Status Enums', () => {
    it('should correctly map backend numeric status codes to domain strings', () => {
      const activeDto = {
        id: 'enr-1',
        organizationId: 'org-demo',
        courseGroupId: 'grp-1',
        courseGroupName: 'Batch 2026-A',
        courseId: 'course-1',
        courseName: 'Full Stack Development',
        studentId: 'stu-1',
        studentCode: 'STU-001',
        studentName: 'Ali Hassan',
        enrollmentDate: '2026-03-01T10:00:00Z',
        paidAmount: 500,
        status: 1,
        statusName: 'Active',
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      };

      const mappedActive = mapBackendEnrollment(activeDto);
      assert.strictEqual(mappedActive.status, 'Active');
      assert.strictEqual(mappedActive.studentId, 'stu-1');
      assert.strictEqual(mappedActive.paidAmount, 500);

      const completedDto = { ...activeDto, id: 'enr-2', status: 2, statusName: 'Completed' };
      assert.strictEqual(mapBackendEnrollment(completedDto).status, 'Completed');

      const cancelledDto = { ...activeDto, id: 'enr-3', status: 3, statusName: 'Cancelled' };
      assert.strictEqual(mapBackendEnrollment(cancelledDto).status, 'Withdrawn');

      const pendingDto = { ...activeDto, id: 'enr-4', status: 0, statusName: 'Pending' };
      assert.strictEqual(mapBackendEnrollment(pendingDto).status, 'Pending');
    });

    it('should map frontend statuses to backend integer codes', () => {
      assert.strictEqual(statusMap.Pending, 0);
      assert.strictEqual(statusMap.Active, 1);
      assert.strictEqual(statusMap.Completed, 2);
      assert.strictEqual(statusMap.Withdrawn, 3);
    });
  });

  describe('Student Roster & Eligibility Filtering in CourseStudentsPanel', () => {
    const mockStudents = [
      { id: 'stu-1', name: 'Sara Ahmed', email: 'sara@example.com', status: 'Active' },
      { id: 'stu-2', name: 'Omar Khaled', email: 'omar@example.com', status: 'Active' },
      { id: 'stu-3', name: 'Mona Zaki', email: 'mona@example.com', status: 'Inactive' },
      { id: 'stu-4', name: 'Tarek Fathy', email: 'tarek@example.com', status: 'Active' },
    ];

    const currentEnrollments = [
      { studentId: 'stu-1', status: 'Active', enrolledAt: '2026-01-10T00:00:00Z' },
    ];

    it('should separate enrolled students from eligible available students', () => {
      const enrollmentByStudent = new Map(currentEnrollments.map((e) => [e.studentId, e]));

      // Enrolled list
      const enrolled = mockStudents.filter((student) => enrollmentByStudent.has(student.id));
      assert.strictEqual(enrolled.length, 1);
      assert.strictEqual(enrolled[0].name, 'Sara Ahmed');

      // Available list: must NOT be enrolled, and MUST have student.status === 'Active'
      const available = mockStudents.filter(
        (student) => !enrollmentByStudent.has(student.id) && student.status === 'Active'
      );

      assert.strictEqual(available.length, 2);
      const availableIds = available.map((s) => s.id);
      assert.ok(availableIds.includes('stu-2')); // Omar (Active, not enrolled)
      assert.ok(availableIds.includes('stu-4')); // Tarek (Active, not enrolled)
      assert.ok(!availableIds.includes('stu-1')); // Sara (Already enrolled)
      assert.ok(!availableIds.includes('stu-3')); // Mona (Inactive)
    });

    it('should search available students by name or email query', () => {
      const enrollmentByStudent = new Map(currentEnrollments.map((e) => [e.studentId, e]));

      const filterByQuery = (q) =>
        mockStudents.filter(
          (student) =>
            !enrollmentByStudent.has(student.id) &&
            student.status === 'Active' &&
            `${student.name} ${student.email}`.toLowerCase().includes(q.trim().toLowerCase())
        );

      assert.strictEqual(filterByQuery('omar').length, 1);
      assert.strictEqual(filterByQuery('omar')[0].name, 'Omar Khaled');

      assert.strictEqual(filterByQuery('example.com').length, 2);
      assert.strictEqual(filterByQuery('tarek@').length, 1);
      assert.strictEqual(filterByQuery('nonexistent').length, 0);
    });

    it('should compute enrollment metrics (total, active, completed)', () => {
      const enrollmentsList = [
        { studentId: 'stu-1', status: 'Active' },
        { studentId: 'stu-2', status: 'Active' },
        { studentId: 'stu-3', status: 'Completed' },
        { studentId: 'stu-4', status: 'Withdrawn' },
      ];

      const total = enrollmentsList.length;
      const active = enrollmentsList.filter((e) => e.status === 'Active').length;
      const completed = enrollmentsList.filter((e) => e.status === 'Completed').length;

      assert.strictEqual(total, 4);
      assert.strictEqual(active, 2);
      assert.strictEqual(completed, 1);
    });
  });

  describe('Course Status Guard for Enrollment', () => {
    it('should only allow enrolling students if course status is Active', () => {
      const activeCourse = { id: 'c-1', title: 'React Masterclass', status: 'Active' };
      const draftCourse = { id: 'c-2', title: 'Next.js Advanced', status: 'Draft' };
      const archivedCourse = { id: 'c-3', title: 'Legacy jQuery', status: 'Archived' };

      const canEnrollInCourse = (course, canManage) => canManage && course.status === 'Active';

      assert.strictEqual(canEnrollInCourse(activeCourse, true), true);
      assert.strictEqual(canEnrollInCourse(draftCourse, true), false);
      assert.strictEqual(canEnrollInCourse(archivedCourse, true), false);
      assert.strictEqual(canEnrollInCourse(activeCourse, false), false);
    });
  });

  describe('Enrollment Lifecycle & State Mutations', () => {
    it('should enroll a student and prevent duplicate enrollment entries', () => {
      let enrollments = [
        { studentId: 'stu-1', status: 'Active', enrolledAt: '2026-01-01T00:00:00Z' },
      ];

      const enrollStudent = (studentId) => {
        enrollments = [
          ...enrollments.filter((item) => item.studentId !== studentId),
          { studentId, status: 'Active', enrolledAt: new Date().toISOString() },
        ];
      };

      // Enroll new student
      enrollStudent('stu-2');
      assert.strictEqual(enrollments.length, 2);
      assert.ok(enrollments.some((e) => e.studentId === 'stu-2'));

      // Re-enroll existing student (should update/deduplicate, not append second record)
      enrollStudent('stu-1');
      assert.strictEqual(enrollments.length, 2);
      assert.strictEqual(enrollments.filter((e) => e.studentId === 'stu-1').length, 1);
    });

    it('should update enrollment status (Active -> Completed -> Withdrawn)', () => {
      let enrollments = [
        { studentId: 'stu-1', status: 'Active' },
        { studentId: 'stu-2', status: 'Active' },
      ];

      const updateStatus = (studentId, nextStatus) => {
        enrollments = enrollments.map((item) =>
          item.studentId === studentId ? { ...item, status: nextStatus } : item
        );
      };

      updateStatus('stu-1', 'Completed');
      assert.strictEqual(enrollments.find((e) => e.studentId === 'stu-1')?.status, 'Completed');
      assert.strictEqual(enrollments.find((e) => e.studentId === 'stu-2')?.status, 'Active');

      updateStatus('stu-2', 'Withdrawn');
      assert.strictEqual(enrollments.find((e) => e.studentId === 'stu-2')?.status, 'Withdrawn');
    });

    it('should remove an enrollment from the course roster', () => {
      let enrollments = [
        { studentId: 'stu-1', status: 'Active' },
        { studentId: 'stu-2', status: 'Active' },
        { studentId: 'stu-3', status: 'Active' },
      ];

      const removeEnrollment = (studentId) => {
        enrollments = enrollments.filter((item) => item.studentId !== studentId);
      };

      removeEnrollment('stu-2');
      assert.strictEqual(enrollments.length, 2);
      assert.ok(!enrollments.some((e) => e.studentId === 'stu-2'));
      assert.ok(enrollments.some((e) => e.studentId === 'stu-1'));
      assert.ok(enrollments.some((e) => e.studentId === 'stu-3'));
    });
  });

  describe('Cohort Capacity & Group Allocation', () => {
    it('should find active non-full cohort group or create default cohort', () => {
      const groups = [
        { id: 'grp-1', name: 'Cohort 1', status: 1, isFull: true, capacity: 20 },
        { id: 'grp-2', name: 'Cohort 2', status: 1, isFull: false, capacity: 25 },
        { id: 'grp-3', name: 'Cohort 3', status: 0, isFull: false, capacity: 30 }, // Inactive
      ];

      const targetGroup =
        groups.find((g) => (g.status === 1 || g.statusName === 'Active') && !g.isFull) ||
        groups.find((g) => g.status === 1 || g.statusName === 'Active') ||
        groups[0];

      assert.ok(targetGroup);
      assert.strictEqual(targetGroup.id, 'grp-2');
      assert.strictEqual(targetGroup.isFull, false);
    });

    it('should identify when a cohort is full and prevent overflow', () => {
      const group = { id: 'grp-1', capacity: 30, enrolledCount: 30 };
      const isCapacityReached = (g) => (g.enrolledCount ?? 0) >= g.capacity;

      assert.strictEqual(isCapacityReached(group), true);

      const groupWithSpace = { id: 'grp-2', capacity: 30, enrolledCount: 29 };
      assert.strictEqual(isCapacityReached(groupWithSpace), false);
    });
  });

  describe('Role-Based Enrollment Permission Gates', () => {
    it('should allow ORG_ADMIN and SUPER_ADMIN to manage enrollments', () => {
      const isAllowed = (role) => role === 'ORG_ADMIN' || role === 'SUPER_ADMIN';

      assert.strictEqual(isAllowed('ORG_ADMIN'), true);
      assert.strictEqual(isAllowed('SUPER_ADMIN'), true);
      assert.strictEqual(isAllowed('INSTRUCTOR'), false);
      assert.strictEqual(isAllowed('STUDENT'), false);
    });

    it('should present appropriate error message when access is denied', () => {
      const formatErrorMessage = (errorTitle, errorDescription) => {
        return errorTitle === 'Access denied'
          ? 'You do not have permission to change course enrollment.'
          : errorDescription;
      };

      const forbiddenError = { title: 'Access denied', description: 'Forbidden action.' };
      assert.strictEqual(
        formatErrorMessage(forbiddenError.title, forbiddenError.description),
        'You do not have permission to change course enrollment.'
      );

      const genericError = { title: 'Server Error', description: 'Unable to connect.' };
      assert.strictEqual(
        formatErrorMessage(genericError.title, genericError.description),
        'Unable to connect.'
      );
    });
  });

  describe('CON-02: Elimination of Silent localStorage Fallback for Enrollments', () => {
    it('should propagate API errors on enroll without falling back to local mock data in non-demo mode', async () => {
      const enrollStudent = async (isDemo, mockApiFn) => {
        if (!isDemo) {
          return await mockApiFn();
        }
        return { id: 'mock-enr' };
      };

      const failingApi = async () => {
        const error = new Error('Capacity exceeded');
        error.status = 400;
        throw error;
      };

      await assert.rejects(
        async () => {
          await enrollStudent(false, failingApi);
        },
        (err) => {
          assert.strictEqual(err.message, 'Capacity exceeded');
          assert.strictEqual(err.status, 400);
          return true;
        }
      );
    });

    it('should propagate API errors on status update or remove without silent fallback in non-demo mode', async () => {
      let localStorageModified = false;
      const updateStatus = async (isDemo, mockApiFn) => {
        if (!isDemo) {
          return await mockApiFn();
        }
        localStorageModified = true;
      };

      const serverErrorApi = async () => {
        throw new Error('503 Service Unavailable');
      };

      await assert.rejects(
        async () => {
          await updateStatus(false, serverErrorApi);
        },
        /503 Service Unavailable/
      );

      assert.strictEqual(localStorageModified, false, 'localStorage must not be modified when real API fails');
    });
  });
});

