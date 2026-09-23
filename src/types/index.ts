export type Classification = 'creative' | 'tech' | 'hybrid';

export type ProjectStatus = 'spark' | 'in-progress' | 'paused' | 'shipped';

export type UpdateType = 'log' | 'milestone' | 'roadblock' | 'idea';

export interface ProjectUpdate {
  id: string;
  projectId: string;
  timestamp: string; // ISO string
  content: string;
  type: UpdateType;
}

export type SubIdeaStatus = 'spark' | 'in-progress' | 'done';

export interface SubIdea {
  id: string;
  projectId: string;
  title: string;
  status: SubIdeaStatus;
  createdAt: string;
}

export type CardColor =
  | 'yellow'   // classic sticky yellow
  | 'amber'    // warm peach / craft paper
  | 'emerald'  // mint green
  | 'cyan'     // blueprint tech cyan
  | 'violet'   // dream lavender
  | 'rose'     // vibrant coral
  | 'slate';   // sleek tech obsidian

export interface Project {
  id: string;
  title: string;
  tldr: string; // punchy 1-2 sentence summary
  description?: string;
  classification: Classification;
  status: ProjectStatus;
  tags: string[];
  color: CardColor;
  position: {
    x: number;
    y: number;
  };
  pinned?: boolean;
  priority?: 'low' | 'medium' | 'high';
  updates: ProjectUpdate[];
  subIdeas?: SubIdea[];
  links?: { title: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface WhiteboardZone {
  id: string;
  title: string;
  description?: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface WhiteboardImage {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned?: boolean;
  createdAt: string;
}

export interface BacklogData {
  version: number;
  projects: Project[];
  zones?: WhiteboardZone[];
  drawings?: DrawingStroke[];
  images?: WhiteboardImage[];
  lastModified?: string;
}

export type ViewMode = 'whiteboard' | 'kanban' | 'list';

