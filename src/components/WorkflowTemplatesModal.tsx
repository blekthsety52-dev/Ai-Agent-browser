import React from 'react';
import {
  Sparkles,
  X,
  Flame,
  BookOpen,
  ShoppingBag,
  CheckSquare,
  Eye,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { WorkflowTemplate } from '../types';

interface WorkflowTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: WorkflowTemplate[];
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

export const WorkflowTemplatesModal: React.FC<WorkflowTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-blue-400" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
      case 'CheckSquare':
        return <CheckSquare className="w-5 h-5 text-indigo-400" />;
      case 'Eye':
        return <Eye className="w-5 h-5 text-amber-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050508]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0a14] border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Ambient radial glow inside modal */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.12)_0%,transparent_60%)]" />

        {/* Header */}
        <div className="bg-[#0a0a14]/90 backdrop-blur-md px-6 py-4 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Autonomous Web Recipes & Presets</h2>
              <p className="text-xs text-slate-400 font-sans">
                Pre-configured multi-step autonomous browsing workflows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3 relative z-10 bg-[#050508]/40">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate(tpl);
                onClose();
              }}
              className="group p-4 rounded-2xl bg-[#050508]/80 border border-white/5 hover:border-indigo-500/40 hover:bg-[#0a0a14] transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 shrink-0 group-hover:scale-105 transition-transform">
                  {getIcon(tpl.icon)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {tpl.title}
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-indigo-400">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                    {tpl.description}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    {tpl.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-white/40 font-mono px-2 py-0.5 rounded-md bg-black/30 border border-white/5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button className="px-4 py-2 bg-white/5 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white text-xs font-semibold rounded-xl group-hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all flex items-center gap-1.5 shrink-0">
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-[#0a0a14] px-6 py-3.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 relative z-10 font-mono">
          <span>You can also enter custom natural language goals in the AI panel anytime.</span>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
