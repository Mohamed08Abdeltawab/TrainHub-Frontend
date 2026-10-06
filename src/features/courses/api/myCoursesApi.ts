import apiClient from '@/api/apiClient';
import type { DashboardRole } from '@/types/nav';
import type { Course } from './coursesApi';

type LearnerCourse = Course & {
  instructorName?: string;
  progressPercent?: number;
  enrollmentStatus?: 'Active' | 'Completed' | 'Withdrawn';
};

export const myCoursesApi = {
  async list(role: Extract<DashboardRole, 'STUDENT' | 'INSTRUCTOR'>): Promise<LearnerCourse[]> {
    const endpoint = role === 'STUDENT' ? '/students/me/courses' : '/instructors/me/courses';
    const { data } = await apiClient.get<LearnerCourse[]>(endpoint);
    return data;
  },
};

export type { LearnerCourse };
