import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, CheckCircle2, AlertCircle, LayoutDashboard } from 'lucide-react';
import { checkHealth } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth()
      .then(() => setIsBackendHealthy(true))
      .catch(() => setIsBackendHealthy(false));
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">AI Meeting-to-Execution OS</span>
              <span className="block text-[10px] text-indigo-400 font-mono tracking-wider uppercase">Capstone OS v0.3</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') && !location.pathname.includes('/projects/')
                  ? 'bg-slate-800 text-indigo-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Backend:</span>
            {isBackendHealthy === null ? (
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            ) : isBackendHealthy ? (
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>DISCONNECTED</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
