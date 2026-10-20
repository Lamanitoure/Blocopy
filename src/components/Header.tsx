import React from 'react';
import { Copy, Layers, RotateCcw, SlidersHorizontal, BookOpen, Sparkles } from 'lucide-react';
import type { BlocopySession } from '../core/blocopy-controller.js';

interface HeaderProps {
  session: BlocopySession | null;
  activeTab: 'sandbox' | 'inspector' | 'tutorial' | 'settings';
  setActiveTab: (tab: 'sandbox' | 'inspector' | 'tutorial' | 'settings') => void;
  onClearSession: () => void;
  onExpandLevel: () => void;
  onShrinkLevel: () => void;
  onManualCopy: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  activeTab,
  setActiveTab,
  onClearSession,
  onExpandLevel,
  onShrinkLevel,
  onManualCopy,
}) => {
  const isSessionActive = session !== null;
  const currentLevel = session ? session.currentLevelIndex + 1 : 0;
  const totalLevels = session ? session.levels.length : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Copy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Blocopy</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  React Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Double-click to select a block • Click a paragraph to leave it out
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('sandbox')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Interactive Document
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inspector')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'inspector'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>Clipboard Output</span>
              {session?.payload && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tutorial')}
              className={`px-3 py-1.5 rounded-lg font-medium hidden md:flex items-center gap-1.5 transition-all ${
                activeTab === 'tutorial'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Guide</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg font-medium hidden sm:flex items-center gap-1.5 transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Active Session Status & Actions */}
          <div className="flex items-center gap-2">
            {isSessionActive ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-800">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Level {currentLevel}/{totalLevels}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-700 font-semibold">{session.includedUnits.length} kept</span>
                  {session.excludedUnits.length > 0 && (
                    <span className="text-rose-600 font-semibold">• {session.excludedUnits.length} excluded</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onExpandLevel}
                  disabled={currentLevel >= totalLevels}
                  title="Expand container (Double-click inside container)"
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Expand ↑
                </button>

                <button
                  type="button"
                  onClick={onShrinkLevel}
                  title="Step down container level (Escape key)"
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Shrink ↓
                </button>

                <button
                  type="button"
                  onClick={onManualCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  onClick={onClearSession}
                  title="Clear active selection"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Double-click any paragraph to start</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
