import React, { useState } from 'react';
import type { Project } from '../../types';
import { CARD_COLORS, CLASSIFICATION_CONFIG, STATUS_CONFIG, UPDATE_TYPE_CONFIG, formatTimeAgo } from '../../utils/colors';
import { MessageSquarePlus, ChevronDown, ChevronUp, Trash2, ArrowUpDown, Clock } from 'lucide-react';

interface ListViewProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onQuickUpdate: (project: Project) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  projects,
  onOpenProject,
  onQuickUpdate,
  onDeleteProject,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'updates'>('updated');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const sortedProjects = [...projects].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'updated') {
      comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else if (sortBy === 'created') {
      comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === 'updates') {
      comparison = (b.updates?.length || 0) - (a.updates?.length || 0);
    }
    return sortAsc ? -comparison : comparison;
  });

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Controls Bar */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">
            Showing {projects.length} project{projects.length === 1 ? '' : 's'}
          </span>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="updated">Recently Updated</option>
              <option value="created">Date Created</option>
              <option value="title">Title (Alphabetical)</option>
              <option value="updates">Most Updates</option>
            </select>

            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              title="Toggle sort direction"
              className="p-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
            >
              <ArrowUpDown size={14} />
            </button>
          </div>
        </div>

        {/* Project Feed */}
        <div className="space-y-3">
          {sortedProjects.map((project) => {
            const colorConfig = CARD_COLORS[project.color] || CARD_COLORS.yellow;
            const classConfig = CLASSIFICATION_CONFIG[project.classification];
            const statusConfig = STATUS_CONFIG[project.status];
            const isExpanded = expandedId === project.id;
            const latestUpdate = project.updates && project.updates.length > 0
              ? project.updates[project.updates.length - 1]
              : null;

            return (
              <div
                key={project.id}
                className={`bg-white rounded-xl border border-slate-200 border-l-4 ${colorConfig.border} shadow-xs hover:border-slate-300 transition-all overflow-hidden`}
              >
                {/* Main Row */}
                <div
                  onClick={() => onOpenProject(project)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                >
                  {/* Left: Classification, Title & TLDR */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${classConfig.badgeBg} ${classConfig.badgeText} ${classConfig.badgeBorder}`}
                      >
                        <span>{classConfig.emoji}</span>
                        <span>{classConfig.label}</span>
                      </span>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.badgeBg}`}>
                        <span>{statusConfig.emoji}</span> {statusConfig.label}
                      </span>

                      {project.tags?.map((t, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <h4 className="font-bold text-base text-slate-900 leading-snug">
                      {project.title}
                    </h4>

                    {/* TLDR callout */}
                    <div className="text-xs text-slate-700 bg-amber-50/60 border border-amber-200/80 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5 max-w-3xl">
                      <span className="text-amber-500 font-bold shrink-0">⚡ TLDR:</span>
                      <span className="leading-relaxed">{project.tldr}</span>
                    </div>
                  </div>

                  {/* Right: Update metrics & actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1 justify-end">
                        <Clock size={12} className="text-slate-400" />
                        <span>{latestUpdate ? formatTimeAgo(latestUpdate.timestamp) : 'No updates'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {project.updates?.length || 0} updates logged
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickUpdate(project);
                        }}
                        title="Add update"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <MessageSquarePlus size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => toggleExpand(project.id, e)}
                        title="Expand updates feed"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => onDeleteProject(project.id, e)}
                        title="Delete project"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Updates Timeline Drawer */}
                {isExpanded && (
                  <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Updates Timeline ({project.updates?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuickUpdate(project)}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        + Add New Update
                      </button>
                    </div>

                    {project.updates && project.updates.length > 0 ? (
                      <div className="space-y-2">
                        {[...project.updates].reverse().map((u) => {
                          const uConf = UPDATE_TYPE_CONFIG[u.type] || UPDATE_TYPE_CONFIG.log;
                          return (
                            <div
                              key={u.id}
                              className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-start gap-2 shadow-2xs"
                            >
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${uConf.badgeBg} ${uConf.border}`}>
                                {uConf.emoji} {uConf.label}
                              </span>
                              <div className="flex-1">
                                <p className="text-slate-800 selectable-text">{u.content}</p>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(u.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No updates logged yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {sortedProjects.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
              No projects found matching the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
