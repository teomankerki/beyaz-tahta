import React from 'react';
import type { Classification, ViewMode, ProjectStatus } from '../../types';
import { Search, Plus, BarChart3, LayoutGrid, Kanban, List } from 'lucide-react';

interface NavbarProps {
  selectedClassification: Classification | 'all';
  onSelectClassification: (cls: Classification | 'all') => void;
  classificationCounts: { all: number; creative: number; tech: number; hybrid: number };
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: ProjectStatus | 'all';
  onSelectStatus: (st: ProjectStatus | 'all') => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenNewProject: () => void;
  onOpenStats: () => void;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedClassification,
  onSelectClassification,
  classificationCounts,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onSelectStatus,
  viewMode,
  onViewModeChange,
  onOpenNewProject,
  onOpenStats,
  isSaving,
}) => {
  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-3 shrink-0 z-30 shadow-2xs">
      {/* Brand & Save Indicator */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-amber-400 via-rose-400 to-indigo-500 flex items-center justify-center text-white shadow-xs">
            <span className="text-base font-black">⚡</span>
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-slate-900 leading-none">
              TLDR Whiteboard
            </h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
              {isSaving ? 'SAVING...' : 'SAVED TO DISK'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Classification Filter Tabs */}
      <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => onSelectClassification('all')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedClassification === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>All Ideas</span>
          <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full">
            {classificationCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectClassification('creative')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedClassification === 'creative'
              ? 'bg-pink-50 text-pink-700 shadow-xs ring-1 ring-pink-300'
              : 'text-slate-600 hover:text-pink-600'
          }`}
        >
          <span>🎨 Creative</span>
          <span className="text-[10px] bg-pink-100 text-pink-800 px-1.5 py-0.2 rounded-full">
            {classificationCounts.creative}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectClassification('tech')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedClassification === 'tech'
              ? 'bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-300'
              : 'text-slate-600 hover:text-blue-600'
          }`}
        >
          <span>💻 Tech</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
            {classificationCounts.tech}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectClassification('hybrid')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedClassification === 'hybrid'
              ? 'bg-purple-50 text-purple-700 shadow-xs ring-1 ring-purple-300'
              : 'text-slate-600 hover:text-purple-600'
          }`}
        >
          <span>⚡ Hybrid</span>
          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full">
            {classificationCounts.hybrid}
          </span>
        </button>
      </div>

      {/* Right Controls: Status Filter, Search, View Switcher, Actions */}
      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onSelectStatus(e.target.value as ProjectStatus | 'all')}
          className="hidden sm:block text-xs font-medium px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
        >
          <option value="all">All Statuses</option>
          <option value="spark">💡 Sparks</option>
          <option value="in-progress">🚧 In Flight</option>
          <option value="paused">🧊 On Ice</option>
          <option value="shipped">🚀 Shipped</option>
        </select>

        {/* Search */}
        <div className="relative w-36 sm:w-48">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search ideas..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 transition-all"
          />
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => onViewModeChange('whiteboard')}
            title="Whiteboard Canvas"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'whiteboard'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid size={15} />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('kanban')}
            title="Kanban Board"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Kanban size={15} />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title="List Feed"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List size={15} />
          </button>
        </div>

        {/* Insights Button */}
        <button
          type="button"
          onClick={onOpenStats}
          title="Whiteboard Stats & Data Export"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
        >
          <BarChart3 size={16} />
        </button>

        {/* New Idea Button */}
        <button
          type="button"
          onClick={onOpenNewProject}
          title="Add New Project/Idea (Shortcut: N)"
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">New Idea</span>
        </button>
      </div>
    </header>
  );
};
