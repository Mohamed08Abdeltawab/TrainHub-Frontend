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
  studentCode?: string;
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

function mapStudent(dto: any): Student {
  const name = [dto.firstName, dto.lastName].filter(Boolean).join(' ') || dto.studentCode || 'Student';
  return {
    id: dto.id,
    name,
    email: dto.email || '',
    phone: dto.phoneNumber || dto.guardianPhone || '',
    course: dto.academicYear || '',
    status: (dto.isActive === false ? 'Inactive' : 'Active') as StudentStatus,
    createdAt: dto.createdAt || new Date().toISOString(),
    studentCode: dto.studentCode || undefined,
  };
}

export const studentsApi = {
  async list(orgId: string, demo: boolean): Promise<Student[]> {
    if (demo) return readDemoStudents(orgId);
    const { data } = await apiClient.get<any>('/students');
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map(mapStudent);
  },
  async create(orgId: string, input: StudentInput, demo: boolean): Promise<Student> {
    if (!demo) {
      const nameParts = input.name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Student';
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
      const studentCode = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data } = await apiClient.post<any>('/students', {
        userId,
        studentCode,
        guardianPhone: input.phone?.trim() || undefined,
        academicYear: input.course?.trim() || undefined,
      });
      return mapStudent(data);
    }
    const student = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    writeDemoStudents(orgId, [student, ...readDemoStudents(orgId)]);
    return student;
  },
  async update(orgId: string, id: string, input: StudentInput, demo: boolean): Promise<Student> {
    if (!demo) {
      let studentCode = (input as any).studentCode;
      if (!studentCode) {
        try {
          const existing = await apiClient.get<any>(`/students/${encodeURIComponent(id)}`);
          studentCode = existing.data?.studentCode;
        } catch {
          // ignore error fetching existing
        }
      }
      studentCode = studentCode || `STU-${id.slice(0, 4).toUpperCase()}`;
      const { data } = await apiClient.put<any>(`/students/${encodeURIComponent(id)}`, {
        studentCode,
        guardianPhone: input.phone?.trim() || undefined,
        academicYear: input.course?.trim() || undefined,
      });
      return mapStudent(data);
    }
    const students = readDemoStudents(orgId);
    const existing = students.find((student) => student.id === id);
    if (!existing) throw new Error('Student not found');
    const updated = { ...existing, ...input };
    writeDemoStudents(orgId, students.map((student) => student.id === id ? updated : student));
    return updated;
  },
};
