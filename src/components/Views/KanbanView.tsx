import React from 'react';
import type { Project, ProjectStatus } from '../../types';
import { CARD_COLORS, CLASSIFICATION_CONFIG, formatTimeAgo } from '../../utils/colors';
import { Plus, MessageSquarePlus, Clock } from 'lucide-react';

interface KanbanViewProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onQuickUpdate: (project: Project) => void;
  onUpdateStatus: (id: string, newStatus: ProjectStatus) => void;
  onNewProjectInStatus: (status: ProjectStatus) => void;
}

const COLUMNS: { status: ProjectStatus; title: string; emoji: string; desc: string }[] = [
  { status: 'spark', title: 'Spark', emoji: '💡', desc: 'Raw ideas & brainstorms' },
  { status: 'in-progress', title: 'In Flight', emoji: '🚧', desc: 'Currently being built or researched' },
  { status: 'paused', title: 'On Ice', emoji: '🧊', desc: 'Backlog / Someday' },
  { status: 'shipped', title: 'Shipped', emoji: '🚀', desc: 'Completed or published' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  projects,
  onOpenProject,
  onQuickUpdate,
  onUpdateStatus,
  onNewProjectInStatus,
}) => {
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
                title={`Add idea to ${col.title}`}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {colProjects.map((project) => {
                const colorConfig = CARD_COLORS[project.color] || CARD_COLORS.yellow;
                const classConfig = CLASSIFICATION_CONFIG[project.classification];
                const latestUpdate = project.updates && project.updates.length > 0
                  ? project.updates[project.updates.length - 1]
                  : null;

                return (
                  <div
                    key={project.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', project.id);
                    }}
                    onClick={() => onOpenProject(project)}
                    className={`
                      p-3.5 rounded-xl border-2 transition-all cursor-pointer shadow-xs hover:shadow-md
                      ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}
                    `}
                  >
                    {/* Classification & Date */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${classConfig.badgeBg} ${classConfig.badgeText} ${classConfig.badgeBorder}`}
                      >
                        <span>{classConfig.emoji}</span>
                        <span>{classConfig.label}</span>
                      </span>

                      <span className="text-[10px] text-slate-400 font-medium">
                        {latestUpdate ? formatTimeAgo(latestUpdate.timestamp) : 'New'}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-sm text-slate-900 leading-snug mb-1.5">
                      {project.title}
                    </h4>

                    {/* TLDR */}
                    <div className="bg-white/80 rounded-md p-2 border border-black/5 text-xs text-slate-700 leading-relaxed mb-2.5">
                      <span className="text-amber-500 font-bold mr-1">⚡</span>
                      {project.tldr}
                    </div>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2.5">
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

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickUpdate(project);
                        }}
                        className="text-[11px] font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1"
                      >
                        <MessageSquarePlus size={12} />
                        <span>Update ({project.updates?.length || 0})</span>
                      </button>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={11} />
                        <span>{new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {colProjects.length === 0 && (
                <div className="h-32 flex flex-col items-center justify-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <span>No items in {col.title}</span>
                  <button
                    type="button"
                    onClick={() => onNewProjectInStatus(col.status)}
                    className="mt-1 text-blue-600 hover:underline font-medium"
                  >
                    + Add one
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
