import apiClient from '@/api/apiClient';
import type { BackendCourseGroupDto } from './groupsApi';

export type EnrollmentStatus = 'Active' | 'Completed' | 'Withdrawn' | 'Pending';

export type Enrollment = {
  id?: string;
  studentId: string;
  courseGroupId?: string;
  courseGroupName?: string;
  courseId?: string;
  status: EnrollmentStatus;
  enrolledAt?: string;
  paidAmount?: number;
};

export interface BackendEnrollmentDto {
  id: string;
  organizationId: string;
  courseGroupId: string;
  courseGroupName: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  studentEmail?: string;
  enrollmentDate: string;
  paidAmount: number;
  status: number; // 0 = Pending, 1 = Active, 2 = Completed, 3 = Cancelled
  statusName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

const statusMap: Record<EnrollmentStatus, number> = {
  Pending: 0,
  Active: 1,
  Completed: 2,
  Withdrawn: 3,
};

function mapEnrollment(dto: BackendEnrollmentDto): Enrollment {
  let status: EnrollmentStatus = 'Active';
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

const storageKey = (orgId: string, courseId: string) => `trainhub.organization.${orgId}.course.${courseId}.students`;

function getSeedEnrollments(courseId: string): Enrollment[] {
  if (courseId === 'demo-course-web') {
    return [
      { studentId: 'user-student', status: 'Active', enrolledAt: new Date().toISOString() },
      { studentId: 'student-2', status: 'Active', enrolledAt: new Date().toISOString() },
      { studentId: 'student-3', status: 'Active', enrolledAt: new Date().toISOString() },
      { studentId: 'student-4', status: 'Active', enrolledAt: new Date().toISOString() },
    ];
  }
  return [];
}

function read(orgId: string, courseId: string): Enrollment[] {
  try {
    const raw = localStorage.getItem(storageKey(orgId, courseId));
    if (!raw) {
      const seeded = getSeedEnrollments(courseId);
      if (seeded.length > 0) {
        write(orgId, courseId, seeded);
        return seeded;
      }
      return [];
    }
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const parsed = value.flatMap((item): Enrollment[] => {
      if (typeof item === 'string') return [{ studentId: item, status: 'Active' }];
      if (!item || typeof item.studentId !== 'string') return [];
      const status: EnrollmentStatus = ['Active', 'Completed', 'Withdrawn', 'Pending'].includes(item.status)
        ? item.status
        : 'Active';
      return [
        {
          studentId: item.studentId,
          status,
          ...(typeof item.enrolledAt === 'string' ? { enrolledAt: item.enrolledAt } : {}),
        },
      ];
    });
    if (parsed.length > 0) return parsed;
    const seeded = getSeedEnrollments(courseId);
    if (seeded.length > 0) {
      write(orgId, courseId, seeded);
      return seeded;
    }
    return [];
  } catch {
    return getSeedEnrollments(courseId);
  }
}

function write(orgId: string, courseId: string, enrollments: Enrollment[]) {
  localStorage.setItem(storageKey(orgId, courseId), JSON.stringify(enrollments));
}

export const enrollmentsApi = {
  async list(
    orgId: string,
    courseId: string,
    demo: boolean,
    query?: {
      courseGroupId?: string;
      studentId?: string;
      status?: number;
      pageNumber?: number;
      pageSize?: number;
    }
  ): Promise<Enrollment[]> {
    if (demo) return read(orgId, courseId);
    const params: Record<string, string | number> = {
      courseId,
      pageSize: query?.pageSize ?? 100,
      pageNumber: query?.pageNumber ?? 1,
    };
    if (query?.courseGroupId) params.courseGroupId = query.courseGroupId;
    if (query?.studentId) params.studentId = query.studentId;
    if (query?.status !== undefined) params.status = query.status;

    try {
      const { data } = await apiClient.get<PagedResult<BackendEnrollmentDto> | BackendEnrollmentDto[]>('/enrollments', {
        params,
      });
      const items = Array.isArray(data) ? data : data?.items || [];
      return items.map(mapEnrollment);
    } catch {
      return read(orgId, courseId);
    }
  },

  async enroll(orgId: string, courseId: string, studentId: string, demo: boolean, paidAmount?: number): Promise<void> {
    if (demo) {
      write(orgId, courseId, [
        ...read(orgId, courseId).filter((item) => item.studentId !== studentId),
        { studentId, status: 'Active', enrolledAt: new Date().toISOString() },
      ]);
      return;
    }

    try {
      // In real mode, find existing groups for this course
      const { data: groupsRes } = await apiClient.get<PagedResult<BackendCourseGroupDto> | BackendCourseGroupDto[]>(
        '/coursegroups',
        {
          params: { courseId, pageSize: 100 },
        }
      );
      const groups = Array.isArray(groupsRes) ? groupsRes : groupsRes?.items || [];
      let targetGroup =
        groups.find((g) => (g.status === 1 || g.statusName === 'Active') && !g.isFull) ||
        groups.find((g) => g.status === 1 || g.statusName === 'Active') ||
        groups[0];

      // If no group exists yet for this course, create a default cohort
      if (!targetGroup) {
        const today = new Date().toISOString().split('T')[0];
        const inThreeMonths = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const { data: createdGroup } = await apiClient.post<BackendCourseGroupDto>('/coursegroups', {
          courseId,
          name: 'Cohort 1',
          startDate: today,
          endDate: inThreeMonths,
          capacity: 30,
          status: 1, // Active
        });
        targetGroup = createdGroup;
      }

      await apiClient.post('/enrollments', {
        courseGroupId: targetGroup.id,
        studentId,
        status: 1, // Active
        paidAmount: paidAmount ?? 0,
      });
    } catch {
      // Fallback to local storage persistence
      write(orgId, courseId, [
        ...read(orgId, courseId).filter((item) => item.studentId !== studentId),
        { studentId, status: 'Active', enrolledAt: new Date().toISOString() },
      ]);
    }
  },

  async remove(orgId: string, courseId: string, studentId: string, demo: boolean): Promise<void> {
    if (demo) {
      write(orgId, courseId, read(orgId, courseId).filter((item) => item.studentId !== studentId));
      return;
    }

    try {
      const { data } = await apiClient.get<PagedResult<BackendEnrollmentDto> | BackendEnrollmentDto[]>('/enrollments', {
        params: { courseId, studentId, pageSize: 1 },
      });
      const items = Array.isArray(data) ? data : data?.items || [];
      const enrollment = items[0];
      if (enrollment) {
        await apiClient.delete(`/enrollments/${encodeURIComponent(enrollment.id)}`);
      }
    } catch {
      // Fallback
    }
    write(orgId, courseId, read(orgId, courseId).filter((item) => item.studentId !== studentId));
  },

  async updateStatus(
    orgId: string,
    courseId: string,
    studentId: string,
    status: EnrollmentStatus,
    demo: boolean
  ): Promise<void> {
    if (demo) {
      write(
        orgId,
        courseId,
        read(orgId, courseId).map((item) => (item.studentId === studentId ? { ...item, status } : item))
      );
      return;
    }

    try {
      const { data } = await apiClient.get<PagedResult<BackendEnrollmentDto> | BackendEnrollmentDto[]>('/enrollments', {
        params: { courseId, studentId, pageSize: 1 },
      });
      const items = Array.isArray(data) ? data : data?.items || [];
      const enrollment = items[0];
      if (enrollment) {
        const backendStatus = statusMap[status] ?? 1;
        await apiClient.patch(`/enrollments/${encodeURIComponent(enrollment.id)}/status`, {
          status: backendStatus,
        });
      }
    } catch {
      // Fallback
    }
    write(
      orgId,
      courseId,
      read(orgId, courseId).map((item) => (item.studentId === studentId ? { ...item, status } : item))
    );
  },

  // Direct enrollment resource APIs
  async getAll(params?: {
    courseGroupId?: string;
    studentId?: string;
    courseId?: string;
    status?: number;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    sortDescending?: boolean;
  }): Promise<PagedResult<BackendEnrollmentDto>> {
    const { data } = await apiClient.get<PagedResult<BackendEnrollmentDto>>('/enrollments', { params });
    return data;
  },

  async getById(id: string): Promise<BackendEnrollmentDto> {
    const { data } = await apiClient.get<BackendEnrollmentDto>(`/enrollments/${encodeURIComponent(id)}`);
    return data;
  },

  async create(input: {
    courseGroupId: string;
    studentId: string;
    paidAmount?: number;
    status?: number;
    enrollmentDate?: string;
  }): Promise<BackendEnrollmentDto> {
    const { data } = await apiClient.post<BackendEnrollmentDto>('/enrollments', input);
    return data;
  },

  async update(
    id: string,
    input: { paidAmount?: number; status?: number }
  ): Promise<BackendEnrollmentDto> {
    const { data } = await apiClient.put<BackendEnrollmentDto>(`/enrollments/${encodeURIComponent(id)}`, input);
    return data;
  },

  async updateStatusById(id: string, status: number): Promise<BackendEnrollmentDto> {
    const { data } = await apiClient.patch<BackendEnrollmentDto>(`/enrollments/${encodeURIComponent(id)}/status`, {
      status,
    });
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/enrollments/${encodeURIComponent(id)}`);
  },
};

