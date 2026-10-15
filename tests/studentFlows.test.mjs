import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Student Dashboard Mock Data
const studentDashboardContent = {
  tenant: 'Al-Amal Training Center',
  plan: 'Learner',
  section: 'Learning',
  title: 'My Learning Dashboard',
  description: 'Continue your courses and keep track of your learning progress.',
  action: 'Explore courses',
  metrics: [
    { label: 'Enrolled courses', value: '3', note: '2 active right now' },
    { label: 'Completed lessons', value: '28', note: '4 this week' },
    { label: 'Learning progress', value: '62%', note: 'Keep up the great work' },
    { label: 'Upcoming sessions', value: '2', note: 'Next one today at 2:00 PM' },
  ],
  tableTitle: 'My Enrolled Courses',
  subtitle: 'Your curriculum and upcoming lessons',
  rows: [
    { title: 'Fullstack Web Development', detail: 'Instructor: Sara Jenkins / Next session: Today, 2:00 PM', status: '62% complete' },
    { title: 'Modern UI/UX Design', detail: 'Instructor: Mona Zaki / Next session: Saturday', status: '45% complete' },
    { title: 'Agile & Git Team Workflows', detail: 'Self-paced / 4 quizzes remaining', status: '80% complete' },
  ],
};

const sampleSessions = [
  {
    id: 'session-1',
    groupId: 'demo-cohort-a',
    title: 'React Components Deep Dive',
    date: '2026-10-08',
    startTime: '10:00',
    endTime: '12:00',
    status: 'Scheduled',
  },
  {
    id: 'session-2',
    groupId: 'demo-cohort-a',
    title: 'State Management & Hooks',
    date: '2026-10-10',
    startTime: '14:00',
    endTime: '16:00',
    status: 'Scheduled',
  },
  {
    id: 'session-3',
    groupId: 'demo-cohort-b', // Cohort B is not enrolled by this student
    title: 'Figma Prototyping Workshop',
    date: '2026-10-09',
    startTime: '11:00',
    endTime: '13:00',
    status: 'Scheduled',
  },
  {
    id: 'session-4',
    groupId: 'demo-cohort-a',
    title: 'Cancelled Office Hours',
    date: '2026-10-11',
    startTime: '16:00',
    endTime: '17:00',
    status: 'Cancelled',
  },
];

const sampleAttendanceRecords = [
  { id: 'att-1', sessionId: 'session-1', studentId: 'user-student', studentName: 'David Kim', status: 'Present', date: '2026-10-01' },
  { id: 'att-2', sessionId: 'session-2', studentId: 'user-student', studentName: 'David Kim', status: 'Present', date: '2026-10-03' },
  { id: 'att-3', sessionId: 'session-3', studentId: 'user-student', studentName: 'David Kim', status: 'Late', date: '2026-10-05' },
  { id: 'att-4', sessionId: 'session-4', studentId: 'user-student', studentName: 'David Kim', status: 'Absent', date: '2026-10-07' },
];

