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

function mapInstructor(dto: any): Instructor {
  const name = [dto.firstName, dto.lastName].filter(Boolean).join(' ') || dto.email || 'Instructor';
  return {
    id: dto.id,
    name,
    email: dto.email || '',
    phone: dto.phoneNumber || '',
    expertise: dto.specialization || '',
    status: 'Active' as InstructorStatus,
    createdAt: dto.createdAt || new Date().toISOString(),
  };
}

export const instructorsApi = {
  async list(orgId: string, demo: boolean): Promise<Instructor[]> {
    if (demo) return readDemoInstructors(orgId);
    const { data } = await apiClient.get<any>('/instructors');
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map(mapInstructor);
  },
  async create(orgId: string, input: InstructorInput, demo: boolean): Promise<Instructor> {
    if (!demo) {
      const nameParts = input.name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Instructor';
      const lastName = nameParts.slice(1).join(' ') || firstName;
      const regRes = await apiClient.post<any>('/auth/register', {
        firstName,
        lastName,
        email: input.email.trim(),
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationId: orgId,
        phoneNumber: input.phone?.trim() || undefined,
      });
      const userId = regRes.data.userId;
      const { data } = await apiClient.post<any>('/instructors', {
        userId,
        specialization: input.expertise?.trim() || 'General',
        bio: '',
      });
      return mapInstructor(data);
    }
    const instructor = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    writeDemoInstructors(orgId, [instructor, ...readDemoInstructors(orgId)]);
    return instructor;
  },
  async update(orgId: string, id: string, input: InstructorInput, demo: boolean): Promise<Instructor> {
    if (!demo) {
      const { data } = await apiClient.put<any>(`/instructors/${encodeURIComponent(id)}`, {
        specialization: input.expertise?.trim() || 'General',
        bio: '',
      });
      return mapInstructor(data);
    }
    const instructors = readDemoInstructors(orgId);
    const existing = instructors.find((instructor) => instructor.id === id);
    if (!existing) throw new Error('Instructor not found');
    const updated = { ...existing, ...input };
    writeDemoInstructors(orgId, instructors.map((instructor) => instructor.id === id ? updated : instructor));
    return updated;
  },
};
