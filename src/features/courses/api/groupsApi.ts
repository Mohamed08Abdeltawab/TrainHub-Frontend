import apiClient from '@/api/apiClient';

export type CourseGroupStatus = 'Planned' | 'Active' | 'Completed' | 'Cancelled';
export type CourseGroup = { id: string; name: string; courseId: string; courseTitle?: string; startDate: string; endDate: string; capacity: number; instructorIds?: string[]; enrolledCount?: number; status: CourseGroupStatus; createdAt: string };
export type CourseGroupInput = Omit<CourseGroup, 'id' | 'createdAt' | 'courseTitle'>;
const key = (orgId: string) => `trainhub.organization.${orgId}.groups`;
function read(orgId: string): CourseGroup[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(key(orgId)) ?? '[]'); return Array.isArray(value) ? value.filter((item): item is CourseGroup => Boolean(item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.courseId === 'string')) : []; } catch { return []; }
}
function write(orgId: string, groups: CourseGroup[]) { localStorage.setItem(key(orgId), JSON.stringify(groups)); }
export const groupsApi = {
  async list(orgId: string, demo: boolean): Promise<CourseGroup[]> {
    if (demo) return read(orgId);
    const { data } = await apiClient.get<CourseGroup[]>(`/organizations/${encodeURIComponent(orgId)}/groups`); return data;
  },
  async listForInstructor(demoOrgId: string, demo: boolean): Promise<CourseGroup[]> {
    if (demo) return read(demoOrgId);
    const { data } = await apiClient.get<CourseGroup[]>('/instructors/me/groups');
    return data;
  },
  async create(orgId: string, input: CourseGroupInput, demo: boolean): Promise<CourseGroup> {
    if (!demo) { const { data } = await apiClient.post<CourseGroup>(`/organizations/${encodeURIComponent(orgId)}/groups`, input); return data; }
    const group = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; write(orgId, [group, ...read(orgId)]); return group;
  },
  async update(orgId: string, id: string, input: CourseGroupInput, demo: boolean): Promise<CourseGroup> {
    if (!demo) { const { data } = await apiClient.put<CourseGroup>(`/organizations/${encodeURIComponent(orgId)}/groups/${encodeURIComponent(id)}`, input); return data; }
    const groups = read(orgId); const existing = groups.find((group) => group.id === id); if (!existing) throw new Error('Group not found');
    const updated = { ...existing, ...input }; write(orgId, groups.map((group) => group.id === id ? updated : group)); return updated;
  },
};
