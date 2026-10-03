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

const storageKey = (orgId: string) => `trainhub.organization.${orgId}.sessions`;
function read(orgId: string): TrainingSession[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(orgId)) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is TrainingSession => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.groupId === 'string')) : [];
  } catch { return []; }
}
function write(orgId: string, sessions: TrainingSession[]) { localStorage.setItem(storageKey(orgId), JSON.stringify(sessions)); }

export const sessionsApi = {
  async list(orgId: string, demo: boolean): Promise<TrainingSession[]> {
    if (demo) return read(orgId);
    const { data } = await apiClient.get<TrainingSession[]>(`/organizations/${encodeURIComponent(orgId)}/sessions`);
    return data;
  },
  async create(orgId: string, input: TrainingSessionInput, demo: boolean): Promise<TrainingSession> {
    if (!demo) { const { data } = await apiClient.post<TrainingSession>(`/organizations/${encodeURIComponent(orgId)}/sessions`, input); return data; }
    const session = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(orgId, [session, ...read(orgId)]);
    return session;
  },
  async update(orgId: string, id: string, input: TrainingSessionInput, demo: boolean): Promise<TrainingSession> {
    if (!demo) { const { data } = await apiClient.put<TrainingSession>(`/organizations/${encodeURIComponent(orgId)}/sessions/${encodeURIComponent(id)}`, input); return data; }
    const sessions = read(orgId); const existing = sessions.find((session) => session.id === id);
    if (!existing) throw new Error('Session not found');
    const updated = { ...existing, ...input };
    write(orgId, sessions.map((session) => session.id === id ? updated : session));
    return updated;
  },
  async updateStatus(orgId: string, id: string, status: TrainingSessionStatus, demo: boolean): Promise<TrainingSession> {
    if (!demo) { const { data } = await apiClient.patch<TrainingSession>(`/organizations/${encodeURIComponent(orgId)}/sessions/${encodeURIComponent(id)}/status`, { status }); return data; }
    const sessions = read(orgId); const existing = sessions.find((session) => session.id === id);
    if (!existing) throw new Error('Session not found');
    const updated = { ...existing, status };
    write(orgId, sessions.map((session) => session.id === id ? updated : session));
    return updated;
  },
};
