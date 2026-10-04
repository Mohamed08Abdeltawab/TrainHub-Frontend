import apiClient from '@/api/apiClient';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';
export type AttendanceEntry = { studentId: string; status: AttendanceStatus; markedAt: string; markedBy?: string };
const key = (orgId: string, sessionId: string) => `trainhub.organization.${orgId}.session.${sessionId}.attendance`;
const isEntry = (item: unknown): item is AttendanceEntry => Boolean(item && typeof item === 'object' && typeof (item as AttendanceEntry).studentId === 'string' && ['Present', 'Absent', 'Late', 'Excused'].includes((item as AttendanceEntry).status) && typeof (item as AttendanceEntry).markedAt === 'string');
function read(orgId: string, sessionId: string): AttendanceEntry[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(key(orgId, sessionId)) ?? '[]'); return Array.isArray(value) ? value.filter(isEntry) : []; } catch { return []; }
}
function write(orgId: string, sessionId: string, entries: AttendanceEntry[]) { localStorage.setItem(key(orgId, sessionId), JSON.stringify(entries)); }

export const attendanceApi = {
  async list(orgId: string, sessionId: string, demo: boolean): Promise<AttendanceEntry[]> {
    if (demo) return read(orgId, sessionId);
    const { data } = await apiClient.get<AttendanceEntry[]>(`/organizations/${encodeURIComponent(orgId)}/sessions/${encodeURIComponent(sessionId)}/attendance`);
    return data;
  },
  async save(orgId: string, sessionId: string, entries: AttendanceEntry[], demo: boolean): Promise<AttendanceEntry[]> {
    if (!demo) {
      const { data } = await apiClient.put<AttendanceEntry[]>(`/organizations/${encodeURIComponent(orgId)}/sessions/${encodeURIComponent(sessionId)}/attendance`, { attendance: entries });
      return data;
    }
    const current = read(orgId, sessionId);
    const updates = new Map(entries.map((entry) => [entry.studentId, entry]));
    const saved = [...current.filter((entry) => !updates.has(entry.studentId)), ...updates.values()];
    write(orgId, sessionId, saved);
    return saved;
  },
};
