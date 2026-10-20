import React, { useState, useCallback } from 'react';
import { Header } from './components/Header.js';
import { DocumentSandbox } from './components/DocumentSandbox.js';
import { ClipboardInspector } from './components/ClipboardInspector.js';
import { GestureTutorial } from './components/GestureTutorial.js';
import { ExtensionSimulator } from './components/ExtensionSimulator.js';
import { ToastContainer } from './components/ToastContainer.js';
import type { BlocopySession, ToastMessage } from './core/blocopy-controller.js';
import {
  createClipboardPayload,
  writeToSystemClipboard,
} from './core/blocopy-controller.js';
import { listLeafUnits } from './content/dom/units.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'inspector' | 'tutorial' | 'settings'>(
    'sandbox'
  );
  const [session, setSession] = useState<BlocopySession | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClearSession = useCallback(() => {
    setSession(null);
    addToast({
      type: 'info',
      message: 'Selection cleared',
    });
  }, [addToast]);

  const handleExpandLevel = useCallback(async () => {
    if (!session) return;
    const nextIndex = session.currentLevelIndex + 1;
    if (nextIndex >= session.levels.length) {
      addToast({
        type: 'info',
        message: 'Already at highest level',
      });
      return;
    }

    const nextContainer = session.levels[nextIndex];
    if (!nextContainer) return;

    const allUnits = listLeafUnits(nextContainer);
    const payload = createClipboardPayload(nextContainer, []);
    await writeToSystemClipboard(payload);

    setSession({
      ...session,
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
  }, [session, addToast]);

  const handleShrinkLevel = useCallback(async () => {
    if (!session) return;
    if (session.currentLevelIndex <= 0) {
      setSession(null);
      addToast({
        type: 'info',
        message: 'Selection cleared (Escape at Level 0)',
      });
      return;
    }

    const prevIndex = session.currentLevelIndex - 1;
    const prevContainer = session.levels[prevIndex];
    if (!prevContainer) return;

    const allUnits = listLeafUnits(prevContainer);
    const payload = createClipboardPayload(prevContainer, []);
    await writeToSystemClipboard(payload);

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
  }, [session, addToast]);

  const handleManualCopy = useCallback(async () => {
    if (!session || !session.payload) return;
    const ok = await writeToSystemClipboard(session.payload);
    if (ok) {
      addToast({
        type: 'copied',
        message: 'Copied to clipboard',
        subtext: `${session.includedUnits.length} units in rich HTML + plaintext`,
      });
    }
  }, [session, addToast]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-200">
      {/* Top Header */}
      <Header
        session={session}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClearSession={handleClearSession}
        onExpandLevel={handleExpandLevel}
        onShrinkLevel={handleShrinkLevel}
        onManualCopy={handleManualCopy}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'sandbox' && (
          <DocumentSandbox
            session={session}
            setSession={setSession}
            addToast={addToast}
            onOpenInspector={() => setActiveTab('inspector')}
          />
        )}

        {activeTab === 'inspector' && (
          <ClipboardInspector session={session} addToast={addToast} />
        )}

        {activeTab === 'tutorial' && <GestureTutorial />}

        {activeTab === 'settings' && <ExtensionSimulator addToast={addToast} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Blocopy</span>
            <span>•</span>
            <span>Zero-telemetry semantic block selection &amp; clipboard sanitizer</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Pure TypeScript &amp; React</span>
            <span>•</span>
            <span>Async Clipboard API</span>
            <span>•</span>
            <span>CSS Custom Highlight</span>
          </div>
        </div>
      </footer>

      {/* Floating Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
