import React, { useState, useEffect } from 'react';
import type { Project, Category, CardColor, ProjectStatus, BoardItemType, LinkItem, TableData } from '../../types';
import { CARD_COLORS, getCategoryStyle } from '../../utils/colors';
import { ExcelTableWidget, DEFAULT_TABLE_DATA } from '../Whiteboard/ExcelTableWidget';
import { X, Plus, FolderPlus, Rocket, StickyNote, Link2, Table2, Trash2 } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
  categories: Category[];
  initialCategoryId?: string;
  initialPosition?: { x: number; y: number };
  initialItemType?: BoardItemType;
  onOpenCategoryManage?: () => void;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  categories = [],
  initialCategoryId,
  initialPosition = { x: 300, y: 200 },
  initialItemType = 'project',
  onOpenCategoryManage,
}) => {
  const defaultCatId = initialCategoryId && initialCategoryId !== 'all'
    ? initialCategoryId
    : '';

  const [itemType, setItemType] = useState<BoardItemType>(initialItemType);
  const [title, setTitle] = useState('');
  const [tldr, setTldr] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>(defaultCatId);
  const [status, setStatus] = useState<ProjectStatus>('spark');
  const [color, setColor] = useState<CardColor>('yellow');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Links state for Link Box
  const [linkRows, setLinkRows] = useState<{ id: string; title: string; url: string }[]>([
    { id: 'row-1', title: '', url: '' },
  ]);

  // Table state for Excel-like Table
  const [tableData, setTableData] = useState<TableData>(DEFAULT_TABLE_DATA);

  useEffect(() => {
    if (isOpen) {
      const nextCat = initialCategoryId && initialCategoryId !== 'all'
        ? initialCategoryId
        : '';
      setItemType(initialItemType || 'project');
      setCategoryId(nextCat);
      setTitle('');
      setTldr('');
      setDescription('');
      setTags([]);
      setTagInput('');
      setColor(
        initialItemType === 'notepad'
          ? 'amber'
          : initialItemType === 'linkbox'
          ? 'cyan'
          : initialItemType === 'table'
          ? 'emerald'
          : 'yellow'
      );
      setLinkRows([{ id: `row-${Date.now()}`, title: '', url: '' }]);
      setTableData({
        headers: [...DEFAULT_TABLE_DATA.headers],
        rows: DEFAULT_TABLE_DATA.rows.map((r) => [...r]),
        showSummaryRow: false,
      });
    }
  }, [isOpen, initialCategoryId, initialItemType]);

  if (!isOpen) return null;

  const handleTypeSwitch = (nextType: BoardItemType) => {
    setItemType(nextType);
    if (nextType === 'notepad' && color === 'yellow') setColor('amber');
    if (nextType === 'linkbox' && (color === 'yellow' || color === 'amber')) setColor('cyan');
    if (nextType === 'table' && (color === 'yellow' || color === 'amber' || color === 'cyan')) setColor('emerald');
  };

  const handleAddLinkRow = () => {
    setLinkRows((prev) => [
      ...prev,
      { id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, title: '', url: '' },
    ]);
  };

  const handleUpdateLinkRow = (id: string, field: 'title' | 'url', value: string) => {
    setLinkRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleRemoveLinkRow = (id: string) => {
    setLinkRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (itemType === 'project' && !tldr.trim()) return;

    const validLinks: LinkItem[] =
      itemType === 'linkbox'
        ? linkRows
            .filter((r) => r.url.trim() || r.title.trim())
            .map((r, idx) => {
              const finalUrl = normalizeUrl(r.url.trim() || r.title.trim());
              return {
                id: `lnk-${Date.now()}-${idx}`,
                title: r.title.trim() || r.url.trim(),
                url: finalUrl,
              };
            })
        : [];

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      itemType,
      title: title.trim(),
      tldr:
        itemType === 'project'
          ? tldr.trim()
          : itemType === 'notepad'
          ? tldr.trim()
          : itemType === 'table'
          ? `${tableData.rows.length} satır × ${tableData.headers.length} sütunlu tablo`
          : description.trim() || `${validLinks.length} bağlantılı link kutusu`,
      description: description.trim(),
      categoryId,
      classification: categoryId,
      status,
      color,
      tags,
      position: initialPosition,
      updates: [],
      subIdeas: [],
      links: validLinks,
      tableData: itemType === 'table' ? tableData : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreate(newProject);
    onClose();
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const colorOptions: CardColor[] = ['yellow', 'amber', 'emerald', 'cyan', 'violet', 'rose', 'slate'];

  const isSubmitDisabled =
    !title.trim() || (itemType === 'project' && !tldr.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${itemType === 'table' ? 'max-w-2xl' : 'max-w-lg'} bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
              <Plus size={16} />
            </span>
            <h3 className="font-bold text-slate-800 text-base">
              {itemType === 'project' && 'Yeni Proje / Etkinlik Ekle'}
              {itemType === 'notepad' && 'Yeni Not Defteri / Hatırlatıcı Ekle'}
              {itemType === 'linkbox' && 'Yeni Link Kutusu Ekle'}
              {itemType === 'table' && 'Yeni Tablo (Excel) Ekle'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Item Type Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Eklenecek Öğe Türü
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleTypeSwitch('project')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  itemType === 'project'
                    ? 'bg-white text-blue-700 shadow-xs ring-1 ring-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Rocket size={13} />
                <span>Proje</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSwitch('notepad')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  itemType === 'notepad'
                    ? 'bg-white text-amber-700 shadow-xs ring-1 ring-amber-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <StickyNote size={13} />
                <span>Not</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSwitch('linkbox')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  itemType === 'linkbox'
                    ? 'bg-white text-cyan-700 shadow-xs ring-1 ring-cyan-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link2 size={13} />
                <span>Link Kutusu</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSwitch('table')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  itemType === 'table'
                    ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table2 size={13} />
                <span>Tablo (Excel)</span>
              </button>
            </div>
          </div>

          {/* Custom Category Selector */}
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
                  <span>+ Kategorileri Düzenle</span>
                </button>
              )}
            </div>

            {categories.length === 0 ? (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>Henüz özel kategori eklenmemiş.</span>
                {onOpenCategoryManage && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManage}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    + Kategori Oluştur
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId('')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    !categoryId
                      ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-400/40 font-bold shadow-xs'
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
                      className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? `${style.badgeBg} ${style.badgeText} border-blue-500 ring-2 ring-blue-400/40 font-bold shadow-xs`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat.emoji || '📁'}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {itemType === 'project' && 'Fikir / Proje Başlığı *'}
              {itemType === 'notepad' && 'Not / Hatırlatıcı Başlığı *'}
              {itemType === 'linkbox' && 'Link Kutusu Başlığı *'}
              {itemType === 'table' && 'Tablo Başlığı *'}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                itemType === 'project'
                  ? 'Örn: Çevrimdışı Ses Görselleştirici'
                  : itemType === 'notepad'
                  ? 'Örn: Haftalık Hatırlatmalar / Toplantı Notları'
                  : itemType === 'linkbox'
                  ? 'Örn: Tasarım Kaynakları / Önemli Dokümanlar'
                  : 'Örn: Aylık Bütçe Planı / Görev Karşılaştırma Tablosu'
              }
              className="w-full text-base font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          {/* PROJECT SPECIFIC FIELDS */}
          {itemType === 'project' && (
            <>
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-900 mb-1 uppercase tracking-wider">
                  <span>⚡</span>
                  <span>ÖZET (TLDR - 1-2 Cümle) *</span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={tldr}
                  onChange={(e) => setTldr(e.target.value)}
                  placeholder="Fikrin özeti ve temel amacı..."
                  className="w-full text-xs font-medium bg-white px-3 py-2 rounded-lg border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Detaylar / Notlar (İsteğe Bağlı)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="İlk düşünceler, bağımlılıklar, ilham kaynakları..."
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800 resize-none"
                />
              </div>
            </>
          )}

          {/* NOTEPAD / REMINDER SPECIFIC FIELDS */}
          {itemType === 'notepad' && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1.5 uppercase tracking-wider">
                <span>📝 Not Defteri / Hatırlatıcı İçeriği</span>
                <span className="text-[10px] font-normal text-amber-700 normal-case">
                  (Panoda doğrudan da düzenlenebilir)
                </span>
              </div>
              <textarea
                rows={5}
                value={tldr}
                onChange={(e) => setTldr(e.target.value)}
                placeholder="Unutulmaması gerekenler, hızlı notlar, hatırlatmalar..."
                className="w-full text-xs font-medium bg-white px-3 py-2.5 rounded-lg border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800 leading-relaxed"
              />
            </div>
          )}

          {/* LINK BOX SPECIFIC FIELDS */}
          {itemType === 'linkbox' && (
            <div className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900 uppercase tracking-wider">
                  <Link2 size={14} />
                  <span>Bağlantılar / Linkler</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddLinkRow}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-900 bg-white px-2.5 py-1 rounded-lg border border-cyan-200 shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>+ Yeni Link Satırı</span>
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {linkRows.map((row, idx) => (
                  <div key={row.id} className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-cyan-200/80">
                    <span className="text-[10px] font-mono font-bold text-slate-400 w-4 text-center">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => handleUpdateLinkRow(row.id, 'title', e.target.value)}
                      placeholder="Link Başlığı (Örn: Figma)"
                      className="w-2/5 text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-hidden focus:border-cyan-500 text-slate-800"
                    />
                    <input
                      type="text"
                      value={row.url}
                      onChange={(e) => handleUpdateLinkRow(row.id, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-hidden focus:border-cyan-500 text-slate-800 font-mono"
                    />
                    {linkRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLinkRow(row.id)}
                        title="Satırı Kaldır"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-cyan-800/80">
                İstediğin kadar link ekleyebilirsin. Kutuyu oluşturduktan sonra doğrudan tahtadaki kartın üzerinden de yeni link eklenebilir.
              </p>
            </div>
          )}

          {/* TABLE (EXCEL) SPECIFIC FIELDS */}
          {itemType === 'table' && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  <Table2 size={14} />
                  <span>Tablo İçeriği (Önizleme & Düzenleme)</span>
                </div>
                <span className="text-[10px] text-emerald-700">
                  Panoda da doğrudan düzenlenebilir • Excel'den yapıştırılabilir (Ctrl+V)
                </span>
              </div>
              <ExcelTableWidget
                tableData={tableData}
                title={title || 'tablo'}
                compact
                onChange={setTableData}
              />
            </div>
          )}

          {/* Color & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Kart Rengi
              </label>
              <div className="flex items-center gap-1.5">
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
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        isSelected ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105 opacity-80'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {itemType === 'project' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Başlangıç Durumu
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full text-xs font-medium px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 cursor-pointer"
                >
                  <option value="spark">💡 Fikir / Kıvılcım</option>
                  <option value="in-progress">🚧 Geliştiriliyor</option>
                  <option value="paused">🧊 Askıda / Beklemede</option>
                  <option value="shipped">🚀 Tamamlandı</option>
                </select>
              </div>
            )}
          </div>

          {/* Tags (for Project) */}
          {itemType === 'project' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Etiketler
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
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
                  placeholder="Örn: Mobil, Yapay Zeka, Tasarım"
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>
                {itemType === 'project' && 'Projeyi Ekle'}
                {itemType === 'notepad' && 'Not / Hatırlatıcı Ekle'}
                {itemType === 'linkbox' && 'Link Kutusunu Ekle'}
                {itemType === 'table' && 'Tabloyu Ekle'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
