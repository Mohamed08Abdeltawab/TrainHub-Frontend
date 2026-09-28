import apiClient from '@/api/apiClient';

export type StudentStatus = 'Active' | 'Pending' | 'Inactive';
export type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  status: StudentStatus;
  createdAt: string;
};
export type StudentInput = Omit<Student, 'id' | 'createdAt'>;

const storageKey = (orgId: string) => `trainhub.organization.${orgId}.students`;
const readDemoStudents = (orgId: string): Student[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(orgId)) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Student => Boolean(item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.email === 'string'));
  } catch { return []; }
};
const writeDemoStudents = (orgId: string, students: Student[]) => localStorage.setItem(storageKey(orgId), JSON.stringify(students));

export const studentsApi = {
  async list(orgId: string, demo: boolean): Promise<Student[]> {
    if (demo) return readDemoStudents(orgId);
    const { data } = await apiClient.get<Student[]>(`/organizations/${encodeURIComponent(orgId)}/students`);
    return data;
  },
  async create(orgId: string, input: StudentInput, demo: boolean): Promise<Student> {
    if (!demo) {
      const { data } = await apiClient.post<Student>(`/organizations/${encodeURIComponent(orgId)}/students`, input);
      return data;
    }
    const student = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    writeDemoStudents(orgId, [student, ...readDemoStudents(orgId)]);
    return student;
  },
  async update(orgId: string, id: string, input: StudentInput, demo: boolean): Promise<Student> {
    if (!demo) {
      const { data } = await apiClient.put<Student>(`/organizations/${encodeURIComponent(orgId)}/students/${encodeURIComponent(id)}`, input);
      return data;
    }
    const students = readDemoStudents(orgId);
    const existing = students.find((student) => student.id === id);
    if (!existing) throw new Error('Student not found');
    const updated = { ...existing, ...input };
    writeDemoStudents(orgId, students.map((student) => student.id === id ? updated : student));
    return updated;
  },
};
