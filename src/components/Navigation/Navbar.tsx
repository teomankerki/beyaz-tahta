import React from 'react';
import type { Category, ViewMode, ProjectStatus } from '../../types';
import { getCategoryStyle } from '../../utils/colors';
import { Search, Plus, BarChart3, LayoutGrid, Kanban, List, FolderPlus } from 'lucide-react';

interface NavbarProps {
  categories: Category[];
  selectedCategoryId: string | 'all';
  onSelectCategory: (id: string | 'all') => void;
  categoryCounts: Record<string, number>;
  onOpenCategoryManage: () => void;
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
  categories,
  selectedCategoryId,
  onSelectCategory,
  categoryCounts,
  onOpenCategoryManage,
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
        <div className="flex items-center gap-2.5">
          <img
            src="./icon.png"
            alt="Beyaz Tahta"
            className="w-9 h-9 rounded-xl object-cover shadow-xs border border-slate-200/80"
          />
          <div>
            <h1 className="font-black text-sm tracking-tight text-slate-900 leading-none">
              Beyaz Tahta
            </h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1.5 mt-0.5 select-none">
              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="inline-block w-28">{isSaving ? 'KAYDEDİLİYOR...' : 'DİSKE KAYDEDİLDİ'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Center: Dynamic Category Filter Tabs (User customizable) */}
      <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 max-w-2xl overflow-x-auto">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedCategoryId === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Tüm Fikirler</span>
          <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
            {categoryCounts.all || 0}
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const style = getCategoryStyle(cat);
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? `${style.badgeBg} ${style.badgeText} shadow-xs ring-1 ring-blue-400/40`
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{cat.emoji || '📁'}</span>
              <span>{cat.name}</span>
              <span className="text-[10px] bg-black/5 px-1.5 py-0.2 rounded-full font-mono">
                {count}
              </span>
            </button>
          );
        })}

        {/* Manage / Add Custom Category Button */}
        <button
          type="button"
          onClick={onOpenCategoryManage}
          title="Kategorileri Düzenle / Yeni Kategori Ekle"
          className="ml-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-white/80 transition-all cursor-pointer flex items-center gap-1 shrink-0"
        >
          <FolderPlus size={13} />
          <span>+ Kategori</span>
        </button>
      </div>

      {/* Right Controls: Status Filter, Search, View Switcher, Actions */}
      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onSelectStatus(e.target.value as ProjectStatus | 'all')}
          className="hidden sm:block text-xs font-medium px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden cursor-pointer"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="spark">💡 Fikir / Kıvılcım</option>
          <option value="in-progress">🚧 Geliştiriliyor</option>
          <option value="paused">🧊 Askıda / Beklemede</option>
          <option value="shipped">🚀 Tamamlandı</option>
        </select>

        {/* Search */}
        <div className="relative w-36 sm:w-48">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Fikirlerde ara..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 transition-all"
          />
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => onViewModeChange('whiteboard')}
            title="Beyaz Tahta (Pano Görünümü)"
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
            title="Kanban Panosu"
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
            title="Liste Akışı"
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
          title="Pano Analizi & Veriler"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
        >
          <BarChart3 size={16} />
        </button>

        {/* New Idea Button */}
        <button
          type="button"
          onClick={onOpenNewProject}
          title="Yeni Fikir Ekle (Kısayol: N)"
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Yeni Fikir</span>
        </button>
      </div>
    </header>
  );
};
