import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SnapshotNode, ExecResult, BrowserSession } from '../src/types';

// Store active session metadata
const sessionsMap = new Map<string, BrowserSession>();

// Ensure default session exists
if (!sessionsMap.has('default')) {
  sessionsMap.set('default', {
    id: 'default',
    name: 'Default Session',
    url: 'about:blank',
    title: 'New Tab',
    createdAt: Date.now(),
    lastActive: Date.now(),
    tabsCount: 1,
  });
}

// Temporary directory for screenshots
const SCREENSHOT_DIR = path.join(os.tmpdir(), 'agent-browser-shots');
try {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create screenshot directory:', e);
}

/**
 * Execute an agent-browser CLI command
 */
export async function runAgentBrowserCommand(
  args: string[],
  session = 'default',
  timeoutMs = 30000
): Promise<ExecResult> {
  const startTime = Date.now();
  
  // Format arguments, ensuring session parameter is passed
  let finalArgs: string[] = [];
  if (!args.includes('--session') && !args.includes('-s')) {
    finalArgs = ['--session', session, ...args];
  } else {
    finalArgs = [...args];
  }

  const cmdString = `agent-browser ${finalArgs.join(' ')}`;

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let isSettled = false;

    // Use npx or direct path to agent-browser
    const child = spawn('npx', ['agent-browser', ...finalArgs], {
      env: {
        ...process.env,
        AGENT_BROWSER_HEADED: 'false',
        PAGER: 'cat',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try {
          child.kill('SIGKILL');
        } catch {}
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          exitCode: 124,
          stdout,
          stderr: stderr + `\nCommand timed out after ${timeoutMs}ms`,
          durationMs: duration,
          command: cmdString,
          timestamp: Date.now(),
        });
      }
    }, timeoutMs);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          exitCode: 1,
          stdout,
          stderr: stderr + `\nExecution error: ${err.message}`,
          durationMs: duration,
          command: cmdString,
          timestamp: Date.now(),
        });
      }
    });

    child.on('close', (code) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        const duration = Date.now() - startTime;
        
        // Update session last active time
        if (sessionsMap.has(session)) {
          const s = sessionsMap.get(session)!;
          s.lastActive = Date.now();
          // Attempt to extract title/url if present in stdout
          if (finalArgs.includes('open')) {
            const openIdx = finalArgs.indexOf('open');
            if (openIdx !== -1 && finalArgs[openIdx + 1]) {
              s.url = finalArgs[openIdx + 1];
            }
          }
        }

        resolve({
          success: code === 0,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          durationMs: duration,
          command: cmdString,
          timestamp: Date.now(),
        });
      }
    });
  });
}

/**
 * Parses snapshot output lines into a hierarchical tree of SnapshotNodes
 * Examples of lines from agent-browser snapshot:
 * - heading "Example Domain" [level=1, ref=e1]
 * - link "Learn more" [ref=e2]
 * - button "Submit query" [disabled, ref=e3]
 * - textbox "Search" [value="AI", ref=e4]
 */
