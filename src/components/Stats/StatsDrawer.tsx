import React, { useRef } from 'react';
import type { BacklogData, Category } from '../../types';
import { exportBacklog, importBacklog } from '../../services/storage';
import { getCategoryStyle } from '../../utils/colors';
import { X, Download, Upload, RefreshCw, Database, BarChart3, Flame, FolderPlus } from 'lucide-react';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  backlogData: BacklogData;
  categories: Category[];
  storageSource: 'file' | 'localStorage' | 'seed';
  onDataReplaced: (data: BacklogData) => void;
  onResetSeed: () => void;
  onOpenCategoryManage?: () => void;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  isOpen,
  onClose,
  backlogData,
  categories = [],
  storageSource,
  onDataReplaced,
  onResetSeed,
  onOpenCategoryManage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const projects = backlogData.projects || [];
  const totalProjects = projects.length;

  // Dynamic Category Breakdown based on user's custom categories
  const categoryStats = categories.map((cat) => {
    const count = projects.filter(
      (p) => (p.categoryId || p.classification) === cat.id || (p.categoryId || p.classification) === cat.name
    ).length;
    const pct = totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0;
    const style = getCategoryStyle(cat);
    return {
      id: cat.id,
      name: cat.name,
      emoji: cat.emoji || '📁',
      count,
      pct,
      dotColor: style.dot,
      textClass: style.badgeText,
      bgClass: style.badgeBg,
    };
  });

  const matchedIds = new Set(categories.flatMap((c) => [c.id, c.name]));
  const uncategorizedCount = projects.filter(
    (p) => !matchedIds.has(p.categoryId || p.classification || '')
  ).length;
  const uncategorizedPct = totalProjects > 0 ? Math.round((uncategorizedCount / totalProjects) * 100) : 0;

  // Status stats
  const sparkCount = projects.filter((p) => p.status === 'spark').length;
  const inFlightCount = projects.filter((p) => p.status === 'in-progress').length;
  const pausedCount = projects.filter((p) => p.status === 'paused').length;
  const shippedCount = projects.filter((p) => p.status === 'shipped').length;

  // Total updates
  const totalUpdates = projects.reduce((acc, p) => acc + (p.updates?.length || 0), 0);

  // Most active project
  const mostActive = [...projects].sort(
    (a, b) => (b.updates?.length || 0) - (a.updates?.length || 0)
  )[0];

  const handleExport = () => {
    exportBacklog(backlogData);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importBacklog(file);
      onDataReplaced(imported);
      alert('Pano verileri başarıyla içe aktarıldı!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(`İçe aktarma başarısız: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <BarChart3 size={18} />
            </span>
            <h3 className="font-bold text-slate-800 text-base">Pano Analizi & İstatistikler</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* App Cover / Storage Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <img
              src="./icon.png"
              alt="Beyaz Tahta"
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <Database size={18} className="text-emerald-600 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>Yerel Depolama Aktif</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-slate-500 mt-0.5">
                {storageSource === 'file'
                  ? 'Değişiklikler ./data/backlog.json dosyasına otomatik kaydediliyor'
                  : 'Tarayıcı yerel belleğine otomatik kaydediliyor'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                TOPLAM FİKİR
              </span>
              <span className="text-2xl font-black text-amber-950 mt-1 block">
                {totalProjects}
              </span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                KAYITLI GÜNCELLEME
              </span>
              <span className="text-2xl font-black text-blue-950 mt-1 block">
                {totalUpdates}
              </span>
            </div>
          </div>

          {/* Dynamic Custom Category Split */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">
                Kategori Dağılımı
              </span>
              {onOpenCategoryManage && (
                <button
                  type="button"
                  onClick={onOpenCategoryManage}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus size={12} />
                  <span>Kategorileri Yönet</span>
                </button>
              )}
            </div>

            {/* Dynamic Multi-Segment Visual Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden bg-slate-200 flex">
              {categoryStats.map((stat) =>
                stat.count > 0 ? (
                  <div
                    key={stat.id}
                    style={{ width: `${stat.pct}%`, backgroundColor: stat.dotColor }}
                    className="transition-all"
                    title={`${stat.name}: ${stat.count} (${stat.pct}%)`}
                  />
                ) : null
              )}
              {uncategorizedCount > 0 && (
                <div
                  style={{ width: `${uncategorizedPct}%`, backgroundColor: '#94a3b8' }}
                  className="transition-all"
                  title={`Diğer / Kategorisiz: ${uncategorizedCount} (${uncategorizedPct}%)`}
                />
              )}
            </div>

            {/* Category Breakdown List */}
            <div className="space-y-1.5 pt-1">
              {categoryStats.map((stat) => (
                <div
                  key={stat.id}
                  className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80"
                >
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: stat.dotColor }}
                    />
                    <span>{stat.emoji}</span>
                    <span>{stat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-slate-900">{stat.count} fikir</span>
                    <span className="text-[11px] text-slate-500">(%{stat.pct})</span>
                  </div>
                </div>
              ))}

              {uncategorizedCount > 0 && (
                <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80">
                  <div className="flex items-center gap-2 font-semibold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                    <span>📁</span>
                    <span>Diğer / Kategorisiz</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-slate-700">{uncategorizedCount} fikir</span>
                    <span className="text-[11px] text-slate-500">(%{uncategorizedPct})</span>
                  </div>
                </div>
              )}

              {categories.length === 0 && uncategorizedCount === 0 && (
                <p className="text-xs text-slate-400 italic">Henüz kategori veya fikir bulunmuyor.</p>
              )}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              İş Akışı Durum Dağılımı
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>💡 Fikir / Kıvılcım:</span>
                <span className="font-bold text-slate-800">{sparkCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>🚧 Geliştiriliyor:</span>
                <span className="font-bold text-slate-800">{inFlightCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>🧊 Askıda:</span>
                <span className="font-bold text-slate-800">{pausedCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>🚀 Tamamlandı:</span>
                <span className="font-bold text-emerald-700">{shippedCount}</span>
              </div>
            </div>
          </div>

          {/* Most Active Spotlight */}
          {mostActive && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Flame size={14} className="text-amber-600" />
                <span>En Aktif Fikir</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{mostActive.title}</p>
              <p className="text-xs text-slate-600 italic line-clamp-1">"{mostActive.tldr}"</p>
              <span className="text-[11px] text-amber-800 font-semibold block mt-1">
                {mostActive.updates?.length || 0} güncelleme kaydedildi
              </span>
            </div>
          )}

          {/* Backup & Data Actions */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Yedekleme & Veri İşlemleri
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="py-2 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <Download size={14} />
                <span>JSON Dışa Aktar</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <Upload size={14} />
                <span>JSON İçe Aktar</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                onResetSeed();
                onClose();
              }}
              className="w-full py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Varsayılan Başlangıç Verilerini Geri Yükle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
