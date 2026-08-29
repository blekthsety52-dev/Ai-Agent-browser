export interface ExecResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  command: string;
  timestamp: number;
}

export interface SnapshotNode {
  id: string;
  ref?: string;
  role: string;
  name: string;
  level?: number;
  value?: string;
  disabled?: boolean;
  checked?: boolean;
  focused?: boolean;
  children?: SnapshotNode[];
  raw?: string;
}

export interface BrowserSession {
  id: string;
  name: string;
  url: string;
  title: string;
  createdAt: number;
  lastActive: number;
  activeTab?: string;
  tabsCount?: number;
}

export interface AgentStep {
  id: string;
  stepNumber: number;
  timestamp: number;
  thought: string;
  command: string;
  actionType: 'navigate' | 'click' | 'fill' | 'press' | 'scroll' | 'extract' | 'wait' | 'screenshot' | 'evaluate' | 'complete' | 'other';
  targetRef?: string;
  targetValue?: string;
  output: string;
  status: 'running' | 'success' | 'failed';
  screenshotUrl?: string;
  durationMs?: number;
}

export interface AutonomousRun {
  id: string;
  goal: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';
  session: string;
  currentUrl?: string;
  steps: AgentStep[];
  extractedData?: any;
  finalAnswer?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
  totalTokensUsed?: number;
}

export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'research' | 'scraping' | 'qa' | 'automation' | 'monitoring';
  initialUrl: string;
  goal: string;
  tags: string[];
}

export interface NetworkLogItem {
  id: string;
  method: string;
  url: string;
  status: number;
  type: string;
  time: string;
  size?: string;
}

export interface ConsoleLogItem {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
  timestamp: number;
}
