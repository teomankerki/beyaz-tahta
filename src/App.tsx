import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Project,
  BacklogData,
  Category,
  WhiteboardZone,
  ProjectStatus,
  ViewMode,
  UpdateType,
  DrawingStroke,
  WhiteboardImage,
  BoardItemType,
} from './types';
import { loadBacklog, saveBacklog } from './services/storage';
import { SEED_DATA } from './data/seedData';
import { getCategoryStyle } from './utils/colors';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navigation/Navbar';
import { CategoryManageModal } from './components/Navigation/CategoryManageModal';
import { WhiteboardCanvas } from './components/Whiteboard/WhiteboardCanvas';
import { KanbanView } from './components/Views/KanbanView';
import { ListView } from './components/Views/ListView';
import { ProjectDetailModal } from './components/ProjectModal/ProjectDetailModal';
import { NewProjectModal } from './components/ProjectModal/NewProjectModal';
import { QuickUpdateModal } from './components/ProjectModal/QuickUpdateModal';
import { StatsDrawer } from './components/Stats/StatsDrawer';
import { Filter, FolderPlus } from 'lucide-react';

const LEGACY_INBUILT_ZONES = new Set(['zone-active', 'zone-creative', 'zone-tech', 'zone-icebox']);

const ZONE_BG_COLORS: Record<string, string> = {
  rose: 'rgba(244, 63, 94, 0.08)',
  blue: 'rgba(59, 130, 246, 0.08)',
  purple: 'rgba(168, 85, 247, 0.08)',
  emerald: 'rgba(16, 185, 129, 0.08)',
  amber: 'rgba(245, 158, 11, 0.08)',
  cyan: 'rgba(6, 182, 212, 0.08)',
  slate: 'rgba(100, 116, 139, 0.08)',
};

