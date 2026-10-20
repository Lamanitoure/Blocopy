import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import type { ToastMessage } from '../core/blocopy-controller.js';
import { MAX_SELECTION_CHARS, MAX_LEVELS } from '../shared/config/limits.js';

interface ExtensionSimulatorProps {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const ExtensionSimulator: React.FC<ExtensionSimulatorProps> = ({ addToast }) => {
  const [siteEnabled, setSiteEnabled] = useState<boolean>(true);
  const [dualMimeEnabled, setDualMimeEnabled] = useState<boolean>(true);
  const [maxChars, setMaxChars] = useState<number>(MAX_SELECTION_CHARS);
  const [maxLevels, setMaxLevels] = useState<number>(MAX_LEVELS);
  const [showToasts, setShowToasts] = useState<boolean>(true);
  const [themeSync, setThemeSync] = useState<boolean>(true);

  const handleToggleSite = () => {
    const nextState = !siteEnabled;
    setSiteEnabled(nextState);
    addToast({
      type: nextState ? 'copied' : 'warn',
      message: nextState ? 'Blocopy enabled for this site' : 'Blocopy paused on this site',
      subtext: nextState ? 'Double-clicks will trigger selection' : 'Native gestures restored',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Extension Simulator Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Blocopy Extension Settings &amp; Site Rules
              </h2>
              <p className="text-xs text-slate-500">
                Configure container selection limits, MIME export types, and per-site permissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Current Site Status:</span>
            <button
              type="button"
              onClick={handleToggleSite}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                siteEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {siteEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span>{siteEnabled ? 'Active (Enabled)' : 'Paused (Disabled)'}</span>
            </button>
          </div>
        </div>

        {/* Settings Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Core Behavior */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              Selection &amp; Clipboard
            </h3>

            {/* Dual MIME Toggle */}
            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Simultaneous Rich HTML &amp; Plaintext
                </span>
                <span className="text-[11px] text-slate-500">
                  Writes both <code>text/html</code> and <code>text/plain</code> to clipboard item.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDualMimeEnabled(!dualMimeEnabled)}
                className={`p-1 rounded-lg text-xs font-semibold ${
                  dualMimeEnabled ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {dualMimeEnabled ? (
                  <ToggleRight className="w-6 h-6" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Max Selection Chars */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Max Selection Text Budget</span>
                <span className="font-mono font-semibold text-blue-600">
                  {maxChars.toLocaleString()} chars
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="50000"
                step="5000"
                value={maxChars}
                onChange={(e) => setMaxChars(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
              <span className="text-[11px] text-slate-500 block">
                Prevents accidental selection of enormous whole-page wrappers.
              </span>
            </div>

            {/* Max Levels */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Max Hierarchy Levels</span>
                <span className="font-mono font-semibold text-blue-600">{maxLevels} levels</span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={maxLevels}
                onChange={(e) => setMaxLevels(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
              <span className="text-[11px] text-slate-500 block">
                Maximum ancestor containers discoverable on double-click expansion.
              </span>
            </div>
          </div>

          {/* Section 2: Privacy & UI */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              User Interface &amp; Privacy
            </h3>

            {/* Floating Toast Notification */}
            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Floating Toast Feedback
                </span>
                <span className="text-[11px] text-slate-500">
                  Displays subtle non-intrusive feedback when text is copied or excluded.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowToasts(!showToasts)}
                className={`p-1 rounded-lg text-xs font-semibold ${
                  showToasts ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {showToasts ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>

            {/* CSS System Colors */}
            <div className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Adaptive CSS Highlight Colors
                </span>
                <span className="text-[11px] text-slate-500">
                  Respects operating system light and dark themes using system colors.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setThemeSync(!themeSync)}
                className={`p-1 rounded-lg text-xs font-semibold ${
                  themeSync ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {themeSync ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>

            {/* Privacy Card */}
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1 text-xs text-emerald-900">
              <div className="flex items-center gap-1.5 font-bold">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Zero Telemetry Guarantee</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Blocopy makes zero network requests. All sanitization, tree traversal, and clipboard
                formatting execute strictly on-device in your browser runtime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
