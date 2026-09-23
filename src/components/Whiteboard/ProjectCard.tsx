import React from 'react';
import type { Project } from '../../types';
import { CARD_COLORS, CLASSIFICATION_CONFIG, STATUS_CONFIG, UPDATE_TYPE_CONFIG, formatTimeAgo } from '../../utils/colors';
import { Pin, MessageSquarePlus, Clock, ExternalLink, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onQuickUpdate: (project: Project) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onTogglePin?: (id: string, e: React.MouseEvent) => void;
  isDragging?: boolean;
  onDragStart?: (e: React.PointerEvent, project: Project) => void;
  style?: React.CSSProperties;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpen,
  onQuickUpdate,
  onDelete,
  onTogglePin,
  isDragging,
  onDragStart,
  style,
}) => {
  const colorConfig = CARD_COLORS[project.color] || CARD_COLORS.yellow;
  const classConfig = CLASSIFICATION_CONFIG[project.classification] || CLASSIFICATION_CONFIG.tech;
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.spark;

  const latestUpdate = project.updates && project.updates.length > 0
    ? project.updates[project.updates.length - 1]
    : null;

  return (
    <div
      style={style}
      onPointerDown={(e) => {
        // Only trigger drag if clicking the card body, not buttons or links
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('.no-drag')) {
          return;
        }
        onDragStart?.(e, project);
      }}
      className={`
        absolute w-80 rounded-xl border-2 p-4 transition-shadow select-none cursor-grab active:cursor-grabbing
        sticky-shadow group
        ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}
        ${isDragging ? 'shadow-2xl scale-[1.02] rotate-1 z-50 ring-4 ring-blue-400/40 opacity-95' : 'hover:scale-[1.01] hover:z-20'}
        ${project.pinned ? 'ring-2 ring-amber-400/70' : ''}
      `}
    >
      {/* Tape Accent */}
      <div
        className={`washi-tape ${
          project.classification === 'creative' ? 'washi-tape-creative' : project.classification === 'tech' ? 'washi-tape-tech' : ''
        }`}
      />

      {/* Header bar: Classification & Status */}
      <div className="flex items-center justify-between gap-1 mb-2 pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Classification Pill */}
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${classConfig.badgeBg} ${classConfig.badgeText} ${classConfig.badgeBorder}`}
          >
            <span>{classConfig.emoji}</span>
            <span>{classConfig.label}</span>
          </span>

          {/* Status Pill */}
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusConfig.badgeBg}`}>
            <span className="mr-1">{statusConfig.emoji}</span>
            <span>{statusConfig.label}</span>
          </span>
        </div>

        {/* Pin & Quick Actions */}
        <div className="flex items-center gap-1">
          {onTogglePin && (
            <button
              type="button"
              title={project.pinned ? 'Unpin card' : 'Pin card in place'}
              onClick={(e) => onTogglePin(project.id, e)}
              className={`p-1 rounded-md text-xs hover:bg-black/10 transition-colors ${
                project.pinned ? 'text-amber-600 font-bold' : 'text-slate-400 opacity-60 group-hover:opacity-100'
              }`}
            >
              <Pin size={14} className={project.pinned ? 'fill-amber-500' : ''} />
            </button>
          )}

          <button
            type="button"
            title="Delete project"
            onClick={(e) => onDelete(project.id, e)}
            className="p-1 rounded-md text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Card Title */}
      <h3 className="font-bold text-base leading-snug tracking-tight mb-2 pr-1 text-slate-900 line-clamp-2">
        {project.title}
      </h3>

      {/* TLDR Strip */}
      <div className="bg-white/80 backdrop-blur-xs rounded-lg p-2.5 border border-black/5 shadow-xs mb-3">
        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
          <span className="text-amber-500">⚡</span>
          <span>TLDR</span>
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

      {/* Sub-Ideas Mini Progress */}
      {project.subIdeas && project.subIdeas.length > 0 && (
        <div className="mb-2.5 bg-white/70 rounded-lg p-2 border border-black/5 text-[11px] text-slate-700">
          <div className="flex items-center justify-between font-medium mb-1">
            <span className="flex items-center gap-1">
              <span>🧩</span>
              <span>Alt Fikirler ({project.subIdeas.filter((s) => s.status === 'done').length}/{project.subIdeas.length})</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-600">
              %{Math.round((project.subIdeas.filter((s) => s.status === 'done').length / project.subIdeas.length) * 100)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div
              style={{
                width: `${Math.round((project.subIdeas.filter((s) => s.status === 'done').length / project.subIdeas.length) * 100)}%`,
              }}
              className="h-full bg-emerald-500 transition-all duration-300"
            />
          </div>
        </div>
      )}

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
    </div>
  );
};
