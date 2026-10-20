import React from 'react';
import {
  Shield,
} from 'lucide-react';

export const GestureTutorial: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Intro Hero */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="max-w-2xl space-y-3">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            Interaction Specification
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How Blocopy Gestures Work
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Blocopy introduces a calm, frictionless way to copy content from articles, chat threads,
            and research papers without wrestling with cursor drag selection.
          </p>
        </div>
      </div>

      {/* 4 Core Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Double-Click on Eligible Text</h3>
              <p className="text-xs text-slate-500">Starts session at Level 0</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Double-click any paragraph, heading, list item, or blockquote. Blocopy finds the
            immediate enclosing semantic container (like an article section or message card) and
            copies it to your clipboard immediately.
          </p>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 font-mono flex items-center justify-between">
            <span>Result: Container highlighted &amp; copied</span>
            <span className="text-emerald-600 font-semibold">Done in 0ms</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Click a Paragraph to Exclude</h3>
              <p className="text-xs text-slate-500">Leaves out unwanted parts</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            During an active selection session, a plain left click on any paragraph, code line, or
            bullet item toggles its exclusion. The clipboard is updated automatically with that part
            pruned!
          </p>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-[11px] text-rose-900 font-mono flex items-center justify-between">
            <span>Click again to re-include</span>
            <span className="text-rose-600 font-semibold">Instant re-render</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Double-Click to Expand Level</h3>
              <p className="text-xs text-slate-500">Climb container hierarchy</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Double-clicking again inside the active container climbs up one level (e.g. from a single
            chat card to the parent conversation thread). This automatically resets exclusions.
          </p>
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 font-mono flex items-center justify-between">
            <span>Levels 0 → 1 → 2 ... up to max 5</span>
            <span className="text-indigo-600 font-semibold">Clean hierarchy</span>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Escape or Click Outside</h3>
              <p className="text-xs text-slate-500">Step down or end session</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pressing <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Escape</kbd> steps down a level; at Level 0, it cancels the session cleanly without altering your clipboard. Clicking outside the container ends the session untouched.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 font-mono flex items-center justify-between">
            <span>No leftover DOM clutter</span>
            <span className="text-slate-500 font-semibold">Zero DOM mutation</span>
          </div>
        </div>
      </div>

      {/* Guard Rules & Native Behavior Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <span>Strict Guard Rules (Never Intercepted)</span>
        </h3>
        <p className="text-xs text-slate-500">
          Blocopy strictly respects native web conventions and never interferes with normal browser
          gestures:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">Gesture / Condition</th>
                <th className="p-3">Blocopy Behavior</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-3 font-medium">Alt + Double-Click</td>
                <td className="p-3 text-emerald-700 font-medium">Native browser behavior</td>
                <td className="p-3 text-slate-500">Never intercepted for accessibility & OS shortcuts</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Ctrl / Cmd / Shift + Click</td>
                <td className="p-3 text-emerald-700 font-medium">Native browser behavior</td>
                <td className="p-3 text-slate-500">Preserves opening links in new tabs / multiselect</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Inputs, Textareas, Selects, Buttons</td>
                <td className="p-3 text-emerald-700 font-medium">Pass-through untouched</td>
                <td className="p-3 text-slate-500">Interactive form controls are never intercepted</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Hyperlinks (&lt;a href&gt;)</td>
                <td className="p-3 text-emerald-700 font-medium">Click navigates normally</td>
                <td className="p-3 text-slate-500">Standard web links always function as expected</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Synthetic events (isTrusted = false)</td>
                <td className="p-3 text-emerald-700 font-medium">Ignored completely</td>
                <td className="p-3 text-slate-500">Security guarantee against malicious page scripts</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
