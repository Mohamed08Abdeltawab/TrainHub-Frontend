import apiClient from '@/api/apiClient';

export type CourseGroupStatus = 'Planned' | 'Active' | 'Completed' | 'Cancelled';

export type CourseGroup = {
  id: string;
  name: string;
  courseId: string;
  courseTitle?: string;
  startDate: string;
  endDate: string;
  capacity: number;
  instructorIds?: string[];
  enrolledCount?: number;
  status: CourseGroupStatus;
  createdAt: string;
};

export type CourseGroupInput = Omit<CourseGroup, 'id' | 'createdAt' | 'courseTitle'>;

export interface BackendCourseGroupDto {
  id: string;
  organizationId: string;
  courseId: string;
  courseName: string;
  instructorId?: string | null;
  instructorName?: string | null;
  name: string;
  scheduleDescription?: string | null;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledStudentsCount: number;
  availableSeats: number;
  isFull: boolean;
  status: number;
  statusName: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendStudentDto {
  id: string;
  userId?: string;
  organizationId?: string;
  studentCode: string;
  guardianPhone?: string;
  academicYear?: string;
  dateOfBirth?: string;
  age?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

const statusMap: Record<CourseGroupStatus, number> = {
  Planned: 0,
  Active: 1,
  Completed: 2,
  Cancelled: 3,
};

function mapCourseGroup(dto: BackendCourseGroupDto): CourseGroup {
  let status: CourseGroupStatus = 'Active';
  if (dto.status === 0 || dto.statusName === 'Draft') status = 'Planned';
  else if (dto.status === 2 || dto.statusName === 'Completed') status = 'Completed';
  else if (dto.status === 3 || dto.statusName === 'Cancelled') status = 'Cancelled';

  return {
    id: dto.id,
    name: dto.name,
    courseId: dto.courseId,
    courseTitle: dto.courseName,
    startDate: dto.startDate,
    endDate: dto.endDate,
    capacity: dto.capacity,
    instructorIds: dto.instructorId ? [dto.instructorId] : [],
    enrolledCount: dto.enrolledStudentsCount ?? 0,
    status,
    createdAt: dto.createdAt,
  };
}

const key = (orgId: string) => `trainhub.organization.${orgId}.groups`;

function read(orgId: string): CourseGroup[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(orgId)) ?? '[]');
    return Array.isArray(value)
      ? value.filter((item): item is CourseGroup =>
          Boolean(item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.courseId === 'string')
        )
      : [];
  } catch {
    return [];
  }
}

function write(orgId: string, groups: CourseGroup[]) {
  localStorage.setItem(key(orgId), JSON.stringify(groups));
}

