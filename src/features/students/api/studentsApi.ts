import apiClient from '@/api/apiClient';
import { mapCourseGroup, type CourseGroup, type BackendCourseGroupDto } from '@/features/courses/api/groupsApi';
import { mapSession, type TrainingSession, type BackendSessionDto } from '@/features/sessions/api/sessionsApi';

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
  studentId?: string;
  studentCode?: string;
}

const storageKey = (orgId: string) => `trainhub.organization.${orgId}.students`;
const getSeedStudents = (): Student[] => [
  {
    id: 'user-student',
    name: 'David Kim',
    email: 'david.kim@trainhub.io',
    phone: '+1 (555) 234-5678',
    course: 'Fullstack Web Development',
    status: 'Active',
    studentCode: 'STU-001',
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'student-2',
    name: 'Nour El-Din',
    email: 'nour.eldin@trainhub.io',
    phone: '+1 (555) 345-6789',
    course: 'Fullstack Web Development',
    status: 'Active',
    studentCode: 'STU-002',
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'student-3',
    name: 'Yara Mansour',
    email: 'yara.mansour@trainhub.io',
    phone: '+1 (555) 456-7890',
    course: 'Fullstack Web Development',
    status: 'Active',
    studentCode: 'STU-003',
    createdAt: '2026-09-02T00:00:00Z',
  },
  {
    id: 'student-4',
    name: 'Karim Zaki',
    email: 'karim.zaki@trainhub.io',
    phone: '+1 (555) 567-8901',
    course: 'Fullstack Web Development',
    status: 'Active',
    studentCode: 'STU-004',
    createdAt: '2026-09-03T00:00:00Z',
  },
  {
    id: 'student-5',
    name: 'Layla Mahmoud',
    email: 'layla.mahmoud@trainhub.io',
    phone: '+1 (555) 678-9012',
    course: 'Modern UI/UX Design',
    status: 'Active',
    studentCode: 'STU-005',
    createdAt: '2026-09-15T00:00:00Z',
  },
  {
    id: 'student-6',
    name: 'Ahmed Fathy',
    email: 'ahmed.fathy@trainhub.io',
    phone: '+1 (555) 789-0123',
    course: 'Agile & Git Team Workflows',
    status: 'Active',
    studentCode: 'STU-006',
    createdAt: '2026-09-20T00:00:00Z',
  },
  {
    id: 'student-7',
    name: 'Mariam Adel',
    email: 'mariam.adel@trainhub.io',
    phone: '+1 (555) 890-1234',
    course: 'Modern UI/UX Design',
    status: 'Active',
    studentCode: 'STU-007',
    createdAt: '2026-09-22T00:00:00Z',
  },
  {
    id: 'student-8',
    name: 'Ziad Tarek',
    email: 'ziad.tarek@trainhub.io',
    phone: '+1 (555) 901-2345',
    course: 'JavaScript Essentials & Deep Dive',
    status: 'Pending',
    studentCode: 'STU-008',
    createdAt: '2026-09-25T00:00:00Z',
  },
];

const readDemoStudents = (orgId: string): Student[] => {
  try {
    const raw = localStorage.getItem(storageKey(orgId));
    if (!raw) {
      const seeded = getSeedStudents();
      writeDemoStudents(orgId, seeded);
      return seeded;
    }
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value)) {
      const valid = value.filter(
        (item): item is Student =>
          Boolean(item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.email === 'string')
      );
      if (valid.length > 0) return valid;
    }
    const seeded = getSeedStudents();
    writeDemoStudents(orgId, seeded);
    return seeded;
  } catch {
    return getSeedStudents();
  }
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
        guardianPhone: input.phone?.trim() || undefined,
        academicYear: input.course?.trim() || undefined,
        studentCode: input.studentCode?.trim() || undefined,
      });

      const studentId = regRes.data.studentId || regRes.data.userId;
      const studentCode = regRes.data.studentCode || input.studentCode || `STU-${regRes.data.userId.slice(0, 8).toUpperCase()}`;

      return {
        id: studentId,
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || '',
        course: input.course?.trim() || '',
        status: 'Active',
        studentCode,
        createdAt: new Date().toISOString(),
      };
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
  async getMe(): Promise<Student | null> {
    try {
      const { data } = await apiClient.get<BackendStudentDto>('/students/me');
      return mapStudent(data);
    } catch {
      return null;
    }
  },
  async getMyCohorts(): Promise<CourseGroup[]> {
    const { data } = await apiClient.get<BackendCourseGroupDto[]>('/students/me/cohorts');
    return (data || []).map(mapCourseGroup);
  },
  async getMySessions(): Promise<TrainingSession[]> {
    const { data } = await apiClient.get<BackendSessionDto[]>('/students/me/sessions');
    return (data || []).map(mapSession);
  },
};
