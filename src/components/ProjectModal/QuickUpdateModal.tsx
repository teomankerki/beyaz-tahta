import React, { useState } from 'react';
import type { Project, UpdateType } from '../../types';
import { UPDATE_TYPE_CONFIG } from '../../utils/colors';
import { X, Send, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickUpdateModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onAddUpdate: (projectId: string, content: string, type: UpdateType) => void;
}

export const QuickUpdateModal: React.FC<QuickUpdateModalProps> = ({
  project,
  isOpen,
  onClose,
  onAddUpdate,
}) => {
  if (!isOpen || !project) return null;

  const [content, setContent] = useState('');
  const [type, setType] = useState<UpdateType>('log');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (type === 'milestone') {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
      });
    }

    onAddUpdate(project.id, content.trim(), type);
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-blue-100 text-blue-800">
              <Sparkles size={15} />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Add Quick Update</h3>
              <p className="text-[11px] text-slate-500 line-clamp-1">{project.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Update Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['log', 'milestone', 'roadblock', 'idea'] as UpdateType[]).map((t) => {
                const conf = UPDATE_TYPE_CONFIG[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? `${conf.badgeBg} ${conf.border} ring-2 ring-blue-400/40 shadow-xs font-bold`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{conf.emoji}</span>
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Son Durum & Not
            </label>
            <textarea
              autoFocus
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Son durum, yapılan değişiklik veya not..."
              className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit(e);
                }
              }}
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              İpucu: Ctrl+Enter ile hızlıca kaydedebilirsin
            </span>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>Güncellemeyi Ekle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
