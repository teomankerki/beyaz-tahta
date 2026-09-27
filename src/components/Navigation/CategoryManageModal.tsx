import React, { useState, useEffect, useRef } from 'react';
import type { Category } from '../../types';
import { CATEGORY_COLOR_PRESETS } from '../../utils/colors';
import { X, Plus, Trash2, Tag } from 'lucide-react';

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Category, createZone?: boolean, zoneDesc?: string) => void;
  onDeleteCategory: (id: string) => void;
}

const QUICK_EMOJIS = ['🎨', '💻', '🚀', '📱', '📚', '🎬', '🎵', '💡', '🛠️', '🎯', '🧪', '✨', '⚡'];

export const CategoryManageModal: React.FC<CategoryManageModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💡');
  const [color, setColor] = useState('blue');
  const [createZone, setCreateZone] = useState(true);
  const [zoneDesc, setZoneDesc] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      emoji,
      color,
    };

    onAddCategory(newCategory, createZone, zoneDesc.trim());
    setName('');
    setZoneDesc('');
    setTimeout(() => nameInputRef.current?.focus(), 30);
  };

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
              <Tag size={16} />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Kategorileri Yönet</h3>
              <p className="text-[11px] text-slate-500">Kendi özel proje kategorilerini ve pano alanlarını oluştur</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Add New Category Form */}
          <form onSubmit={handleSubmit} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Yeni Kategori Ekle</h4>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                title="Emoji"
                className="w-12 text-center text-base py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 select-text"
              />
              <input
                ref={nameInputRef}
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kategori Adı (Örn: YouTube, Mobil, Oyun)..."
                className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 select-text"
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Ekle</span>
              </button>
            </div>

            {/* Quick Emoji Picker */}
            <div className="flex items-center gap-1 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 mr-1">Hızlı Emoji:</span>
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`text-xs p-1 rounded-md hover:bg-slate-200 cursor-pointer ${
                    emoji === em ? 'bg-blue-100 ring-1 ring-blue-400' : ''
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>

            {/* Color Swatch Picker */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 mr-1">Renk:</span>
              {Object.entries(CATEGORY_COLOR_PRESETS).map(([key, conf]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColor(key)}
                  title={conf.name}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                    color === key ? 'scale-125 ring-2 ring-blue-500 ring-offset-1 shadow-xs' : 'hover:scale-110 opacity-80'
                  }`}
                  style={{ backgroundColor: conf.dot }}
                />
              ))}
            </div>

            {/* Optional Canvas Zone Creation */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createZone}
                  onChange={(e) => setCreateZone(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Beyaz tahtaya bu kategori için alan (bölge) da ekle</span>
              </label>

              {createZone && (
                <input
                  type="text"
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  placeholder="Alan alt açıklaması (isteğe bağlı)..."
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-700"
                />
              )}
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Mevcut Kategoriler ({categories.length})</h4>
            
            {categories.length > 0 ? (
              <div className="space-y-1.5">
                {categories.map((cat) => {
                  const conf = CATEGORY_COLOR_PRESETS[cat.color] || CATEGORY_COLOR_PRESETS.blue;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.emoji}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                          {cat.name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        title="Kategoriyi Sil"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Henüz özel bir kategori eklenmemiş. Yukarıdaki formdan kendi kategorilerini oluşturabilirsin!
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
