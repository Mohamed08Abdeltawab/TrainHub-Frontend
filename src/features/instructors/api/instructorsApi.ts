import apiClient from '@/api/apiClient';

export type InstructorStatus = 'Active' | 'Pending' | 'Inactive';
export type Instructor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  expertise: string;
  status: InstructorStatus;
  createdAt: string;
};
export type InstructorInput = Omit<Instructor, 'id' | 'createdAt'>;

const storageKey = (orgId: string) => `trainhub.organization.${orgId}.instructors`;
const readDemoInstructors = (orgId: string): Instructor[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(orgId)) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Instructor => Boolean(item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.email === 'string'));
  } catch { return []; }
};
const writeDemoInstructors = (orgId: string, instructors: Instructor[]) => localStorage.setItem(storageKey(orgId), JSON.stringify(instructors));

export const instructorsApi = {
  async list(orgId: string, demo: boolean): Promise<Instructor[]> {
    if (demo) return readDemoInstructors(orgId);
    const { data } = await apiClient.get<Instructor[]>(`/organizations/${encodeURIComponent(orgId)}/instructors`);
    return data;
  },
  async create(orgId: string, input: InstructorInput, demo: boolean): Promise<Instructor> {
    if (!demo) {
      const { data } = await apiClient.post<Instructor>(`/organizations/${encodeURIComponent(orgId)}/instructors`, input);
      return data;
    }
    const instructor = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    writeDemoInstructors(orgId, [instructor, ...readDemoInstructors(orgId)]);
    return instructor;
  },
  async update(orgId: string, id: string, input: InstructorInput, demo: boolean): Promise<Instructor> {
    if (!demo) {
      const { data } = await apiClient.put<Instructor>(`/organizations/${encodeURIComponent(orgId)}/instructors/${encodeURIComponent(id)}`, input);
      return data;
    }
    const instructors = readDemoInstructors(orgId);
    const existing = instructors.find((instructor) => instructor.id === id);
    if (!existing) throw new Error('Instructor not found');
    const updated = { ...existing, ...input };
    writeDemoInstructors(orgId, instructors.map((instructor) => instructor.id === id ? updated : instructor));
    return updated;
  },
};
