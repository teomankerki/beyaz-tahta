import type { BacklogData } from './index';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getBacklog: () => Promise<BacklogData | null>;
      saveBacklog: (data: BacklogData) => Promise<boolean>;
      openDataFolder: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
    };
  }
}

export {};
