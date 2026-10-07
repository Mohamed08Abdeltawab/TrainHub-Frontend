import apiClient from '@/api/apiClient';

export type TrainingSessionStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export type TrainingSession = {
  id: string;
  title: string;
  groupId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingUrl?: string;
  status: TrainingSessionStatus;
  createdAt: string;
};

export type TrainingSessionInput = Omit<TrainingSession, 'id' | 'createdAt'>;

export interface BackendSessionDto {
  id: string;
  organizationId: string;
  courseGroupId: string;
  courseGroupName: string;
  courseId: string;
  courseName: string;
  instructorId?: string | null;
  instructorName?: string | null;
  startTime: string;
  endTime: string;
  room?: string | null;
  status: number;
  statusName: string;
  createdAt: string;
  updatedAt: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

const statusToCode: Record<TrainingSessionStatus, number> = {
  Scheduled: 1,
  Completed: 2,
  Cancelled: 3,
};

function mapBackendStatus(status: number | string): TrainingSessionStatus {
  if (status === 2 || status === 'Completed') return 'Completed';
  if (status === 3 || status === 'Cancelled') return 'Cancelled';
  return 'Scheduled';
}

function parseIsoDateTime(iso: string): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const [d, t] = iso.split('T');
  const date = d || '';
  const time = (t || '').substring(0, 5);
  return { date, time };
}

function toIsoString(date: string, time: string): string {
  const formattedTime = time.length === 5 ? `${time}:00` : time;
  return `${date}T${formattedTime}`;
}

function mapSession(dto: BackendSessionDto): TrainingSession {
  const { date, time: startTime } = parseIsoDateTime(dto.startTime);
  const { time: endTime } = parseIsoDateTime(dto.endTime);

  let title = dto.room || (dto.courseGroupName ? `${dto.courseGroupName} Session` : 'Session');
  let location = dto.room || '';
  if (dto.room && dto.room.includes(' - ')) {
    const parts = dto.room.split(' - ');
    title = parts[0];
    location = parts.slice(1).join(' - ');
  }

  return {
    id: dto.id,
    title,
    groupId: dto.courseGroupId,
    date,
    startTime,
    endTime,
    location,
    meetingUrl: dto.room?.startsWith('http') ? dto.room : undefined,
    status: mapBackendStatus(dto.status ?? dto.statusName),
    createdAt: dto.createdAt,
  };
}

function buildRoomString(title?: string, location?: string, meetingUrl?: string): string | undefined {
  if (meetingUrl?.trim()) {
    return meetingUrl.trim().substring(0, 50);
  }
  const cleanTitle = title?.trim() || '';
  const cleanLocation = location?.trim() || '';
  if (cleanTitle && cleanLocation && cleanTitle !== cleanLocation) {
    return `${cleanTitle} - ${cleanLocation}`.substring(0, 50);
  }
  return (cleanLocation || cleanTitle || '').substring(0, 50) || undefined;
}

const storageKey = (orgId: string) => `trainhub.organization.${orgId}.sessions`;

function read(orgId: string): TrainingSession[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(orgId)) ?? '[]');
    return Array.isArray(value)
      ? value.filter(
          (item): item is TrainingSession =>
            Boolean(
              item &&
                typeof item.id === 'string' &&
                typeof item.title === 'string' &&
                typeof item.groupId === 'string'
            )
        )
      : [];
  } catch {
    return [];
  }
}

function write(orgId: string, sessions: TrainingSession[]) {
  localStorage.setItem(storageKey(orgId), JSON.stringify(sessions));
}

