import apiClient from '@/api/apiClient';

export type EnrollmentStatus = 'Active' | 'Completed' | 'Withdrawn';
export type Enrollment = { studentId: string; status: EnrollmentStatus; enrolledAt?: string };
const storageKey = (orgId: string, courseId: string) => `trainhub.organization.${orgId}.course.${courseId}.students`;
function read(orgId: string, courseId: string): Enrollment[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(orgId, courseId)) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.flatMap((item): Enrollment[] => {
      if (typeof item === 'string') return [{ studentId: item, status: 'Active' }];
      if (!item || typeof item.studentId !== 'string') return [];
      const status: EnrollmentStatus = ['Active', 'Completed', 'Withdrawn'].includes(item.status) ? item.status : 'Active';
      return [{ studentId: item.studentId, status, ...(typeof item.enrolledAt === 'string' ? { enrolledAt: item.enrolledAt } : {}) }];
    });
  } catch { return []; }
}
function write(orgId: string, courseId: string, enrollments: Enrollment[]) {
  localStorage.setItem(storageKey(orgId, courseId), JSON.stringify(enrollments));
}

export const enrollmentsApi = {
  async list(orgId: string, courseId: string, demo: boolean): Promise<Enrollment[]> {
    if (demo) return read(orgId, courseId);
    const { data } = await apiClient.get<Enrollment[]>(`/organizations/${encodeURIComponent(orgId)}/courses/${encodeURIComponent(courseId)}/students`);
    return data;
  },
  async enroll(orgId: string, courseId: string, studentId: string, demo: boolean): Promise<void> {
    if (demo) { write(orgId, courseId, [...read(orgId, courseId).filter((item) => item.studentId !== studentId), { studentId, status: 'Active', enrolledAt: new Date().toISOString() }]); return; }
    await apiClient.post(`/organizations/${encodeURIComponent(orgId)}/courses/${encodeURIComponent(courseId)}/students`, { studentId, status: 'Active' });
  },
  async remove(orgId: string, courseId: string, studentId: string, demo: boolean): Promise<void> {
    if (demo) { write(orgId, courseId, read(orgId, courseId).filter((item) => item.studentId !== studentId)); return; }
    await apiClient.delete(`/organizations/${encodeURIComponent(orgId)}/courses/${encodeURIComponent(courseId)}/students/${encodeURIComponent(studentId)}`);
  },
  async updateStatus(orgId: string, courseId: string, studentId: string, status: EnrollmentStatus, demo: boolean): Promise<void> {
    if (demo) { write(orgId, courseId, read(orgId, courseId).map((item) => item.studentId === studentId ? { ...item, status } : item)); return; }
    await apiClient.patch(`/organizations/${encodeURIComponent(orgId)}/courses/${encodeURIComponent(courseId)}/students/${encodeURIComponent(studentId)}`, { status });
  },
};
