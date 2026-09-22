import React, { useRef } from 'react';
import type { BacklogData } from '../../types';
import { exportBacklog, importBacklog } from '../../services/storage';
import { X, Download, Upload, RefreshCw, Database, BarChart3, Flame } from 'lucide-react';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  backlogData: BacklogData;
  storageSource: 'file' | 'localStorage' | 'seed';
  onDataReplaced: (data: BacklogData) => void;
  onResetSeed: () => void;
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({
  isOpen,
  onClose,
  backlogData,
  storageSource,
  onDataReplaced,
  onResetSeed,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const projects = backlogData.projects || [];
  const totalProjects = projects.length;

  // Classification stats
  const creativeCount = projects.filter((p) => p.classification === 'creative').length;
  const techCount = projects.filter((p) => p.classification === 'tech').length;
  const hybridCount = projects.filter((p) => p.classification === 'hybrid').length;

  const creativePct = totalProjects > 0 ? Math.round((creativeCount / totalProjects) * 100) : 0;
  const techPct = totalProjects > 0 ? Math.round((techCount / totalProjects) * 100) : 0;
  const hybridPct = totalProjects > 0 ? 100 - creativePct - techPct : 0;

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
      alert('Backlog successfully imported!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(`Failed to import backlog: ${err.message}`);
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
            <h3 className="font-bold text-slate-800 text-base">Whiteboard Insights</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Storage Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <Database size={20} className="text-emerald-600 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>Local Storage Active</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-slate-500 mt-0.5">
                {storageSource === 'file'
                  ? 'Auto-saving changes to ./data/backlog.json on disk'
                  : 'Cached in browser local storage'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Total Ideas
              </span>
              <span className="text-2xl font-black text-amber-950 mt-1 block">
                {totalProjects}
              </span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                Logged Updates
              </span>
              <span className="text-2xl font-black text-blue-950 mt-1 block">
                {totalUpdates}
              </span>
            </div>
          </div>

          {/* Creative vs Tech Ratio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">
                Creative vs. Tech Split
              </span>
              <span className="text-slate-500 font-medium">
                {creativeCount} Creative • {techCount} Tech • {hybridCount} Hybrid
              </span>
            </div>

            {/* Split Visual Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden bg-slate-200 flex">
              <div
                style={{ width: `${creativePct}%` }}
                className="bg-pink-500 transition-all"
                title={`Creative: ${creativeCount} (${creativePct}%)`}
              />
              <div
                style={{ width: `${techPct}%` }}
                className="bg-blue-500 transition-all"
                title={`Tech: ${techCount} (${techPct}%)`}
              />
              <div
                style={{ width: `${hybridPct}%` }}
                className="bg-purple-500 transition-all"
                title={`Hybrid: ${hybridCount} (${hybridPct}%)`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1 font-semibold text-pink-700">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                Creative ({creativePct}%)
              </span>
              <span className="flex items-center gap-1 font-semibold text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Tech ({techPct}%)
              </span>
              <span className="flex items-center gap-1 font-semibold text-purple-700">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Hybrid ({hybridPct}%)
              </span>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Workflow Status Breakdown
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>💡 Sparks:</span>
                <span className="font-bold text-slate-800">{sparkCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>🚧 In Flight:</span>
                <span className="font-bold text-slate-800">{inFlightCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>🧊 On Ice:</span>
                <span className="font-bold text-slate-800">{pausedCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>🚀 Shipped:</span>
                <span className="font-bold text-emerald-700">{shippedCount}</span>
              </div>
            </div>
          </div>

          {/* Most Active Spotlight */}
          {mostActive && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Flame size={14} className="text-amber-600" />
                <span>Most Active Idea</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{mostActive.title}</p>
              <p className="text-xs text-slate-600 italic line-clamp-1">"{mostActive.tldr}"</p>
              <span className="text-[11px] text-amber-800 font-semibold block mt-1">
                {mostActive.updates?.length || 0} updates logged
              </span>
            </div>
          )}

          {/* Backup & Data Actions */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Backup & Portability
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="py-2 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <Upload size={14} />
                <span>Import JSON</span>
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
                if (confirm('Reset all projects back to default sample ideas?')) {
                  onResetSeed();
                  onClose();
                }
              }}
              className="w-full py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Restore Default Starter Ideas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
