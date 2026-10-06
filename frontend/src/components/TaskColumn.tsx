import React from 'react';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { Clock, PlayCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onStatusChange?: (updatedTask: Task) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({ status, tasks, onStatusChange }) => {
  const getHeaderDetails = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return {
          title: 'To Do',
          icon: <Clock className="w-4 h-4 text-slate-400" />,
          accent: 'border-slate-700 bg-slate-900/50',
          badge: 'bg-slate-800 text-slate-300',
        };
      case 'IN_PROGRESS':
        return {
          title: 'In Progress',
          icon: <PlayCircle className="w-4 h-4 text-indigo-400" />,
          accent: 'border-indigo-500/30 bg-indigo-950/10',
          badge: 'bg-indigo-500/20 text-indigo-300',
        };
      case 'BLOCKED':
        return {
          title: 'Blocked',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          accent: 'border-rose-500/30 bg-rose-950/10',
          badge: 'bg-rose-500/20 text-rose-300',
        };
      case 'DONE':
        return {
          title: 'Done',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          accent: 'border-emerald-500/30 bg-emerald-950/10',
          badge: 'bg-emerald-500/20 text-emerald-300',
        };
    }
  };

  const header = getHeaderDetails(status);

  return (
    <div className={`flex flex-col rounded-2xl border ${header.accent} p-4 min-h-[500px]`}>
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          {header.icon}
          <h3 className="font-bold text-sm text-slate-200 tracking-tight">{header.title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${header.badge}`}>
          {tasks.length}
        </span>
      </div>

      {/* Task Cards List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="h-40 border-2 border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-center p-4">
            <span className="text-xs text-slate-500 font-medium">No tasks in {header.title.toLowerCase()}</span>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
          ))
        )}
      </div>
    </div>
  );
};
