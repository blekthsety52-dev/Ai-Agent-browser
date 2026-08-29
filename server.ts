import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  runAgentBrowserCommand,
  getSnapshot,
  captureScreenshot,
  getActiveSessions,
  createNewSession,
  closeSession,
} from './server/browser-manager';
import { planNextBrowserAction, synthesizeAutonomousReport } from './server/gemini';
import { WORKFLOW_TEMPLATES } from './server/templates';
import { AgentStep } from './src/types';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ==========================================
  // API Routes
  // ==========================================

  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      engine: 'agent-browser',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // 2. Direct agent-browser CLI execution
  app.post('/api/exec', async (req, res) => {
    try {
      const { args, session = 'default', timeoutMs = 30000 } = req.body;
      if (!Array.isArray(args)) {
        return res.status(400).json({
          success: false,
          error: 'Expected "args" to be an array of string arguments',
        });
      }
      const result = await runAgentBrowserCommand(args, session, timeoutMs);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error executing agent-browser command',
      });
    }
  });

  // 3. Quick Action execution (navigate, click ref, fill ref, scroll, press, etc.)
  app.post('/api/action', async (req, res) => {
    try {
      const {
        type,
        session = 'default',
        targetRef,
        value,
        url,
        direction,
        key,
      } = req.body;

      let cliArgs: string[] = [];

      switch (type) {
        case 'navigate':
          if (!url) return res.status(400).json({ error: 'URL required for navigate' });
          cliArgs = ['open', url];
          break;
        case 'click':
          if (!targetRef) return res.status(400).json({ error: 'targetRef required for click' });
          cliArgs = ['click', targetRef.startsWith('@') ? targetRef : `@${targetRef}`];
          break;
        case 'fill':
          if (!targetRef) return res.status(400).json({ error: 'targetRef required for fill' });
          cliArgs = ['fill', targetRef.startsWith('@') ? targetRef : `@${targetRef}`, value || ''];
          break;
        case 'press':
          cliArgs = ['press', key || value || 'Enter'];
          break;
        case 'scroll':
          cliArgs = ['scroll', direction || 'down'];
          break;
        case 'extract':
          if (!targetRef) return res.status(400).json({ error: 'targetRef required for extract' });
          cliArgs = ['get', 'text', targetRef.startsWith('@') ? targetRef : `@${targetRef}`];
          break;
        case 'back':
          cliArgs = ['back'];
          break;
        case 'reload':
          cliArgs = ['reload'];
          break;
        case 'close':
          cliArgs = ['close'];
          break;
        default:
          return res.status(400).json({ error: `Unknown action type: ${type}` });
      }

      const result = await runAgentBrowserCommand(cliArgs, session);
      
      // Auto capture fresh snapshot & screenshot after action
      const [snapshotData, shotData] = await Promise.all([
        getSnapshot(session, true),
        captureScreenshot(session),
      ]);

      res.json({
        success: result.success,
        execResult: result,
        snapshot: snapshotData.success ? snapshotData.parsed : null,
        screenshotUrl: shotData.success ? shotData.dataUrl : null,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  // 4. Get page accessibility tree & interactive snapshot
  app.get('/api/snapshot', async (req, res) => {
    try {
      const session = (req.query.session as string) || 'default';
      const interactiveOnly = req.query.interactive !== 'false';
      const data = await getSnapshot(session, interactiveOnly);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Capture screenshot
  app.get('/api/screenshot', async (req, res) => {
    try {
      const session = (req.query.session as string) || 'default';
      const data = await captureScreenshot(session);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Session Management
  app.get('/api/sessions', (_req, res) => {
    res.json(getActiveSessions());
  });

  app.post('/api/sessions/create', (req, res) => {
    const { id, name } = req.body;
    if (!id) return res.status(400).json({ error: 'Session ID required' });
    const session = createNewSession(id, name);
    res.json(session);
  });

  app.post('/api/sessions/close', async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Session ID required' });
    const success = await closeSession(id);
    res.json({ success });
  });

  // 7. Autonomous Agent: Step Planning & Execution
  app.post('/api/agent/step', async (req, res) => {
    try {
      const {
        goal,
        session = 'default',
        stepHistory = [],
        stepNumber = 1,
      } = req.body;

      if (!goal) {
        return res.status(400).json({ error: 'Goal is required' });
      }

      // Step 1: Capture current snapshot & screenshot
      const [currentSnapshot, currentShot] = await Promise.all([
        getSnapshot(session, true),
        captureScreenshot(session),
      ]);

      const currentUrl = currentSnapshot.parsed?.url || '';

      // Step 2: Use Gemini to plan next browser command
      const planned = await planNextBrowserAction({
        goal,
        currentUrl,
        snapshotText: currentSnapshot.raw || '',
        stepHistory: stepHistory as AgentStep[],
        stepNumber,
      });

      // If goal is already met or action is complete
      if (planned.isGoalMet && planned.actionType === 'complete') {
        const step: AgentStep = {
          id: `step-${stepNumber}-${Date.now().toString(36)}`,
          stepNumber,
          timestamp: Date.now(),
          thought: planned.thought,
          command: 'agent-browser complete',
          actionType: 'complete',
          output: planned.finalSummary || 'Goal accomplished successfully.',
          status: 'success',
          screenshotUrl: currentShot.success ? currentShot.dataUrl : undefined,
          durationMs: 100,
        };

        return res.json({
          step,
          isGoalMet: true,
          finalSummary: planned.finalSummary || planned.thought,
          extractedInfo: planned.extractedInfo,
        });
      }

      // Step 3: Execute planned CLI command
      const execResult = await runAgentBrowserCommand(planned.cliArgs, session);

      // Step 4: Capture resulting screenshot
      const postShot = await captureScreenshot(session);

      const step: AgentStep = {
        id: `step-${stepNumber}-${Date.now().toString(36)}`,
        stepNumber,
        timestamp: Date.now(),
        thought: planned.thought,
        command: execResult.command,
        actionType: planned.actionType,
        targetRef: planned.targetRef,
        targetValue: planned.targetValue,
        output: execResult.stdout || execResult.stderr || (execResult.success ? 'Success' : 'No output'),
        status: execResult.success ? 'success' : 'failed',
        screenshotUrl: postShot.success ? postShot.dataUrl : currentShot.dataUrl,
        durationMs: execResult.durationMs,
      };

      res.json({
        step,
        isGoalMet: planned.isGoalMet,
        finalSummary: planned.finalSummary,
        extractedInfo: planned.extractedInfo,
        execResult,
      });
    } catch (err: any) {
      console.error('Agent step execution error:', err);
      // Return a structured recovery step rather than a hard 500 error
      const step: AgentStep = {
        id: `step-${req.body.stepNumber || 1}-${Date.now().toString(36)}`,
        stepNumber: req.body.stepNumber || 1,
        timestamp: Date.now(),
        thought: `Encountered transient notice (${err.message || 'connection'}). Refreshing DOM state and continuing...`,
        command: 'agent-browser snapshot -i',
        actionType: 'evaluate',
        output: err.message || 'Transient error',
        status: 'failed',
        durationMs: 200,
      };
      res.json({
        step,
        isGoalMet: false,
        notice: err.message,
      });
    }
  });

  // 8. Synthesize final autonomous report
  app.post('/api/agent/synthesize', async (req, res) => {
    try {
      const { goal, stepHistory = [] } = req.body;
      const report = await synthesizeAutonomousReport(goal, stepHistory);
      res.json({ report });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Workflow Templates
  app.get('/api/templates', (_req, res) => {
    res.json(WORKFLOW_TEMPLATES);
  });

  // ==========================================
  // Vite Middleware / Static Serving
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Agent Browser server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
