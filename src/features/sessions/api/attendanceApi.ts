import apiClient from '@/api/apiClient';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export type AttendanceEntry = {
  id?: string;
  sessionId?: string;
  studentId: string;
  status: AttendanceStatus;
  markedAt: string;
  markedBy?: string;
  studentName?: string;
  studentCode?: string;
  sessionTitle?: string;
  courseGroupName?: string;
  sessionDate?: string;
  notes?: string;
};

export interface BackendAttendanceDto {
  id: string;
  organizationId: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  markedByUserId?: string | null;
  markedByName?: string | null;
  status: number;
  statusName: string;
  markedAt: string;
  notes?: string | null;
  sessionTitle?: string | null;
  courseGroupName?: string | null;
  sessionDate?: string | null;
}

export interface AttendancePercentageDto {
  studentId: string;
  studentName: string;
  studentCode: string;
  courseGroupId?: string | null;
  courseGroupName?: string | null;
  totalRecords: number;
  attendedCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendancePercentage: number;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const attendanceStatusToCode: Record<AttendanceStatus, number> = {
  Absent: 0,
  Present: 1,
  Late: 2,
  Excused: 3,
};

export const codeToAttendanceStatus: Record<number, AttendanceStatus> = {
  0: 'Absent',
  1: 'Present',
  2: 'Late',
  3: 'Excused',
};

function mapAttendanceStatus(status: number | string): AttendanceStatus {
  if (typeof status === 'number') {
    return codeToAttendanceStatus[status] ?? 'Present';
  }
  if (status === 'Absent' || status === 'Present' || status === 'Late' || status === 'Excused') {
    return status;
  }
  return 'Present';
}

function mapAttendance(dto: BackendAttendanceDto): AttendanceEntry {
  return {
    id: dto.id,
    sessionId: dto.sessionId,
    studentId: dto.studentId,
    status: mapAttendanceStatus(dto.status ?? dto.statusName),
    markedAt: dto.markedAt,
    markedBy: dto.markedByName ?? undefined,
    studentName: dto.studentName,
    studentCode: dto.studentCode,
    sessionTitle: dto.sessionTitle ?? undefined,
    courseGroupName: dto.courseGroupName ?? undefined,
    sessionDate: dto.sessionDate ? dto.sessionDate.substring(0, 10) : undefined,
    notes: dto.notes ?? undefined,
  };
}

const key = (orgId: string, sessionId: string) => `trainhub.organization.${orgId}.session.${sessionId}.attendance`;

const isEntry = (item: unknown): item is AttendanceEntry =>
  Boolean(
    item &&
      typeof item === 'object' &&
      typeof (item as AttendanceEntry).studentId === 'string' &&
      ['Present', 'Absent', 'Late', 'Excused'].includes((item as AttendanceEntry).status) &&
      typeof (item as AttendanceEntry).markedAt === 'string'
  );

function read(orgId: string, sessionId: string): AttendanceEntry[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(orgId, sessionId)) ?? '[]');
    return Array.isArray(value) ? value.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function write(orgId: string, sessionId: string, entries: AttendanceEntry[]) {
  localStorage.setItem(key(orgId, sessionId), JSON.stringify(entries));
}

export const attendanceApi = {
  async list(orgId: string, sessionId: string, demo: boolean): Promise<AttendanceEntry[]> {
    if (demo) return read(orgId, sessionId);
    try {
      const { data } = await apiClient.get<BackendAttendanceDto[] | PagedResult<BackendAttendanceDto>>(
        `/sessions/${encodeURIComponent(sessionId)}/attendance`
      );
      const items = Array.isArray(data) ? data : data?.items || [];
      return items.map(mapAttendance);
    } catch (err) {
      if (demo) return read(orgId, sessionId);
      throw err;
    }
  },

  async listRecords(params?: {
    sessionId?: string;
    studentId?: string;
    courseGroupId?: string;
    status?: number;
    fromDate?: string;
    toDate?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<AttendanceEntry[]> {
    const queryParams: Record<string, string | number> = {
      pageSize: params?.pageSize ?? 100,
      pageNumber: params?.pageNumber ?? 1,
    };
    if (params?.sessionId) queryParams.sessionId = params.sessionId;
    if (params?.studentId) queryParams.studentId = params.studentId;
    if (params?.courseGroupId) queryParams.courseGroupId = params.courseGroupId;
    if (params?.status !== undefined) queryParams.status = params.status;
    if (params?.fromDate) queryParams.fromDate = params.fromDate;
    if (params?.toDate) queryParams.toDate = params.toDate;

    const { data } = await apiClient.get<PagedResult<BackendAttendanceDto> | BackendAttendanceDto[]>('/attendances', {
      params: queryParams,
    });
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map(mapAttendance);
  },

  async getById(id: string): Promise<AttendanceEntry> {
    const { data } = await apiClient.get<BackendAttendanceDto>(`/attendances/${encodeURIComponent(id)}`);
    return mapAttendance(data);
  },

  async getStudentPercentage(studentId: string, courseGroupId?: string): Promise<AttendancePercentageDto> {
    const params = courseGroupId ? { courseGroupId } : undefined;
    const { data } = await apiClient.get<AttendancePercentageDto>(
      `/attendances/student/${encodeURIComponent(studentId)}/percentage`,
      { params }
    );
    return data;
  },

  async save(orgId: string, sessionId: string, entries: AttendanceEntry[], demo: boolean): Promise<AttendanceEntry[]> {
    if (demo) {
      const current = read(orgId, sessionId);
      const updates = new Map(entries.map((entry) => [entry.studentId, entry]));
      const saved = [...current.filter((entry) => !updates.has(entry.studentId)), ...updates.values()];
      write(orgId, sessionId, saved);
      return saved;
    }

    // 1. Fetch current attendance records for this session to know existing IDs
    const existing = await attendanceApi.list(orgId, sessionId, false);
    const existingByStudentId = new Map(existing.map((e) => [e.studentId, e]));

    // 2. Create or update each student's attendance record
    await Promise.all(
      entries.map(async (entry) => {
        const statusCode = attendanceStatusToCode[entry.status] ?? 1;
        const existingRecord = existingByStudentId.get(entry.studentId);
        if (existingRecord?.id) {
          if (existingRecord.status !== entry.status) {
            await apiClient.patch(`/attendances/${encodeURIComponent(existingRecord.id)}/status`, {
              status: statusCode,
            });
          }
        } else {
          await apiClient.post<BackendAttendanceDto>('/attendances', {
            sessionId,
            studentId: entry.studentId,
            status: statusCode,
            notes: entry.notes || undefined,
          });
        }
      })
    );

    // 3. Return fresh list from the server
    return await attendanceApi.list(orgId, sessionId, false);
  },

  async updateStatus(id: string, status: AttendanceStatus): Promise<AttendanceEntry> {
    const statusCode = attendanceStatusToCode[status] ?? 1;
    const { data } = await apiClient.patch<BackendAttendanceDto>(`/attendances/${encodeURIComponent(id)}/status`, {
      status: statusCode,
    });
    return mapAttendance(data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/attendances/${encodeURIComponent(id)}`);
  },
};
