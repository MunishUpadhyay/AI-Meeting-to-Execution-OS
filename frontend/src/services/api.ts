import type {
  Project,
  CreateProjectDTO,
  Meeting,
  CreateMeetingDTO,
  MeetingAnalysisResponse,
  Task,
  UpdateTaskDTO,
  Decision,
  ProjectRisksResponse,
  MeetingTranscribeResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let detail = '';
      try {
        const errorData = await response.json();
        detail = errorData.detail || errorData.message || response.statusText;
      } catch {
        detail = response.statusText;
      }

      if (response.status === 503) {
        throw new APIError('Ollama is unavailable. Please make sure Ollama is running.', 503);
      }
      if (response.status === 504) {
        throw new APIError('AI analysis timed out. Please try again.', 504);
      }
      if (response.status === 502) {
        throw new APIError(detail || 'AI returned invalid analysis format.', 502);
      }

      throw new APIError(detail || `Request failed with status ${response.status}`, response.status);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err) {
    if (err instanceof APIError) {
      throw err;
    }
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new APIError('Unable to connect to the backend server. Please verify FastAPI is running.', 0);
    }
    throw new APIError((err as Error).message || 'An unexpected error occurred', 500);
  }
}

// Health Check
export async function checkHealth(): Promise<{ status: string }> {
  return request<{ status: string }>('/health');
}

// Projects API
export async function getProjects(): Promise<Project[]> {
  return request<Project[]>('/projects');
}

export async function createProject(data: CreateProjectDTO): Promise<Project> {
  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProject(projectId: number): Promise<Project> {
  return request<Project>(`/projects/${projectId}`);
}

export async function deleteProject(projectId: number): Promise<void> {
  return request<void>(`/projects/${projectId}`, {
    method: 'DELETE',
  });
}

// Risks API
export async function getProjectRisks(projectId: number): Promise<ProjectRisksResponse> {
  return request<ProjectRisksResponse>(`/projects/${projectId}/risks`);
}

// Meetings API
export async function getMeetings(projectId: number): Promise<Meeting[]> {
  return request<Meeting[]>(`/projects/${projectId}/meetings`);
}

export async function createMeeting(projectId: number, data: CreateMeetingDTO): Promise<Meeting> {
  return request<Meeting>(`/projects/${projectId}/meetings`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMeeting(meetingId: number): Promise<Meeting> {
  return request<Meeting>(`/meetings/${meetingId}`);
}

export async function analyzeMeeting(meetingId: number): Promise<MeetingAnalysisResponse> {
  return request<MeetingAnalysisResponse>(`/meetings/${meetingId}/analyze`, {
    method: 'POST',
  });
}

export async function transcribeMeeting(
  meetingId: number,
  audioFile: File
): Promise<MeetingTranscribeResponse> {
  const url = `${BASE_URL}/meetings/${meetingId}/transcribe`;
  const formData = new FormData();
  formData.append('file', audioFile);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let detail = '';
      try {
        const errorData = await response.json();
        detail = errorData.detail || errorData.message || response.statusText;
      } catch {
        detail = response.statusText;
      }

      if (response.status === 503) {
        throw new APIError('Moonshine speech-to-text service is unavailable.', 503);
      }
      throw new APIError(detail || `Transcription failed with status ${response.status}`, response.status);
    }

    return await response.json();
  } catch (err) {
    if (err instanceof APIError) {
      throw err;
    }
    throw new APIError((err as Error).message || 'Audio transcription failed', 500);
  }
}

// Tasks API
export async function getTasks(projectId: number): Promise<Task[]> {
  return request<Task[]>(`/projects/${projectId}/tasks`);
}

export async function updateTask(taskId: number, data: UpdateTaskDTO): Promise<Task> {
  return request<Task>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Decisions API
export async function getDecisions(meetingId: number): Promise<Decision[]> {
  return request<Decision[]>(`/meetings/${meetingId}/decisions`);
}


