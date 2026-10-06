import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Folder, Video, CheckSquare, ArrowLeft, Kanban, AlertCircle } from 'lucide-react';
import { getProject, getMeetings, createMeeting, getTasks, getProjectRisks } from '../services/api';
import type { Project, Meeting, Task, ProjectRisksResponse } from '../types';
import { MeetingCard } from '../components/MeetingCard';
import { TaskCard } from '../components/TaskCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { RiskPanel } from '../components/RiskPanel';

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const pId = Number(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Execution Risks state
  const [risksData, setRisksData] = useState<ProjectRisksResponse | null>(null);
  const [isRisksLoading, setIsRisksLoading] = useState<boolean>(true);
  const [risksError, setRisksError] = useState<string | null>(null);

  // Create Meeting Modal State
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  const fetchRisks = async () => {
    if (isNaN(pId)) return;
    setIsRisksLoading(true);
    setRisksError(null);
    try {
      const data = await getProjectRisks(pId);
      setRisksData(data);
    } catch (err) {
      setRisksError((err as Error).message || 'Unable to load project risks.');
    } finally {
      setIsRisksLoading(false);
    }
  };

  const loadData = async () => {
    if (isNaN(pId)) return;
    setIsLoading(true);
    setError(null);

    // Fetch risks independently
    fetchRisks();

    try {
      const [projData, meetingsData, tasksData] = await Promise.all([
        getProject(pId),
        getMeetings(pId),
        getTasks(pId),
      ]);
      setProject(projData);
      setMeetings(meetingsData);
      setTasks(tasksData);
    } catch (err) {
      setError((err as Error).message || 'Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pId]);

  const handleCreateMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) {
      setMeetingError('Meeting title is required');
      return;
    }
    if (!transcript.trim()) {
      setMeetingError('Meeting transcript is required');
      return;
    }

    setIsSubmittingMeeting(true);
    setMeetingError(null);
    try {
      const newMeeting = await createMeeting(pId, {
        title: meetingTitle.trim(),
        transcript: transcript.trim(),
      });

      setShowMeetingModal(false);
      setMeetingTitle('');
      setTranscript('');
      // Navigate to the newly created Meeting Details page
      navigate(`/projects/${pId}/meetings/${newMeeting.id}`);
    } catch (err) {
      setMeetingError((err as Error).message || 'Failed to create meeting.');
      setIsSubmittingMeeting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading project workspace..." />;
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
            <p className="font-bold">Project Error</p>
            <p className="text-xs text-rose-400/90">{error || 'Project not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Navigation Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center space-x-3">
          <Link
            to={`/projects/${pId}/tasks`}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-indigo-400 font-semibold text-xs transition-colors"
          >
            <Kanban className="w-4 h-4" />
            <span>Open Task Board ({tasks.length})</span>
          </Link>

          <button
            onClick={() => setShowMeetingModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Meeting</span>
          </button>
        </div>
      </div>

      {/* Project Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center space-x-3 text-indigo-400 text-xs font-mono mb-2">
          <Folder className="w-4 h-4" />
          <span>PROJECT WORKSPACE #{project.id}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          {project.name}
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Risk / Execution Summary */}
      <RiskPanel risksData={risksData} loading={isRisksLoading} error={risksError} />

      {/* Meetings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Project Meetings ({meetings.length})
            </h2>
          </div>
        </div>

        {meetings.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No meetings yet"
            description="Create a meeting and provide a transcript to extract tasks and decisions with AI."
            actionLabel="Create First Meeting"
            onAction={() => setShowMeetingModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>

      {/* Extracted Tasks Preview Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Extracted Tasks ({tasks.length})
            </h2>
          </div>

          {tasks.length > 0 && (
            <Link
              to={`/projects/${pId}/tasks`}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View Full Kanban Board →
            </Link>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <p className="text-slate-400 text-sm">No tasks extracted for this project yet.</p>
            <p className="text-slate-500 text-xs mt-1">
              Open a meeting and click "Analyze Meeting" to extract actionable tasks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.slice(0, 6).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={(updated) => {
                  setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                  fetchRisks();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Create New Meeting</h3>
              <p className="text-slate-400 text-xs mt-1">
                Enter a meeting title and paste the meeting discussion transcript for AI analysis.
              </p>
            </div>

            {meetingError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {meetingError}
              </div>
            )}

            <form onSubmit={handleCreateMeetingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Payment Gateway Planning Discussion"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Meeting Transcript *
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste unstructured meeting transcript conversation here..."
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-y"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowMeetingModal(false);
                    setMeetingError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMeeting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/30"
                >
                  {isSubmittingMeeting ? 'Creating Meeting...' : 'Save & Open Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
