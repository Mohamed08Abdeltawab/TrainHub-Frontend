import apiClient from '@/api/apiClient';

export type CourseStatus = 'Draft' | 'Active' | 'Archived';
export type Course = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  durationHours: number;
  status: CourseStatus;
  createdAt: string;
};
export type CourseInput = Omit<Course, 'id' | 'createdAt'>;

interface BackendCourseDto {
  id: string;
  organizationId?: string;
  name: string;
  description?: string;
  category?: string;
  basePrice?: number;
  durationInHours?: number;
  status?: number;
  statusName?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

const key = (orgId: string) => `trainhub.organization.${orgId}.courses`;
const defaultSeedCourses: Course[] = [
  {
    id: 'demo-course-web',
    title: 'Fullstack Web Development',
    description: 'Modern full-stack web development with React, Node.js, and TypeScript.',
    category: 'Web Development',
    level: 'Intermediate',
    durationHours: 60,
    status: 'Active',
    createdAt: '2026-09-01T00:00:00Z',
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
  },
  {
    id: 'demo-course-js',
    title: 'JavaScript Essentials & Deep Dive',
    description: 'Core JavaScript fundamentals, asynchronous programming, closures, and DOM manipulation.',
    category: 'Web Development',
    level: 'Beginner',
    durationHours: 35,
    status: 'Active',
    createdAt: '2026-09-10T00:00:00Z',
  },
  {
    id: 'demo-course-frontend',
    title: 'Frontend Foundations with React',
    description: 'Building accessible, high-performance user interfaces with React and Tailwind CSS.',
    category: 'Web Development',
    level: 'Beginner',
    durationHours: 30,
    status: 'Active',
    createdAt: '2026-09-15T00:00:00Z',
  },
];

function read(orgId: string): Course[] {
  try {
    const raw = localStorage.getItem(key(orgId));
    if (!raw) {
      write(orgId, defaultSeedCourses);
      return defaultSeedCourses;
    }
    const value: unknown = JSON.parse(raw);
    const parsed = Array.isArray(value)
      ? value.filter((item): item is Course => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string'))
      : [];
    if (parsed.length > 0) return parsed;
    write(orgId, defaultSeedCourses);
    return defaultSeedCourses;
  } catch {
    return defaultSeedCourses;
  }
}
function write(orgId: string, courses: Course[]) { localStorage.setItem(key(orgId), JSON.stringify(courses)); }

function mapCourse(dto: BackendCourseDto, fallbackLevel = 'Beginner'): Course {
  return {
    id: dto.id,
    title: dto.name || '',
    description: dto.description || '',
    category: dto.category || '',
    level: fallbackLevel,
    durationHours: dto.durationInHours || 1,
    status: (dto.statusName === 'Active' || dto.status === 1 ? 'Active' : dto.statusName === 'Archived' || dto.status === 3 ? 'Archived' : 'Draft') as CourseStatus,
    createdAt: dto.createdAt || new Date().toISOString(),
  };
}

export const coursesApi = {
  async list(orgId: string, demo: boolean, query?: { searchTerm?: string; category?: string; status?: string; pageNumber?: number; pageSize?: number }): Promise<Course[]> {
    if (demo) return read(orgId);
    const params: Record<string, string | number> = {
      pageSize: query?.pageSize ?? 100,
      pageNumber: query?.pageNumber ?? 1,
    };
    if (query?.searchTerm) params.searchTerm = query.searchTerm;
    if (query?.category && query.category !== 'All') params.category = query.category;
    const { data } = await apiClient.get<PagedResult<BackendCourseDto> | BackendCourseDto[]>('/courses', { params });
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map((item) => mapCourse(item));
  },
  async getById(orgId: string, id: string, demo: boolean): Promise<Course> {
    if (demo) {
      const found = read(orgId).find((c) => c.id === id);
      if (!found) throw new Error('Course not found');
      return found;
    }
    const { data } = await apiClient.get<BackendCourseDto>(`/courses/${encodeURIComponent(id)}`);
    return mapCourse(data);
  },
  async getCategories(orgId: string, demo: boolean): Promise<string[]> {
    if (demo) {
      return [...new Set(read(orgId).map((c) => c.category).filter(Boolean))].sort();
    }
    const { data } = await apiClient.get<string[]>('/courses/categories');
    return Array.isArray(data) ? data : [];
  },
  async create(orgId: string, input: CourseInput, demo: boolean): Promise<Course> {
    if (!demo) {
      const payload = {
        name: input.title,
        description: input.description,
        category: input.category,
        basePrice: 0,
        durationInHours: input.durationHours,
        status: input.status === 'Active' ? 1 : input.status === 'Archived' ? 3 : 0,
      };
      const { data } = await apiClient.post<BackendCourseDto>('/courses', payload);
      return mapCourse(data, input.level);
    }
    const course = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(orgId, [course, ...read(orgId)]);
    return course;
  },
  async update(orgId: string, id: string, input: CourseInput, demo: boolean): Promise<Course> {
    if (!demo) {
      const payload = {
        name: input.title,
        description: input.description,
        category: input.category,
        basePrice: 0,
        durationInHours: input.durationHours,
        status: input.status === 'Active' ? 1 : input.status === 'Archived' ? 3 : 0,
      };
      const { data } = await apiClient.put<BackendCourseDto>(`/courses/${encodeURIComponent(id)}`, payload);
      return mapCourse(data, input.level);
    }
    const courses = read(orgId);
    const existing = courses.find((course) => course.id === id);
    if (!existing) throw new Error('Course not found');
    const updated = { ...existing, ...input };
    write(orgId, courses.map((course) => course.id === id ? updated : course));
    return updated;
  },
  async updateStatus(orgId: string, id: string, status: CourseStatus, demo: boolean): Promise<Course> {
    if (!demo) {
      const statusByte = status === 'Active' ? 1 : status === 'Archived' ? 3 : 0;
      const { data } = await apiClient.patch<BackendCourseDto>(`/courses/${encodeURIComponent(id)}/status`, {
        status: statusByte,
      });
      return mapCourse(data);
    }
    const courses = read(orgId);
    const existing = courses.find((course) => course.id === id);
    if (!existing) throw new Error('Course not found');
    const updated = { ...existing, status };
    write(orgId, courses.map((course) => course.id === id ? updated : course));
    return updated;
  },
  async delete(orgId: string, id: string, demo: boolean): Promise<void> {
    if (!demo) {
      await apiClient.delete(`/courses/${encodeURIComponent(id)}`);
      return;
    }
    const courses = read(orgId);
    write(orgId, courses.filter((course) => course.id !== id));
  },
};
