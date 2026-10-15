import apiClient from '@/api/apiClient';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export type AttendanceEntry = {
  id?: string;
  sessionId?: string;
  sessionTitle?: string;
  sessionStartTime?: string;
  sessionEndTime?: string;
  courseGroupName?: string;
  room?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentCode?: string;
  status: AttendanceStatus;
  markedAt: string;
  markedBy?: string;
  notes?: string;
};

export interface BackendAttendanceDto {
  id: string;
  organizationId: string;
  sessionId: string;
  courseGroupName?: string | null;
  sessionStartTime?: string | null;
  sessionEndTime?: string | null;
  room?: string | null;
  studentId: string;
  studentName: string;
  studentCode: string;
  markedByUserId?: string | null;
  markedByName?: string | null;
  status: number; // 0 = Absent, 1 = Present, 2 = Late, 3 = Excused
  statusName: string;
  markedAt: string;
  notes?: string | null;
}

export interface BackendAttendancePercentageDto {
  studentId: string;
  studentName: string;
  studentCode?: string;
  courseGroupId?: string | null;
  courseGroupName?: string | null;
  totalRecords: number;
  attendedCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendancePercentage: number;
  totalSessions?: number;
  attendedSessions?: number;
}

export type AttendancePercentageDto = BackendAttendancePercentageDto;

export interface AttendanceQueryParameters {
  sessionId?: string;
  studentId?: string;
  courseGroupId?: string;
  status?: number;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export const codeToAttendanceStatus: Record<number, AttendanceStatus> = {
  0: 'Absent',
  1: 'Present',
  2: 'Late',
  3: 'Excused',
};

export const attendanceStatusToCode: Record<AttendanceStatus, number> = {
  Absent: 0,
  Present: 1,
  Late: 2,
  Excused: 3,
};

export function mapAttendance(dto: BackendAttendanceDto): AttendanceEntry {
  return {
    id: dto.id,
    sessionId: dto.sessionId,
    courseGroupName: dto.courseGroupName ?? undefined,
    sessionStartTime: dto.sessionStartTime ?? undefined,
    sessionEndTime: dto.sessionEndTime ?? undefined,
    room: dto.room ?? undefined,
    studentId: dto.studentId,
    studentName: dto.studentName,
    studentCode: dto.studentCode,
    status: codeToAttendanceStatus[dto.status] ?? (dto.statusName as AttendanceStatus) ?? 'Present',
    markedAt: dto.markedAt,
    markedBy: dto.markedByName ?? undefined,
    notes: dto.notes ?? undefined,
  };
}

const key = (orgId: string, sessionId: string) =>
  `trainhub.organization.${orgId}.session.${sessionId}.attendance`;

const isEntry = (item: unknown): item is AttendanceEntry =>
  Boolean(
    item &&
      typeof item === 'object' &&
      typeof (item as AttendanceEntry).studentId === 'string' &&
      ['Present', 'Absent', 'Late', 'Excused'].includes((item as AttendanceEntry).status) &&
      typeof (item as AttendanceEntry).markedAt === 'string'
  );

function getSeedAttendanceForSession(sessionId: string): AttendanceEntry[] {
  if (sessionId === 'demo-session-1') {
    const today = new Date().toISOString();
    return [
      {
        id: 'seed-att-1-1',
        sessionId: 'demo-session-1',
        studentId: 'user-student',
        studentName: 'David Kim',
        studentCode: 'STU-001',
        status: 'Present',
        markedAt: today,
        markedBy: 'sarah.jenkins@trainhub.io',
      },
      {
        id: 'seed-att-1-2',
        sessionId: 'demo-session-1',
        studentId: 'student-2',
        studentName: 'Nour El-Din',
        studentCode: 'STU-002',
        status: 'Present',
        markedAt: today,
        markedBy: 'sarah.jenkins@trainhub.io',
      },
      {
        id: 'seed-att-1-3',
        sessionId: 'demo-session-1',
        studentId: 'student-3',
        studentName: 'Yara Mansour',
        studentCode: 'STU-003',
        status: 'Present',
        markedAt: today,
        markedBy: 'sarah.jenkins@trainhub.io',
      },
      {
        id: 'seed-att-1-4',
        sessionId: 'demo-session-1',
        studentId: 'student-4',
        studentName: 'Karim Zaki',
        studentCode: 'STU-004',
        status: 'Present',
        markedAt: today,
        markedBy: 'sarah.jenkins@trainhub.io',
      },
    ];
  }
  if (sessionId === 'demo-session-2') {
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    return [
      {
        id: 'seed-att-1',
        sessionId: 'demo-session-2',
        studentId: 'user-student',
        studentName: 'David Kim',
        studentCode: 'STU-001',
        status: 'Present',
        markedAt: pastDate,
        markedBy: 'sarah.jenkins@trainhub.io',
      },
      {
        id: 'seed-att-2',
        sessionId: 'demo-session-2',
        studentId: 'student-2',
        studentName: 'Nour El-Din',
        studentCode: 'STU-002',
        status: 'Present',
        markedAt: pastDate,
        markedBy: 'sarah.jenkins@trainhub.io',
      },
      {
        id: 'seed-att-3',
        sessionId: 'demo-session-2',
        studentId: 'student-3',
        studentName: 'Yara Mansour',
        studentCode: 'STU-003',
        status: 'Late',
        markedAt: pastDate,
        markedBy: 'sarah.jenkins@trainhub.io',
      },
      {
        id: 'seed-att-4',
        sessionId: 'demo-session-2',
        studentId: 'student-4',
        studentName: 'Karim Zaki',
        studentCode: 'STU-004',
        status: 'Excused',
        markedAt: pastDate,
        markedBy: 'sarah.jenkins@trainhub.io',
      },
    ];
  }
  return [];
}

function read(orgId: string, sessionId: string): AttendanceEntry[] {
  try {
    const raw = localStorage.getItem(key(orgId, sessionId));
    if (!raw) {
      const seeded = getSeedAttendanceForSession(sessionId);
      if (seeded.length > 0) {
        write(orgId, sessionId, seeded);
        return seeded;
      }
      return [];
    }
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value)) {
      const valid = value.filter(isEntry);
      if (valid.length > 0) return valid;
    }
    return [];
  } catch {
    return [];
  }
}