export const App: React.FC = () => {
  // Backlog state
  const [backlogData, setBacklogData] = useState<BacklogData>(SEED_DATA);
  const [storageSource, setStorageSource] = useState<'file' | 'localStorage' | 'seed'>('seed');
  const [isSaving, setIsSaving] = useState(false);

  // Filters & View
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('whiteboard');

  // Modals state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newProjectPos, setNewProjectPos] = useState<{ x: number; y: number }>({ x: 300, y: 200 });
  const [newItemType, setNewItemType] = useState<BoardItemType>('project');
  const [quickUpdateProject, setQuickUpdateProject] = useState<Project | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState(false);

  // Sync helper that updates state & persists to disk
  const persistChanges = useCallback((newData: BacklogData) => {
    setBacklogData(newData);
    setIsSaving(true);
    saveBacklog(newData).finally(() => {
      setTimeout(() => setIsSaving(false), 300);
    });
  }, []);

  // Load backlog on mount & clean any legacy hardcoded English zones
  useEffect(() => {
    let isMounted = true;
    loadBacklog().then(({ data, source }) => {
      if (isMounted) {
        const cleanedZones = (data.zones || []).filter((z) => !LEGACY_INBUILT_ZONES.has(z.id));
        const cleanedData: BacklogData = {
          ...data,
          categories: data.categories || [],
          zones: cleanedZones,
        };
        setBacklogData(cleanedData);
        setStorageSource(source);
        if ((data.zones || []).length !== cleanedZones.length) {
          saveBacklog(cleanedData);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Keyboard shortcut: 'n' for new idea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const activeTag = (activeEl?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || activeEl?.isContentEditable) {
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setNewProjectPos({ x: 350, y: 220 });
        setIsNewModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = useMemo(() => backlogData.categories || [], [backlogData.categories]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return backlogData.projects.filter((project) => {
      // Custom Category filter
      if (selectedCategoryId !== 'all') {
        const projCat = project.categoryId || project.classification;
        const selectedCatObj = categories.find((c) => c.id === selectedCategoryId);
        if (projCat !== selectedCategoryId && (!selectedCatObj || projCat !== selectedCatObj.name)) {
          return false;
        }
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
  }, [backlogData.projects, selectedCategoryId, categories, selectedStatus, searchQuery]);

  // Dynamic counts for category tabs
  const categoryCounts = useMemo(() => {
    const projects = backlogData.projects;
    const counts: Record<string, number> = {
      all: projects.length,
    };
    for (const cat of categories) {
      counts[cat.id] = projects.filter(
        (p) => (p.categoryId || p.classification) === cat.id || (p.categoryId || p.classification) === cat.name
      ).length;
    }
    return counts;
  }, [backlogData.projects, categories]);

  // Category Management Handlers
  const handleAddCategory = (newCat: Category, createZone?: boolean, zoneDesc?: string) => {
    const nextCategories = [...categories, newCat];
    let nextZones = [...(backlogData.zones || [])];

    if (createZone) {
      const idx = nextZones.length;
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const newZone: WhiteboardZone = {
        id: `zone-${newCat.id}`,
        title: `${newCat.emoji || '📁'} ${newCat.name}`,
        description: zoneDesc || '',
        color: ZONE_BG_COLORS[newCat.color] || ZONE_BG_COLORS.blue,
        x: 60 + col * 820,
        y: 80 + row * 600,
        width: 760,
        height: 520,
      };
      nextZones = [...nextZones, newZone];
    }

    persistChanges({
      ...backlogData,
      categories: nextCategories,
      zones: nextZones,
    });
  };

  const handleDeleteCategory = (catId: string) => {
    const nextCategories = categories.filter((c) => c.id !== catId);
    const nextZones = (backlogData.zones || []).filter((z) => z.id !== `zone-${catId}`);
    if (selectedCategoryId === catId) {
      setSelectedCategoryId('all');
    }
    persistChanges({
      ...backlogData,
      categories: nextCategories,
      zones: nextZones,
    });
  };

  // Project & Zone Actions
  const handleCreateProject = (newProject: Project) => {
    let finalProject = newProject;
    if (newProject.categoryId) {
      const targetZone = (backlogData.zones || []).find(
        (z) => z.id === `zone-${newProject.categoryId}`
      );
      if (targetZone) {
        const px = newProject.position.x;
        const py = newProject.position.y;
        const isAlreadyInside =
          px >= targetZone.x &&
          px <= targetZone.x + targetZone.width - 60 &&
          py >= targetZone.y &&
          py <= targetZone.y + targetZone.height - 60;

        if (!isAlreadyInside) {
          const itemsInZone = backlogData.projects.filter((p) => {
            const cx = p.position.x + 60;
            const cy = p.position.y + 20;
            return (
              p.categoryId === newProject.categoryId ||
              (cx >= targetZone.x &&
                cx <= targetZone.x + targetZone.width &&
                cy >= targetZone.y &&
                cy <= targetZone.y + targetZone.height)
            );
          }).length;
          const col = itemsInZone % 2;
          const row = Math.floor(itemsInZone / 2);
          finalProject = {
            ...newProject,
            position: {
              x: Math.round(targetZone.x + 24 + col * 340),
              y: Math.round(targetZone.y + 68 + row * 210),
            },
          };
        }
      }
    }

    const newData: BacklogData = {
      ...backlogData,
      projects: [...backlogData.projects, finalProject],
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

  const handleAddZone = (newZone: WhiteboardZone) => {
    const nextZones = [...(backlogData.zones || []), newZone];
    persistChanges({
      ...backlogData,
      zones: nextZones,
    });
  };

  const handleUpdateZone = (
    zoneId: string,
    updates: { x?: number; y?: number; width?: number; height?: number; title?: string; description?: string; color?: string },
    movedItems?: { dx: number; dy: number; zoneIds?: string[]; projectIds: string[]; imageIds?: string[] }
  ) => {
    const childZoneSet = new Set(movedItems?.zoneIds || []);
    const dx = movedItems?.dx || 0;
    const dy = movedItems?.dy || 0;

    const newZones = (backlogData.zones || []).map((z) => {
      if (z.id === zoneId) {
        return { ...z, ...updates };
      }
      if (childZoneSet.has(z.id) && (dx !== 0 || dy !== 0)) {
        return {
          ...z,
          x: z.x + dx,
          y: z.y + dy,
        };
      }
      return z;
    });

    let newProjects = backlogData.projects;
    let newImages = backlogData.images || [];

    if (movedItems && (dx !== 0 || dy !== 0)) {
      const projSet = new Set(movedItems.projectIds);
      if (projSet.size > 0) {
        newProjects = backlogData.projects.map((p) =>
          projSet.has(p.id)
            ? {
                ...p,
                position: {
                  x: p.position.x + dx,
                  y: p.position.y + dy,
                },
              }
            : p
        );
      }

      if (movedItems.imageIds && movedItems.imageIds.length > 0) {
        const imgSet = new Set(movedItems.imageIds);
        newImages = newImages.map((img) =>
          imgSet.has(img.id)
            ? {
                ...img,
                x: img.x + dx,
                y: img.y + dy,
              }
            : img
        );
      }
    }

    persistChanges({
      ...backlogData,
      zones: newZones,
      projects: newProjects,
      images: newImages,
    });
  };

  const handleDeleteZone = (zoneId: string) => {
    const newZones = (backlogData.zones || []).filter((z) => z.id !== zoneId);
    persistChanges({ ...backlogData, zones: newZones });
  };

  const handleDeleteProject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.filter((p) => p.id !== id),
    };
    persistChanges(newData);
    if (selectedProject?.id === id) setSelectedProject(null);
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

  const handleToggleTodo = (projectId: string, todoId: string) => {
    let completed = false;
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) => {
        if (p.id !== projectId) return p;
        const nextSubIdeas = (p.subIdeas || []).map((s) => {
          if (s.id !== todoId) return s;
          const nextStatus = s.status === 'done' ? ('spark' as const) : ('done' as const);
          if (nextStatus === 'done') completed = true;
          return { ...s, status: nextStatus };
        });
        const updated = {
          ...p,
          subIdeas: nextSubIdeas,
          updatedAt: new Date().toISOString(),
        };
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        return updated;
      }),
    };
    if (completed) {
      confetti({
        particleCount: 30,
        spread: 55,
        origin: { y: 0.7 },
      });
    }
    persistChanges(newData);
  };

  const handleAddTodo = (projectId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const newTodo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId,
      title: trimmed,
      status: 'spark' as const,
      createdAt: new Date().toISOString(),
    };
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) => {
        if (p.id !== projectId) return p;
        const updated = {
          ...p,
          subIdeas: [...(p.subIdeas || []), newTodo],
          updatedAt: new Date().toISOString(),
        };
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        return updated;
      }),
    };
    persistChanges(newData);
  };

  const handleDeleteTodo = (projectId: string, todoId: string) => {
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) => {
        if (p.id !== projectId) return p;
        const updated = {
          ...p,
          subIdeas: (p.subIdeas || []).filter((s) => s.id !== todoId),
          updatedAt: new Date().toISOString(),
        };
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        return updated;
      }),
    };
    persistChanges(newData);
  };

  const handleUpdateNote = (projectId: string, newNote: string) => {
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) => {
        if (p.id !== projectId) return p;
        const updated = {
          ...p,
          tldr: newNote,
          updatedAt: new Date().toISOString(),
        };
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        return updated;
      }),
    };
    persistChanges(newData);
  };

  const handleAddLink = (projectId: string, title: string, url: string) => {
    const newLink = {
      id: `lnk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      url,
    };
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) => {
        if (p.id !== projectId) return p;
        const updated = {
          ...p,
          links: [...(p.links || []), newLink],
          updatedAt: new Date().toISOString(),
        };
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        return updated;
      }),
    };
    persistChanges(newData);
  };

  const handleDeleteLink = (projectId: string, linkId: string) => {
    const newData: BacklogData = {
      ...backlogData,
      projects: backlogData.projects.map((p) => {
        if (p.id !== projectId) return p;
        const updated = {
          ...p,
          links: (p.links || []).filter((lnk, idx) => (lnk.id || String(idx)) !== linkId),
          updatedAt: new Date().toISOString(),
        };
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        return updated;
      }),
    };
    persistChanges(newData);
  };

  const handleCanvasDoubleClick = (x: number, y: number, itemType: BoardItemType = 'project') => {
    if (itemType === 'text') {
      const newTextItem: Project = {
        id: `txt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemType: 'text',
        title: 'Basit Metin',
        tldr: '',
        categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : (categories[0]?.id || 'Genel'),
        classification: selectedCategoryId !== 'all' ? selectedCategoryId : (categories[0]?.id || 'Genel'),
        status: 'spark',
        color: 'slate',
        tags: [],
        position: { x, y },
        updates: [],
        subIdeas: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistChanges({
        ...backlogData,
        projects: [...backlogData.projects, newTextItem],
      });
      return;
    }
    setNewProjectPos({ x, y });
    setNewItemType(itemType);
    setIsNewModalOpen(true);
  };

  const handleUpdateDrawings = useCallback((drawings: DrawingStroke[]) => {
    const newData: BacklogData = {
      ...backlogData,
      drawings,
    };
    persistChanges(newData);
  }, [backlogData, persistChanges]);

  const handleUpdateImages = useCallback((images: WhiteboardImage[]) => {
    const newData: BacklogData = {
      ...backlogData,
      images,
    };
    persistChanges(newData);
  }, [backlogData, persistChanges]);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Top Navigation & Filter Bar */}
      <Navbar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        categoryCounts={categoryCounts}
        onOpenCategoryManage={() => setIsCategoryManageOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNewProject={() => {
          setNewProjectPos({ x: 320, y: 180 });
          setNewItemType('project');
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
            onClick={() => setSelectedCategoryId('all')}
            className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
              selectedCategoryId === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Tümü ({categoryCounts.all || 0})
          </button>
          {categories.map((cat) => {
            const style = getCategoryStyle(cat);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  selectedCategoryId === cat.id ? `${style.badgeBg} ${style.badgeText}` : 'text-slate-600'
                }`}
              >
                {cat.emoji} {cat.name} ({categoryCounts[cat.id] || 0})
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsCategoryManageOpen(true)}
            className="px-2 py-1 rounded-md font-semibold text-blue-600 flex items-center gap-1 cursor-pointer"
          >
            <FolderPlus size={12} />
            <span>+ Kategori</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Surface */}
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'whiteboard' && (
          <WhiteboardCanvas
            projects={filteredProjects}
            categories={categories}
            zones={backlogData.zones}
            drawings={backlogData.drawings || []}
            images={backlogData.images || []}
            onUpdateProjectPosition={handleUpdateProjectPosition}
            onOpenProject={(proj) => setSelectedProject(proj)}
            onQuickUpdate={(proj) => setQuickUpdateProject(proj)}
            onDeleteProject={handleDeleteProject}
            onTogglePin={handleTogglePin}
            onCanvasDoubleClick={handleCanvasDoubleClick}
            onAddZone={handleAddZone}
            onUpdateZone={handleUpdateZone}
            onDeleteZone={handleDeleteZone}
            onUpdateDrawings={handleUpdateDrawings}
            onUpdateImages={handleUpdateImages}
            onToggleTodo={handleToggleTodo}
            onAddTodo={handleAddTodo}
            onDeleteTodo={handleDeleteTodo}
            onUpdateNote={handleUpdateNote}
            onAddLink={handleAddLink}
            onDeleteLink={handleDeleteLink}
          />
        )}

        {viewMode === 'kanban' && (
          <KanbanView
            projects={filteredProjects}
            categories={categories}
            onOpenProject={(proj) => setSelectedProject(proj)}
            onQuickUpdate={(proj) => setQuickUpdateProject(proj)}
            onUpdateStatus={handleUpdateStatus}
            onNewProjectInStatus={(_status) => {
              setNewProjectPos({ x: 300, y: 200 });
              setNewItemType('project');
              setIsNewModalOpen(true);
            }}
            onToggleTodo={handleToggleTodo}
            onAddTodo={handleAddTodo}
            onDeleteTodo={handleDeleteTodo}
          />
        )}

        {viewMode === 'list' && (
          <ListView
            projects={filteredProjects}
            categories={categories}
            onOpenProject={(proj) => setSelectedProject(proj)}
            onQuickUpdate={(proj) => setQuickUpdateProject(proj)}
            onDeleteProject={handleDeleteProject}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <ProjectDetailModal
        project={selectedProject}
        categories={categories}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        onSave={handleUpdateProject}
        onDelete={(id) => handleDeleteProject(id)}
        onOpenCategoryManage={() => setIsCategoryManageOpen(true)}
      />

      <NewProjectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateProject}
        categories={categories}
        initialCategoryId={selectedCategoryId !== 'all' ? selectedCategoryId : undefined}
        initialPosition={newProjectPos}
        initialItemType={newItemType}
        onOpenCategoryManage={() => setIsCategoryManageOpen(true)}
      />

      <QuickUpdateModal
        project={quickUpdateProject}
        isOpen={!!quickUpdateProject}
        onClose={() => setQuickUpdateProject(null)}
        onAddUpdate={handleAddQuickUpdate}
      />

      <CategoryManageModal
        isOpen={isCategoryManageOpen}
        onClose={() => setIsCategoryManageOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <StatsDrawer
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        backlogData={backlogData}
        categories={categories}
        storageSource={storageSource}
        onDataReplaced={(imported) => persistChanges(imported)}
        onResetSeed={() => persistChanges(SEED_DATA)}
        onOpenCategoryManage={() => {
          setIsStatsOpen(false);
          setIsCategoryManageOpen(true);
        }}
      />
    </div>
  );
};

export default App;
