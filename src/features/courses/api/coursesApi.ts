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

export const coursesApi = {
  async list(orgId: string, demo: boolean): Promise<Course[]> {
    if (demo) return read(orgId);
    const { data } = await apiClient.get<Course[]>(`/organizations/${encodeURIComponent(orgId)}/courses`);
    return data;
  },
  async create(orgId: string, input: CourseInput, demo: boolean): Promise<Course> {
    if (!demo) { const { data } = await apiClient.post<Course>(`/organizations/${encodeURIComponent(orgId)}/courses`, input); return data; }
    const course = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(orgId, [course, ...read(orgId)]); return course;
  },
  async update(orgId: string, id: string, input: CourseInput, demo: boolean): Promise<Course> {
    if (!demo) { const { data } = await apiClient.put<Course>(`/organizations/${encodeURIComponent(orgId)}/courses/${encodeURIComponent(id)}`, input); return data; }
    const courses = read(orgId); const existing = courses.find((course) => course.id === id);
    if (!existing) throw new Error('Course not found');
    const updated = { ...existing, ...input };
    write(orgId, courses.map((course) => course.id === id ? updated : course)); return updated;
  },
};
