import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Decision } from '../types';

interface DecisionListProps {
  decisions: Decision[] | Array<{ id?: number; content: string }>;
}

export const DecisionList: React.FC<DecisionListProps> = ({ decisions }) => {
  if (decisions.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-slate-400 text-sm italic">
        No decisions were extracted from this meeting.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {decisions.map((decision, index) => (
        <div
          key={decision.id || index}
          className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
        >
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium text-slate-200 leading-snug">{decision.content}</p>
        </div>
      ))}
    </div>
  );
};
