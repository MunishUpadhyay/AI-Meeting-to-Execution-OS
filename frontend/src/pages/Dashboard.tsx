import React, { useEffect, useState } from 'react';
import { Plus, FolderKanban, Sparkles, ShieldAlert } from 'lucide-react';
import { getProjects, createProject, getMeetings, getTasks, getProjectRisks } from '../services/api';
import type { Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [countsMap, setCountsMap] = useState<
    Record<number, { meetings: number; tasks: number; riskCount: number; highRiskCount: number }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Project Form State
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);

      // Fetch meeting, task, and risk counts for each project in parallel
      const counts: Record<
        number,
        { meetings: number; tasks: number; riskCount: number; highRiskCount: number }
      > = {};
      await Promise.all(
        data.map(async (p) => {
          try {
            const [mList, tList, risksData] = await Promise.all([
              getMeetings(p.id),
              getTasks(p.id),
              getProjectRisks(p.id),
            ]);
            counts[p.id] = {
              meetings: mList.length,
              tasks: tList.length,
              riskCount: risksData.summary.risk_count,
              highRiskCount: risksData.summary.high_risk_count,
            };
          } catch {
            counts[p.id] = { meetings: 0, tasks: 0, riskCount: 0, highRiskCount: 0 };
          }
        })
      );
      setCountsMap(counts);
    } catch (err) {
      setError((err as Error).message || 'Failed to load projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setModalError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      const newProj = await createProject({
        name: projectName.trim(),
        description: projectDesc.trim() || undefined,
      });

      setProjects((prev) => [newProj, ...prev]);
      setCountsMap((prev) => ({
        ...prev,
        [newProj.id]: { meetings: 0, tasks: 0, riskCount: 0, highRiskCount: 0 },
      }));
      setProjectName('');
      setProjectDesc('');
      setShowModal(false);
    } catch (err) {
      setModalError((err as Error).message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Meeting-to-Execution OS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Transform Conversations into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Executable Intelligence
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Ingest meeting transcripts, run local LLM analysis via Ollama, extract actionable tasks
            with assignees, deadlines & dependencies, and manage project execution with deterministic risk analysis.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>

        <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Projects Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Active Projects</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Select a project to view meetings, AI analysis, execution risks, and task boards.
          </p>
        </div>
        {projects.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700/60"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Main Content State */}
      {isLoading ? (
        <LoadingState message="Loading projects..." />
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <p className="font-bold">Error loading projects</p>
            <p className="text-xs text-rose-400/90">{error}</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start ingesting meeting transcripts and extracting task artifacts."
          actionLabel="Create Project"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              meetingCount={countsMap[project.id]?.meetings || 0}
              taskCount={countsMap[project.id]?.tasks || 0}
              riskCount={countsMap[project.id]?.riskCount}
              highRiskCount={countsMap[project.id]?.highRiskCount}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Create New Project</h3>
              <p className="text-slate-400 text-xs mt-1">
                Set up a workspace to organize your team's meetings and tasks.
              </p>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Payment Gateway Integration"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Brief summary of the project goals..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setModalError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/30"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