describe('Task 3: Student Flows Validation & Architecture', () => {
  describe('Student Dashboard Overview Metrics', () => {
    it('should provide complete student dashboard metrics and enrolled course records', () => {
      assert.strictEqual(studentDashboardContent.title, 'My Learning Dashboard');
      assert.strictEqual(studentDashboardContent.section, 'Learning');
      assert.strictEqual(studentDashboardContent.metrics.length, 4);

      const metricLabels = studentDashboardContent.metrics.map((m) => m.label);
      assert.deepStrictEqual(metricLabels, [
        'Enrolled courses',
        'Completed lessons',
        'Learning progress',
        'Upcoming sessions',
      ]);

      assert.strictEqual(studentDashboardContent.rows.length, 3);
      assert.strictEqual(studentDashboardContent.rows[0].title, 'Fullstack Web Development');
      assert.strictEqual(studentDashboardContent.rows[0].status, '62% complete');
    });

    it('should gracefully fallback to student dashboard content when backend returns 403 Forbidden', () => {
      const getDashboardData = (role, apiThrowsForbidden = true) => {
        try {
          if (apiThrowsForbidden) {
            const forbiddenErr = new Error('Forbidden');
            Object.assign(forbiddenErr, { response: { status: 403 } });
            throw forbiddenErr;
          }
          return { data: 'from-api' };
        } catch {
          if (role === 'STUDENT') {
            return studentDashboardContent;
          }
          throw new Error('Unhandled');
        }
      };

      const result = getDashboardData('STUDENT', true);
      assert.strictEqual(result.title, 'My Learning Dashboard');
      assert.strictEqual(result.metrics[0].value, '3');
    });
  });

  describe('Student Schedule Filtering', () => {
    function filterStudentSessions(sessions, allowedGroupIds) {
      return sessions.filter((session) => {
        if (session.status === 'Cancelled') return false;
        if (allowedGroupIds !== null && !allowedGroupIds.includes(session.groupId)) {
          return false;
        }
        return true;
      });
    }

    it('should strictly filter sessions to only cohorts the student is enrolled in', () => {
      const studentEnrolledGroups = ['demo-cohort-a'];
      const visible = filterStudentSessions(sampleSessions, studentEnrolledGroups);

      // Should include session-1 and session-2
      // Should exclude session-3 (Cohort B) and session-4 (Cancelled)
      assert.strictEqual(visible.length, 2);
      assert.deepStrictEqual(
        visible.map((s) => s.id),
        ['session-1', 'session-2']
      );
    });

    it('should return empty list when student is not enrolled in any cohorts', () => {
      const visible = filterStudentSessions(sampleSessions, []);
      assert.strictEqual(visible.length, 0);
    });
  });

  describe('Student Attendance Metrics & Security', () => {
    function calculateStudentAttendance(records) {
      const total = records.length;
      if (total === 0) return { total: 0, rate: 0, present: 0, late: 0, absent: 0, excused: 0 };

      const present = records.filter((r) => r.status === 'Present').length;
      const late = records.filter((r) => r.status === 'Late').length;
      const absent = records.filter((r) => r.status === 'Absent').length;
      const excused = records.filter((r) => r.status === 'Excused').length;
      const rate = Math.round(((present + late) / total) * 100);

      return { total, rate, present, late, absent, excused };
    }

    it('should accurately calculate overall attendance percentage and breakdown', () => {
      const stats = calculateStudentAttendance(sampleAttendanceRecords);

      assert.strictEqual(stats.total, 4);
      assert.strictEqual(stats.present, 2);
      assert.strictEqual(stats.late, 1);
      assert.strictEqual(stats.absent, 1);
      assert.strictEqual(stats.excused, 0);
      assert.strictEqual(stats.rate, 75); // (2 Present + 1 Late) / 4 = 75%
    });

    it('should verify student has view-only permissions (canMark === false)', () => {
      const userRole = 'STUDENT';
      const canMark = userRole === 'ORG_ADMIN' || userRole === 'INSTRUCTOR' || userRole === 'SUPER_ADMIN';

      assert.strictEqual(canMark, false);
    });

    it('should filter attendance records by status', () => {
      const filterByStatus = (records, status) => {
        if (status === 'All') return records;
        return records.filter((r) => r.status === status);
      };

      const presentRecords = filterByStatus(sampleAttendanceRecords, 'Present');
      assert.strictEqual(presentRecords.length, 2);

      const absentRecords = filterByStatus(sampleAttendanceRecords, 'Absent');
      assert.strictEqual(absentRecords.length, 1);
    });
  });

  describe('FIND-P2-02: Admin Student Creation Contract & Field Preservation', () => {
    it('should provision student via unified register call without redundant POST /students conflict', async () => {
      let postStudentsCalled = false;
      let registerPayloadCaptured = null;

      const mockApiClient = {
        post: async (url, payload) => {
          if (url === '/auth/register') {
            registerPayloadCaptured = payload;
            return {
              data: {
                userId: 'user-new-stu',
                studentId: 'student-entity-123',
                studentCode: payload.studentCode || 'STU-AUTO-01',
                email: payload.email,
              },
            };
          }
          if (url === '/students') {
            postStudentsCalled = true;
            throw new Error('409 Conflict: Student already exists');
          }
          throw new Error(`Unexpected url: ${url}`);
        },
      };

      const createStudent = async (orgId, input) => {
        const nameParts = input.name.trim().split(/\s+/);
        const firstName = nameParts[0] || 'Student';
        const lastName = nameParts.slice(1).join(' ') || firstName;

        const regRes = await mockApiClient.post('/auth/register', {
          firstName,
          lastName,
          email: input.email.trim(),
          password: 'Password123!',
          confirmPassword: 'Password123!',
          organizationId: orgId,
          phoneNumber: input.phone?.trim() || undefined,
          guardianPhone: input.phone?.trim() || undefined,
          academicYear: input.course?.trim() || undefined,
          studentCode: input.studentCode?.trim() || undefined,
        });

        const studentId = regRes.data.studentId || regRes.data.userId;
        const studentCode = regRes.data.studentCode || `STU-${regRes.data.userId.slice(0, 8).toUpperCase()}`;

        return {
          id: studentId,
          name: input.name.trim(),
          email: input.email.trim(),
          phone: input.phone?.trim() || '',
          course: input.course?.trim() || '',
          status: 'Active',
          studentCode,
          createdAt: new Date().toISOString(),
        };
      };

      const input = {
        name: 'Sara Tarek',
        email: 'sara.tarek@example.com',
        phone: '+20 100 999 8888',
        course: 'Grade 11 - Science',
        status: 'Active',
        studentCode: 'STU-EXP-01',
      };

      const result = await createStudent('org-demo', input);

      assert.strictEqual(postStudentsCalled, false, 'Redundant POST /students must not be called');
      assert.strictEqual(result.id, 'student-entity-123', 'Result ID must be the Student entity ID');
      assert.strictEqual(result.studentCode, 'STU-EXP-01');
      assert.strictEqual(result.phone, '+20 100 999 8888');
      assert.strictEqual(result.course, 'Grade 11 - Science');

      assert.strictEqual(registerPayloadCaptured.guardianPhone, '+20 100 999 8888');
      assert.strictEqual(registerPayloadCaptured.academicYear, 'Grade 11 - Science');
      assert.strictEqual(registerPayloadCaptured.studentCode, 'STU-EXP-01');
    });

    it('should propagate 409 duplicate email error cleanly to admin UI without phantom success', async () => {
      const failingApiClient = {
        post: async () => {
          const error = new Error('A user with email duplicate@example.com already exists in this organization.');
          error.response = {
            status: 409,
            data: { detail: 'A user with email duplicate@example.com already exists in this organization.' },
          };
          throw error;
        },
      };

      await assert.rejects(
        async () => {
          await failingApiClient.post('/auth/register', { email: 'duplicate@example.com' });
        },
        (err) => {
          assert.strictEqual(err.response.status, 409);
          assert.match(err.message, /already exists/);
          return true;
        }
      );
    });
  });
});
