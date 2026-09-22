import type { BacklogData } from '../types';
import { SEED_DATA } from '../data/seedData';

const LOCAL_STORAGE_KEY = 'tldr_whiteboard_backlog_v1';

export async function loadBacklog(): Promise<{ data: BacklogData; source: 'file' | 'localStorage' | 'seed' }> {
  // 1. Try local API (direct file system sync)
  try {
    const res = await fetch('/api/backlog', {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data: BacklogData = await res.json();
      if (data && Array.isArray(data.projects)) {
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
        return { data: parsed, source: 'localStorage' };
      }
    }
  } catch (err) {
    console.error('Error reading localStorage', err);
  }

  // 3. Fallback to seed data
  return { data: SEED_DATA, source: 'seed' };
}

export async function saveBacklog(data: BacklogData): Promise<boolean> {
  // Always update local cache
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }

  // Write to local file via API
  try {
    const res = await fetch('/api/backlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to sync to local file', e);
    return false;
  }
}

export function exportBacklog(data: BacklogData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `whiteboard-backlog-${dateStr}.json`;
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
