import React, { useState } from 'react';
import type { Project, Category } from '../../types';
import { CARD_COLORS, STATUS_CONFIG, UPDATE_TYPE_CONFIG, getCategoryStyle, formatTimeAgo } from '../../utils/colors';
import { MessageSquarePlus, ChevronDown, ChevronUp, Trash2, ArrowUpDown, Clock } from 'lucide-react';

interface ListViewProps {
  projects: Project[];
  categories?: Category[];
  onOpenProject: (project: Project) => void;
  onQuickUpdate: (project: Project) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  projects,
  categories = [],
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
      comparison = a.title.localeCompare(b.title, 'tr');
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
            Toplam {projects.length} fikir listeleniyor
          </span>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="updated">Son Güncellenen</option>
              <option value="created">Oluşturulma Tarihi</option>
              <option value="title">Başlık (A-Z)</option>
              <option value="updates">En Çok Güncelleme Alan</option>
            </select>

            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              title="Sıralama yönünü değiştir"
              className="p-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <ArrowUpDown size={14} />
            </button>
          </div>
        </div>

        {/* Project Feed */}
        <div className="space-y-3">
          {sortedProjects.map((project) => {
            const colorConfig = CARD_COLORS[project.color] || CARD_COLORS.yellow;
            const catId = project.categoryId || project.classification;
            const matchedCat = categories.find((c) => c.id === catId || c.name === catId);
            const catStyle = getCategoryStyle(matchedCat, project.classification);
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.spark;
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
                  {/* Left: Category, Title & TLDR */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {matchedCat && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${catStyle.badgeBg} ${catStyle.badgeText} ${catStyle.badgeBorder}`}
                        >
                          <span>{catStyle.emoji}</span>
                          <span>{catStyle.label}</span>
                        </span>
                      )}

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
                      <span className="text-amber-500 font-bold shrink-0">⚡ ÖZET:</span>
                      <span className="leading-relaxed">{project.tldr}</span>
                    </div>
                  </div>

                  {/* Right: Update metrics & actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1 justify-end">
                        <Clock size={12} className="text-slate-400" />
                        <span>{latestUpdate ? formatTimeAgo(latestUpdate.timestamp) : 'Güncelleme yok'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {project.updates?.length || 0} güncelleme
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickUpdate(project);
                        }}
                        title="Hızlı güncelleme ekle"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <MessageSquarePlus size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => toggleExpand(project.id, e)}
                        title="Güncellemeleri genişlet/daralt"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => onDeleteProject(project.id, e)}
                        title="Fikri sil"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Updates Drawer */}
                {isExpanded && (
                  <div className="bg-slate-50/80 border-t border-slate-100 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Güncelleme Geçmişi ({project.updates?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuickUpdate(project)}
                        className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquarePlus size={13} />
                        <span>+ Yeni Güncelleme</span>
                      </button>
                    </div>

                    {project.updates && project.updates.length > 0 ? (
                      <div className="space-y-2">
                        {[...project.updates].reverse().map((upd) => {
                          const conf = UPDATE_TYPE_CONFIG[upd.type] || UPDATE_TYPE_CONFIG.log;
                          return (
                            <div
                              key={upd.id}
                              className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs flex items-start gap-2.5"
                            >
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${conf.badgeBg} ${conf.border}`}
                              >
                                {conf.emoji} {conf.label}
                              </span>
                              <p className="flex-1 text-slate-700 leading-relaxed">{upd.content}</p>
                              <span className="text-[11px] text-slate-400 shrink-0">
                                {formatTimeAgo(upd.timestamp)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Bu fikir için henüz güncelleme girilmemiş.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {sortedProjects.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
              Filtrelere uygun fikir bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
