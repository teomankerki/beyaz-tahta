import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Project, BacklogData, Classification, ProjectStatus, ViewMode, UpdateType } from './types';
import { loadBacklog, saveBacklog } from './services/storage';
import { SEED_DATA } from './data/seedData';
import { Navbar } from './components/Navigation/Navbar';
import { WhiteboardCanvas } from './components/Whiteboard/WhiteboardCanvas';
import { KanbanView } from './components/Views/KanbanView';
import { ListView } from './components/Views/ListView';
import { ProjectDetailModal } from './components/ProjectModal/ProjectDetailModal';
import { NewProjectModal } from './components/ProjectModal/NewProjectModal';
import { QuickUpdateModal } from './components/ProjectModal/QuickUpdateModal';
import { StatsDrawer } from './components/Stats/StatsDrawer';
import { Filter } from 'lucide-react';

export const App: React.FC = () => {
  // Backlog state
  const [backlogData, setBacklogData] = useState<BacklogData>(SEED_DATA);
  const [storageSource, setStorageSource] = useState<'file' | 'localStorage' | 'seed'>('seed');
  const [isSaving, setIsSaving] = useState(false);

  // Filters & View
  const [selectedClassification, setSelectedClassification] = useState<Classification | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('whiteboard');

  // Modals state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newProjectPos, setNewProjectPos] = useState<{ x: number; y: number }>({ x: 300, y: 200 });
  const [quickUpdateProject, setQuickUpdateProject] = useState<Project | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Load backlog on mount
  useEffect(() => {
    let isMounted = true;
    loadBacklog().then(({ data, source }) => {
      if (isMounted) {
        setBacklogData(data);
        setStorageSource(source);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync helper that updates state & persists to disk
  const persistChanges = useCallback((newData: BacklogData) => {
    setBacklogData(newData);
    setIsSaving(true);
    saveBacklog(newData).finally(() => {
      setTimeout(() => setIsSaving(false), 300);
    });
  }, []);

  // Keyboard shortcut: 'n' for new idea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setNewProjectPos({ x: 350, y: 220 });
        setIsNewModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return backlogData.projects.filter((project) => {
      // Classification filter
      if (selectedClassification !== 'all' && project.classification !== selectedClassification) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && project.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = project.title.toLowerCase().includes(q);
        const matchesTldr = project.tldr.toLowerCase().includes(q);
        const matchesDesc = project.description?.toLowerCase().includes(q);
        const matchesTags = project.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesUpdates = project.updates?.some((u) => u.content.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTldr && !matchesDesc && !matchesTags && !matchesUpdates) {
          return false;
        }
      }
      return true;
    });
  }, [backlogData.projects, selectedClassification, selectedStatus, searchQuery]);

  // Counts for tabs
  const classificationCounts = useMemo(() => {
    const projects = backlogData.projects;
    return {
      all: projects.length,
      creative: projects.filter((p) => p.classification === 'creative').length,
      tech: projects.filter((p) => p.classification === 'tech').length,
      hybrid: projects.filter((p) => p.classification === 'hybrid').length,
    };
  }, [backlogData.projects]);

  // Actions
  const handleCreateProject = (newProject: Project) => {
    const newData: BacklogData = {
      ...backlogData,
      projects: [...backlogData.projects, newProject],
    };
    persistChanges(newData);
  };

  const handleUpdateProject = (updated: Project) => {
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) => (p.id === updated.id ? updated : p)),
    };
    persistChanges(newData);
    if (selectedProject?.id === updated.id) {
      setSelectedProject(updated);
    }
  };

  const handleUpdateZone = (zoneId: string, width: number, height: number) => {
    const newZones = (backlogData.zones || []).map((z) =>
      z.id === zoneId ? { ...z, width, height } : z
    );
    persistChanges({ ...backlogData, zones: newZones });
  };

  const handleDeleteProject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Delete this idea card?')) {
      const newData: BacklogData = {
        ...backlogData,
        projects: backlogData.projects.filter((p) => p.id !== id),
      };
      persistChanges(newData);
      if (selectedProject?.id === id) setSelectedProject(null);
    }
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) =>
        p.id === id ? { ...p, pinned: !p.pinned } : p
      ),
    };
    persistChanges(newData);
  };

  const handleUpdateProjectPosition = (id: string, x: number, y: number) => {
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) =>
        p.id === id ? { ...p, position: { x, y }, updatedAt: new Date().toISOString() } : p
      ),
    };
    persistChanges(newData);
  };

  const handleUpdateStatus = (id: string, newStatus: ProjectStatus) => {
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) =>
        p.id === id ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p
      ),
    };
    persistChanges(newData);
  };

  const handleAddQuickUpdate = (projectId: string, content: string, type: UpdateType) => {
    const newUpdate = {
      id: `upd-${Date.now()}`,
      projectId,
      timestamp: new Date().toISOString(),
      content,
      type,
    };
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            updates: [...(p.updates || []), newUpdate],
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      }),
    };
    persistChanges(newData);
  };

  // Auto-Tidy function: cleanly positions cards into neat clusters
  const handleAutoTidy = () => {
    let creativeIndex = 0;
    let techIndex = 0;
    let hybridIndex = 0;

    const tidiedProjects = backlogData.projects.map((p) => {
      if (p.pinned) return p;

      let x = 100;
      let y = 150;

      if (p.status === 'in-progress' || p.status === 'spark') {
        if (p.classification === 'creative') {
          const col = creativeIndex % 2;
          const row = Math.floor(creativeIndex / 2);
          x = 880 + col * 360;
          y = 150 + row * 240;
          creativeIndex++;
        } else if (p.classification === 'tech') {
          const col = techIndex % 2;
          const row = Math.floor(techIndex / 2);
          x = 100 + col * 360;
          y = 150 + row * 240;
          techIndex++;
        } else {
          const col = hybridIndex % 2;
          const row = Math.floor(hybridIndex / 2);
          x = 100 + col * 360;
          y = 700 + row * 240;
          hybridIndex++;
        }
      } else {
        // Paused or Shipped in Icebox zone
        const col = hybridIndex % 2;
        const row = Math.floor(hybridIndex / 2);
        x = 880 + col * 360;
        y = 700 + row * 240;
        hybridIndex++;
      }

      return {
        ...p,
        position: { x, y },
      };
    });

    const newData: BacklogData = {
      ...backlogData,
      projects: tidiedProjects,
    };
    persistChanges(newData);
  };

  const handleCanvasDoubleClick = (x: number, y: number) => {
    setNewProjectPos({ x, y });
    setIsNewModalOpen(true);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Top Navigation & Filter Bar */}
      <Navbar
        selectedClassification={selectedClassification}
        onSelectClassification={setSelectedClassification}
        classificationCounts={classificationCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNewProject={() => {
          setNewProjectPos({ x: 320, y: 180 });
          setIsNewModalOpen(true);
        }}
        onOpenStats={() => setIsStatsOpen(true)}
        isSaving={isSaving}
      />

      {/* Sub-bar for Mobile / Small Screens */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-slate-100/90 border-b border-slate-200 overflow-x-auto text-xs shrink-0 gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter size={13} className="text-slate-400" />
          <button
            type="button"
            onClick={() => setSelectedClassification('all')}
            className={`px-2.5 py-1 rounded-md font-semibold ${
              selectedClassification === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            All ({classificationCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedClassification('creative')}
            className={`px-2.5 py-1 rounded-md font-semibold ${
              selectedClassification === 'creative' ? 'bg-pink-100 text-pink-800' : 'text-slate-600'
            }`}
          >
            🎨 Creative ({classificationCounts.creative})
          </button>
          <button
            type="button"
            onClick={() => setSelectedClassification('tech')}
            className={`px-2.5 py-1 rounded-md font-semibold ${
              selectedClassification === 'tech' ? 'bg-blue-100 text-blue-800' : 'text-slate-600'
            }`}
          >
            💻 Tech ({classificationCounts.tech})
          </button>
          <button
            type="button"
            onClick={() => setSelectedClassification('hybrid')}
            className={`px-2.5 py-1 rounded-md font-semibold ${
              selectedClassification === 'hybrid' ? 'bg-purple-100 text-purple-800' : 'text-slate-600'
            }`}
          >
            ⚡ Hybrid ({classificationCounts.hybrid})
          </button>
        </div>
      </div>

      {/* Main Workspace Surface */}
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'whiteboard' && (
          <WhiteboardCanvas
            projects={filteredProjects}
            zones={backlogData.zones}
            onUpdateProjectPosition={handleUpdateProjectPosition}
            onOpenProject={(proj) => setSelectedProject(proj)}
            onQuickUpdate={(proj) => setQuickUpdateProject(proj)}
            onDeleteProject={handleDeleteProject}
            onTogglePin={handleTogglePin}
            onAutoTidy={handleAutoTidy}
            onCanvasDoubleClick={handleCanvasDoubleClick}
            onUpdateZone={handleUpdateZone}
          />
        )}

        {viewMode === 'kanban' && (
          <KanbanView
            projects={filteredProjects}
            onOpenProject={(proj) => setSelectedProject(proj)}
            onQuickUpdate={(proj) => setQuickUpdateProject(proj)}
            onUpdateStatus={handleUpdateStatus}
            onNewProjectInStatus={(_status) => {
              setNewProjectPos({ x: 300, y: 200 });
              setIsNewModalOpen(true);
            }}
          />
        )}

        {viewMode === 'list' && (
          <ListView
            projects={filteredProjects}
            onOpenProject={(proj) => setSelectedProject(proj)}
            onQuickUpdate={(proj) => setQuickUpdateProject(proj)}
            onDeleteProject={handleDeleteProject}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        onSave={handleUpdateProject}
        onDelete={(id) => handleDeleteProject(id)}
      />

      <NewProjectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateProject}
        initialClassification={selectedClassification !== 'all' ? selectedClassification : 'creative'}
        initialPosition={newProjectPos}
      />

      <QuickUpdateModal
        project={quickUpdateProject}
        isOpen={!!quickUpdateProject}
        onClose={() => setQuickUpdateProject(null)}
        onAddUpdate={handleAddQuickUpdate}
      />

      <StatsDrawer
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        backlogData={backlogData}
        storageSource={storageSource}
        onDataReplaced={(imported) => persistChanges(imported)}
        onResetSeed={() => persistChanges(SEED_DATA)}
      />
    </div>
  );
};

export default App;
