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

export interface UpdateMeetingDTO {
  title?: string;
  transcript?: string;
  summary?: string | null;
}


export interface UpdateTaskDTO {
  title?: string;
  owner?: string | null;
  deadline?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dependency?: string | null;
}

export type RiskSeverity = 'HIGH' | 'MEDIUM';

export type RiskType =
  | 'BLOCKED_TASK'
  | 'OVERDUE_TASK'
  | 'DEPENDENCY_RISK'
  | 'UNRESOLVED_DEPENDENCY_REFERENCE'
  | 'APPROACHING_DEADLINE'
  | 'HIGH_PRIORITY_INCOMPLETE';

export interface Risk {
  type: RiskType;
  severity: RiskSeverity;
  title: string;
  description: string;
  related_task_id: number;
  related_task_title: string;
  dependency_task_id?: number | null;
  dependency_task_title?: string | null;
}

export interface ProjectRiskSummary {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  overdue_tasks: number;
  risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
}

export interface ProjectRisksResponse {
  project_id: number;
  summary: ProjectRiskSummary;
  risks: Risk[];
}

export interface MeetingTranscribeResponse {
  meeting_id: number;
  transcript: string;
  status: string;
}


