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
function read(orgId: string): Course[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(orgId)) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is Course => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string')) : [];
  } catch { return []; }
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
