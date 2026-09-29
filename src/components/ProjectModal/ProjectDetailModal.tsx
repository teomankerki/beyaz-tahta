import React, { useState, useEffect } from 'react';
import type { Project, Category, ProjectStatus, CardColor, UpdateType, SubIdea, SubIdeaStatus, TableData } from '../../types';
import {
  CARD_COLORS,
  STATUS_CONFIG,
  UPDATE_TYPE_CONFIG,
  SUB_IDEA_STATUS_CONFIG,
  getCategoryStyle,
  formatTimeAgo,
} from '../../utils/colors';
import { ExcelTableWidget, DEFAULT_TABLE_DATA } from '../Whiteboard/ExcelTableWidget';
import { X, Send, Trash2, Plus, Tag, Check, FolderPlus, Table2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectDetailModalProps {
  project: Project | null;
  categories?: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
  onDelete: (id: string) => void;
  onOpenCategoryManage?: () => void;
  initialOpenToUpdates?: boolean;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  categories = [],
  isOpen,
  onClose,
  onSave,
  onDelete,
  onOpenCategoryManage,
}) => {
  const [title, setTitle] = useState(project?.title || '');
  const [tldr, setTldr] = useState(project?.tldr || '');
  const [description, setDescription] = useState(project?.description || '');
  const [categoryId, setCategoryId] = useState<string>(project?.categoryId || project?.classification || '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'spark');
  const [color, setColor] = useState<CardColor>(project?.color || 'yellow');
  const [tags, setTags] = useState<string[]>(project?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [updates, setUpdates] = useState(project?.updates || []);
  const [subIdeas, setSubIdeas] = useState<SubIdea[]>(project?.subIdeas || []);
  const [tableData, setTableData] = useState<TableData | undefined>(project?.tableData);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [newUpdateType, setNewUpdateType] = useState<UpdateType>('log');

  const [newSubIdeaTitle, setNewSubIdeaTitle] = useState('');
  const newSubIdeaStatus: SubIdeaStatus = 'spark';

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setTldr(project.tldr);
      setDescription(project.description || '');
      setCategoryId(project.categoryId ?? project.classification ?? '');
      setStatus(project.status);
      setColor(project.color);
      setTags(project.tags || []);
      setUpdates(project.updates || []);
      setSubIdeas(project.subIdeas || []);
      setTableData(project.tableData);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const matchedCat = categories.find((c) => c.id === categoryId || c.name === categoryId);
  const catStyle = getCategoryStyle(matchedCat, categoryId);

  const handleSave = () => {
    if (!title.trim()) return;
    const updated: Project = {
      ...project,
      title: title.trim(),
      tldr:
        project.itemType === 'table' && tableData
          ? `${tableData.rows.length} satır × ${tableData.headers.length} sütunlu tablo`
          : tldr.trim(),
      description: description.trim(),
      categoryId,
      classification: categoryId,
      status,
      color,
      tags,
      updates,
      subIdeas,
      tableData,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    setStatus(newStatus);
    if (newStatus === 'shipped' && project.status !== 'shipped') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      const newTags = [...tags, clean];
      setTags(newTags);
      setTagInput('');
      onSave({
        ...project,
        title,
        tldr,
        description,
        categoryId,
        classification: categoryId,
        status,
        color,
        tags: newTags,
        updates,
        subIdeas,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    onSave({
      ...project,
      title,
      tldr,
      description,
      categoryId,
      classification: categoryId,
      status,
      color,
      tags: newTags,
      updates,
      subIdeas,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateContent.trim()) return;

    const newUpdate = {
      id: `upd-${Date.now()}`,
      projectId: project.id,
      timestamp: new Date().toISOString(),
      content: newUpdateContent.trim(),
      type: newUpdateType,
    };

    if (newUpdateType === 'milestone') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    const updatedUpdates = [...updates, newUpdate];
    setUpdates(updatedUpdates);
    setNewUpdateContent('');

    const updatedProject: Project = {
      ...project,
      title,
      tldr,
      description,
      categoryId,
      classification: categoryId,
      status,
      color,
      tags,
      updates: updatedUpdates,
      subIdeas,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedProject);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDeleteUpdate = (updateId: string) => {
    const updatedUpdates = updates.filter((u) => u.id !== updateId);
    setUpdates(updatedUpdates);
    const updatedProject: Project = {
      ...project,
      title,
      tldr,
      description,
      categoryId,
      classification: categoryId,
      status,
      color,
      tags,
      updates: updatedUpdates,
      subIdeas,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedProject);
  };

  const handleAddSubIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubIdeaTitle.trim()) return;

    const newSub: SubIdea = {
      id: `sub-${Date.now()}`,
      projectId: project.id,
      title: newSubIdeaTitle.trim(),
      status: newSubIdeaStatus,
      createdAt: new Date().toISOString(),
    };

    const updatedSubIdeas = [...subIdeas, newSub];
    setSubIdeas(updatedSubIdeas);
    setNewSubIdeaTitle('');

    const updatedProject: Project = {
      ...project,
      title,
      tldr,
      description,
      categoryId,
      classification: categoryId,
      status,
      color,
      tags,
      updates,
      subIdeas: updatedSubIdeas,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedProject);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCycleSubIdeaStatus = (subId: string) => {
    const nextStatusMap: Record<SubIdeaStatus, SubIdeaStatus> = {
      spark: 'in-progress',
      'in-progress': 'done',
      done: 'spark',
    };

    const updatedSubIdeas = subIdeas.map((sub) => {
      if (sub.id === subId) {
        const nextStatus = nextStatusMap[sub.status];
        if (nextStatus === 'done') {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        }
        return { ...sub, status: nextStatus };
      }
      return sub;
    });

    setSubIdeas(updatedSubIdeas);

    const updatedProject: Project = {
      ...project,
      title,
      tldr,
      description,
      categoryId,
      classification: categoryId,
      status,
      color,
      tags,
      updates,
      subIdeas: updatedSubIdeas,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedProject);
  };

  const handleDeleteSubIdea = (subId: string) => {
    const updatedSubIdeas = subIdeas.filter((s) => s.id !== subId);
    setSubIdeas(updatedSubIdeas);
    const updatedProject: Project = {
      ...project,
      title,
      tldr,
      description,
      categoryId,
      classification: categoryId,
      status,
      color,
      tags,
      updates,
      subIdeas: updatedSubIdeas,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedProject);
  };

  const totalSubIdeas = subIdeas.length;
  const completedSubIdeas = subIdeas.filter((s) => s.status === 'done').length;
  const subIdeasProgressPct = totalSubIdeas > 0 ? Math.round((completedSubIdeas / totalSubIdeas) * 100) : 0;

  const colorOptions: CardColor[] = ['yellow', 'amber', 'emerald', 'cyan', 'violet', 'rose', 'slate'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xl">{matchedCat ? catStyle.emoji : '🚀'}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {matchedCat ? `${catStyle.label} • Proje & Fikir Detayları` : 'Proje & Fikir Detayları'}
            </span>
            {savedSuccess && (
              <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-in fade-in duration-150 flex items-center gap-1">
                <Check size={12} />
                <span>Kaydedildi</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onDelete(project.id);
                onClose();
              }}
              title="Projeyi Sil"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 size={17} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Proje / Fikir Başlığı
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Üretken Ambiyans Sentezleyici"
              className="w-full text-xl font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
            />
          </div>

          {/* TLDR Input or Table Editor */}
          {project.itemType === 'table' ? (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  <Table2 size={14} />
                  <span>Tablo (Excel) Düzenleyici</span>
                </div>
                <span className="text-[11px] text-emerald-700">
                  Değişiklikler otomatik kaydedilir
                </span>
              </div>
              <ExcelTableWidget
                tableData={tableData || DEFAULT_TABLE_DATA}
                title={title}
                onChange={(nextTable) => {
                  setTableData(nextTable);
                  onSave({
                    ...project,
                    title: title.trim() || project.title,
                    tldr: `${nextTable.rows.length} satır × ${nextTable.headers.length} sütunlu tablo`,
                    description,
                    categoryId,
                    classification: categoryId,
                    status,
                    color,
                    tags,
                    updates,
                    subIdeas,
                    tableData: nextTable,
                    updatedAt: new Date().toISOString(),
                  });
                }}
              />
            </div>
          ) : (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1 uppercase tracking-wider">
                <span>⚡</span>
                <span>TLDR (1-2 Cümle Özet)</span>
              </div>
              <textarea
                rows={2}
                value={tldr}
                onChange={(e) => setTldr(e.target.value)}
                placeholder="Projenin temel fikri ve amacı..."
                className="w-full text-sm font-medium bg-white/90 px-3 py-2 rounded-lg border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800 resize-none"
              />
            </div>
          )}

          {/* Category & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Custom Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Kategori (İsteğe Bağlı)
                </label>
                {onOpenCategoryManage && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManage}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus size={12} />
                    <span>+ Düzenle</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId('')}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    !categoryId
                      ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-400/40 shadow-xs font-bold'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span>Kategorisiz</span>
                </button>
                {categories.map((cat) => {
                  const style = getCategoryStyle(cat);
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(isSelected ? '' : cat.id)}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? `${style.badgeBg} ${style.badgeText} border-blue-500 ring-2 ring-blue-400/40 shadow-xs font-bold`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat.emoji || '📁'}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Mevcut Durum
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['spark', 'in-progress', 'paused', 'shipped'] as ProjectStatus[]).map((st) => {
                  const conf = STATUS_CONFIG[st];
                  const isSelected = status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                        isSelected
                          ? `${conf.badgeBg} border-blue-500 ring-2 ring-blue-400/30 shadow-xs`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{conf.emoji}</span>
                      <span>{conf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Color & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sticky Card Color Theme */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Kart Rengi
              </label>
              <div className="flex items-center gap-2">
                {colorOptions.map((c) => {
                  const conf = CARD_COLORS[c];
                  const isSelected = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      title={conf.name}
                      style={{ backgroundColor: conf.dotColor }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        isSelected ? 'ring-3 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Etiketler
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Etiket yazıp Enter'a bas..."
                    className="w-full text-xs pl-7 pr-2 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Deeper Description / Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Detaylı Notlar & Bağlam
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Teknik kararlar, ilham kaynakları, bağlantılar, mimari düşünceler..."
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* ----------------- TO-DO / YAPILACAKLAR LISTESI ----------------- */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>✅ Yapılacaklar (To-Do)</span>
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                  {completedSubIdeas} / {totalSubIdeas}
                </span>
              </div>
              {totalSubIdeas > 0 && (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  %{subIdeasProgressPct} Tamamlandı
                </span>
              )}
            </div>

            {totalSubIdeas > 0 && (
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${subIdeasProgressPct}%` }}
                  className="h-full bg-emerald-500 transition-all duration-300"
                />
              </div>
            )}

            {/* Add To-Do Form */}
            <form onSubmit={handleAddSubIdea} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubIdeaTitle}
                  onChange={(e) => setNewSubIdeaTitle(e.target.value)}
                  placeholder="Yeni yapılacak madde (To-Do) yazıp Enter'a basın..."
                  className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!newSubIdeaTitle.trim()}
                  className="px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>Todo Ekle</span>
                </button>
              </div>
            </form>

            {/* To-Do Items List */}
            <div className="space-y-2">
              {subIdeas.length > 0 ? (
                subIdeas.map((sub) => {
                  const conf = SUB_IDEA_STATUS_CONFIG[sub.status] || SUB_IDEA_STATUS_CONFIG.spark;
                  const isDone = sub.status === 'done';

                  return (
                    <div
                      key={sub.id}
                      className={`group/sub bg-white border rounded-xl p-3 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between gap-3 ${
                        isDone ? 'bg-slate-50/70 border-slate-200' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {
                            const nextSt: SubIdeaStatus = isDone ? 'spark' : 'done';
                            if (nextSt === 'done') {
                              confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
                            }
                            const updatedSubIdeas = subIdeas.map((s) =>
                              s.id === sub.id ? { ...s, status: nextSt } : s
                            );
                            setSubIdeas(updatedSubIdeas);
                            onSave({
                              ...project,
                              title,
                              tldr,
                              description,
                              categoryId,
                              classification: categoryId,
                              status,
                              color,
                              tags,
                              updates,
                              subIdeas: updatedSubIdeas,
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />

                        <button
                          type="button"
                          onClick={() => handleCycleSubIdeaStatus(sub.id)}
                          title="Durumu değiştir (Fikir -> Yapılıyor -> Tamamlandı)"
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shrink-0 ${conf.badgeBg} ${conf.border} ${conf.text}`}
                        >
                          <span>{conf.emoji}</span>
                          <span>{conf.label}</span>
                        </button>

                        <span
                          className={`text-xs font-medium text-slate-800 selectable-text ${
                            isDone ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {sub.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSubIdea(sub.id)}
                        title="Sil"
                        className="opacity-0 group-hover/sub:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Henüz yapılacak madde (To-Do) eklenmemiş.
                </div>
              )}
            </div>
          </div>

          {/* ----------------- UPDATES & LOGS SECTION ----------------- */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-800">
                📝 Güncellemeler & Loglar
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                {updates.length}
              </span>
            </div>

            <div>
              {/* Post New Update Box */}
              <form onSubmit={handleAddUpdate} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-500">Tür:</span>
                  {(['log', 'milestone', 'roadblock', 'idea'] as UpdateType[]).map((type) => {
                    const conf = UPDATE_TYPE_CONFIG[type];
                    const isSelected = newUpdateType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewUpdateType(type)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? `${conf.badgeBg} ${conf.border} ring-1 ring-blue-400 font-bold`
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{conf.emoji}</span>
                        <span>{conf.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={newUpdateContent}
                    onChange={(e) => setNewUpdateContent(e.target.value)}
                    placeholder={`Güncelleme veya not ekle (${UPDATE_TYPE_CONFIG[newUpdateType].label.toLowerCase()})...`}
                    className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAddUpdate(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newUpdateContent.trim()}
                    className="px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send size={13} />
                    <span>Paylaş</span>
                  </button>
                </div>
              </form>

              {/* Updates Timeline Feed */}
              <div className="space-y-3">
                {updates.length > 0 ? (
                  [...updates].reverse().map((upd) => {
                    const conf = UPDATE_TYPE_CONFIG[upd.type] || UPDATE_TYPE_CONFIG.log;
                    return (
                      <div
                        key={upd.id}
                        className="group/upd bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:border-slate-300 transition-colors flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${conf.badgeBg} ${conf.border}`}
                            >
                              <span>{conf.emoji}</span>
                              <span>{conf.label}</span>
                            </span>
                            <span
                              title={new Date(upd.timestamp).toLocaleString('tr-TR')}
                              className="text-[11px] font-medium text-slate-400"
                            >
                              {formatTimeAgo(upd.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 whitespace-pre-wrap selectable-text font-normal leading-relaxed">
                            {upd.content}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteUpdate(upd.id)}
                          title="Güncellemeyi sil"
                          className="opacity-0 group-hover/upd:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Henüz güncelleme yok.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              Oluşturulma: {new Date(project.createdAt).toLocaleDateString('tr-TR')}
            </span>
            {savedSuccess && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ Otomatik Kaydedildi
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