function write(orgId: string, sessionId: string, entries: AttendanceEntry[]) {
  try {
    localStorage.setItem(key(orgId, sessionId), JSON.stringify(entries));
  } catch {
    // Ignore storage write issues
  }
}

export const attendanceApi = {
  async list(orgId: string, sessionId: string, demo: boolean): Promise<AttendanceEntry[]> {
    if (demo) return read(orgId, sessionId);
    const { data } = await apiClient.get<BackendAttendanceDto[]>(
      `/sessions/${encodeURIComponent(sessionId)}/attendance`
    );
    return (data || []).map(mapAttendance);
  },

  async getById(id: string): Promise<AttendanceEntry> {
    const { data } = await apiClient.get<BackendAttendanceDto>(`/attendances/${encodeURIComponent(id)}`);
    return mapAttendance(data);
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

  async save(
    orgId: string,
    sessionId: string,
    entries: AttendanceEntry[],
    demo: boolean
  ): Promise<AttendanceEntry[]> {
    if (demo) {
      const current = read(orgId, sessionId);
      const updates = new Map(entries.map((entry) => [entry.studentId, entry]));
      const saved = [...current.filter((entry) => !updates.has(entry.studentId)), ...updates.values()];
      write(orgId, sessionId, saved);
      return saved;
    }

    // In real mode, synchronise directly with backend and throw on failure
    const { data: existing } = await apiClient.get<BackendAttendanceDto[]>(
      `/sessions/${encodeURIComponent(sessionId)}/attendance`
    );
    const existingMap = new Map((existing || []).map((rec) => [rec.studentId, rec]));

    for (const entry of entries) {
      const existingRecord = existingMap.get(entry.studentId);
      const statusByte = attendanceStatusToCode[entry.status] ?? 1;

      if (existingRecord) {
        await apiClient.put(`/attendances/${encodeURIComponent(existingRecord.id)}`, {
          status: statusByte,
          notes: entry.notes || null,
        });
      } else {
        await apiClient.post('/attendances', {
          sessionId,
          studentId: entry.studentId,
          status: statusByte,
          notes: entry.notes || null,
        });
      }
    }

    const { data: updated } = await apiClient.get<BackendAttendanceDto[]>(
      `/sessions/${encodeURIComponent(sessionId)}/attendance`
    );
    const mapped = (updated || []).map(mapAttendance);
    return mapped;
  },

  async listAll(
    orgId: string,
    demo: boolean,
    query?: AttendanceQueryParameters
  ): Promise<AttendanceEntry[]> {
    if (demo) {
      // Ensure seed sessions have attendance primed if not present
      read(orgId, 'demo-session-1');
      read(orgId, 'demo-session-2');

      // In demo mode, collect all records for this org
      const entries: AttendanceEntry[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(`trainhub.organization.${orgId}.session.`) && k.endsWith('.attendance')) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed: unknown = JSON.parse(raw);
              if (Array.isArray(parsed)) entries.push(...parsed.filter(isEntry));
            }
          } catch {
            // ignore corrupt entry
          }
        }
      }
      return entries;
    }

    const params: Record<string, string | number | boolean> = {
      pageSize: query?.pageSize ?? 100,
      pageNumber: query?.pageNumber ?? 1,
    };
    if (query?.sessionId) params.sessionId = query.sessionId;
    if (query?.studentId) params.studentId = query.studentId;
    if (query?.courseGroupId) params.courseGroupId = query.courseGroupId;
    if (query?.status !== undefined) params.status = query.status;
    if (query?.fromDate) params.fromDate = query.fromDate;
    if (query?.toDate) params.toDate = query.toDate;

    const { data } = await apiClient.get<{ items: BackendAttendanceDto[] } | BackendAttendanceDto[]>(
      '/attendances',
      { params }
    );
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map(mapAttendance);
  },

  async listRecords(params?: AttendanceQueryParameters): Promise<AttendanceEntry[]> {
    return this.listAll('default', false, params);
  },

  async getPercentage(
    studentId: string,
    courseGroupId?: string,
    demo = false,
    orgId = 'demo'
  ): Promise<BackendAttendancePercentageDto> {
    if (demo) {
      const all = await attendanceApi.listAll(orgId, true);
      const studentRecords = all.filter((r) => r.studentId === studentId);
      const totalRecords = studentRecords.length;
      const presentCount = studentRecords.filter((r) => r.status === 'Present').length;
      const lateCount = studentRecords.filter((r) => r.status === 'Late').length;
      const absentCount = studentRecords.filter((r) => r.status === 'Absent').length;
      const excusedCount = studentRecords.filter((r) => r.status === 'Excused').length;
      const attendedCount = presentCount + lateCount;
      const attendancePercentage = totalRecords > 0 ? Math.round((attendedCount / totalRecords) * 10000) / 100 : 0;
      return {
        studentId,
        studentName: studentRecords[0]?.studentName || 'Student',
        studentCode: studentRecords[0]?.studentCode,
        courseGroupId: courseGroupId ?? null,
        totalRecords,
        attendedCount,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        attendancePercentage,
        totalSessions: totalRecords,
        attendedSessions: attendedCount,
      };
    }

    const params = courseGroupId ? { courseGroupId } : undefined;
    try {
      const { data } = await apiClient.get<Record<string, unknown>>(
        `/attendances/student/${encodeURIComponent(studentId)}/percentage`,
        { params }
      );
      const totalRecords = Number(data.totalRecords ?? data.totalSessions ?? 0);
      const attendedCount = Number(data.attendedCount ?? data.attendedSessions ?? 0);
      const presentCount = Number(data.presentCount ?? data.presentSessions ?? 0);
      const lateCount = Number(data.lateCount ?? data.lateSessions ?? 0);
      const absentCount = Number(data.absentCount ?? data.absentSessions ?? 0);
      const excusedCount = Number(data.excusedCount ?? data.excusedSessions ?? 0);
      const attendancePercentage = Number(data.attendancePercentage ?? 0);

      return {
        studentId: String(data.studentId ?? studentId),
        studentName: String(data.studentName ?? ''),
        studentCode: data.studentCode ? String(data.studentCode) : undefined,
        courseGroupId: data.courseGroupId ? String(data.courseGroupId) : null,
        courseGroupName: data.courseGroupName ? String(data.courseGroupName) : null,
        totalRecords,
        attendedCount,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        attendancePercentage,
        totalSessions: totalRecords,
        attendedSessions: attendedCount,
      };
    } catch {
      const { data } = await apiClient.get<Record<string, unknown>>(
        `/students/${encodeURIComponent(studentId)}/attendance/percentage`,
        { params }
      );
      const totalRecords = Number(data.totalRecords ?? data.totalSessions ?? 0);
      const attendedCount = Number(data.attendedCount ?? data.attendedSessions ?? 0);
      const presentCount = Number(data.presentCount ?? data.presentSessions ?? 0);
      const lateCount = Number(data.lateCount ?? data.lateSessions ?? 0);
      const absentCount = Number(data.absentCount ?? data.absentSessions ?? 0);
      const excusedCount = Number(data.excusedCount ?? data.excusedSessions ?? 0);
      const attendancePercentage = Number(data.attendancePercentage ?? 0);

      return {
        studentId: String(data.studentId ?? studentId),
        studentName: String(data.studentName ?? ''),
        studentCode: data.studentCode ? String(data.studentCode) : undefined,
        courseGroupId: data.courseGroupId ? String(data.courseGroupId) : null,
        courseGroupName: data.courseGroupName ? String(data.courseGroupName) : null,
        totalRecords,
        attendedCount,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        attendancePercentage,
        totalSessions: totalRecords,
        attendedSessions: attendedCount,
      };
    }
  },

  async getStudentPercentage(studentId: string, courseGroupId?: string): Promise<BackendAttendancePercentageDto> {
    return this.getPercentage(studentId, courseGroupId, false);
  },
};
