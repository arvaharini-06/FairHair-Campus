import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award,
  Sun,
  Moon,
  ShieldCheck,
  Globe
} from 'lucide-react';

import StudentDashboard from './components/StudentDashboard';
import RecruiterPortal from './components/RecruiterPortal';
import CollegeAnalytics from './components/CollegeAnalytics';

type ViewState = 'student' | 'recruiter' | 'college';

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>('student');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg text-slate-800 dark:text-dark-text font-sans selection:bg-indigo-100 flex flex-col transition-colors duration-300">
      {/* MODERN SaaS NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl border-b border-border dark:border-dark-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Award className="text-white w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                FairHire Dashboard
              </span>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Merit Sync Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              <NavButton 
                active={activeView === 'student'} 
                onClick={() => setActiveView('student')}
                label="Student"
              />
              <NavButton 
                active={activeView === 'recruiter'} 
                onClick={() => setActiveView('recruiter')}
                label="Recruiter"
              />
              <NavButton 
                active={activeView === 'college'} 
                onClick={() => setActiveView('college')}
                label="Institute"
              />
            </div>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-8 py-16 w-full flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeView === 'student' && <StudentDashboard />}
            {activeView === 'recruiter' && <RecruiterPortal />}
            {activeView === 'college' && <CollegeAnalytics />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MINIMAL FOOTER */}
      <footer className="mt-12 py-10 bg-white dark:bg-dark-card border-t border-border dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <div>© 2026 FairHire Campus Framework</div>
          <div className="flex gap-8">
            <span className="hover:text-secondary transition-colors cursor-pointer">Security Protocol</span>
            <span className="hover:text-secondary transition-colors cursor-pointer">Anonymization Ledger</span>
            <span className="hover:text-secondary transition-colors cursor-pointer">Verified by Gemini</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, label }: { 
  active: boolean, 
  onClick: () => void, 
  label: string 
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
        active 
          ? 'bg-white dark:bg-dark-card text-secondary shadow-md border border-slate-100 dark:border-dark-border' 
          : 'text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  );
}