export const sessionsApi = {
  async list(
    orgId: string,
    demo: boolean,
    query?: {
      courseGroupId?: string;
      instructorId?: string;
      status?: number;
      fromDate?: string;
      toDate?: string;
      searchTerm?: string;
      pageNumber?: number;
      pageSize?: number;
    }
  ): Promise<TrainingSession[]> {
    if (demo) return read(orgId);
    try {
      const params: Record<string, string | number> = {
        pageSize: query?.pageSize ?? 100,
        pageNumber: query?.pageNumber ?? 1,
      };
      if (query?.courseGroupId) params.courseGroupId = query.courseGroupId;
      if (query?.instructorId) params.instructorId = query.instructorId;
      if (query?.status !== undefined) params.status = query.status;
      if (query?.fromDate) params.fromDate = query.fromDate;
      if (query?.toDate) params.toDate = query.toDate;
      if (query?.searchTerm) params.searchTerm = query.searchTerm;

      const { data } = await apiClient.get<PagedResult<BackendSessionDto> | BackendSessionDto[]>('/sessions', {
        params,
      });
      const items = Array.isArray(data) ? data : data?.items || [];
      return items.map(mapSession);
    } catch (err) {
      if (demo) return read(orgId);
      throw err;
    }
  },

  async getById(id: string, orgId?: string, demo?: boolean): Promise<TrainingSession> {
    if (demo && orgId) {
      const existing = read(orgId).find((s) => s.id === id);
      if (!existing) throw new Error('Session not found');
      return existing;
    }
    const { data } = await apiClient.get<BackendSessionDto>(`/sessions/${encodeURIComponent(id)}`);
    return mapSession(data);
  },

  async getByGroupId(groupId: string, demoOrgId?: string, demo?: boolean): Promise<TrainingSession[]> {
    if (demo && demoOrgId) {
      return read(demoOrgId).filter((s) => s.groupId === groupId);
    }
    const { data } = await apiClient.get<BackendSessionDto[]>(`/sessions/group/${encodeURIComponent(groupId)}`);
    return (data || []).map(mapSession);
  },

  async create(orgId: string, input: TrainingSessionInput, demo: boolean): Promise<TrainingSession> {
    if (!demo) {
      const startTime = toIsoString(input.date, input.startTime);
      const endTime = toIsoString(input.date, input.endTime);
      const room = buildRoomString(input.title, input.location, input.meetingUrl);
      const status = statusToCode[input.status] ?? 1;

      const payload = {
        courseGroupId: input.groupId,
        startTime,
        endTime,
        room,
        status,
      };

      const { data } = await apiClient.post<BackendSessionDto>('/sessions', payload);
      return mapSession(data);
    }
    const session = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(orgId, [session, ...read(orgId)]);
    return session;
  },

  async update(orgId: string, id: string, input: TrainingSessionInput, demo: boolean): Promise<TrainingSession> {
    if (!demo) {
      const startTime = toIsoString(input.date, input.startTime);
      const endTime = toIsoString(input.date, input.endTime);
      const room = buildRoomString(input.title, input.location, input.meetingUrl);
      const status = statusToCode[input.status] ?? 1;

      const payload = {
        startTime,
        endTime,
        room,
        status,
      };

      const { data } = await apiClient.put<BackendSessionDto>(`/sessions/${encodeURIComponent(id)}`, payload);
      return mapSession(data);
    }
    const sessions = read(orgId);
    const existing = sessions.find((session) => session.id === id);
    if (!existing) throw new Error('Session not found');
    const updated = { ...existing, ...input };
    write(orgId, sessions.map((session) => (session.id === id ? updated : session)));
    return updated;
  },

  async reschedule(
    orgId: string,
    id: string,
    startTime: string,
    endTime: string,
    room?: string,
    demo?: boolean
  ): Promise<TrainingSession> {
    if (!demo) {
      const payload = {
        startTime,
        endTime,
        room: room ? room.substring(0, 50) : undefined,
      };
      const { data } = await apiClient.patch<BackendSessionDto>(`/sessions/${encodeURIComponent(id)}/reschedule`, payload);
      return mapSession(data);
    }
    const sessions = read(orgId);
    const existing = sessions.find((s) => s.id === id);
    if (!existing) throw new Error('Session not found');
    const { date, time: parsedStart } = parseIsoDateTime(startTime);
    const { time: parsedEnd } = parseIsoDateTime(endTime);
    const updated = {
      ...existing,
      date: date || existing.date,
      startTime: parsedStart || existing.startTime,
      endTime: parsedEnd || existing.endTime,
      location: room || existing.location,
    };
    write(orgId, sessions.map((s) => (s.id === id ? updated : s)));
    return updated;
  },

  async updateStatus(
    orgId: string,
    id: string,
    status: TrainingSessionStatus,
    demo: boolean
  ): Promise<TrainingSession> {
    if (!demo) {
      const statusCode = statusToCode[status] ?? 1;
      const { data } = await apiClient.patch<BackendSessionDto>(`/sessions/${encodeURIComponent(id)}/status`, {
        status: statusCode,
      });
      return mapSession(data);
    }
    const sessions = read(orgId);
    const existing = sessions.find((session) => session.id === id);
    if (!existing) throw new Error('Session not found');
    const updated = { ...existing, status };
    write(orgId, sessions.map((session) => (session.id === id ? updated : session)));
    return updated;
  },

  async delete(orgId: string, id: string, demo: boolean): Promise<void> {
    if (!demo) {
      await apiClient.delete(`/sessions/${encodeURIComponent(id)}`);
      return;
    }
    const sessions = read(orgId);
    write(orgId, sessions.filter((s) => s.id !== id));
  },
};
