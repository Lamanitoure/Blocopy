import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  FileEdit,
  Eye,
  CornerDownRight,
  Plus,
} from 'lucide-react';
import type { BlocopySession, ToastMessage } from '../core/blocopy-controller.js';
import {
  isInteractiveTarget,
  createClipboardPayload,
  writeToSystemClipboard,
} from '../core/blocopy-controller.js';
import { findLevels } from '../content/dom/level-finder.js';
import { closestLeafUnit, listLeafUnits } from '../content/dom/units.js';

interface DocumentSandboxProps {
  session: BlocopySession | null;
  setSession: React.Dispatch<React.SetStateAction<BlocopySession | null>>;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  onOpenInspector: () => void;
}

export const DocumentSandbox: React.FC<DocumentSandboxProps> = ({
  session,
  setSession,
  addToast,
  onOpenInspector,
}) => {
  const [documentContent, setDocumentContent] = useState<string>(
    `<article class="space-y-4 text-slate-800">
  <h2 class="text-xl font-bold text-slate-900">Document Selection Workspace</h2>
  <p class="leading-relaxed">
    Double-click any paragraph or element to test Blocopy's block selection.
  </p>
  <p class="leading-relaxed">
    Click a paragraph during an active selection to exclude it from the copied text.
  </p>
  <blockquote class="p-3 border-l-4 border-blue-500 bg-blue-50/50 italic text-slate-700">
    Nested containers expand smoothly with consecutive double-clicks.
  </blockquote>
  <ul class="list-disc pl-5 space-y-1">
    <li>First item</li>
    <li>Second item (click to leave out)</li>
    <li>Third item</li>
  </ul>
</article>`
  );

  const [isRawEditorOpen, setIsRawEditorOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync visual highlights on the live DOM
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Clean up previous classes
    const prevActive = root.querySelectorAll('.blocopy-container-active');
    prevActive.forEach((el) => {
      el.classList.remove('blocopy-container-active');
    });

    const prevUnits = root.querySelectorAll(
      '.blocopy-unit, .blocopy-unit-included, .blocopy-unit-excluded'
    );
    prevUnits.forEach((el) => {
      el.classList.remove('blocopy-unit', 'blocopy-unit-included', 'blocopy-unit-excluded');
      el.removeAttribute('data-blocopy-status');
      el.removeAttribute('title');
    });

    if (!session) return;

    const { currentContainer, includedUnits, excludedUnits } = session;
    currentContainer.classList.add('blocopy-container-active');

    includedUnits.forEach((u) => {
      u.classList.add('blocopy-unit', 'blocopy-unit-included');
      u.setAttribute('data-blocopy-status', 'included');
      u.setAttribute('title', 'Click to exclude this unit from clipboard');
    });

    excludedUnits.forEach((u) => {
      u.classList.add('blocopy-unit', 'blocopy-unit-excluded');
      u.setAttribute('data-blocopy-status', 'excluded');
      u.setAttribute('title', 'Click to re-include this unit');
    });
  }, [session]);

  // Handle double-click gesture according to Blocopy spec
  const handleDoubleClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as Element;
      const root = containerRef.current;
      if (!root) return;

      if (e.altKey || isInteractiveTarget(target)) {
        return;
      }

      const leafUnit = closestLeafUnit(target, root);
      if (!leafUnit) {
        return;
      }

      // Check if we already have an active session
      if (session && session.currentContainer.contains(leafUnit)) {
        // Double-click INSIDE current container -> Expand one level (clears exclusions)
        const nextIndex = session.currentLevelIndex + 1;
        if (nextIndex < session.levels.length) {
          const nextContainer = session.levels[nextIndex];
          if (nextContainer) {
            const allUnits = listLeafUnits(nextContainer);
            const payload = createClipboardPayload(nextContainer, []);
            await writeToSystemClipboard(payload);

            setSession({
              targetElement: session.targetElement,
              levels: session.levels,
              currentLevelIndex: nextIndex,
              currentContainer: nextContainer,
              allUnits,
              excludedUnits: [],
              includedUnits: allUnits,
              payload,
              timestamp: Date.now(),
            });

            addToast({
              type: 'copied',
              message: `Expanded to Level ${nextIndex + 1} (${nextContainer.tagName.toLowerCase()})`,
              subtext: `Copied ${allUnits.length} units to clipboard`,
            });
            return;
          }
        } else {
          addToast({
            type: 'info',
            message: 'Already at highest container level',
            subtext: `Level ${session.levels.length} of ${session.levels.length}`,
          });
          return;
        }
      }

      // Start new session
      const levels = findLevels(leafUnit);
      if (levels.length === 0) {
        const fallbackContainer = leafUnit.parentElement || leafUnit;
        const allUnits = listLeafUnits(fallbackContainer);
        const payload = createClipboardPayload(fallbackContainer, []);
        await writeToSystemClipboard(payload);

        setSession({
          targetElement: leafUnit,
          levels: [fallbackContainer],
          currentLevelIndex: 0,
          currentContainer: fallbackContainer,
          allUnits,
          excludedUnits: [],
          includedUnits: allUnits,
          payload,
          timestamp: Date.now(),
        });

        addToast({
          type: 'copied',
          message: 'Selected block (Level 1)',
          subtext: `Copied ${allUnits.length} units to clipboard`,
        });
        return;
      }

      const initialContainer = levels[0];
      if (!initialContainer) return;

      const allUnits = listLeafUnits(initialContainer);
      const payload = createClipboardPayload(initialContainer, []);
      await writeToSystemClipboard(payload);

      window.getSelection()?.removeAllRanges();

      setSession({
        targetElement: leafUnit,
        levels,
        currentLevelIndex: 0,
        currentContainer: initialContainer,
        allUnits,
        excludedUnits: [],
        includedUnits: allUnits,
        payload,
        timestamp: Date.now(),
      });

      addToast({
        type: 'copied',
        message: `Selected ${initialContainer.tagName.toLowerCase()} (Level 1/${levels.length})`,
        subtext: `Copied ${allUnits.length} units to clipboard • Click any unit to exclude`,
      });
    },
    [session, setSession, addToast]
  );

  // Handle single-click gesture according to Blocopy spec
  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as Element;
      const root = containerRef.current;
      if (!root || !session) return;

      if (e.detail !== 1 || e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }

      if (isInteractiveTarget(target)) {
        return;
      }

      const leafUnit = closestLeafUnit(target, root);

      if (!leafUnit || !session.currentContainer.contains(leafUnit)) {
        setSession(null);
        addToast({
          type: 'info',
          message: 'Selection session ended',
        });
        return;
      }

      const isAlreadyExcluded = session.excludedUnits.includes(leafUnit);
      const newExcluded = isAlreadyExcluded
        ? session.excludedUnits.filter((u) => u !== leafUnit)
        : [...session.excludedUnits, leafUnit];

      const newIncluded = session.allUnits.filter((u) => !newExcluded.includes(u));
      const payload = createClipboardPayload(session.currentContainer, newExcluded);

      if (newIncluded.length === 0) {
        setSession({
          ...session,
          excludedUnits: newExcluded,
          includedUnits: [],
          payload: null,
          timestamp: Date.now(),
        });
        addToast({
          type: 'warn',
          message: 'Nothing left to copy',
          subtext: 'All paragraphs in this block have been excluded',
        });
        return;
      }

      await writeToSystemClipboard(payload);

      setSession({
        ...session,
        excludedUnits: newExcluded,
        includedUnits: newIncluded,
        payload,
        timestamp: Date.now(),
      });

      addToast({
        type: isAlreadyExcluded ? 'copied' : 'info',
        message: isAlreadyExcluded ? 'Re-included unit' : 'Excluded unit',
        subtext: `Updated clipboard (${newIncluded.length} units remaining)`,
      });
    },
    [session, setSession, addToast]
  );

  // Keyboard navigation (Escape steps down or cancels)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && session) {
        e.preventDefault();
        if (session.currentLevelIndex > 0) {
          const prevIndex = session.currentLevelIndex - 1;
          const prevContainer = session.levels[prevIndex];
          if (prevContainer) {
            const allUnits = listLeafUnits(prevContainer);
            const payload = createClipboardPayload(prevContainer, []);
            void writeToSystemClipboard(payload);

            setSession({
              ...session,
              currentLevelIndex: prevIndex,
              currentContainer: prevContainer,
              allUnits,
              excludedUnits: [],
              includedUnits: allUnits,
              payload,
              timestamp: Date.now(),
            });

            addToast({
              type: 'info',
              message: `Stepped down to Level ${prevIndex + 1} (${prevContainer.tagName.toLowerCase()})`,
            });
          }
        } else {
          setSession(null);
          addToast({
            type: 'info',
            message: 'Session cleared (Escape)',
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [session, setSession, addToast]);

  return (
    <div className="space-y-4">
      {/* Dynamic Document Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsRawEditorOpen(!isRawEditorOpen);
                setSession(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <FileEdit className="w-3.5 h-3.5 text-blue-600" />
              <span>{isRawEditorOpen ? 'Hide Editor' : 'Edit Document HTML'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDocumentContent(
                  '<article class="space-y-3"><p>New paragraph 1</p><p>New paragraph 2</p></article>'
                );
                setSession(null);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Reset Clean</span>
            </button>
          </div>

          {session?.payload && (
            <button
              type="button"
              onClick={onOpenInspector}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inspect Copied Output ({session.includedUnits.length} units)</span>
            </button>
          )}
        </div>

        {/* Live HTML Edit Area */}
        {isRawEditorOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <label htmlFor="dynamic-doc-textarea" className="text-xs font-bold text-slate-700 block">
              HTML Content:
            </label>
            <textarea
              id="dynamic-doc-textarea"
              value={documentContent}
              onChange={(e) => {
                setDocumentContent(e.target.value);
                setSession(null);
              }}
              placeholder="Paste or write HTML markup here..."
              className="w-full h-36 p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* Gesture Helper Instructions */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-blue-600 text-white rounded-lg">
            <CornerDownRight className="w-4 h-4" />
          </span>
          <div>
            <strong className="text-slate-900 font-semibold">How to interact:</strong>{' '}
            <span className="text-blue-900 font-medium">Double-click</span> any block to select &amp;
            copy. <span className="text-indigo-900 font-medium">Click</span> any unit inside to
            exclude it.
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Included
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Excluded
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] shadow-2xs font-mono">
              Esc
            </kbd>{' '}
            to shrink / exit
          </span>
        </div>
      </div>

      {/* Main Interactive Live Document Canvas */}
      <div className="relative bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs min-h-[380px]">
        {/* Floating Session Level Breadcrumb */}
        {session && (
          <div className="mb-6 p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded-md uppercase tracking-wider text-[10px]">
                Active Selection
              </span>
              <span className="font-semibold text-blue-950">
                Level {session.currentLevelIndex + 1} of {session.levels.length} (
                &lt;{session.currentContainer.tagName.toLowerCase()}&gt;
                {session.currentContainer.className && (
                  <span className="font-normal text-slate-500">
                    .{session.currentContainer.className.split(' ')[0]}
                  </span>
                )}
                )
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-600">
                <strong className="text-emerald-700">{session.includedUnits.length}</strong> kept
                {session.excludedUnits.length > 0 && (
                  <span>
                    {' '}
                    • <strong className="text-rose-600">{session.excludedUnits.length}</strong> excluded
                  </span>
                )}
              </span>
              {session.currentLevelIndex < session.levels.length - 1 && (
                <span className="text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded text-[11px]">
                  Double-click inside to expand ↑
                </span>
              )}
            </div>
          </div>
        )}

        {/* Live Document DOM Container */}
        <div
          ref={containerRef}
          onDoubleClick={handleDoubleClick}
          onClick={handleClick}
          className="blocopy-sandbox-content select-none sm:select-text cursor-default"
          dangerouslySetInnerHTML={{
            __html: documentContent,
          }}
        />
      </div>
    </div>
  );
};
