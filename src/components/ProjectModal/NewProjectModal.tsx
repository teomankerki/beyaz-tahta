import React, { useState } from 'react';
import type { Project, Classification, CardColor, ProjectStatus } from '../../types';
import { CARD_COLORS, CLASSIFICATION_CONFIG } from '../../utils/colors';
import { X, Sparkles, Plus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
  initialClassification?: Classification;
  initialPosition?: { x: number; y: number };
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  initialClassification = 'creative',
  initialPosition = { x: 300, y: 200 },
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [tldr, setTldr] = useState('');
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState<Classification>(initialClassification);
  const [status, setStatus] = useState<ProjectStatus>('spark');
  const [color, setColor] = useState<CardColor>(initialClassification === 'creative' ? 'amber' : 'cyan');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !tldr.trim()) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      tldr: tldr.trim(),
      description: description.trim(),
      classification,
      status,
      color,
      tags,
      position: initialPosition,
      updates: [],
      subIdeas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreate(newProject);
    onClose();
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const colorOptions: CardColor[] = ['yellow', 'amber', 'emerald', 'cyan', 'violet', 'rose', 'slate'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Sparkles size={16} />
            </span>
            <h3 className="font-bold text-slate-800 text-base">New Backlog Idea</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {/* Classification Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Classification
            </label>
            <div className="flex gap-2">
              {(['creative', 'tech', 'hybrid'] as Classification[]).map((cls) => {
                const conf = CLASSIFICATION_CONFIG[cls];
                const isSelected = classification === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      setClassification(cls);
                      if (cls === 'creative') setColor('amber');
                      else if (cls === 'tech') setColor('cyan');
                      else setColor('violet');
                    }}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? `${conf.badgeBg} ${conf.badgeText} border-blue-500 ring-2 ring-blue-400/40 font-bold shadow-xs`
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

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Offline Audio Visualizer"
              className="w-full text-base font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          {/* TLDR Summary */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-900 mb-1 uppercase tracking-wider">
              <span>⚡</span>
              <span>TLDR (1-2 Cümle Özet) *</span>
            </div>
            <textarea
              rows={2}
              required
              value={tldr}
              onChange={(e) => setTldr(e.target.value)}
              placeholder="Fikrin özeti ve temel amacı..."
              className="w-full text-xs font-medium bg-white px-3 py-2 rounded-lg border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800 resize-none"
            />
          </div>

          {/* Notes / Context */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Context / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Initial thoughts, dependencies, inspiration..."
              className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800 resize-none"
            />
          </div>

          {/* Color & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Note Color
              </label>
              <div className="flex items-center gap-1.5">
                {colorOptions.map((c) => {
                  const conf = CARD_COLORS[c];
                  const isSelected = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      title={conf.name}
                      style={{ backgroundColor: conf.dotColor }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        isSelected ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105 opacity-80'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full text-xs font-medium px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800"
              >
                <option value="spark">💡 Spark (Ideation)</option>
                <option value="in-progress">🚧 In Flight (Building)</option>
                <option value="paused">🧊 On Ice (Later)</option>
                <option value="shipped">🚀 Shipped (Done)</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200"
                >
                  #{t}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="e.g. Rust, Audio, Indie"
                className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !tldr.trim()}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Projeyi Ekle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
