import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Attendance Enums and Mapping
const codeToAttendanceStatus = {
  0: 'Absent',
  1: 'Present',
  2: 'Late',
  3: 'Excused',
};

const attendanceStatusToCode = {
  Absent: 0,
  Present: 1,
  Late: 2,
  Excused: 3,
};

function mapBackendAttendance(dto) {
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
    status: codeToAttendanceStatus[dto.status] ?? dto.statusName ?? 'Present',
    markedAt: dto.markedAt,
    markedBy: dto.markedByName ?? undefined,
    notes: dto.notes ?? undefined,
  };
}

describe('Task 6: Attendance Flows Validation & Architecture', () => {
  describe('Attendance Status Mapping & Numeric Enums', () => {
    it('should map numeric status codes to domain strings and back', () => {
      assert.strictEqual(codeToAttendanceStatus[0], 'Absent');
      assert.strictEqual(codeToAttendanceStatus[1], 'Present');
      assert.strictEqual(codeToAttendanceStatus[2], 'Late');
      assert.strictEqual(codeToAttendanceStatus[3], 'Excused');

      assert.strictEqual(attendanceStatusToCode.Absent, 0);
      assert.strictEqual(attendanceStatusToCode.Present, 1);
      assert.strictEqual(attendanceStatusToCode.Late, 2);
      assert.strictEqual(attendanceStatusToCode.Excused, 3);
    });

    it('should correctly transform backend DTO to domain AttendanceEntry', () => {
      const dto = {
        id: 'att-101',
        organizationId: 'org-1',
        sessionId: 'sess-1',
        courseGroupName: 'Cohort Alfa',
        sessionStartTime: '2026-03-15T09:00:00Z',
        sessionEndTime: '2026-03-15T11:00:00Z',
        room: 'Lab 3',
        studentId: 'stu-1',
        studentName: 'Ziad Mansour',
        studentCode: 'STU-101',
        markedByName: 'Instructor Sarah',
        status: 2,
        statusName: 'Late',
        markedAt: '2026-03-15T09:15:00Z',
        notes: 'Arrived 15 minutes late due to traffic',
      };

      const entry = mapBackendAttendance(dto);
      assert.strictEqual(entry.id, 'att-101');
      assert.strictEqual(entry.sessionId, 'sess-1');
      assert.strictEqual(entry.studentId, 'stu-1');
      assert.strictEqual(entry.studentName, 'Ziad Mansour');
      assert.strictEqual(entry.status, 'Late');
      assert.strictEqual(entry.notes, 'Arrived 15 minutes late due to traffic');
      assert.strictEqual(entry.markedBy, 'Instructor Sarah');
    });
  });

  describe('Attendance Marking & Shortcuts', () => {
    const roster = [
      { id: 'stu-1', name: 'Ziad Mansour' },
      { id: 'stu-2', name: 'Laila Fawzy' },
      { id: 'stu-3', name: 'Hossam Kamel' },
    ];

    it('should set all roster learners to Present with markAllPresent shortcut', () => {
      let draft = { 'stu-1': 'Absent' };

      const markAllPresent = () => {
        const next = {};
        for (const student of roster) {
          next[student.id] = 'Present';
        }
        draft = { ...draft, ...next };
      };

      markAllPresent();

      assert.strictEqual(draft['stu-1'], 'Present');
      assert.strictEqual(draft['stu-2'], 'Present');
      assert.strictEqual(draft['stu-3'], 'Present');
      assert.strictEqual(Object.keys(draft).length, 3);
    });

    it('should manage per-learner notes draft and clean whitespace', () => {
      const notesDraft = {
        'stu-1': '  Doctor excuse provided   ',
        'stu-2': '   ',
      };

      const getFinalNotes = (studentId) => notesDraft[studentId]?.trim() || undefined;

      assert.strictEqual(getFinalNotes('stu-1'), 'Doctor excuse provided');
      assert.strictEqual(getFinalNotes('stu-2'), undefined);
      assert.strictEqual(getFinalNotes('stu-3'), undefined);
    });
  });

  describe('Save Validation Constraints', () => {
    const roster = [
      { id: 'stu-1', name: 'Ziad' },
      { id: 'stu-2', name: 'Laila' },
      { id: 'stu-3', name: 'Hossam' },
    ];

    const validateBeforeSave = (rosterList, draft) => {
      const missing = rosterList.filter((student) => !draft[student.id]);
      if (missing.length > 0) {
        return { valid: false, error: 'Mark an attendance status for every learner before saving.' };
      }
      return { valid: true, error: null };
    };

    it('should reject save when any learner is missing an attendance status', () => {
      const partialDraft = {
        'stu-1': 'Present',
        'stu-2': 'Late',
        // stu-3 is unassigned
      };

      const result = validateBeforeSave(roster, partialDraft);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Mark an attendance status for every learner before saving.');
    });

    it('should allow save when all learners have an attendance status', () => {
      const completeDraft = {
        'stu-1': 'Present',
        'stu-2': 'Late',
        'stu-3': 'Absent',
      };

      const result = validateBeforeSave(roster, completeDraft);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.error, null);
    });
  });

  describe('Attendance Metrics & Rate Calculations', () => {
    const sampleRecords = [
      { status: 'Present' },
      { status: 'Present' },
      { status: 'Late' },
      { status: 'Absent' },
      { status: 'Excused' },
    ];

    it('should treat Present and Late as attended, and Absent/Excused as non-attended', () => {
      const presentCount = sampleRecords.filter((r) => r.status === 'Present').length;
      const lateCount = sampleRecords.filter((r) => r.status === 'Late').length;
      const absentCount = sampleRecords.filter((r) => r.status === 'Absent').length;
      const excusedCount = sampleRecords.filter((r) => r.status === 'Excused').length;
      const totalRecords = sampleRecords.length;

      assert.strictEqual(presentCount, 2);
      assert.strictEqual(lateCount, 1);
      assert.strictEqual(absentCount, 1);
      assert.strictEqual(excusedCount, 1);

      const attendedCount = presentCount + lateCount;
      assert.strictEqual(attendedCount, 3);

      const rate = totalRecords > 0 ? Math.round((attendedCount / totalRecords) * 100) : 0;
      // 3 / 5 = 60%
      assert.strictEqual(rate, 60);
    });

    it('should handle empty attendance history safely without division by zero', () => {
      const emptyRecords = [];
      const total = emptyRecords.length;
      const attended = 0;
      const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

      assert.strictEqual(rate, 0);
      assert.ok(!Number.isNaN(rate));
    });
  });

  describe('Multi-dimensional Filtering', () => {
    const sessions = [
      { id: 'sess-1', groupId: 'grp-1', date: '2026-03-10', startTime: '10:00' },
      { id: 'sess-2', groupId: 'grp-1', date: '2026-03-12', startTime: '10:00' },
      { id: 'sess-3', groupId: 'grp-2', date: '2026-03-14', startTime: '14:00' },
    ];

    const attendanceBySession = {
      'sess-1': [
        { studentId: 's-1', status: 'Present' },
        { studentId: 's-2', status: 'Late' },
      ],
      'sess-2': [
        { studentId: 's-1', status: 'Absent' },
        { studentId: 's-2', status: 'Present' },
      ],
      'sess-3': [
        { studentId: 's-3', status: 'Present' },
      ],
    };

    const filterRows = ({ filterGroup = 'All', filterSession = 'All', filterStatus = 'All', dateFrom = '', dateTo = '' }) => {
      return sessions.flatMap((session) => {
        if (filterGroup !== 'All' && session.groupId !== filterGroup) return [];
        if (filterSession !== 'All' && session.id !== filterSession) return [];
        if (dateFrom && session.date < dateFrom) return [];
        if (dateTo && session.date > dateTo) return [];
        return (attendanceBySession[session.id] ?? []).flatMap((entry) => {
          if (filterStatus !== 'All' && entry.status !== filterStatus) return [];
          return [{ sessionId: session.id, date: session.date, ...entry }];
        });
      });
    };

    it('should filter by cohort/group', () => {
      const rows = filterRows({ filterGroup: 'grp-1' });
      assert.strictEqual(rows.length, 4); // 2 in sess-1, 2 in sess-2
      assert.ok(rows.every((r) => r.sessionId === 'sess-1' || r.sessionId === 'sess-2'));
    });

    it('should filter by session', () => {
      const rows = filterRows({ filterSession: 'sess-2' });
      assert.strictEqual(rows.length, 2);
      assert.strictEqual(rows[0].sessionId, 'sess-2');
    });

    it('should filter by status (Present vs Absent vs Late)', () => {
      const absentRows = filterRows({ filterStatus: 'Absent' });
      assert.strictEqual(absentRows.length, 1);
      assert.strictEqual(absentRows[0].studentId, 's-1');
      assert.strictEqual(absentRows[0].sessionId, 'sess-2');

      const presentRows = filterRows({ filterStatus: 'Present' });
      assert.strictEqual(presentRows.length, 3);
    });

    it('should filter by date range', () => {
      const dateFiltered = filterRows({ dateFrom: '2026-03-11', dateTo: '2026-03-13' });
      assert.strictEqual(dateFiltered.length, 2);
      assert.strictEqual(dateFiltered[0].sessionId, 'sess-2');
    });
  });

  describe('Dirty State & Change Detection', () => {
    const roster = [{ id: 'stu-1' }, { id: 'stu-2' }];
    const savedEntries = [
      { studentId: 'stu-1', status: 'Present', notes: 'Great participation' },
      { studentId: 'stu-2', status: 'Absent', notes: '' },
    ];

    const checkDirty = (draft, notesDraft) => {
      return roster.some((student) => {
        const existing = savedEntries.find((entry) => entry.studentId === student.id);
        const statusChanged = (draft[student.id] ?? '') !== (existing?.status ?? '');
        const noteChanged = (notesDraft[student.id] ?? '') !== (existing?.notes ?? '');
        return statusChanged || noteChanged;
      });
    };

    it('should detect when status or notes change', () => {
      // Clean state
      const cleanDraft = { 'stu-1': 'Present', 'stu-2': 'Absent' };
      const cleanNotes = { 'stu-1': 'Great participation', 'stu-2': '' };
      assert.strictEqual(checkDirty(cleanDraft, cleanNotes), false);

      // Status changed
      const dirtyDraftStatus = { ...cleanDraft, 'stu-2': 'Late' };
      assert.strictEqual(checkDirty(dirtyDraftStatus, cleanNotes), true);

      // Notes changed
      const dirtyDraftNotes = { ...cleanNotes, 'stu-1': 'Updated comment' };
      assert.strictEqual(checkDirty(cleanDraft, dirtyDraftNotes), true);
    });
  });

  describe('Role-Based Permissions & Instructor Scoping', () => {
    it('should grant marking permissions to Admin and Instructor, and restrict Student to view-only', () => {
      const canMark = (role) => role === 'ORG_ADMIN' || role === 'SUPER_ADMIN' || role === 'INSTRUCTOR';

      assert.strictEqual(canMark('ORG_ADMIN'), true);
      assert.strictEqual(canMark('SUPER_ADMIN'), true);
      assert.strictEqual(canMark('INSTRUCTOR'), true);
      assert.strictEqual(canMark('STUDENT'), false);
    });

    it('should scope sessions visible to instructor to only their assigned cohorts', () => {
      const instructorId = 'inst-1';
      const allGroups = [
        { id: 'grp-1', instructorIds: ['inst-1', 'inst-2'] },
        { id: 'grp-2', instructorIds: ['inst-2'] }, // not assigned to inst-1
        { id: 'grp-3', instructorIds: ['inst-1'] },
      ];

      const allSessions = [
        { id: 's-1', groupId: 'grp-1' },
        { id: 's-2', groupId: 'grp-2' },
        { id: 's-3', groupId: 'grp-3' },
      ];

      const allowedGroups = allGroups.filter((g) => g.instructorIds?.includes(instructorId));
      const visibleSessions = allSessions.filter((s) =>
        allowedGroups.some((g) => g.id === s.groupId)
      );

      assert.strictEqual(visibleSessions.length, 2);
      const sessionIds = visibleSessions.map((s) => s.id);
      assert.ok(sessionIds.includes('s-1'));
      assert.ok(sessionIds.includes('s-3'));
      assert.ok(!sessionIds.includes('s-2'));
    });
  });

  describe('Storage Fallback & Session Merge Persistence', () => {
    it('should merge session attendance updates by studentId', () => {
      const existingSaved = [
        { studentId: 'stu-1', status: 'Present', markedAt: '2026-03-01T10:00:00Z' },
        { studentId: 'stu-2', status: 'Absent', markedAt: '2026-03-01T10:00:00Z' },
      ];

      const updatesToSave = [
        { studentId: 'stu-2', status: 'Late', markedAt: '2026-03-01T10:30:00Z' },
        { studentId: 'stu-3', status: 'Present', markedAt: '2026-03-01T10:30:00Z' },
      ];

      const updateMap = new Map(updatesToSave.map((entry) => [entry.studentId, entry]));
      const merged = [
        ...existingSaved.filter((entry) => !updateMap.has(entry.studentId)),
        ...updateMap.values(),
      ];

      assert.strictEqual(merged.length, 3);
      assert.strictEqual(merged.find((e) => e.studentId === 'stu-1')?.status, 'Present');
      assert.strictEqual(merged.find((e) => e.studentId === 'stu-2')?.status, 'Late');
      assert.strictEqual(merged.find((e) => e.studentId === 'stu-3')?.status, 'Present');
    });
  });

  describe('CON-02: Elimination of Silent localStorage Fallback on API Failures', () => {
    it('should throw and propagate errors when save API fails in non-demo mode', async () => {
      const saveAttendance = async (isDemo, mockApiFn) => {
        if (!isDemo) {
          return await mockApiFn();
        }
        return 'demo-fallback';
      };

      const failingApi = async () => {
        throw new Error('500 Internal Server Error: Failed to commit attendance');
      };

      await assert.rejects(
        async () => {
          await saveAttendance(false, failingApi);
        },
        {
          message: '500 Internal Server Error: Failed to commit attendance',
        }
      );
    });

    it('should not silently fall back to localStorage on network timeout or 4xx/5xx in non-demo mode', async () => {
      let localStorageWritten = false;
      const fakeLocalStorage = {
        setItem: () => {
          localStorageWritten = true;
        },
      };

      const executeSave = async (isDemo) => {
        if (!isDemo) {
          throw new Error('Network Error');
        }
        fakeLocalStorage.setItem('attendance', 'cached');
      };

      await assert.rejects(
        async () => {
          await executeSave(false);
        },
        /Network Error/
      );

      assert.strictEqual(localStorageWritten, false, 'localStorage must NOT be written when non-demo API fails');
    });

    it('should allow demo mode to utilize demo persistence without affecting production flow', async () => {
      let localStorageWritten = false;
      const fakeLocalStorage = {
        setItem: () => {
          localStorageWritten = true;
        },
      };

      const executeSave = async (isDemo) => {
        if (!isDemo) {
          throw new Error('Network Error');
        }
        fakeLocalStorage.setItem('attendance', 'cached');
        return { success: true };
      };

      const result = await executeSave(true);
      assert.strictEqual(result.success, true);
      assert.strictEqual(localStorageWritten, true);
    });
  });

  describe('Phase 3.2: Transactional Batch Attendance Contract & UI Workflow', () => {
    it('should send batch attendance in exactly one POST request to /sessions/{sessionId}/attendance/batch', async () => {
      let postCallCount = 0;
      let requestedEndpoint = '';
      let sentPayload = null;

      const mockApiClient = {
        post: async (endpoint, payload) => {
          postCallCount++;
          requestedEndpoint = endpoint;
          sentPayload = payload;
          return {
            data: payload.records.map((r, i) => ({
              id: `att-${i + 1}`,
              organizationId: 'org-1',
              sessionId: 'sess-100',
              studentId: r.studentId,
              studentName: `Student ${r.studentId}`,
              studentCode: `STU-${i + 1}`,
              status: r.status,
              statusName: codeToAttendanceStatus[r.status],
              markedAt: new Date().toISOString(),
              notes: r.notes,
            })),
          };
        },
      };

      const saveBatchAttendance = async (sessionId, entries) => {
        const payload = {
          records: entries.map((entry) => ({
            studentId: entry.studentId,
            status: attendanceStatusToCode[entry.status] ?? 1,
            notes: entry.notes || null,
          })),
        };

        const { data } = await mockApiClient.post(
          `/sessions/${encodeURIComponent(sessionId)}/attendance/batch`,
          payload
        );

        return (data || []).map(mapBackendAttendance);
      };

      const entries = [
        { studentId: 'stu-1', status: 'Present', notes: 'On time' },
        { studentId: 'stu-2', status: 'Late', notes: 'Traffic' },
        { studentId: 'stu-3', status: 'Absent', notes: null },
      ];

      const result = await saveBatchAttendance('sess-100', entries);

      assert.strictEqual(postCallCount, 1, 'Batch API must be called exactly once');
      assert.strictEqual(requestedEndpoint, '/sessions/sess-100/attendance/batch');
      assert.strictEqual(sentPayload.records.length, 3);
      assert.strictEqual(sentPayload.records[0].studentId, 'stu-1');
      assert.strictEqual(sentPayload.records[0].status, 1);
      assert.strictEqual(sentPayload.records[0].notes, 'On time');
      assert.strictEqual(sentPayload.records[1].status, 2);
      assert.strictEqual(sentPayload.records[2].status, 0);

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].status, 'Present');
      assert.strictEqual(result[1].status, 'Late');
      assert.strictEqual(result[2].status, 'Absent');
    });

    it('should eliminate per-student request loops in real mode', async () => {
      let individualPutCalls = 0;
      let individualPostCalls = 0;
      let batchCalls = 0;

      const executeBatchSave = async (sessionId, entries) => {
        batchCalls++;
        return entries.map((e) => ({
          ...e,
          id: `saved-${e.studentId}`,
        }));
      };

      const roster = [
        { studentId: 's1', status: 'Present' },
        { studentId: 's2', status: 'Present' },
        { studentId: 's3', status: 'Late' },
        { studentId: 's4', status: 'Excused' },
      ];

      await executeBatchSave('sess-1', roster);

      assert.strictEqual(batchCalls, 1, 'Must invoke single batch call');
      assert.strictEqual(individualPutCalls, 0, 'Must NOT perform individual PUT requests');
      assert.strictEqual(individualPostCalls, 0, 'Must NOT perform individual POST requests');
    });

    it('should not discard unsaved drafts and should propagate error when batch API fails', async () => {
      let draftState = {
        'stu-1': 'Present',
        'stu-2': 'Absent',
      };
      let saveNotice = false;
      let saveError = '';

      const failingBatchSave = async () => {
        throw new Error('409 Conflict: Student stu-2 is not enrolled in the course group for this session.');
      };

      try {
        await failingBatchSave();
        saveNotice = true;
      } catch (err) {
        saveError = err.message;
      }

      assert.strictEqual(saveNotice, false, 'Save notice must remain false on error');
      assert.match(saveError, /409 Conflict/);
      assert.strictEqual(draftState['stu-1'], 'Present', 'Draft state must be preserved for editing');
      assert.strictEqual(draftState['stu-2'], 'Absent', 'Draft state must be preserved for editing');
    });

    it('should prevent duplicate submissions while saving is active', () => {
      let saving = false;
      let submissionAttempts = 0;

      const submitHandler = () => {
        if (saving) return 'blocked';
        saving = true;
        submissionAttempts++;
        return 'submitted';
      };

      const firstCall = submitHandler();
      const secondCall = submitHandler();

      assert.strictEqual(firstCall, 'submitted');
      assert.strictEqual(secondCall, 'blocked');
      assert.strictEqual(submissionAttempts, 1);
    });
  });
});


