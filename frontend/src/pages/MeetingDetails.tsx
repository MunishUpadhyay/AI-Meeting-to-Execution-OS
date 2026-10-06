import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  FileText,
  CheckCircle2,
  CheckSquare,
  AlertOctagon,
  ShieldAlert,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { getMeeting, analyzeMeeting, getDecisions, getTasks } from '../services/api';
import type { Meeting, Task, Decision, MeetingAnalysisResponse } from '../types';
import { DecisionList } from '../components/DecisionList';
import { TaskCard } from '../components/TaskCard';
import { LoadingState } from '../components/LoadingState';

export const MeetingDetails: React.FC = () => {
  const { projectId, meetingId } = useParams<{ projectId: string; meetingId: string }>();
  const pId = Number(projectId);
  const mId = Number(meetingId);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [risks, setRisks] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Analysis Trigger State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const loadData = async () => {
    if (isNaN(mId)) return;
    setIsLoading(true);
    setError(null);
    try {
      const [meetData, decData, taskData] = await Promise.all([
        getMeeting(mId),
        getDecisions(mId),
        getTasks(pId),
      ]);
      setMeeting(meetData);
      setDecisions(decData);

      // Filter tasks associated with this meeting
      const meetingTasks = taskData.filter((t) => t.meeting_id === mId);
      setTasks(meetingTasks);
    } catch (err) {
      setError((err as Error).message || 'Failed to load meeting details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mId, pId]);

  const handleAnalyze = async () => {
    if (isAnalyzing || isNaN(mId)) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result: MeetingAnalysisResponse = await analyzeMeeting(mId);

      // Update state with newly analyzed execution artifacts
      setMeeting((prev) => (prev ? { ...prev, summary: result.summary } : prev));
      setBlockers(result.blockers || []);
      setRisks(result.risks || []);

      // Reload updated decisions and tasks from backend
      const [updatedDecisions, updatedTasks] = await Promise.all([
        getDecisions(mId),
        getTasks(pId),
      ]);

      setDecisions(updatedDecisions);
      setTasks(updatedTasks.filter((t) => t.meeting_id === mId));
    } catch (err) {
      setAnalysisError((err as Error).message || 'Unable to analyze this meeting.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading meeting details..." />;
  }

  if (error || !meeting) {
    return (
      <div className="space-y-6">
        <Link
          to={`/projects/${pId}`}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Project</span>
        </Link>
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <p className="font-bold">Meeting Error</p>
            <p className="text-xs text-rose-400/90">{error || 'Meeting not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const isAnalyzed = Boolean(meeting.summary);

  return (
    <div className="space-y-8 pb-12">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to={`/projects/${pId}`}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Project</span>
        </Link>

        {isAnalyzed ? (
          <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Analysis Complete</span>
          </span>
        ) : (
          <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Not Analyzed Yet</span>
          </span>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs text-indigo-400 font-mono font-semibold uppercase tracking-wider block mb-1">
              MEETING INTELLIGENCE #{meeting.id}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{meeting.title}</h1>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`inline-flex items-center space-x-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl ${
              isAnalyzing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : isAnalyzed
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 shadow-indigo-600/30 active:scale-95'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Analyzing Meeting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzed ? 'Re-Run AI Analysis' : 'Analyze Meeting with AI'}</span>
              </>
            )}
          </button>
        </div>

        {/* Analysis Status / Loading Warning Banner */}
        {isAnalyzing && (
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center space-x-3 animate-pulse">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
            <div>
              <p className="font-semibold">Local LLM Analysis in Progress...</p>
              <p className="text-[11px] text-indigo-400/90">
                Running Qwen 2.5 local inference via Ollama. Please allow a few seconds for task & decision extraction.
              </p>
            </div>
          </div>
        )}

        {analysisError && (
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold">Analysis Failed</p>
              <p className="text-rose-400">{analysisError}</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Summary Section (If Analyzed) */}
      {isAnalyzed && meeting.summary && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-lg text-white">AI Executive Summary</h3>
          </div>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
            {meeting.summary}
          </p>
        </div>
      )}

      {/* Decisions & Extracted Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Extracted Decisions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg text-white">Extracted Decisions ({decisions.length})</h3>
          </div>
          <DecisionList decisions={decisions} />
        </div>

        {/* Extracted Blockers & Risks */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <AlertOctagon className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white">Extracted Blockers & Risks</h3>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Blockers ({blockers.length}):
              </span>
              {blockers.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                  No explicit blockers reported.
                </p>
              ) : (
                <ul className="space-y-2">
                  {blockers.map((blocker, i) => (
                    <li key={i} className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{blocker}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Identified Risks ({risks.length}):
              </span>
              {risks.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                  No explicit execution risks identified.
                </p>
              ) : (
                <ul className="space-y-2">
                  {risks.map((risk, i) => (
                    <li key={i} className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2">
                      <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Tasks List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg text-white">Extracted Tasks ({tasks.length})</h3>
          </div>
          <Link
            to={`/projects/${pId}/tasks`}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Open Project Kanban Board →
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-800/80 rounded-2xl bg-slate-950/40">
            <p className="text-slate-400 text-sm">No tasks extracted for this meeting yet.</p>
            {!isAnalyzed && (
              <p className="text-slate-500 text-xs mt-1">Click "Analyze Meeting with AI" to extract actionable tasks.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={(updated) => {
                  setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Raw Transcript View */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center space-x-2 text-slate-400">
          <FileText className="w-5 h-5" />
          <h3 className="font-bold text-base text-white">Raw Meeting Transcript</h3>
        </div>
        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
          {meeting.transcript}
        </pre>
      </div>
    </div>
  );
};
