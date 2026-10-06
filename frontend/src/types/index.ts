export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Meeting {
  id: number;
  project_id: number;
  title: string;
  transcript: string;
  summary: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  meeting_id: number | null;
  title: string;
  owner: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dependency: string | null;
  created_at: string;
}

export interface Decision {
  id: number;
  meeting_id: number;
  content: string;
  created_at: string;
}

export interface MeetingAnalysisResponse {
  meeting_id: number;
  summary: string;
  decisions: Array<{ id?: number; content: string }>;
  tasks: Array<{
    id?: number;
    title: string;
    owner: string | null;
    deadline: string | null;
    priority: TaskPriority;
    status?: TaskStatus;
    dependency: string | null;
  }>;
  blockers: string[];
  risks: string[];
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
}

export interface CreateMeetingDTO {
  title: string;
  transcript: string;
}

export interface UpdateTaskDTO {
  title?: string;
  owner?: string | null;
  deadline?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dependency?: string | null;
}
