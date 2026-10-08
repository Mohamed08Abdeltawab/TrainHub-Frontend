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
    try {
      const { data } = await apiClient.get<LearnerCourse[]>(endpoint);
      return data;
    } catch {
      if (role === 'STUDENT') {
        return [
          {
            id: 'demo-course-web',
            title: 'Fullstack Web Development',
            description: 'Modern full-stack web development with React, Node.js, and TypeScript.',
            category: 'Web Development',
            level: 'Intermediate',
            durationHours: 60,
            status: 'Active',
            createdAt: '2026-09-01T00:00:00Z',
            instructorName: 'Sara Jenkins',
            progressPercent: 62,
            enrollmentStatus: 'Active',
          },
          {
            id: 'demo-course-design',
            title: 'Modern UI/UX Design',
            description: 'Principles of modern digital design, accessibility, and user research.',
            category: 'Design',
            level: 'Beginner',
            durationHours: 40,
            status: 'Active',
            createdAt: '2026-09-15T00:00:00Z',
            instructorName: 'Mona Zaki',
            progressPercent: 45,
            enrollmentStatus: 'Active',
          },
          {
            id: 'demo-course-git',
            title: 'Agile & Git Team Workflows',
            description: 'Collaborative development workflows, branching strategies, and CI/CD.',
            category: 'Software Engineering',
            level: 'Advanced',
            durationHours: 20,
            status: 'Active',
            createdAt: '2026-09-20T00:00:00Z',
            instructorName: 'Omar Hassan',
            progressPercent: 80,
            enrollmentStatus: 'Active',
          },
        ];
      }
      return [
        {
          id: 'demo-course-web',
          title: 'Fullstack Web Development',
          description: 'Cohort A / Next session: Today, 2:00 PM',
          category: 'Web Development',
          level: 'Intermediate',
          durationHours: 60,
          status: 'Active',
          createdAt: '2026-09-01T00:00:00Z',
          enrollmentStatus: 'Active',
        },
        {
          id: 'demo-course-js',
          title: 'JavaScript Essentials',
          description: 'Cohort B / 24 learners enrolled',
          category: 'Web Development',
          level: 'Beginner',
          durationHours: 35,
          status: 'Active',
          createdAt: '2026-09-10T00:00:00Z',
          enrollmentStatus: 'Active',
        },
        {
          id: 'demo-course-frontend',
          title: 'Frontend Foundations',
          description: 'Cohort C / Next session: Thursday',
          category: 'Web Development',
          level: 'Beginner',
          durationHours: 30,
          status: 'Active',
          createdAt: '2026-09-15T00:00:00Z',
          enrollmentStatus: 'Active',
        },
      ];
    }
  },
};

export type { LearnerCourse };
