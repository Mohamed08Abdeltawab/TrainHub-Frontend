import apiClient from '@/api/apiClient';

export interface AssignmentDto {
  id: string;
  organizationId: string;
  courseGroupId: string;
  courseGroupName: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string | null;
  dueDate: string;
  maxScore: number;
  status: number;
  statusName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentInput {
  courseGroupId: string;
  title: string;
  description?: string | null;
  dueDate: string;
  maxScore?: number;
  status?: number;
}

export interface UpdateAssignmentInput {
  title: string;
  description?: string | null;
  dueDate: string;
  maxScore?: number;
  status?: number;
}

export interface AssignmentQueryParameters {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  courseGroupId?: string;
  courseId?: string;
  status?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

const DEMO_STORAGE_KEY = 'trainhub.demo.assignments';

function getDemoAssignments(): AssignmentDto[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const initial: AssignmentDto[] = [
    {
      id: 'demo-asg-1',
      organizationId: 'demo',
      courseGroupId: 'demo-group-1',
      courseGroupName: 'Cohort A',
      courseId: 'demo-course-1',
      courseName: 'Fullstack Web Development',
      title: 'Build a REST API Client',
      description: 'Implement a frontend service connecting to the TrainHub backend endpoints.',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      maxScore: 100,
      status: 1,
      statusName: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-asg-2',
      organizationId: 'demo',
      courseGroupId: 'demo-group-1',
      courseGroupName: 'Cohort A',
      courseId: 'demo-course-1',
      courseName: 'Fullstack Web Development',
      title: 'Database Schema Design & ERD',
      description: 'Design the relational schema for multi-tenant course and enrollment management.',
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      maxScore: 50,
      status: 1,
      statusName: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

function saveDemoAssignments(items: AssignmentDto[]) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const assignmentsApi = {
  async list(params?: AssignmentQueryParameters, isDemo?: boolean): Promise<PagedResult<AssignmentDto>> {
    if (isDemo) {
      let items = getDemoAssignments();
      if (params?.courseGroupId) {
        items = items.filter((a) => a.courseGroupId === params.courseGroupId);
      }
      if (params?.searchTerm) {
        const term = params.searchTerm.toLowerCase();
        items = items.filter((a) => a.title.toLowerCase().includes(term) || (a.description && a.description.toLowerCase().includes(term)));
      }
      return {
        items,
        totalCount: items.length,
        pageNumber: params?.pageNumber || 1,
        pageSize: params?.pageSize || 10,
      };
    }

    const { data } = await apiClient.get<PagedResult<AssignmentDto>>('/assignments', {
      params,
    });
    return data;
  },

  async getById(id: string, isDemo?: boolean): Promise<AssignmentDto> {
    if (isDemo) {
      const items = getDemoAssignments();
      const item = items.find((a) => a.id === id);
      if (!item) throw new Error('Assignment not found');
      return item;
    }

    const { data } = await apiClient.get<AssignmentDto>(`/assignments/${encodeURIComponent(id)}`);
    return data;
  },

  async create(input: CreateAssignmentInput, isDemo?: boolean, groupName?: string, courseName?: string): Promise<AssignmentDto> {
    if (isDemo) {
      const items = getDemoAssignments();
      const newItem: AssignmentDto = {
        id: `demo-asg-${Date.now()}`,
        organizationId: 'demo',
        courseGroupId: input.courseGroupId,
        courseGroupName: groupName || 'Assigned Cohort',
        courseId: 'demo-course-1',
        courseName: courseName || 'Training Course',
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        maxScore: input.maxScore ?? 100,
        status: input.status ?? 1,
        statusName: input.status === 0 ? 'Draft' : input.status === 2 ? 'Closed' : 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      saveDemoAssignments(items);
      return newItem;
    }

    const { data } = await apiClient.post<AssignmentDto>('/assignments', input);
    return data;
  },

  async update(id: string, input: UpdateAssignmentInput, isDemo?: boolean): Promise<AssignmentDto> {
    if (isDemo) {
      const items = getDemoAssignments();
      const index = items.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Assignment not found');
      const updated: AssignmentDto = {
        ...items[index],
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        maxScore: input.maxScore ?? items[index].maxScore,
        status: input.status ?? items[index].status,
        statusName: input.status === 0 ? 'Draft' : input.status === 2 ? 'Closed' : 'Active',
        updatedAt: new Date().toISOString(),
      };
      items[index] = updated;
      saveDemoAssignments(items);
      return updated;
    }

    const { data } = await apiClient.put<AssignmentDto>(`/assignments/${encodeURIComponent(id)}`, input);
    return data;
  },

  async delete(id: string, isDemo?: boolean): Promise<void> {
    if (isDemo) {
      const items = getDemoAssignments();
      saveDemoAssignments(items.filter((a) => a.id !== id));
      return;
    }

    await apiClient.delete(`/assignments/${encodeURIComponent(id)}`);
  },
};
