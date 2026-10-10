import apiClient from '@/api/apiClient';

export type TrainingSessionStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Draft';

export type TrainingSession = {
  id: string;
  title: string;
  groupId: string;
  groupName?: string;
  courseId?: string;
  courseTitle?: string;
  instructorId?: string | null;
  instructorName?: string | null;
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

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface SessionQueryParameters {
  courseGroupId?: string;
  courseId?: string;
  instructorId?: string;
  status?: number;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
  room?: string;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

const statusByteMap: Record<number, TrainingSessionStatus> = {
  0: 'Draft',
  1: 'Scheduled',
  2: 'Completed',
  3: 'Cancelled',
};

const statusToByteMap: Record<TrainingSessionStatus, number> = {
  Draft: 0,
  Scheduled: 1,
  Completed: 2,
  Cancelled: 3,
};

export function toIsoUtc(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) return new Date().toISOString();
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  return date.toISOString();
}

export function fromIsoUtc(isoStr: string): { date: string; time: string } {
  if (!isoStr) return { date: '', time: '' };
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) {
      const parts = isoStr.split('T');
      return { date: parts[0] || '', time: parts[1]?.slice(0, 5) || '' };
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    return { date, time };
  } catch {
    const parts = isoStr.split('T');
    return { date: parts[0] || '', time: parts[1]?.slice(0, 5) || '' };
  }
}

export function mapSession(dto: BackendSessionDto): TrainingSession {
  const { date, time: startTime } = fromIsoUtc(dto.startTime);
  const { time: endTime } = fromIsoUtc(dto.endTime);
  const isUrl = Boolean(dto.room && /^https?:\/\//i.test(dto.room.trim()));
  const status = statusByteMap[dto.status] ?? (dto.statusName as TrainingSessionStatus) ?? 'Scheduled';

  return {
    id: dto.id,
    title: dto.courseGroupName ? `${dto.courseGroupName} - Session` : (dto.courseName || 'Training Session'),
    groupId: dto.courseGroupId,
    groupName: dto.courseGroupName,
    courseId: dto.courseId,
    courseTitle: dto.courseName,
    instructorId: dto.instructorId ?? null,
    instructorName: dto.instructorName ?? null,
    date,
    startTime: startTime || '09:00',
    endTime: endTime || '11:00',
    location: isUrl ? 'Online' : (dto.room || ''),
    meetingUrl: isUrl ? dto.room?.trim() : undefined,
    status,
    createdAt: dto.createdAt,
  };
}

const storageKey = (orgId: string) => `trainhub.organization.${orgId}.sessions`;

function getSeedSessions(): TrainingSession[] {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const dPast = new Date(today);
  dPast.setDate(today.getDate() - 2);

  const dFuture1 = new Date(today);
  dFuture1.setDate(today.getDate() + 1);

  const dFuture2 = new Date(today);
  dFuture2.setDate(today.getDate() + 3);

  return [
    {
      id: 'demo-session-1',
      title: 'React Components & Hooks',
      groupId: 'demo-cohort-a',
      groupName: 'Cohort A - Fullstack Web Development',
      courseId: 'demo-course-web',
      courseTitle: 'Fullstack Web Development',
      instructorId: 'user-instructor',
      instructorName: 'Sarah Jenkins',
      date: formatDate(today),
      startTime: '14:00',
      endTime: '16:00',
      location: 'Lab 201',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-session-2',
      title: 'Orientation & Environment Setup',
      groupId: 'demo-cohort-a',
      groupName: 'Cohort A - Fullstack Web Development',
      courseId: 'demo-course-web',
      courseTitle: 'Fullstack Web Development',
      instructorId: 'user-instructor',
      instructorName: 'Sarah Jenkins',
      date: formatDate(dPast),
      startTime: '10:00',
      endTime: '12:00',
      location: 'Room 102',
      meetingUrl: 'https://meet.google.com/xyz-uvwx-rst',
      status: 'Completed',
      createdAt: new Date(dPast).toISOString(),
    },
    {
      id: 'demo-session-3',
      title: 'State Management & API Integration',
      groupId: 'demo-cohort-a',
      groupName: 'Cohort A - Fullstack Web Development',
      courseId: 'demo-course-web',
      courseTitle: 'Fullstack Web Development',
      instructorId: 'user-instructor',
      instructorName: 'Sarah Jenkins',
      date: formatDate(dFuture1),
      startTime: '14:00',
      endTime: '16:30',
      location: 'Lab 201',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-session-4',
      title: 'Wireframing & Interactive Prototyping',
      groupId: 'demo-cohort-b',
      groupName: 'Cohort B - Modern UI/UX Design',
      courseId: 'demo-course-design',
      courseTitle: 'Modern UI/UX Design',
      instructorId: 'inst-mona-zaki',
      instructorName: 'Mona Zaki',
      date: formatDate(dFuture2),
      startTime: '11:00',
      endTime: '13:00',
      location: 'Design Studio 4',
      meetingUrl: 'https://meet.google.com/ux-design-room',
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-session-5',
      title: 'Design Systems & Typography',
      groupId: 'demo-cohort-b',
      groupName: 'Cohort B - Modern UI/UX Design',
      courseId: 'demo-course-design',
      courseTitle: 'Modern UI/UX Design',
      instructorId: 'inst-mona-zaki',
      instructorName: 'Mona Zaki',
      date: formatDate(today),
      startTime: '10:00',
      endTime: '12:00',
      location: 'Design Studio 4',
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-session-6',
      title: 'Git Branching & CI/CD Pipelines',
      groupId: 'demo-cohort-c',
      groupName: 'Cohort C - Agile & Git Team Workflows',
      courseId: 'demo-course-git',
      courseTitle: 'Agile & Git Team Workflows',
      instructorId: 'inst-omar-hassan',
      instructorName: 'Omar Hassan',
      date: formatDate(dFuture1),
      startTime: '10:00',
      endTime: '12:30',
      location: 'Dev Lab 101',
      meetingUrl: 'https://meet.google.com/git-workflows-live',
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-session-7',
      title: 'Async JavaScript & Event Loop',
      groupId: 'demo-cohort-d',
      groupName: 'Cohort D - JavaScript Essentials',
      courseId: 'demo-course-js',
      courseTitle: 'JavaScript Essentials & Deep Dive',
      instructorId: 'user-instructor',
      instructorName: 'Sarah Jenkins',
      date: formatDate(dFuture2),
      startTime: '15:00',
      endTime: '17:00',
      location: 'Lab 201',
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    },
  ];
}

function read(orgId: string): TrainingSession[] {
  try {
    const raw = localStorage.getItem(storageKey(orgId));
    if (!raw) {
      const seeded = getSeedSessions();
      write(orgId, seeded);
      return seeded;
    }
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value)) {
      const valid = value.filter(
        (item): item is TrainingSession =>
          Boolean(item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.groupId === 'string')
      );
      if (valid.length > 0) return valid;
    }
    const seeded = getSeedSessions();
    write(orgId, seeded);
    return seeded;
  } catch {
    return getSeedSessions();
  }
}

