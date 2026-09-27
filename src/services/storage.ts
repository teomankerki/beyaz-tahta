import type { BacklogData } from '../types';
import { SEED_DATA } from '../data/seedData';

const LOCAL_STORAGE_KEY = 'tldr_whiteboard_backlog_v1';

function sanitizeBacklog(data: BacklogData): BacklogData {
  if (!data || !Array.isArray(data.projects)) return data;
  return {
    ...data,
    projects: data.projects.map((p) => ({
      ...p,
      updates: (p.updates || []).filter(
        (u) => !u.content || !u.content.includes('Spark ignited')
      ),
    })),
  };
}

export async function loadBacklog(): Promise<{ data: BacklogData; source: 'file' | 'localStorage' | 'seed' }> {
  // 0. Try Electron IPC (native desktop mode)
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    try {
      const electronData = await window.electronAPI.getBacklog();
      if (electronData && Array.isArray(electronData.projects)) {
        const data = sanitizeBacklog(electronData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return { data, source: 'file' };
      }
    } catch (err) {
      console.warn('Electron IPC getBacklog error, falling back to web storage:', err);
    }
  }

  // 1. Try local API (direct file system sync)
  try {
    const res = await fetch('/api/backlog', {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const rawData: BacklogData = await res.json();
      if (rawData && Array.isArray(rawData.projects)) {
        const data = sanitizeBacklog(rawData);
        // Cache to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return { data, source: 'file' };
      }
    }
  } catch {
    console.warn('Backend /api/backlog not reachable, falling back to local cache.');
  }

  // 2. Try localStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as BacklogData;
      if (parsed && Array.isArray(parsed.projects)) {
        const data = sanitizeBacklog(parsed);
        return { data, source: 'localStorage' };
      }
    }
  } catch (err) {
    console.error('Error reading localStorage', err);
  }

  // 3. Fallback to seed data
  return { data: sanitizeBacklog(SEED_DATA), source: 'seed' };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: BacklogData | null = null;

async function flushPendingToDisk(): Promise<boolean> {
  if (!pendingData) return true;
  const dataToSend = pendingData;
  pendingData = null;

  // 0. Use Electron IPC if available
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    try {
      const ok = await window.electronAPI.saveBacklog(dataToSend);
      return ok;
    } catch (e) {
      console.warn('Electron saveBacklog error:', e);
      return false;
    }
  }

  // 1. Fallback to HTTP API
  try {
    const res = await fetch('/api/backlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend),
    });
    return res.ok;
  } catch (e) {
    console.warn('Passive background sync notice:', e);
    return false;
  }
}

export async function saveBacklog(data: BacklogData, immediate = false): Promise<boolean> {
  // 1. Instantly save to local cache (0ms, synchronous)
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }

  // 2. Queue for passive background file save
  pendingData = data;

  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  if (immediate) {
    return flushPendingToDisk();
  }

  return new Promise((resolve) => {
    saveTimer = setTimeout(async () => {
      const ok = await flushPendingToDisk();
      resolve(ok);
    }, 400);
  });
}

export function exportBacklog(data: BacklogData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `beyaz-tahta-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBacklog(file: File): Promise<BacklogData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as BacklogData;
        if (!parsed || !Array.isArray(parsed.projects)) {
          throw new Error('Invalid backlog format: missing projects list.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
