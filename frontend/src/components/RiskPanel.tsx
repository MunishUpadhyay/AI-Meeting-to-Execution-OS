import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Activity,
} from 'lucide-react';

import type { ProjectRisksResponse, Risk, RiskSeverity } from '../types';

interface RiskPanelProps {
  risksData: ProjectRisksResponse | null;
  loading: boolean;
  error: string | null;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({ risksData, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 text-slate-400">
          <Activity className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="font-medium text-slate-300">Analyzing execution risk...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-rose-300">Risk Assessment Error</h4>
            <p className="text-sm text-slate-400">{error || 'Unable to load project risks.'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!risksData) {
    return null;
  }

  const { summary, risks } = risksData;

  const getSeverityBadge = (severity: RiskSeverity) => {
    if (severity === 'HIGH') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3" />
          <span>HIGH</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertCircle className="w-3 h-3" />
        <span>MEDIUM</span>
      </span>
    );
  };

  const formatRiskType = (typeStr: string) => {
    return typeStr.replace(/_/g, ' ');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Execution Intelligence & Risk Engine</h3>
            <p className="text-xs text-slate-400">Deterministic project execution health assessment</p>
          </div>
        </div>

        {/* Risk Badges Summary */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/60">
            {summary.risk_count} Total {summary.risk_count === 1 ? 'Risk' : 'Risks'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {summary.high_risk_count} High
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {summary.medium_risk_count} Medium
          </span>
        </div>
      </div>

      {/* Task Execution Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 text-center">
          <span className="block text-sm font-semibold text-slate-400">Total Tasks</span>
          <span className="text-xl font-bold text-slate-100">{summary.total_tasks}</span>
        </div>
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 text-center">
          <span className="block text-sm font-semibold text-emerald-400/80">Completed</span>
          <span className="text-xl font-bold text-emerald-400">{summary.completed_tasks}</span>
        </div>
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 text-center">
          <span className="block text-sm font-semibold text-indigo-400/80">In Progress</span>
          <span className="text-xl font-bold text-indigo-400">{summary.in_progress_tasks}</span>
        </div>
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 text-center">
          <span className="block text-sm font-semibold text-rose-400/80">Blocked</span>
          <span className="text-xl font-bold text-rose-400">{summary.blocked_tasks}</span>
        </div>
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 text-center">
          <span className="block text-sm font-semibold text-amber-400/80">Overdue</span>
          <span className="text-xl font-bold text-amber-400">{summary.overdue_tasks}</span>
        </div>
      </div>

      {/* Risk Cards List */}
      {risks.length === 0 ? (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 text-center flex items-center justify-center space-x-2 text-emerald-400 font-medium">
          <CheckCircle2 className="w-5 h-5" />
          <span>✓ No active execution risks identified</span>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identified Risk Cards</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {risks.map((risk: Risk, idx: number) => {
              const isHigh = risk.severity === 'HIGH';
              return (
                <div
                  key={`${risk.related_task_id}-${risk.type}-${idx}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isHigh
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                      : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      {getSeverityBadge(risk.severity)}
                      <span className="text-xs font-mono text-slate-400 tracking-tight">
                        {formatRiskType(risk.type)}
                      </span>
                    </div>
                  </div>

                  <h5 className="font-semibold text-slate-100 text-sm mb-1">{risk.title}</h5>

                  <p className="text-xs text-slate-300 mb-3 line-clamp-3 leading-relaxed">
                    {risk.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                    <span className="inline-flex items-center space-x-1 text-slate-300 font-medium bg-slate-800/80 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Task:</span>
                      <span className="text-slate-100 truncate max-w-[150px]">
                        "{risk.related_task_title}"
                      </span>
                    </span>

                    {risk.dependency_task_title && (
                      <span className="inline-flex items-center space-x-1 text-rose-300 font-medium bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                        <LinkIcon className="w-3 h-3 text-rose-400" />
                        <span>Waiting for:</span>
                        <span className="text-rose-200 truncate max-w-[150px]">
                          "{risk.dependency_task_title}"
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
