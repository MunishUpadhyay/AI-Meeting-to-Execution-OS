import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { ProjectDetails } from './pages/ProjectDetails';
import { MeetingDetails } from './pages/MeetingDetails';
import { TaskBoard } from './pages/TaskBoard';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/projects/:projectId/meetings/:meetingId" element={<MeetingDetails />} />
            <Route path="/projects/:projectId/tasks" element={<TaskBoard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs font-mono text-slate-600">
          AI Meeting-to-Execution OS — B.Tech Capstone Project MVP
        </footer>
      </div>
    </Router>
  );
};

export default App;
