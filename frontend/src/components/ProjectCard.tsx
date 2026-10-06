import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, ArrowRight, Calendar } from 'lucide-react';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  meetingCount?: number;
  taskCount?: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  meetingCount = 0,
  taskCount = 0,
}) => {
  const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Folder className="w-6 h-6" />
          </div>
          <span className="flex items-center space-x-1 text-xs text-slate-500 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
          {project.name}
        </h3>

        <p className="text-slate-400 text-sm line-clamp-2 mb-6">
          {project.description || 'No project description provided.'}
        </p>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3 mb-6 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-2.5 text-center border border-slate-800/40">
            <span className="block text-lg font-bold text-slate-100">{meetingCount}</span>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Meetings</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2.5 text-center border border-slate-800/40">
            <span className="block text-lg font-bold text-slate-100">{taskCount}</span>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Tasks</span>
          </div>
        </div>

        <Link
          to={`/projects/${project.id}`}
          className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-medium text-sm transition-all group-hover:shadow-md"
        >
          <span>Open Project</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
