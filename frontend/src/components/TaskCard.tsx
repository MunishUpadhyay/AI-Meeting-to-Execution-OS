import React, { useState } from 'react';
import { User, Calendar, GitFork, CheckCircle2, Clock, PlayCircle, ShieldAlert } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { updateTask } from '../services/api';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (updatedTask: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status);

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />;
      case 'BLOCKED':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'DONE':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      const updated = await updateTask(task.id, { status: newStatus });
      setCurrentStatus(updated.status);
      if (onStatusChange) {
        onStatusChange(updated);
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert selection on failure
      e.target.value = currentStatus;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 hover:border-slate-700/80 transition-all shadow-md flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-slate-100 leading-snug">{task.title}</h4>
          <span
            className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wider uppercase ${getPriorityStyle(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        </div>

        {/* Owner & Deadline */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 mt-2">
          {task.owner ? (
            <div className="flex items-center space-x-1.5 text-slate-300">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>{task.owner}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-slate-500 italic">
              <User className="w-3.5 h-3.5" />
              <span>Unassigned</span>
            </div>
          )}

          {task.deadline ? (
            <div className="flex items-center space-x-1.5 text-amber-300/90 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>{task.deadline}</span>
            </div>
          ) : null}
        </div>

        {/* Dependency Pill */}
        {task.dependency ? (
          <div className="mt-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start space-x-2 text-xs">
            <GitFork className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Prerequisite:</span>
              <span className="text-slate-300 font-medium truncate block">{task.dependency}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Status Dropdown */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          {getStatusIcon(currentStatus)}
          <span className="font-mono text-[11px] uppercase tracking-wider">{currentStatus.replace('_', ' ')}</span>
        </div>

        <div className="relative">
          <select
            value={currentStatus}
            onChange={handleStatusSelect}
            disabled={isUpdating}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="DONE">DONE</option>
          </select>
        </div>
      </div>
    </div>
  );
};
