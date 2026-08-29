import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  Camera,
  Maximize2,
  Minimize2,
  Layers,
  MousePointer,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
  Globe,
  Tag,
  Compass,
} from 'lucide-react';
import { SnapshotNode } from '../types';

interface LiveViewportProps {
  screenshotUrl: string | null;
  currentUrl: string;
  pageTitle: string;
  snapshotNodes: SnapshotNode[];
  isLoading: boolean;
  onNavigate: (url: string) => void;
  onAction: (action: {
    type: string;
    targetRef?: string;
    value?: string;
    url?: string;
    direction?: string;
  }) => void;
  onRefresh: () => void;
}

export const LiveViewport: React.FC<LiveViewportProps> = ({
  screenshotUrl,
  currentUrl,
  pageTitle,
  snapshotNodes,
  isLoading,
  onNavigate,
  onAction,
  onRefresh,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl || '');
  const [showRefsOverlay, setShowRefsOverlay] = useState(true);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [fillValue, setFillValue] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync inputUrl when currentUrl changes
  React.useEffect(() => {
    if (currentUrl) {
      setInputUrl(currentUrl);
    }
  }, [currentUrl]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    let url = inputUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = `https://${url}`;
      } else {
        url = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
      }
    }
    onNavigate(url);
  };

  const quickSites = [
    { name: 'Hacker News', url: 'https://news.ycombinator.com', icon: '🔥' },
    { name: 'Wikipedia', url: 'https://en.wikipedia.org', icon: '📖' },
    { name: 'Books Scrape Demo', url: 'https://books.toscrape.com', icon: '📚' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🦆' },
    { name: 'Example Domain', url: 'https://example.com', icon: '🌐' },
  ];

  // Filter nodes that have valid refs
  const interactiveNodes = snapshotNodes.filter((n) => Boolean(n.ref));

  return (
    <div className={`flex flex-col h-full bg-[#0a0a14] border border-white/5 rounded-3xl overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] relative group ${
      isFullscreen ? 'fixed inset-4 z-50 bg-[#050508]' : ''
    }`}>
      {/* Background ambient radial glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08)_0%,transparent_70%)]" />

      {/* Top Browser Bar */}
      <div className="bg-[#0a0a14]/90 backdrop-blur-md px-4 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 relative z-10">
        {/* Navigation & Traffic dots */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 mr-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onAction({ type: 'back' })}
              disabled={isLoading}
              title="Back"
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Reload Page"
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Address Bar Form */}
        <form onSubmit={handleUrlSubmit} className="flex-1 min-w-[220px] max-w-xl relative flex items-center">
          <div className="absolute left-3.5 text-indigo-400 pointer-events-none flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter URL or search query..."
            className="w-full bg-black/40 text-indigo-200 text-xs font-mono rounded-xl pl-9 pr-20 py-2 border border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(79,70,229,0.3)] cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Open</span>}
          </button>
        </form>

        {/* Viewport Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRefsOverlay(!showRefsOverlay)}
            title="Toggle Accessibility @ref handles"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              showRefsOverlay
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">@refs ({interactiveNodes.length})</span>
          </button>

          <button
            onClick={() => onAction({ type: 'scroll', direction: 'up' })}
            title="Scroll Up"
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onAction({ type: 'scroll', direction: 'down' })}
            title="Scroll Down"
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Viewport Content */}
      <div className="flex-1 relative overflow-auto bg-[#050508]/80 flex flex-col items-center justify-start p-4 z-10">
        {screenshotUrl ? (
          <div className="relative max-w-full inline-block rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden bg-[#0a0a14]">
            <img
              src={screenshotUrl}
              alt="Live Browser Viewport"
              className="max-w-full h-auto object-contain block select-none"
              style={{ maxHeight: isFullscreen ? 'calc(100vh - 160px)' : '560px' }}
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-[#050508]/80 backdrop-blur-md flex items-center justify-center gap-2.5 text-indigo-300 font-mono text-xs shadow-inner">
                <div className="bg-[#0a0a14] border border-indigo-500/50 px-6 py-4 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.4)] flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-sm text-indigo-100 font-medium">Executing action via agent-browser...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Initial Landing State */
          <div className="my-auto flex flex-col items-center justify-center text-center max-w-md py-10 px-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">No Active Page Loaded</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Enter any URL in the address bar above, launch an autonomous AI workflow, or pick one of these fast test sites to start automating.
            </p>

            <div className="grid grid-cols-2 gap-2.5 w-full">
              {quickSites.map((site) => (
                <button
                  key={site.url}
                  onClick={() => onNavigate(site.url)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/50 text-left transition-all text-xs group shadow-sm"
                >
                  <span className="text-base">{site.icon}</span>
                  <div className="truncate">
                    <div className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                      {site.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{site.url.replace('https://', '')}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Refs Drawer / Quick Element Action Bar */}
      {showRefsOverlay && interactiveNodes.length > 0 && (
        <div className="bg-[#0a0a14] border-t border-white/5 px-4 py-3 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
                Discovered Interactive Elements
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-indigo-400">
                {interactiveNodes.length} refs
              </span>
            </div>

            {selectedRef && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-indigo-300 font-semibold">
                  Active: @{selectedRef}
                </span>
                <button
                  onClick={() => setSelectedRef(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Horizontal scrollable refs pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 max-h-24">
            {interactiveNodes.map((node) => {
              const isSelected = selectedRef === node.ref;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedRef(node.ref || null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                      : 'bg-black/30 text-slate-300 border-white/5 hover:border-indigo-500/30 hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold text-indigo-400">@{node.ref}</span>
                  <span className="text-[10px] text-slate-400 uppercase">[{node.role}]</span>
                  {node.name && <span className="text-slate-200 font-sans max-w-[120px] truncate">"{node.name}"</span>}
                </button>
              );
            })}
          </div>

          {/* Action Trigger for Selected Ref */}
          {selectedRef && (
            <div className="mt-2.5 pt-2.5 border-t border-white/5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-300 font-medium">Action on @{selectedRef}:</span>
              <button
                onClick={() => onAction({ type: 'click', targetRef: selectedRef })}
                disabled={isLoading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(79,70,229,0.3)] cursor-pointer"
              >
                <MousePointer className="w-3 h-3" />
                Click @{selectedRef}
              </button>

              <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                <input
                  type="text"
                  value={fillValue}
                  onChange={(e) => setFillValue(e.target.value)}
                  placeholder="Text to fill in element..."
                  className="w-full bg-black/40 text-slate-100 text-xs font-mono rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => {
                    onAction({ type: 'fill', targetRef: selectedRef, value: fillValue });
                    setFillValue('');
                  }}
                  disabled={isLoading || !fillValue.trim()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Fill
                </button>
              </div>

              <button
                onClick={() => onAction({ type: 'extract', targetRef: selectedRef })}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium rounded-lg border border-white/10 transition-colors"
              >
                Extract Text
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom Footer Info */}
      <div className="bg-[#0a0a14] px-4 py-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400 relative z-10">
        <div className="flex items-center gap-3 truncate">
          <span className="text-white/40 uppercase font-bold text-[10px] tracking-tight">Title:</span>
          <span className="text-slate-200 font-sans truncate font-medium">{pageTitle || 'Untitled Page'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white/40 uppercase font-bold text-[10px] tracking-tight">Engine:</span>
          <span className="text-emerald-400 font-semibold">agent-browser (CDP)</span>
        </div>
      </div>
    </div>
  );
};
