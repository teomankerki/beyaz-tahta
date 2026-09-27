import React, { useState } from 'react';
import type { Project, ProjectStatus, Category } from '../../types';
import { CARD_COLORS, getCategoryStyle, formatTimeAgo } from '../../utils/colors';
import { Plus, MessageSquarePlus, Clock, CheckSquare, Square, X } from 'lucide-react';

interface KanbanViewProps {
  projects: Project[];
  categories?: Category[];
  onOpenProject: (project: Project) => void;
  onQuickUpdate: (project: Project) => void;
  onUpdateStatus: (id: string, newStatus: ProjectStatus) => void;
  onNewProjectInStatus: (status: ProjectStatus) => void;
  onToggleTodo?: (projectId: string, todoId: string) => void;
  onAddTodo?: (projectId: string, title: string) => void;
  onDeleteTodo?: (projectId: string, todoId: string) => void;
}

const COLUMNS: { status: ProjectStatus; title: string; emoji: string; desc: string }[] = [
  { status: 'spark', title: 'Fikir / Kıvılcım', emoji: '💡', desc: 'Ham fikirler ve beyin fırtınaları' },
  { status: 'in-progress', title: 'Geliştiriliyor', emoji: '🚧', desc: 'Şu anda üzerinde çalışılanlar' },
  { status: 'paused', title: 'Askıda / Beklemede', emoji: '🧊', desc: 'Daha sonra bakılacaklar' },
  { status: 'shipped', title: 'Tamamlandı', emoji: '🚀', desc: 'Bitirilen veya yayınlanan projeler' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  projects,
  categories = [],
  onOpenProject,
  onQuickUpdate,
  onUpdateStatus,
  onNewProjectInStatus,
  onToggleTodo,
  onAddTodo,
  onDeleteTodo,
}) => {
  const [newTodoInputs, setNewTodoInputs] = useState<Record<string, string>>({});

  return (
    <div className="w-full h-full overflow-x-auto overflow-y-hidden bg-slate-50 p-6 flex gap-6">
      {COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => p.status === col.status);

        return (
          <div
            key={col.status}
            className="w-88 shrink-0 flex flex-col bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-xs max-h-full"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const projId = e.dataTransfer.getData('text/plain');
              if (projId) {
                onUpdateStatus(projId, col.status);
              }
            }}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">{col.emoji}</span>
                  <h3 className="font-bold text-slate-800 text-sm">{col.title}</h3>
                  <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {colProjects.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{col.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => onNewProjectInStatus(col.status)}
                title={`${col.title} sütununa yeni fikir ekle`}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {colProjects.map((project) => {
                const colorConfig = CARD_COLORS[project.color] || CARD_COLORS.yellow;
                const catId = project.categoryId || project.classification;
                const matchedCat = categories.find((c) => c.id === catId || c.name === catId);
                const catStyle = getCategoryStyle(matchedCat, project.classification);
                const latestUpdate = project.updates && project.updates.length > 0
                  ? project.updates[project.updates.length - 1]
                  : null;
                const todos = project.subIdeas || [];
                const doneCount = todos.filter((s) => s.status === 'done').length;

                return (
                  <div
                    key={project.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', project.id);
                    }}
                    onDoubleClick={() => onOpenProject(project)}
                    className={`
                      p-3.5 rounded-xl border-2 transition-all cursor-pointer shadow-xs hover:shadow-md
                      ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}
                    `}
                  >
                    {/* Category & Date */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      {matchedCat ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${catStyle.badgeBg} ${catStyle.badgeText} ${catStyle.badgeBorder}`}
                        >
                          <span>{catStyle.emoji}</span>
                          <span>{catStyle.label}</span>
                        </span>
                      ) : (
                        <span />
                      )}

                      <span className="text-[10px] text-slate-400 font-medium">
                        {latestUpdate ? formatTimeAgo(latestUpdate.timestamp) : 'Yeni'}
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      onClick={() => onOpenProject(project)}
                      className="font-bold text-sm text-slate-900 leading-snug mb-1.5 hover:underline"
                    >
                      {project.title}
                    </h4>

                    {/* TLDR */}
                    <div className="bg-white/80 rounded-md p-2 border border-black/5 text-xs text-slate-700 leading-relaxed mb-2.5">
                      <span className="text-amber-500 font-bold mr-1">⚡</span>
                      {project.tldr}
                    </div>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${colorConfig.tagBg}`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Latest log preview */}
                    {latestUpdate && (
                      <div className="text-[11px] text-slate-600 italic bg-white/40 p-1.5 rounded-sm line-clamp-1 border border-black/5 mb-2">
                        "{latestUpdate.content}"
                      </div>
                    )}

                    {/* Interactive To-Do Checklist under card */}
                    <div
                      className="mb-2.5 bg-white/75 rounded-lg p-2 border border-black/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 mb-1.5">
                        <span className="flex items-center gap-1">
                          <span>✅ Yapılacaklar</span>
                          {todos.length > 0 && (
                            <span className="text-[9px] font-mono bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full">
                              {doneCount}/{todos.length}
                            </span>
                          )}
                        </span>
                      </div>

                      {todos.length > 0 && (
                        <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5 mb-1.5">
                          {todos.map((todo) => {
                            const isDone = todo.status === 'done';
                            return (
                              <div
                                key={todo.id}
                                className="group/todo flex items-start justify-between gap-1.5 text-[11px] bg-white/80 hover:bg-white px-1.5 py-1 rounded border border-black/5 transition-colors"
                              >
                                <button
                                  type="button"
                                  onClick={() => onToggleTodo?.(project.id, todo.id)}
                                  className="flex items-start gap-1.5 text-left flex-1 cursor-pointer"
                                >
                                  {isDone ? (
                                    <CheckSquare size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Square size={13} className="text-slate-400 hover:text-blue-600 shrink-0 mt-0.5" />
                                  )}
                                  <span
                                    className={`leading-tight break-words ${
                                      isDone ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                                    }`}
                                  >
                                    {todo.title}
                                  </span>
                                </button>
                                {onDeleteTodo && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteTodo(project.id, todo.id)}
                                    className="opacity-0 group-hover/todo:opacity-100 text-slate-300 hover:text-rose-500 p-0.5 transition-opacity cursor-pointer shrink-0"
                                    title="Sil"
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
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const val = (newTodoInputs[project.id] || '').trim();
                            if (!val) return;
                            onAddTodo(project.id, val);
                            setNewTodoInputs((prev) => ({ ...prev, [project.id]: '' }));
                          }}
                          className="flex items-center gap-1"
                        >
                          <input
                            type="text"
                            value={newTodoInputs[project.id] || ''}
                            onChange={(e) =>
                              setNewTodoInputs((prev) => ({ ...prev, [project.id]: e.target.value }))
                            }
                            placeholder="+ Yapılacak ekle..."
                            className="flex-1 text-[11px] bg-white/90 border border-slate-200/90 rounded px-2 py-1 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                          />
                          {(newTodoInputs[project.id] || '').trim() && (
                            <button
                              type="submit"
                              className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer shrink-0"
                            >
                              <Plus size={12} />
                            </button>
                          )}
                        </form>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickUpdate(project);
                        }}
                        className="text-[11px] font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquarePlus size={12} />
                        <span>Güncelleme ({project.updates?.length || 0})</span>
                      </button>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={11} />
                        <span>{formatTimeAgo(project.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {colProjects.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  Kartları buraya sürükle veya + ile ekle
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
