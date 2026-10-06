import React from 'react';
import { Link } from 'react-router-dom';
import { Video, Sparkles, ArrowRight, Clock } from 'lucide-react';
import type { Meeting } from '../types';

interface MeetingCardProps {
  meeting: Meeting;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting }) => {
  const isAnalyzed = Boolean(meeting.summary);
  const formattedDate = new Date(meeting.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400">
            <Video className="w-5 h-5" />
          </div>
          {isAnalyzed ? (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3 h-3" />
              <span>Analyzed</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
              <Clock className="w-3 h-3" />
              <span>Not Analyzed</span>
            </span>
          )}
        </div>

        <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{meeting.title}</h4>
        
        {isAnalyzed ? (
          <p className="text-slate-300 text-sm line-clamp-3 mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 font-sans">
            {meeting.summary}
          </p>
        ) : (
          <p className="text-slate-400 text-xs italic line-clamp-2 mb-4 bg-slate-950/20 p-2.5 rounded-xl">
            "{meeting.transcript}"
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <span className="text-xs text-slate-500 font-mono">{formattedDate}</span>
        <Link
          to={`/projects/${meeting.project_id}/meetings/${meeting.id}`}
          className="inline-flex items-center space-x-1 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
