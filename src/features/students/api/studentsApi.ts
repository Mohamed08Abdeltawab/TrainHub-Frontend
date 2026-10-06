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

interface BackendStudentDto {
  id: string;
  userId?: string;
  organizationId?: string;
  studentCode?: string;
  guardianPhone?: string;
  academicYear?: string;
  dateOfBirth?: string;
  age?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface RegisterResponse {
  userId: string;
  accessToken: string;
}

const storageKey = (orgId: string) => `trainhub.organization.${orgId}.students`;
const readDemoStudents = (orgId: string): Student[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(orgId)) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Student => Boolean(item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.email === 'string'));
  } catch { return []; }
};
const writeDemoStudents = (orgId: string, students: Student[]) => localStorage.setItem(storageKey(orgId), JSON.stringify(students));

function mapStudent(dto: BackendStudentDto): Student {
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
  async list(orgId: string, demo: boolean, query?: { searchTerm?: string; pageNumber?: number; pageSize?: number }): Promise<Student[]> {
    if (demo) return readDemoStudents(orgId);
    const params: Record<string, string | number> = {
      pageSize: query?.pageSize ?? 100,
      pageNumber: query?.pageNumber ?? 1,
    };
    if (query?.searchTerm) params.searchTerm = query.searchTerm;
    const { data } = await apiClient.get<PagedResult<BackendStudentDto> | BackendStudentDto[]>('/students', { params });
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map(mapStudent);
  },
  async getById(orgId: string, id: string, demo: boolean): Promise<Student> {
    if (demo) {
      const found = readDemoStudents(orgId).find((s) => s.id === id);
      if (!found) throw new Error('Student not found');
      return found;
    }
    const { data } = await apiClient.get<BackendStudentDto>(`/students/${encodeURIComponent(id)}`);
    return mapStudent(data);
  },
  async create(orgId: string, input: StudentInput, demo: boolean): Promise<Student> {
    if (!demo) {
      const nameParts = input.name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || firstName;
      const regRes = await apiClient.post<RegisterResponse>('/auth/register', {
        firstName,
        lastName,
        email: input.email.trim(),
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationId: orgId,
        phoneNumber: input.phone?.trim() || undefined,
      });
      const userId = regRes.data.userId;
      const studentCode = `STU-${Math.floor(100000 + Math.random() * 900000)}`;
      const { data } = await apiClient.post<BackendStudentDto>('/students', {
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
      let studentCode = input.studentCode;
      if (!studentCode) {
        try {
          const existing = await apiClient.get<BackendStudentDto>(`/students/${encodeURIComponent(id)}`);
          studentCode = existing.data?.studentCode;
        } catch {
          // ignore error fetching existing
        }
      }
      studentCode = studentCode || `STU-${id.slice(0, 4).toUpperCase()}`;
      const nameParts = input.name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || firstName;
      const { data } = await apiClient.put<BackendStudentDto>(`/students/${encodeURIComponent(id)}`, {
        studentCode,
        guardianPhone: input.phone?.trim() || undefined,
        academicYear: input.course?.trim() || undefined,
        firstName,
        lastName,
        phoneNumber: input.phone?.trim() || undefined,
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
  async delete(orgId: string, id: string, demo: boolean): Promise<void> {
    if (!demo) {
      await apiClient.delete(`/students/${encodeURIComponent(id)}`);
      return;
    }
    const students = readDemoStudents(orgId);
    writeDemoStudents(orgId, students.filter((student) => student.id !== id));
  },
};
