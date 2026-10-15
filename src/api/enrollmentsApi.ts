import apiClient from './apiClient';

export interface CreateEnrollmentInput {
  courseGroupId: string;
  studentId: string;
  paidAmount?: number;
  status?: number;
  enrollmentDate?: string;
}

export interface EnrollmentDto {
  id: string;
  organizationId: string;
  courseGroupId: string;
  courseGroupName: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  studentEmail?: string | null;
  enrollmentDate: string;
  paidAmount: number;
  status: number;
  statusName: string;
  createdAt: string;
  updatedAt: string;
}

export const enrollmentsApi = {
  async create(input: CreateEnrollmentInput): Promise<EnrollmentDto> {
    const { data } = await apiClient.post<EnrollmentDto>('/enrollments', input);
    return data;
  },

  async getById(id: string): Promise<EnrollmentDto> {
    const { data } = await apiClient.get<EnrollmentDto>(`/enrollments/${encodeURIComponent(id)}`);
    return data;
  },
};
