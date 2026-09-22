import React, { useState } from 'react';
import type { Project, Classification, ProjectStatus, CardColor, UpdateType } from '../../types';
import { CARD_COLORS, CLASSIFICATION_CONFIG, STATUS_CONFIG, UPDATE_TYPE_CONFIG, formatTimeAgo } from '../../utils/colors';
import { X, Send, Trash2, Plus, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
  onDelete: (id: string) => void;
  initialOpenToUpdates?: boolean;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !project) return null;

  // Local state for editing project fields
  const [title, setTitle] = useState(project.title);
  const [tldr, setTldr] = useState(project.tldr);
  const [description, setDescription] = useState(project.description || '');
  const [classification, setClassification] = useState<Classification>(project.classification);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [color, setColor] = useState<CardColor>(project.color);
  const [tags, setTags] = useState<string[]>(project.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Local state for new update input
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [newUpdateType, setNewUpdateType] = useState<UpdateType>('log');

  const handleSave = () => {
    if (!title.trim()) return;
    const updated: Project = {
      ...project,
      title: title.trim(),
      tldr: tldr.trim(),
      description: description.trim(),
      classification,
      status,
      color,
      tags,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    onClose();
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    setStatus(newStatus);
    if (newStatus === 'shipped' && project.status !== 'shipped') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateContent.trim()) return;

    const newUpdate = {
      id: `upd-${Date.now()}`,
      projectId: project.id,
      timestamp: new Date().toISOString(),
      content: newUpdateContent.trim(),
      type: newUpdateType,
    };

    if (newUpdateType === 'milestone') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    const updatedProject: Project = {
      ...project,
      title: title.trim(),
      tldr: tldr.trim(),
      description: description.trim(),
      classification,
      status,
      color,
      tags,
      updates: [...(project.updates || []), newUpdate],
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedProject);
    setNewUpdateContent('');
  };

  const handleDeleteUpdate = (updateId: string) => {
    const updatedProject: Project = {
      ...project,
      title,
      tldr,
      description,
      classification,
      status,
      color,
      tags,
      updates: (project.updates || []).filter((u) => u.id !== updateId),
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedProject);
  };

  // Color selection list
  const colorOptions: CardColor[] = ['yellow', 'amber', 'emerald', 'cyan', 'violet', 'rose', 'slate'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xl">{CLASSIFICATION_CONFIG[classification]?.emoji}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {classification} Project & Idea Details
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to delete this project?')) {
                  onDelete(project.id);
                  onClose();
                }
              }}
              title="Delete Project"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={17} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Generative Ambient Synth"
              className="w-full text-xl font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            />
          </div>

          {/* TLDR Input (Whiteboard Highlight) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1 uppercase tracking-wider">
              <span>⚡</span>
              <span>TLDR Summary (1-2 Punchy Sentences)</span>
            </div>
            <textarea
              rows={2}
              value={tldr}
              onChange={(e) => setTldr(e.target.value)}
              placeholder="What is the core premise and why is it awesome?"
              className="w-full text-sm font-medium bg-white/90 px-3 py-2 rounded-lg border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800 resize-none"
            />
          </div>

          {/* Classification & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Classification */}
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
                      onClick={() => setClassification(cls)}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? `${conf.badgeBg} ${conf.badgeText} border-blue-500 ring-2 ring-blue-400/40 shadow-xs font-bold`
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

            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Current Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['spark', 'in-progress', 'paused', 'shipped'] as ProjectStatus[]).map((st) => {
                  const conf = STATUS_CONFIG[st];
                  const isSelected = status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                        isSelected
                          ? `${conf.badgeBg} border-blue-500 ring-2 ring-blue-400/30 shadow-xs`
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
          </div>

          {/* Color & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sticky Card Color Theme */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Sticky Note Color
              </label>
              <div className="flex items-center gap-2">
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
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        isSelected ? 'ring-3 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
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
                    placeholder="Add tag and hit Enter..."
                    className="w-full text-xs pl-7 pr-2 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Deeper Description / Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Detailed Notes & Context
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key technical decisions, inspirations, links, architecture thoughts..."
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* ----------------- UPDATES STREAM ----------------- */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span>📝</span>
                <span>Project Updates & Micro-Logs</span>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {project.updates?.length || 0}
                </span>
              </h4>
            </div>

            {/* Post New Update Box */}
            <form onSubmit={handleAddUpdate} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Update Type:</span>
                {(['log', 'milestone', 'roadblock', 'idea'] as UpdateType[]).map((type) => {
                  const conf = UPDATE_TYPE_CONFIG[type];
                  const isSelected = newUpdateType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewUpdateType(type)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? `${conf.badgeBg} ${conf.border} ring-1 ring-blue-400 font-bold`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{conf.emoji}</span>
                      <span>{conf.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={newUpdateContent}
                  onChange={(e) => setNewUpdateContent(e.target.value)}
                  placeholder={`Write a quick update (${UPDATE_TYPE_CONFIG[newUpdateType].label.toLowerCase()})...`}
                  className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddUpdate(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!newUpdateContent.trim()}
                  className="px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Send size={13} />
                  <span>Post</span>
                </button>
              </div>
            </form>

            {/* Updates Timeline Feed */}
            <div className="space-y-3">
              {project.updates && project.updates.length > 0 ? (
                [...project.updates].reverse().map((upd) => {
                  const conf = UPDATE_TYPE_CONFIG[upd.type] || UPDATE_TYPE_CONFIG.log;
                  return (
                    <div
                      key={upd.id}
                      className="group/upd bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:border-slate-300 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${conf.badgeBg} ${conf.border}`}
                          >
                            <span>{conf.emoji}</span>
                            <span>{conf.label}</span>
                          </span>
                          <span
                            title={new Date(upd.timestamp).toLocaleString()}
                            className="text-[11px] font-medium text-slate-400"
                          >
                            {formatTimeAgo(upd.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 whitespace-pre-wrap selectable-text font-normal leading-relaxed">
                          {upd.content}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteUpdate(upd.id)}
                        title="Delete log"
                        className="opacity-0 group-hover/upd:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No updates yet. Post the first milestone or log above!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <span className="text-[11px] text-slate-400">
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