export function parseSnapshotTree(rawText: string): { nodes: SnapshotNode[]; title: string; url: string } {
  const lines = rawText.split('\n');
  const rootNodes: SnapshotNode[] = [];
  let currentTitle = '';
  let currentUrl = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (!line.trim()) continue;

    // Detect Title / URL headers
    if (line.startsWith('✓ ') || line.startsWith('Title: ') || line.startsWith('Page: ')) {
      currentTitle = line.replace(/^(✓|Title:|Page:)\s*/, '').trim();
      continue;
    }
    if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('URL: ')) {
      currentUrl = line.replace(/^URL:\s*/, '').trim();
      continue;
    }

    // Match snapshot element line: e.g. "  - role \"name\" [attrs]" or "- role \"name\" [ref=e1]"
    const match = line.match(/^(\s*)-\s+([a-zA-Z0-9_\-]+)(?:\s+"([^"]*)")?(?:\s+\[(.*)\])?/);
    if (match) {
      const indent = match[1].length;
      const role = match[2];
      const name = match[3] || '';
      const rawAttrs = match[4] || '';

      const node: SnapshotNode = {
        id: `node-${i}-${Date.now().toString(36)}`,
        role,
        name,
        raw: line.trim(),
      };

      // Parse attributes inside brackets: e.g., level=1, ref=e1, disabled, value="abc"
      if (rawAttrs) {
        const refMatch = rawAttrs.match(/ref=([a-zA-Z0-9_\-]+)/);
        if (refMatch) node.ref = refMatch[1];

        const levelMatch = rawAttrs.match(/level=(\d+)/);
        if (levelMatch) node.level = parseInt(levelMatch[1], 10);

        const valMatch = rawAttrs.match(/value="([^"]*)"/);
        if (valMatch) node.value = valMatch[1];

        if (rawAttrs.includes('disabled')) node.disabled = true;
        if (rawAttrs.includes('checked')) node.checked = true;
        if (rawAttrs.includes('focused')) node.focused = true;
      }

      rootNodes.push(node);
    } else if (line.trim().startsWith('- ')) {
      // General item fallback
      const text = line.trim().substring(2);
      rootNodes.push({
        id: `node-${i}`,
        role: 'generic',
        name: text,
        raw: line.trim(),
      });
    }
  }

  return {
    nodes: rootNodes,
    title: currentTitle || 'Web Page',
    url: currentUrl,
  };
}

/**
 * Capture a screenshot for a session and return it as a base64 data URI
 */
export async function captureScreenshot(session = 'default'): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  const filePath = path.join(SCREENSHOT_DIR, `shot-${session}-${Date.now()}.png`);
  try {
    const res = await runAgentBrowserCommand(['screenshot', filePath], session, 15000);
    if (res.success && fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      const base64 = buf.toString('base64');
      // Cleanup file
      try {
        fs.unlinkSync(filePath);
      } catch {}
      return {
        success: true,
        dataUrl: `data:image/png;base64,${base64}`,
      };
    }
    return {
      success: false,
      error: res.stderr || 'Screenshot capture failed or file not found',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Get current page snapshot for a session
 */
export async function getSnapshot(session = 'default', interactiveOnly = true): Promise<{
  success: boolean;
  raw: string;
  parsed: { nodes: SnapshotNode[]; title: string; url: string };
  error?: string;
}> {
  const args = interactiveOnly ? ['snapshot', '-i'] : ['snapshot'];
  const res = await runAgentBrowserCommand(args, session, 15000);
  if (res.success) {
    const parsed = parseSnapshotTree(res.stdout);
    
    // Update session title and url if discovered
    if (sessionsMap.has(session)) {
      const s = sessionsMap.get(session)!;
      if (parsed.title) s.title = parsed.title;
      if (parsed.url) s.url = parsed.url;
    }

    return {
      success: true,
      raw: res.stdout,
      parsed,
    };
  }
  return {
    success: false,
    raw: res.stdout,
    parsed: { nodes: [], title: '', url: '' },
    error: res.stderr || 'Failed to capture snapshot',
  };
}

/**
 * Manage sessions
 */
export function getActiveSessions(): BrowserSession[] {
  return Array.from(sessionsMap.values());
}

export function createNewSession(id: string, name?: string): BrowserSession {
  const session: BrowserSession = {
    id: id.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
    name: name || `Session ${id}`,
    url: 'about:blank',
    title: 'New Session',
    createdAt: Date.now(),
    lastActive: Date.now(),
    tabsCount: 1,
  };
  sessionsMap.set(session.id, session);
  return session;
}

export async function closeSession(id: string): Promise<boolean> {
  if (id === 'default') {
    await runAgentBrowserCommand(['close'], 'default');
    const s = sessionsMap.get('default');
    if (s) {
      s.url = 'about:blank';
      s.title = 'New Tab';
    }
    return true;
  }
  await runAgentBrowserCommand(['close'], id);
  sessionsMap.delete(id);
  return true;
}
