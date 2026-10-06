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

const key = (orgId: string) => `trainhub.organization.${orgId}.courses`;
function read(orgId: string): Course[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(orgId)) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is Course => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string')) : [];
  } catch { return []; }
}
function write(orgId: string, courses: Course[]) { localStorage.setItem(key(orgId), JSON.stringify(courses)); }

function mapCourse(dto: any, fallbackLevel = 'Beginner'): Course {
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
  async list(orgId: string, demo: boolean): Promise<Course[]> {
    if (demo) return read(orgId);
    const { data } = await apiClient.get<any>('/courses');
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map((item: any) => mapCourse(item));
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
      const { data } = await apiClient.post<any>('/courses', payload);
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
      const { data } = await apiClient.put<any>(`/courses/${encodeURIComponent(id)}`, payload);
      return mapCourse(data, input.level);
    }
    const courses = read(orgId);
    const existing = courses.find((course) => course.id === id);
    if (!existing) throw new Error('Course not found');
    const updated = { ...existing, ...input };
    write(orgId, courses.map((course) => course.id === id ? updated : course));
    return updated;
  },
};
