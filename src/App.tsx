import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LiveViewport } from './components/LiveViewport';
import { AutonomousAgentPanel } from './components/AutonomousAgentPanel';
import { CommandStudio } from './components/CommandStudio';
import { SnapshotInspector } from './components/SnapshotInspector';
import { WorkflowTemplatesModal } from './components/WorkflowTemplatesModal';
import { SessionModal } from './components/SessionModal';
import {
  BrowserSession,
  SnapshotNode,
  ExecResult,
  AgentStep,
  AutonomousRun,
  WorkflowTemplate,
} from './types';

export function App() {
  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<
    'agent' | 'viewport' | 'terminal' | 'snapshot' | 'templates'
  >('agent');
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Session State
  const [sessions, setSessions] = useState<BrowserSession[]>([
    {
      id: 'default',
      name: 'Default Session',
      url: 'about:blank',
      title: 'New Tab',
      createdAt: Date.now(),
      lastActive: Date.now(),
    },
  ]);
  const [activeSession, setActiveSession] = useState<string>('default');

  // Browser Visual & Accessibility State
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [pageTitle, setPageTitle] = useState<string>('');
  const [snapshotNodes, setSnapshotNodes] = useState<SnapshotNode[]>([]);
  const [rawSnapshot, setRawSnapshot] = useState<string>('');
  const [isBusy, setIsBusy] = useState<boolean>(false);

  // CLI History State
  const [cliHistory, setCliHistory] = useState<ExecResult[]>([]);

  // Autonomous Agent State
  const [currentRun, setCurrentRun] = useState<AutonomousRun | null>(null);
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);
  const shouldStopRef = useRef<boolean>(false);

  // Workflow Templates
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);

  // ==========================================
  // Data Fetching & Sync
  // ==========================================

  const refreshPageData = async (session = activeSession) => {
    setIsBusy(true);
    try {
      // 1. Fetch snapshot
      const snapRes = await fetch(`/api/snapshot?session=${encodeURIComponent(session)}`);
      const snapData = await snapRes.json();
      if (snapData.success) {
        setRawSnapshot(snapData.raw || '');
        setSnapshotNodes(snapData.parsed?.nodes || []);
        if (snapData.parsed?.title) setPageTitle(snapData.parsed.title);
        if (snapData.parsed?.url) setCurrentUrl(snapData.parsed.url);
      }

      // 2. Fetch screenshot
      const shotRes = await fetch(`/api/screenshot?session=${encodeURIComponent(session)}`);
      const shotData = await shotRes.json();
      if (shotData.success && shotData.dataUrl) {
        setScreenshotUrl(shotData.dataUrl);
      }

      // 3. Fetch active sessions list
      const sessRes = await fetch('/api/sessions');
      const sessData = await sessRes.json();
      if (Array.isArray(sessData)) {
        setSessions(sessData);
      }
    } catch (err) {
      console.warn('Error refreshing page data:', err);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    // Fetch initial templates
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch((e) => console.warn('Could not load templates', e));

    refreshPageData(activeSession);
  }, []);

  // When active session changes
  useEffect(() => {
    refreshPageData(activeSession);
  }, [activeSession]);

  // ==========================================
  // CLI Command Execution
  // ==========================================

  const handleExecuteCli = async (args: string[]): Promise<ExecResult | null> => {
    setIsBusy(true);
    try {
      const res = await fetch('/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          args,
          session: activeSession,
        }),
      });
      const result: ExecResult = await res.json();
      setCliHistory((prev) => [...prev, result]);

      // Automatically refresh visual state
      await refreshPageData(activeSession);
      return result;
    } catch (err: any) {
      console.error('CLI execution error:', err);
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  // ==========================================
  // Quick Actions (Navigate, Click, Fill, etc.)
  // ==========================================

  const handleAction = async (action: {
    type: string;
    targetRef?: string;
    value?: string;
    url?: string;
    direction?: string;
    key?: string;
  }) => {
    setIsBusy(true);
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...action,
          session: activeSession,
        }),
      });
      const data = await res.json();

      if (data.execResult) {
        setCliHistory((prev) => [...prev, data.execResult]);
      }
      if (data.screenshotUrl) {
        setScreenshotUrl(data.screenshotUrl);
      }
      if (data.snapshot) {
        setSnapshotNodes(data.snapshot.nodes || []);
        if (data.snapshot.title) setPageTitle(data.snapshot.title);
        if (data.snapshot.url) setCurrentUrl(data.snapshot.url);
      }

      await refreshPageData(activeSession);
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setIsBusy(false);
    }
  };

  // ==========================================
  // Autonomous Agent Runner
  // ==========================================

  const handleStartAutonomousRun = async (goal: string, maxSteps = 10) => {
    if (!goal.trim() || isAgentRunning) return;

    shouldStopRef.current = false;
    setIsAgentRunning(true);

    const newRun: AutonomousRun = {
      id: `run-${Date.now()}`,
      goal,
      status: 'running',
      session: activeSession,
      currentUrl,
      steps: [],
      startedAt: Date.now(),
    };
    setCurrentRun(newRun);

    let stepNumber = 1;
    let accumulatedSteps: AgentStep[] = [];
    let isGoalMet = false;
    let finalSummary = '';

    while (stepNumber <= maxSteps && !isGoalMet && !shouldStopRef.current) {
      try {
        const res = await fetch('/api/agent/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal,
            session: activeSession,
            stepHistory: accumulatedSteps,
            stepNumber,
          }),
        });

        const data = await res.json();

        if (data.step) {
          accumulatedSteps = [...accumulatedSteps, data.step];
          if (data.step.screenshotUrl) {
            setScreenshotUrl(data.step.screenshotUrl);
          }

          setCurrentRun((prev) =>
            prev
              ? {
                  ...prev,
                  steps: accumulatedSteps,
                  currentUrl,
                }
              : null
          );
        }

        if (data.isGoalMet) {
          isGoalMet = true;
          finalSummary = data.finalSummary || '';
          break;
        }

        stepNumber++;
        // Small breathing delay between actions
        await new Promise((r) => setTimeout(r, 1200));
      } catch (err: any) {
        console.error('Autonomous step failure:', err);
        break;
      }
    }

    // Synthesize final summary report if not already provided
    if (!finalSummary && accumulatedSteps.length > 0) {
      try {
        const synthRes = await fetch('/api/agent/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal,
            stepHistory: accumulatedSteps,
          }),
        });
        const synthData = await synthRes.json();
        finalSummary = synthData.report || '';
      } catch (e) {
        console.warn('Synthesis error:', e);
      }
    }

    setCurrentRun((prev) =>
      prev
        ? {
            ...prev,
            status: shouldStopRef.current ? 'stopped' : 'completed',
            completedAt: Date.now(),
            finalAnswer: finalSummary,
          }
        : null
    );

    setIsAgentRunning(false);
    await refreshPageData(activeSession);
  };

  const handleStepAutonomousRun = async (goal: string) => {
    if (!goal.trim() || isAgentRunning) return;

    setIsAgentRunning(true);
    const existingSteps = currentRun?.steps || [];
    const stepNumber = existingSteps.length + 1;

    try {
      const res = await fetch('/api/agent/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          session: activeSession,
          stepHistory: existingSteps,
          stepNumber,
        }),
      });

      const data = await res.json();

      if (data.step) {
        const updatedSteps = [...existingSteps, data.step];
        if (data.step.screenshotUrl) {
          setScreenshotUrl(data.step.screenshotUrl);
        }

        setCurrentRun({
          id: currentRun?.id || `run-${Date.now()}`,
          goal,
          status: data.isGoalMet ? 'completed' : 'idle',
          session: activeSession,
          currentUrl,
          steps: updatedSteps,
          startedAt: currentRun?.startedAt || Date.now(),
          finalAnswer: data.finalSummary || currentRun?.finalAnswer,
        });
      }

      await refreshPageData(activeSession);
    } catch (err) {
      console.error('Step execution error:', err);
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleStopRun = () => {
    shouldStopRef.current = true;
    setIsAgentRunning(false);
    if (currentRun) {
      setCurrentRun({ ...currentRun, status: 'stopped' });
    }
  };

  // ==========================================
  // Session Actions
  // ==========================================

  const handleCreateSession = async (id: string, name?: string) => {
    try {
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      });
      const newSess = await res.json();
      setSessions((prev) => [...prev, newSess]);
      setActiveSession(newSess.id);
      setIsSessionModalOpen(false);
    } catch (e) {
      console.error('Failed to create session', e);
    }
  };

  const handleCloseSession = async (id: string) => {
    try {
      await fetch('/api/sessions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSession === id) {
        setActiveSession('default');
      }
    } catch (e) {
      console.error('Failed to close session', e);
    }
  };

  // ==========================================
  // Template Recipe Launcher
  // ==========================================

  const handleSelectTemplate = (tpl: WorkflowTemplate) => {
    setActiveTab('agent');
    handleStartAutonomousRun(tpl.goal);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-300 flex flex-col font-sans relative selection:bg-indigo-600/30 selection:text-indigo-200">
      {/* Immersive ambient radial lighting */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.08)_0%,transparent_60%)] z-0" />

      {/* Top Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'templates') {
            setIsTemplatesModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        sessions={sessions}
        activeSession={activeSession}
        setActiveSession={setActiveSession}
        onNewSession={() => setIsSessionModalOpen(true)}
        onRefreshAll={() => refreshPageData(activeSession)}
        isBusy={isBusy || isAgentRunning}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 overflow-hidden flex flex-col relative z-10">
        {activeTab === 'agent' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 h-[calc(100vh-120px)]">
            {/* Left Column: Autonomous AI Planning and Mission Timeline */}
            <div className="lg:col-span-6 h-full flex flex-col overflow-hidden">
              <AutonomousAgentPanel
                currentRun={currentRun}
                isRunning={isAgentRunning}
                onStartRun={(goal) => handleStartAutonomousRun(goal)}
                onStepRun={(goal) => handleStepAutonomousRun(goal)}
                onStopRun={handleStopRun}
                onSelectWorkflow={() => setIsTemplatesModalOpen(true)}
              />
            </div>

            {/* Right Column: Live Viewport Rendering & Interactive Element Badges */}
            <div className="lg:col-span-6 h-full flex flex-col overflow-hidden">
              <LiveViewport
                screenshotUrl={screenshotUrl}
                currentUrl={currentUrl}
                pageTitle={pageTitle}
                snapshotNodes={snapshotNodes}
                isLoading={isBusy || isAgentRunning}
                onNavigate={(url) => handleAction({ type: 'navigate', url })}
                onAction={handleAction}
                onRefresh={() => refreshPageData(activeSession)}
              />
            </div>
          </div>
        )}

        {activeTab === 'viewport' && (
          <div className="flex-1 h-[calc(100vh-120px)]">
            <LiveViewport
              screenshotUrl={screenshotUrl}
              currentUrl={currentUrl}
              pageTitle={pageTitle}
              snapshotNodes={snapshotNodes}
              isLoading={isBusy || isAgentRunning}
              onNavigate={(url) => handleAction({ type: 'navigate', url })}
              onAction={handleAction}
              onRefresh={() => refreshPageData(activeSession)}
            />
          </div>
        )}

        {activeTab === 'snapshot' && (
          <div className="flex-1 h-[calc(100vh-120px)]">
            <SnapshotInspector
              nodes={snapshotNodes}
              rawSnapshot={rawSnapshot}
              pageTitle={pageTitle}
              pageUrl={currentUrl}
              isLoading={isBusy}
              onRefresh={() => refreshPageData(activeSession)}
              onAction={handleAction}
            />
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="flex-1 h-[calc(100vh-120px)]">
            <CommandStudio
              onExecute={handleExecuteCli}
              history={cliHistory}
              onClearHistory={() => setCliHistory([])}
              isLoading={isBusy}
            />
          </div>
        )}
      </main>

      {/* Preset Workflow Templates Modal */}
      <WorkflowTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        templates={templates}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Browser Sessions Profile Modal */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={setActiveSession}
        onCreateSession={handleCreateSession}
        onCloseSession={handleCloseSession}
      />
    </div>
  );
}

export default App;

