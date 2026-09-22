import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Project, WhiteboardZone } from '../../types';
import { ProjectCard } from './ProjectCard';
import { ZoomIn, ZoomOut, RotateCcw, Grid, Sparkles, Move } from 'lucide-react';

interface WhiteboardCanvasProps {
  projects: Project[];
  zones?: WhiteboardZone[];
  onUpdateProjectPosition: (id: string, x: number, y: number) => void;
  onOpenProject: (project: Project) => void;
  onQuickUpdate: (project: Project) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onTogglePin?: (id: string, e: React.MouseEvent) => void;
  onAutoTidy: () => void;
  onCanvasDoubleClick?: (x: number, y: number) => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  projects,
  zones = [],
  onUpdateProjectPosition,
  onOpenProject,
  onQuickUpdate,
  onDeleteProject,
  onTogglePin,
  onAutoTidy,
  onCanvasDoubleClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [zoom, setZoom] = useState<number>(0.95);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Dragging state for canvas panning
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging state for individual project card
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const cardDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialProjX: number;
    initialProjY: number;
  } | null>(null);

  // Temporary dragged positions for smooth 60fps rendering
  const [dragOffset, setDragOffset] = useState<{ id: string; x: number; y: number } | null>(null);

  // Handle Zoom In/Out
  const handleZoom = useCallback((delta: number, clientX?: number, clientY?: number) => {
    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(0.4, prevZoom + delta), 1.8);
      if (clientX !== undefined && clientY !== undefined && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        // Adjust pan so mouse point stays fixed
        const scaleFactor = nextZoom / prevZoom;
        setPan((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * scaleFactor,
          y: mouseY - (mouseY - prevPan.y) * scaleFactor,
        }));
      }
      return Number(nextZoom.toFixed(2));
    });
  }, []);

  // Wheel event for pan & zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zooming
        const delta = -e.deltaY * 0.0015;
        handleZoom(delta, e.clientX, e.clientY);
      } else {
        // Panning
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [handleZoom]);

  // Pointer down on canvas (start pan)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 0 || e.button === 1) { // Left or middle click
      // Only pan if user clicked directly on canvas background or zone
      const target = e.target as HTMLElement;
      if (target.closest('.no-pan') || target.closest('button') || target.closest('input')) {
        return;
      }
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  // Pointer down on a card (start card drag)
  const handleCardDragStart = (e: React.PointerEvent, project: Project) => {
    if (project.pinned) return; // Cannot drag pinned cards
    e.stopPropagation();
    setActiveCardId(project.id);
    cardDragRef.current = {
      id: project.id,
      startX: e.clientX,
      startY: e.clientY,
      initialProjX: project.position.x,
      initialProjY: project.position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Global Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (cardDragRef.current && activeCardId) {
      const { id, startX, startY, initialProjX, initialProjY } = cardDragRef.current;
      const dx = (e.clientX - startX) / zoom;
      const dy = (e.clientY - startY) / zoom;

      let newX = Math.round(initialProjX + dx);
      let newY = Math.round(initialProjY + dy);

      if (snapToGrid) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      }

      setDragOffset({ id, x: newX, y: newY });
    }
  };

  // Global Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }

    if (cardDragRef.current && dragOffset) {
      onUpdateProjectPosition(dragOffset.id, dragOffset.x, dragOffset.y);
      cardDragRef.current = null;
      setActiveCardId(null);
      setDragOffset(null);
    } else if (cardDragRef.current) {
      cardDragRef.current = null;
      setActiveCardId(null);
    }
  };

  // Double click canvas to add new project right here
  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.no-pan') || target.closest('button')) return;

    if (containerRef.current && onCanvasDoubleClick) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - pan.x) / zoom;
      const clickY = (e.clientY - rect.top - pan.y) / zoom;
      onCanvasDoubleClick(Math.round(clickX), Math.round(clickY));
    }
  };

  // Reset View to fit contents nicely
  const handleResetView = () => {
    setPan({ x: 60, y: 40 });
    setZoom(0.9);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      className={`relative w-full h-full overflow-hidden bg-dot-grid cursor-grab active:cursor-grabbing select-none ${
        isPanning ? 'cursor-grabbing' : ''
      }`}
    >
      {/* Transformable Canvas Layer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute top-0 left-0 w-[4000px] h-[4000px] pointer-events-auto"
      >
        {/* Background Whiteboard Zones */}
        {zones.map((zone) => (
          <div
            key={zone.id}
            style={{
              left: `${zone.x}px`,
              top: `${zone.y}px`,
              width: `${zone.width}px`,
              height: `${zone.height}px`,
              backgroundColor: zone.color,
            }}
            className="absolute rounded-3xl border-2 border-dashed border-slate-300/80 pointer-events-none p-5 flex flex-col justify-between"
          >
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-slate-700 bg-white/80 px-3 py-1 rounded-full shadow-xs border border-slate-200">
                {zone.title}
              </span>
              {zone.description && (
                <p className="text-xs text-slate-500 mt-2 ml-1 font-medium">
                  {zone.description}
                </p>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest text-right">
              WHITEBOARD ZONE
            </div>
          </div>
        ))}

        {/* Project Cards */}
        {projects.map((project) => {
          const isBeingDragged = activeCardId === project.id;
          const currentX = isBeingDragged && dragOffset ? dragOffset.x : project.position.x;
          const currentY = isBeingDragged && dragOffset ? dragOffset.y : project.position.y;

          return (
            <div
              key={project.id}
              style={{
                transform: `translate(${currentX}px, ${currentY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              className="no-pan"
            >
              <ProjectCard
                project={project}
                onOpen={onOpenProject}
                onQuickUpdate={onQuickUpdate}
                onDelete={onDeleteProject}
                onTogglePin={onTogglePin}
                isDragging={isBeingDragged}
                onDragStart={handleCardDragStart}
              />
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-slate-200 no-pan z-40">
        <button
          type="button"
          onClick={() => handleZoom(-0.15)}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ZoomOut size={16} />
        </button>

        <span className="text-xs font-mono font-medium text-slate-700 min-w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => handleZoom(0.15)}
          title="Zoom In"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={handleResetView}
          title="Reset View"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw size={15} />
        </button>

        <button
          type="button"
          onClick={() => setSnapToGrid(!snapToGrid)}
          title={snapToGrid ? 'Snap to grid: ON' : 'Snap to grid: OFF'}
          className={`p-1.5 rounded-lg transition-colors ${
            snapToGrid ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Grid size={15} />
        </button>

        <button
          type="button"
          onClick={onAutoTidy}
          title="Auto-Tidy Board Layout"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <Sparkles size={13} className="text-amber-500" />
          <span>Auto-Tidy</span>
        </button>
      </div>

      {/* Helper hint pill (Bottom Left) */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 text-xs text-slate-500 pointer-events-none z-30">
        <Move size={13} className="text-slate-400" />
        <span>Drag canvas to pan • Double-click space to create card</span>
      </div>
    </div>
  );
};