export const groupsApi = {
  async list(
    orgId: string,
    demo: boolean,
    query?: {
      courseId?: string;
      instructorId?: string;
      status?: number;
      searchTerm?: string;
      pageNumber?: number;
      pageSize?: number;
    }
  ): Promise<CourseGroup[]> {
    if (demo) return read(orgId);
    const params: Record<string, string | number> = {
      pageSize: query?.pageSize ?? 100,
      pageNumber: query?.pageNumber ?? 1,
    };
    if (query?.courseId) params.courseId = query.courseId;
    if (query?.instructorId) params.instructorId = query.instructorId;
    if (query?.status !== undefined) params.status = query.status;
    if (query?.searchTerm) params.searchTerm = query.searchTerm;

    const { data } = await apiClient.get<PagedResult<BackendCourseGroupDto> | BackendCourseGroupDto[]>('/coursegroups', {
      params,
    });
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map(mapCourseGroup);
  },

  async listForInstructor(demoOrgId: string, demo: boolean): Promise<CourseGroup[]> {
    if (demo) return read(demoOrgId);
    try {
      const { data: me } = await apiClient.get<{ id: string }>('/instructors/me');
      if (me?.id) {
        return await groupsApi.list(demoOrgId, false, { instructorId: me.id });
      }
    } catch {
      // If fetching instructor profile fails, fall back to general listing
    }
    return await groupsApi.list(demoOrgId, false);
  },

  async getById(id: string, demoOrgId?: string, demo?: boolean): Promise<CourseGroup> {
    if (demo && demoOrgId) {
      const found = read(demoOrgId).find((g) => g.id === id);
      if (!found) throw new Error('Group not found');
      return found;
    }
    const { data } = await apiClient.get<BackendCourseGroupDto>(`/coursegroups/${encodeURIComponent(id)}`);
    return mapCourseGroup(data);
  },

  async create(orgId: string, input: CourseGroupInput, demo: boolean): Promise<CourseGroup> {
    if (!demo) {
      const payload = {
        courseId: input.courseId,
        name: input.name.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
        capacity: input.capacity,
        instructorId: input.instructorIds?.[0] || null,
        status: statusMap[input.status] ?? 1,
      };
      const { data } = await apiClient.post<BackendCourseGroupDto>('/coursegroups', payload);
      return mapCourseGroup(data);
    }
    const group = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(orgId, [group, ...read(orgId)]);
    return group;
  },

  async update(orgId: string, id: string, input: CourseGroupInput, demo: boolean): Promise<CourseGroup> {
    if (!demo) {
      const payload = {
        name: input.name.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
        capacity: input.capacity,
        instructorId: input.instructorIds?.[0] || null,
        status: statusMap[input.status] ?? 1,
      };
      const { data } = await apiClient.put<BackendCourseGroupDto>(`/coursegroups/${encodeURIComponent(id)}`, payload);
      return mapCourseGroup(data);
    }
    const groups = read(orgId);
    const existing = groups.find((group) => group.id === id);
    if (!existing) throw new Error('Group not found');
    const updated = { ...existing, ...input };
    write(orgId, groups.map((group) => (group.id === id ? updated : group)));
    return updated;
  },

  async assignInstructor(id: string, instructorId: string | null, demoOrgId?: string, demo?: boolean): Promise<CourseGroup> {
    if (demo && demoOrgId) {
      const groups = read(demoOrgId);
      const existing = groups.find((g) => g.id === id);
      if (!existing) throw new Error('Group not found');
      const updated = { ...existing, instructorIds: instructorId ? [instructorId] : [] };
      write(demoOrgId, groups.map((g) => (g.id === id ? updated : g)));
      return updated;
    }
    const { data } = await apiClient.put<BackendCourseGroupDto>(`/coursegroups/${encodeURIComponent(id)}/instructor`, {
      instructorId,
    });
    return mapCourseGroup(data);
  },

  async unassignInstructor(id: string, demoOrgId?: string, demo?: boolean): Promise<CourseGroup> {
    if (demo && demoOrgId) {
      return groupsApi.assignInstructor(id, null, demoOrgId, true);
    }
    const { data } = await apiClient.delete<BackendCourseGroupDto>(`/coursegroups/${encodeURIComponent(id)}/instructor`);
    return mapCourseGroup(data);
  },

  async updateCapacity(id: string, capacity: number, demoOrgId?: string, demo?: boolean): Promise<CourseGroup> {
    if (demo && demoOrgId) {
      const groups = read(demoOrgId);
      const existing = groups.find((g) => g.id === id);
      if (!existing) throw new Error('Group not found');
      const updated = { ...existing, capacity };
      write(demoOrgId, groups.map((g) => (g.id === id ? updated : g)));
      return updated;
    }
    const { data } = await apiClient.patch<BackendCourseGroupDto>(`/coursegroups/${encodeURIComponent(id)}/capacity`, {
      capacity,
    });
    return mapCourseGroup(data);
  },

  async updateStatus(id: string, status: CourseGroupStatus | number, demoOrgId?: string, demo?: boolean): Promise<CourseGroup> {
    const statusVal = typeof status === 'number' ? status : (statusMap[status] ?? 1);
    if (demo && demoOrgId) {
      const statusName = typeof status === 'string' ? status : (['Planned', 'Active', 'Completed', 'Cancelled'][statusVal] as CourseGroupStatus);
      const groups = read(demoOrgId);
      const existing = groups.find((g) => g.id === id);
      if (!existing) throw new Error('Group not found');
      const updated = { ...existing, status: statusName };
      write(demoOrgId, groups.map((g) => (g.id === id ? updated : g)));
      return updated;
    }
    const { data } = await apiClient.patch<BackendCourseGroupDto>(`/coursegroups/${encodeURIComponent(id)}/status`, {
      status: statusVal,
    });
    return mapCourseGroup(data);
  },

  async delete(id: string, demoOrgId?: string, demo?: boolean): Promise<void> {
    if (demo && demoOrgId) {
      const groups = read(demoOrgId);
      write(demoOrgId, groups.filter((g) => g.id !== id));
      return;
    }
    await apiClient.delete(`/coursegroups/${encodeURIComponent(id)}`);
  },

  async getStudents(id: string, status?: number): Promise<BackendStudentDto[]> {
    const params = status !== undefined ? { status } : undefined;
    const { data } = await apiClient.get<BackendStudentDto[]>(`/coursegroups/${encodeURIComponent(id)}/students`, {
      params,
    });
    return data;
  },
};

