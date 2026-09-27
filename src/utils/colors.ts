import type { CardColor, ProjectStatus, UpdateType, SubIdeaStatus, Category } from '../types';

export const CARD_COLORS: Record<CardColor, {
  name: string;
  bg: string;
  border: string;
  text: string;
  accent: string;
  tape: string;
  tagBg: string;
  dotColor: string;
}> = {
  yellow: {
    name: 'Sarı Not',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-950',
    accent: 'text-amber-700',
    tape: 'bg-yellow-200/80 border-yellow-400/40',
    tagBg: 'bg-amber-200/60 text-amber-900',
    dotColor: '#f59e0b',
  },
  amber: {
    name: 'Sıcak Parşömen',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-950',
    accent: 'text-orange-700',
    tape: 'bg-orange-200/80 border-orange-400/40',
    tagBg: 'bg-orange-200/60 text-orange-900',
    dotColor: '#ea580c',
  },
  emerald: {
    name: 'Nane Yeşili',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-950',
    accent: 'text-emerald-700',
    tape: 'bg-emerald-200/80 border-emerald-400/40',
    tagBg: 'bg-emerald-200/60 text-emerald-900',
    dotColor: '#10b981',
  },
  cyan: {
    name: 'Teknik Mavi',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-950',
    accent: 'text-sky-700',
    tape: 'bg-sky-200/80 border-sky-400/40',
    tagBg: 'bg-sky-200/60 text-sky-900',
    dotColor: '#0ea5e9',
  },
  violet: {
    name: 'Lavanta Rüyası',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-950',
    accent: 'text-purple-700',
    tape: 'bg-purple-200/80 border-purple-400/40',
    tagBg: 'bg-purple-200/60 text-purple-900',
    dotColor: '#8b5cf6',
  },
  rose: {
    name: 'Mercan Pembesi',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-950',
    accent: 'text-rose-700',
    tape: 'bg-rose-200/80 border-rose-400/40',
    tagBg: 'bg-rose-200/60 text-rose-900',
    dotColor: '#f43f5e',
  },
  slate: {
    name: 'Grafit Gri',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-900',
    accent: 'text-slate-700',
    tape: 'bg-slate-300/80 border-slate-400/40',
    tagBg: 'bg-slate-300/60 text-slate-800',
    dotColor: '#64748b',
  },
};

// Customizable Category styling presets
export const CATEGORY_COLOR_PRESETS: Record<string, {
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dot: string;
}> = {
  rose: {
    name: 'Pembe / Mercan',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-300',
    dot: '#f43f5e',
  },
  blue: {
    name: 'Mavi / Okyanus',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-300',
    dot: '#3b82f6',
  },
  purple: {
    name: 'Mor / Lavanta',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-300',
    dot: '#a855f7',
  },
  emerald: {
    name: 'Yeşil / Zümrüt',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-300',
    dot: '#10b981',
  },
  amber: {
    name: 'Sarı / Kehribar',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-300',
    dot: '#f59e0b',
  },
  cyan: {
    name: 'Turkuaz / Gökyüzü',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-300',
    dot: '#06b6d4',
  },
  slate: {
    name: 'Koyu / Grafit',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
    dot: '#64748b',
  },
};

// No inbuilt categories — user creates their own categories freely
export const DEFAULT_CATEGORIES: Category[] = [];

export function getCategoryStyle(category?: Category | null, _fallback?: string) {
  if (category) {
    const conf = CATEGORY_COLOR_PRESETS[category.color] || CATEGORY_COLOR_PRESETS.blue;
    return {
      badgeBg: conf.badgeBg,
      badgeText: conf.badgeText,
      badgeBorder: conf.badgeBorder,
      dot: conf.dot,
      label: category.name,
      emoji: category.emoji || '📁',
    };
  }
  return {
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
    dot: '#94a3b8',
    label: 'Kategorisiz',
    emoji: '📁',
  };
}

// Backward compatibility helper
export const CLASSIFICATION_CONFIG: Record<string, {
  label: string;
  emoji: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconColor: string;
}> = {
  creative: {
    label: 'Yaratıcı',
    emoji: '🎨',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-800',
    badgeBorder: 'border-pink-300',
    iconColor: '#ec4899',
  },
  tech: {
    label: 'Teknoloji',
    emoji: '💻',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
    iconColor: '#3b82f6',
  },
  hybrid: {
    label: 'Hibrit',
    emoji: '⚡',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-300',
    iconColor: '#a855f7',
  },
};

export const STATUS_CONFIG: Record<ProjectStatus, {
  label: string;
  emoji: string;
  color: string;
  textColor: string;
  badgeBg: string;
}> = {
  spark: {
    label: 'Fikir / Kıvılcım',
    emoji: '💡',
    color: 'bg-amber-400',
    textColor: 'text-amber-800',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  'in-progress': {
    label: 'Geliştiriliyor',
    emoji: '🚧',
    color: 'bg-blue-500',
    textColor: 'text-blue-800',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  paused: {
    label: 'Askıda / Beklemede',
    emoji: '🧊',
    color: 'bg-slate-400',
    textColor: 'text-slate-700',
    badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
  },
  shipped: {
    label: 'Tamamlandı',
    emoji: '🚀',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-800',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
};

export const UPDATE_TYPE_CONFIG: Record<UpdateType, {
  label: string;
  emoji: string;
  badgeBg: string;
  border: string;
}> = {
  log: {
    label: 'Not / Log',
    emoji: '📝',
    badgeBg: 'bg-slate-100 text-slate-800',
    border: 'border-slate-300',
  },
  milestone: {
    label: 'Aşama / Milestone',
    emoji: '🏆',
    badgeBg: 'bg-emerald-100 text-emerald-800 font-semibold',
    border: 'border-emerald-300',
  },
  roadblock: {
    label: 'Engel / Sorun',
    emoji: '⚠️',
    badgeBg: 'bg-rose-100 text-rose-800 font-medium',
    border: 'border-rose-300',
  },
  idea: {
    label: 'Fikir Notu',
    emoji: '💡',
    badgeBg: 'bg-amber-100 text-amber-800 font-medium',
    border: 'border-amber-300',
  },
};

export const SUB_IDEA_STATUS_CONFIG: Record<SubIdeaStatus, {
  label: string;
  emoji: string;
  badgeBg: string;
  border: string;
  text: string;
}> = {
  spark: {
    label: 'Fikir',
    emoji: '💡',
    badgeBg: 'bg-amber-100',
    border: 'border-amber-300',
    text: 'text-amber-800',
  },
  'in-progress': {
    label: 'Yapılıyor',
    emoji: '🚧',
    badgeBg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-800',
  },
  done: {
    label: 'Bitti',
    emoji: '✅',
    badgeBg: 'bg-emerald-100',
    border: 'border-emerald-300',
    text: 'text-emerald-800',
  },
};

export function formatTimeAgo(timestampStr: string): string {
  try {
    const now = new Date();
    const date = new Date(timestampStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Az önce';
    if (diffMin < 60) return `${diffMin} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    if (diffDays === 1) return 'Dün';
    if (diffDays < 30) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
  } catch {
    return 'Yakın zamanda';
  }
}
