import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Kanban, AlertCircle } from 'lucide-react';
import { getProject, getTasks } from '../services/api';
import type { Project, Task, TaskStatus } from '../types';
import { TaskColumn } from '../components/TaskColumn';
import { LoadingState } from '../components/LoadingState';

export const TaskBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pId = Number(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (isNaN(pId)) return;
    setIsLoading(true);
    setError(null);
    try {
      const [projData, tasksData] = await Promise.all([
        getProject(pId),
        getTasks(pId),
      ]);
      setProject(projData);
      setTasks(tasksData);
    } catch (err) {
      setError((err as Error).message || 'Failed to load task board.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pId]);

  const handleTaskStatusUpdate = (updatedTask: Task) => {
    setTasks((prevTasks) => prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  if (isLoading) {
    return <LoadingState message="Loading project task board..." />;
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <p className="font-bold">Task Board Error</p>
            <p className="text-xs text-rose-400/90">{error || 'Project not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const columns: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to={`/projects/${pId}`}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Project Workspace</span>
        </Link>

        <div className="flex items-center space-x-4 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
          <span>Total Tasks: <strong className="text-white font-bold">{tasks.length}</strong></span>
          <span>•</span>
          <span className="text-emerald-400">Done: <strong>{tasks.filter((t) => t.status === 'DONE').length}</strong></span>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono mb-2">
          <Kanban className="w-4 h-4" />
          <span>PROJECT KANBAN BOARD</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          {project.name} Task Board
        </h1>
        <p className="text-slate-400 text-sm">
          Track and update task execution status across TODO, IN PROGRESS, BLOCKED, and DONE.
        </p>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            onStatusChange={handleTaskStatusUpdate}
          />
        ))}
      </div>
    </div>
  );
};