function write(orgId: string, sessions: TrainingSession[]) {
  try {
    localStorage.setItem(storageKey(orgId), JSON.stringify(sessions));
  } catch {
    // LocalStorage write ignored if storage disabled
  }
}

export const sessionsApi = {
  async list(orgId: string, demo: boolean, query?: SessionQueryParameters): Promise<TrainingSession[]> {
    if (demo) {
      let items = read(orgId);
      if (query?.courseGroupId) {
        items = items.filter((s) => s.groupId === query.courseGroupId);
      }
      if (query?.instructorId) {
        items = items.filter((s) => s.instructorId === query.instructorId);
      }
      if (query?.status !== undefined) {
        const statusName = statusByteMap[query.status];
        if (statusName) items = items.filter((s) => s.status === statusName);
      }
      if (query?.searchTerm) {
        const term = query.searchTerm.toLowerCase();
        items = items.filter((s) =>
          `${s.title} ${s.groupName ?? ''} ${s.location}`.toLowerCase().includes(term)
        );
      }
      return items;
    }

    const params: Record<string, string | number | boolean> = {
      pageSize: query?.pageSize ?? 100,
      pageNumber: query?.pageNumber ?? 1,
    };
    if (query?.courseGroupId) params.courseGroupId = query.courseGroupId;
    if (query?.courseId) params.courseId = query.courseId;
    if (query?.instructorId) params.instructorId = query.instructorId;
    if (query?.status !== undefined) params.status = query.status;
    if (query?.searchTerm) params.searchTerm = query.searchTerm;
    if (query?.fromDate) params.fromDate = query.fromDate;
    if (query?.toDate) params.toDate = query.toDate;
    if (query?.room) params.room = query.room;
    if (query?.sortBy) params.sortBy = query.sortBy;
    if (query?.sortDescending !== undefined) params.sortDescending = query.sortDescending;

    const { data } = await apiClient.get<PagedResult<BackendSessionDto> | BackendSessionDto[]>('/sessions', {
      params,
    });
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map(mapSession);
  },

  async getById(id: string, orgId = 'demo', demo = false): Promise<TrainingSession> {
    if (demo) {
      const found = read(orgId).find((s) => s.id === id);
      if (!found) throw new Error('Session not found');
      return found;
    }
    const { data } = await apiClient.get<BackendSessionDto>(`/sessions/${encodeURIComponent(id)}`);
    return mapSession(data);
  },

  async getByCourseGroupId(courseGroupId: string, orgId = 'demo', demo = false): Promise<TrainingSession[]> {
    if (demo) {
      return read(orgId).filter((s) => s.groupId === courseGroupId);
    }
    const { data } = await apiClient.get<BackendSessionDto[]>(`/coursegroups/${encodeURIComponent(courseGroupId)}/sessions`);
    return (data || []).map(mapSession);
  },

  async getByGroupId(groupId: string, orgId = 'demo', demo = false): Promise<TrainingSession[]> {
    return this.getByCourseGroupId(groupId, orgId, demo);
  },

  async create(orgId: string, input: TrainingSessionInput, demo: boolean): Promise<TrainingSession> {
    if (!demo) {
      const room = (input.location || input.meetingUrl || '').trim();
      const payload = {
        courseGroupId: input.groupId,
        instructorId: input.instructorId || null,
        startTime: toIsoUtc(input.date, input.startTime),
        endTime: toIsoUtc(input.date, input.endTime),
        room: room.length > 50 ? room.slice(0, 50) : room || null,
        status: statusToByteMap[input.status] ?? 1,
      };
      const { data } = await apiClient.post<BackendSessionDto>('/sessions', payload);
      const mapped = mapSession(data);
      if (input.title) mapped.title = input.title;
      if (input.location) mapped.location = input.location;
      if (input.meetingUrl) mapped.meetingUrl = input.meetingUrl;
      return mapped;
    }

    const session: TrainingSession = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    write(orgId, [session, ...read(orgId)]);
    return session;
  },

  async update(orgId: string, id: string, input: TrainingSessionInput, demo: boolean): Promise<TrainingSession> {
    if (!demo) {
      const room = (input.location || input.meetingUrl || '').trim();
      const payload = {
        instructorId: input.instructorId || null,
        startTime: toIsoUtc(input.date, input.startTime),
        endTime: toIsoUtc(input.date, input.endTime),
        room: room.length > 50 ? room.slice(0, 50) : room || null,
        status: statusToByteMap[input.status] ?? 1,
      };
      const { data } = await apiClient.put<BackendSessionDto>(`/sessions/${encodeURIComponent(id)}`, payload);
      const mapped = mapSession(data);
      if (input.title) mapped.title = input.title;
      if (input.location) mapped.location = input.location;
      if (input.meetingUrl) mapped.meetingUrl = input.meetingUrl;
      return mapped;
    }

    const sessions = read(orgId);
    const existing = sessions.find((session) => session.id === id);
    if (!existing) throw new Error('Session not found');
    const updated: TrainingSession = { ...existing, ...input };
    write(orgId, sessions.map((session) => (session.id === id ? updated : session)));
    return updated;
  },

  async reschedule(
    orgId: string,
    id: string,
    startTime: string,
    endTime: string,
    room?: string,
    demo = false
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
    const { date, time: parsedStart } = fromIsoUtc(startTime);
    const { time: parsedEnd } = fromIsoUtc(endTime);
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
      const { data } = await apiClient.patch<BackendSessionDto>(`/sessions/${encodeURIComponent(id)}/status`, {
        status: statusToByteMap[status] ?? 1,
      });
      return mapSession(data);
    }

    const sessions = read(orgId);
    const existing = sessions.find((session) => session.id === id);
    if (!existing) throw new Error('Session not found');
    const updated: TrainingSession = { ...existing, status };
    write(orgId, sessions.map((session) => (session.id === id ? updated : session)));
    return updated;
  },

  async delete(orgId: string, id: string, demo: boolean): Promise<void> {
    if (!demo) {
      await apiClient.delete(`/sessions/${encodeURIComponent(id)}`);
      return;
    }
    const sessions = read(orgId);
    write(orgId, sessions.filter((session) => session.id !== id));
  },
};
