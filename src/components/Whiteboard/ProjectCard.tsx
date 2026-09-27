import React, { useState, useEffect, useRef } from 'react';
import type { Project, Category, CanvasTool } from '../../types';
import { CARD_COLORS, STATUS_CONFIG, UPDATE_TYPE_CONFIG, getCategoryStyle, formatTimeAgo } from '../../utils/colors';
import {
  Pin,
  MessageSquarePlus,
  Clock,
  ExternalLink,
  Trash2,
  CheckSquare,
  Square,
  Plus,
  X,
  StickyNote,
  Link2,
  Move,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  categories?: Category[];
  activeTool?: CanvasTool;
  onOpen: (project: Project) => void;
  onQuickUpdate: (project: Project) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onTogglePin?: (id: string, e: React.MouseEvent) => void;
  onToggleTodo?: (projectId: string, todoId: string) => void;
  onAddTodo?: (projectId: string, title: string) => void;
  onDeleteTodo?: (projectId: string, todoId: string) => void;
  onUpdateNote?: (projectId: string, newNote: string) => void;
  onAddLink?: (projectId: string, title: string, url: string) => void;
  onDeleteLink?: (projectId: string, linkId: string) => void;
  isDragging?: boolean;
  onDragStart?: (e: React.PointerEvent, project: Project) => void;
  style?: React.CSSProperties;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  categories = [],
  activeTool,
  onOpen,
  onQuickUpdate,
  onDelete,
  onTogglePin,
  onToggleTodo,
  onAddTodo,
  onDeleteTodo,
  onUpdateNote,
  onAddLink,
  onDeleteLink,
  isDragging,
  onDragStart,
  style,
}) => {
  const [newTodoText, setNewTodoText] = useState('');
  const [noteDraft, setNoteDraft] = useState(project.tldr || '');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setNoteDraft(project.tldr || '');
  }, [project.tldr]);

  const itemType = project.itemType || 'project';

  useEffect(() => {
    if (itemType === 'text' && textInputRef.current) {
      textInputRef.current.style.height = 'auto';
      textInputRef.current.style.height = `${textInputRef.current.scrollHeight}px`;
    }
  }, [itemType, noteDraft]);

  useEffect(() => {
    if (itemType === 'text' && !project.tldr) {
      const timer = setTimeout(() => {
        textInputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [itemType, project.tldr]);

  const colorConfig = CARD_COLORS[project.color] || CARD_COLORS.yellow;
  const catId = project.categoryId || project.classification;
  const matchedCat = categories.find((c) => c.id === catId || c.name === catId);
  const catStyle = getCategoryStyle(matchedCat, project.classification);
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.spark;

  const latestUpdate = project.updates && project.updates.length > 0
    ? project.updates[project.updates.length - 1]
    : null;

  const todos = project.subIdeas || [];
  const doneTodosCount = todos.filter((s) => s.status === 'done').length;
  const todoProgressPct = todos.length > 0 ? Math.round((doneTodosCount / todos.length) * 100) : 0;

  const links = project.links || [];

  const handleTodoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newTodoText.trim() || !onAddTodo) return;
    onAddTodo(project.id, newTodoText.trim());
    setNewTodoText('');
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rawUrl = newLinkUrl.trim() || newLinkTitle.trim();
    if (!rawUrl || !onAddLink) return;
    const finalUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const finalTitle = newLinkTitle.trim() || rawUrl;
    onAddLink(project.id, finalTitle, finalUrl);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsAddingLink(false);
  };

  // =========================================================
  // SIMPLE TEXT NODE (Frameless, Single Font)
  // =========================================================
  if (itemType === 'text') {
    return (
      <div
        style={style}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('textarea')) return;
          onDragStart?.(e, project);
        }}
        className={`group/text absolute min-w-48 max-w-96 flex items-start gap-1.5 p-1.5 rounded-lg border border-transparent hover:border-dashed hover:border-slate-300 hover:bg-white/60 focus-within:border-dashed focus-within:border-blue-400 focus-within:bg-white/80 transition-all no-drag ${
          isDragging ? 'opacity-90 scale-[1.02] z-50' : ''
        }`}
      >
        {/* Drag Handle */}
        <div
          onPointerDown={(e) => onDragStart?.(e, project)}
          title="Metni Taşı"
          className="p-1 mt-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 opacity-0 group-hover/text:opacity-100 focus-within:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shrink-0"
        >
          <Move size={13} />
        </div>

        {/* Single-Font Auto-Resizing Textarea */}
        <textarea
          ref={textInputRef}
          rows={1}
          autoFocus={!project.tldr}
          value={noteDraft}
          onChange={(e) => {
            setNoteDraft(e.target.value);
            onUpdateNote?.(project.id, e.target.value);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          placeholder="Metin yazın..."
          className="w-full font-sans text-base font-semibold text-slate-800 bg-transparent focus:outline-hidden resize-none leading-snug placeholder:text-slate-400 overflow-hidden select-text cursor-text"
        />

        {/* Delete Button */}
        <button
          type="button"
          title="Metni Sil"
          onClick={(e) => onDelete(project.id, e)}
          className="p-1 mt-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover/text:opacity-100 transition-opacity cursor-pointer shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={style}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('.no-drag')
        ) {
          return;
        }
        onDragStart?.(e, project);
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('.no-drag')
        ) {
          return;
        }
        e.stopPropagation();
        if (!activeTool || activeTool === 'pointer') {
          onOpen(project);
        }
      }}
      className={`
        absolute w-80 rounded-xl border-2 p-4 transition-shadow select-none
        ${activeTool === 'pointer' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
        sticky-shadow group
        ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}
        ${isDragging ? 'shadow-2xl scale-[1.02] rotate-1 z-50 ring-4 ring-blue-400/40 opacity-95' : 'hover:scale-[1.01] hover:z-20'}
        ${project.pinned ? 'ring-2 ring-amber-400/70' : ''}
      `}
    >
      {/* Tape Accent */}
      <div className="washi-tape" />

      {/* Header bar: Type/Category & Actions */}
      <div className="flex items-center justify-between gap-1 mb-2 pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {itemType === 'notepad' && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1">
              <StickyNote size={11} />
              <span>Not / Hatırlatıcı</span>
            </span>
          )}

          {itemType === 'linkbox' && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-cyan-100 text-cyan-900 border-cyan-300 flex items-center gap-1">
              <Link2 size={11} />
              <span>Link Kutusu</span>
            </span>
          )}

          {/* Custom Category Pill (only shown if a category is assigned) */}
          {matchedCat && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${catStyle.badgeBg} ${catStyle.badgeText} ${catStyle.badgeBorder}`}
            >
              <span>{catStyle.emoji}</span>
              <span>{catStyle.label}</span>
            </span>
          )}

          {/* Status Pill (only for project) */}
          {itemType === 'project' && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusConfig.badgeBg}`}>
              <span className="mr-1">{statusConfig.emoji}</span>
              <span>{statusConfig.label}</span>
            </span>
          )}
        </div>

        {/* Pin & Delete Actions */}
        <div className="flex items-center gap-1">
          {onTogglePin && (
            <button
              type="button"
              title={project.pinned ? 'Sabitlemeyi kaldır' : 'Kartı buraya sabitle'}
              onClick={(e) => onTogglePin(project.id, e)}
              className={`p-1 rounded-md text-xs hover:bg-black/10 transition-colors cursor-pointer ${
                project.pinned ? 'text-amber-600 font-bold' : 'text-slate-400 opacity-60 group-hover:opacity-100'
              }`}
            >
              <Pin size={14} className={project.pinned ? 'fill-amber-500' : ''} />
            </button>
          )}

          <button
            type="button"
            title="Sil"
            onClick={(e) => onDelete(project.id, e)}
            className="p-1 rounded-md text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Card Title */}
      <h3 className="font-bold text-base leading-snug tracking-tight mb-2 pr-1 text-slate-900 line-clamp-2">
        {project.title}
      </h3>

      {/* =========================================================
          TYPE 1: NOTEPAD / REMINDER CARD
         ========================================================= */}
      {itemType === 'notepad' && (
        <>
          <div className="bg-white/85 backdrop-blur-xs rounded-lg p-2.5 border border-black/10 shadow-xs mb-2.5 no-drag">
            <textarea
              rows={5}
              value={noteDraft}
              onChange={(e) => {
                setNoteDraft(e.target.value);
                onUpdateNote?.(project.id, e.target.value);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Notlarını veya hatırlatmalarını buraya yaz..."
              className="w-full text-xs leading-relaxed text-slate-800 bg-transparent focus:outline-hidden resize-y font-medium placeholder:text-slate-400 select-text cursor-text"
            />
          </div>

          {/* Optional To-Do / Reminder Checklist inside Notepad */}
          <div className="bg-white/75 rounded-lg p-2.5 border border-black/5 text-[11px] text-slate-700 no-drag">
            <div className="flex items-center justify-between font-bold mb-1.5 text-slate-700">
              <span className="flex items-center gap-1">
                <span>⏰</span>
                <span>Hatırlatmalar / Maddeler</span>
              </span>
              {todos.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-slate-600 bg-black/5 px-1.5 py-0.2 rounded-full">
                  {doneTodosCount}/{todos.length}
                </span>
              )}
            </div>

            {todos.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5 mb-2">
                {todos.map((todo) => {
                  const isDone = todo.status === 'done';
                  return (
                    <div
                      key={todo.id}
                      className="flex items-start justify-between gap-1.5 group/todo py-0.5 px-1 rounded-md hover:bg-black/5 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTodo?.(project.id, todo.id);
                        }}
                        className="flex items-start gap-1.5 text-left flex-1 cursor-pointer"
                      >
                        {isDone ? (
                          <CheckSquare size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square size={13} className="text-slate-400 hover:text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-[11px] leading-snug break-words ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                          }`}
                        >
                          {todo.title}
                        </span>
                      </button>

                      {onDeleteTodo && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTodo(project.id, todo.id);
                          }}
                          title="Sil"
                          className="opacity-0 group-hover/todo:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 transition-opacity cursor-pointer shrink-0"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {onAddTodo && (
              <form onSubmit={handleTodoSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="+ Hatırlatma maddesi ekle..."
                  className="flex-1 text-[11px] bg-white/90 border border-black/10 rounded-md px-2 py-1 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                {newTodoText.trim() && (
                  <button
                    type="submit"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer shrink-0"
                    title="Ekle"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </form>
            )}
          </div>
        </>
      )}

      {/* =========================================================
          TYPE 2: LINK BOX CARD (Title + Unlimited Links)
         ========================================================= */}
      {itemType === 'linkbox' && (
        <div className="bg-white/85 backdrop-blur-xs rounded-lg p-2.5 border border-black/10 shadow-xs no-drag space-y-2">
          {links.length === 0 ? (
            <div className="text-center py-3 text-xs text-slate-400 italic">
              Henüz link eklenmedi. Aşağıdan ekleyebilirsin.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {links.map((lnk, idx) => {
                const linkKey = lnk.id || `lnk-${idx}`;
                return (
                  <div
                    key={linkKey}
                    className="group/link flex items-center justify-between gap-2 bg-white hover:bg-cyan-50/70 px-2.5 py-1.5 rounded-lg border border-slate-200/80 hover:border-cyan-300 transition-all"
                  >
                    <a
                      href={lnk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left group/anchor"
                    >
                      <span className="p-1 rounded-md bg-cyan-100/80 text-cyan-700 shrink-0">
                        <Link2 size={12} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 group-hover/anchor:text-cyan-700 truncate flex items-center gap-1">
                          <span className="truncate">{lnk.title || lnk.url}</span>
                          <ExternalLink size={10} className="shrink-0 opacity-60 group-hover/anchor:opacity-100" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {lnk.url.replace(/^https?:\/\//i, '')}
                        </div>
                      </div>
                    </a>

                    {onDeleteLink && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLink(project.id, lnk.id || String(idx));
                        }}
                        title="Linki Kaldır"
                        className="opacity-0 group-hover/link:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity cursor-pointer shrink-0"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Inline Add Link Form */}
          {onAddLink && (
            <div className="pt-1.5 border-t border-slate-200/70">
              {!isAddingLink ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingLink(true);
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-cyan-100/70 text-slate-700 hover:text-cyan-900 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  <span>+ Yeni Link Ekle</span>
                </button>
              ) : (
                <form onSubmit={handleLinkSubmit} className="space-y-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    autoFocus
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Başlık (Örn: GitHub Repo)"
                    className="w-full text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="URL (https://...)"
                    className="w-full text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-mono placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-500"
                  />
                  <div className="flex items-center justify-end gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingLink(false);
                      }}
                      className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 text-[10px] font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded cursor-pointer"
                    >
                      Link Ekle
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TYPE 3: STANDARD PROJECT / ACTIVITY CARD
         ========================================================= */}
      {itemType === 'project' && (
        <>
          {/* TLDR Strip */}
          <div className="bg-white/80 backdrop-blur-xs rounded-lg p-2.5 border border-black/5 shadow-xs mb-2.5">
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              <span className="text-amber-500">⚡</span>
              <span>ÖZET (TLDR)</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-800 line-clamp-3 selectable-text font-normal">
              {project.tldr}
            </p>
          </div>

          {/* Tags row */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {project.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${colorConfig.tagBg}`}
                >
                  #{tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-[10px] text-slate-500 self-center">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Interactive To-Do List Section under the activity/project */}
          <div className="mb-2.5 bg-white/75 rounded-lg p-2.5 border border-black/5 text-[11px] text-slate-700 no-drag">
            <div className="flex items-center justify-between font-bold mb-1.5 text-slate-700">
              <span className="flex items-center gap-1">
                <span>✅</span>
                <span>Yapılacaklar (To-Do)</span>
              </span>
              {todos.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-slate-600 bg-black/5 px-1.5 py-0.2 rounded-full">
                  {doneTodosCount}/{todos.length} (%{todoProgressPct})
                </span>
              )}
            </div>

            {todos.length > 0 && (
              <>
                <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden mb-2">
                  <div
                    style={{ width: `${todoProgressPct}%` }}
                    className="h-full bg-emerald-500 transition-all duration-300"
                  />
                </div>

                <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5 mb-2">
                  {todos.map((todo) => {
                    const isDone = todo.status === 'done';
                    return (
                      <div
                        key={todo.id}
                        className="flex items-start justify-between gap-1.5 group/todo py-0.5 px-1 rounded-md hover:bg-black/5 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTodo?.(project.id, todo.id);
                          }}
                          className="flex items-start gap-1.5 text-left flex-1 cursor-pointer"
                        >
                          {isDone ? (
                            <CheckSquare size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square size={13} className="text-slate-400 hover:text-blue-600 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-[11px] leading-snug break-words ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                            }`}
                          >
                            {todo.title}
                          </span>
                        </button>

                        {onDeleteTodo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTodo(project.id, todo.id);
                            }}
                            title="Sil"
                            className="opacity-0 group-hover/todo:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 transition-opacity cursor-pointer shrink-0"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Quick Add Todo Input */}
            {onAddTodo && (
              <form onSubmit={handleTodoSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="+ Yapılacak ekle..."
                  className="flex-1 text-[11px] bg-white/90 border border-black/10 rounded-md px-2 py-1 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                {newTodoText.trim() && (
                  <button
                    type="submit"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer shrink-0"
                    title="Ekle"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </form>
            )}
          </div>

          {/* Latest Update Banner */}
          <div className="pt-2 border-t border-black/10 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-1 font-medium">
                <Clock size={12} className="text-slate-400" />
                <span>
                  {latestUpdate ? formatTimeAgo(latestUpdate.timestamp) : 'Henüz güncelleme yok'}
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-black/5 px-1.5 py-0.5 rounded-full">
                {project.updates?.length || 0} güncelleme
              </span>
            </div>

            {latestUpdate && (
              <div className="text-[11px] text-slate-700 bg-white/50 rounded-md p-1.5 line-clamp-2 italic border border-black/5">
                <span className="mr-1">{UPDATE_TYPE_CONFIG[latestUpdate.type]?.emoji || '📝'}</span>
                <span>"{latestUpdate.content}"</span>
              </div>
            )}

            {/* Hover action footer */}
            <div className="flex items-center justify-between pt-1 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickUpdate(project);
                }}
                className="text-[11px] font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <MessageSquarePlus size={13} />
                <span>+ Güncelleme</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(project);
                }}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <span>Detaylar</span>
                <ExternalLink size={11} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
