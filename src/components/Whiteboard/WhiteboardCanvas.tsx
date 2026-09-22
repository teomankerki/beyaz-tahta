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
  onUpdateZone?: (zoneId: string, width: number, height: number) => void;
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
  onUpdateZone,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [zoom, setZoom] = useState<number>(0.95);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const snapToGridRef = useRef(snapToGrid);
  snapToGridRef.current = snapToGrid;

  // Active interaction states for visual indicators
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ id: string; x: number; y: number } | null>(null);
  const [activeResizeZoneId, setActiveResizeZoneId] = useState<string | null>(null);
  const [resizeZoneOffset, setResizeZoneOffset] = useState<{ id: string; width: number; height: number } | null>(null);

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
    if (e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('.no-pan') || target.closest('button') || target.closest('input')) {
      return;
    }

    setIsPanning(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialPanX = pan.x;
    const initialPanY = pan.y;

    const onPanMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setPan({
        x: initialPanX + dx,
        y: initialPanY + dy,
      });
    };

    const onPanUp = () => {
      setIsPanning(false);
      window.removeEventListener('pointermove', onPanMove);
      window.removeEventListener('pointerup', onPanUp);
    };

    window.addEventListener('pointermove', onPanMove);
    window.addEventListener('pointerup', onPanUp);
  };

  // Pointer down on a card (start card drag or click)
  const handleCardDragStart = (e: React.PointerEvent, project: Project) => {
    if (project.pinned) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialProjX = project.position.x;
    const initialProjY = project.position.y;
    let hasMoved = false;
    let lastX = initialProjX;
    let lastY = initialProjY;

    setActiveCardId(project.id);

    const onCardMove = (ev: PointerEvent) => {
      const curZoom = zoomRef.current;
      const dx = (ev.clientX - startX) / curZoom;
      const dy = (ev.clientY - startY) / curZoom;

      if (!hasMoved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 5) {
        hasMoved = true;
      }

      let newX = Math.round(initialProjX + dx);
      let newY = Math.round(initialProjY + dy);

      if (snapToGridRef.current) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      }

      lastX = newX;
      lastY = newY;
      setDragOffset({ id: project.id, x: newX, y: newY });
    };

    const onCardUp = () => {
      window.removeEventListener('pointermove', onCardMove);
      window.removeEventListener('pointerup', onCardUp);

      if (hasMoved) {
        onUpdateProjectPosition(project.id, lastX, lastY);
      } else {
        // Simple click without dragging
        onOpenProject(project);
      }

      setActiveCardId(null);
      setDragOffset(null);
    };

    window.addEventListener('pointermove', onCardMove);
    window.addEventListener('pointerup', onCardUp);
  };

  // Start resizing a zone
  const handleZoneResizeStart = (e: React.PointerEvent, zone: WhiteboardZone) => {
    e.stopPropagation();
    setActiveResizeZoneId(zone.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = zone.width;
    const initialHeight = zone.height;
    let lastW = initialWidth;
    let lastH = initialHeight;

    const onZoneMove = (ev: PointerEvent) => {
      const curZoom = zoomRef.current;
      const dx = (ev.clientX - startX) / curZoom;
      const dy = (ev.clientY - startY) / curZoom;

      let newW = Math.max(300, Math.round(initialWidth + dx));
      let newH = Math.max(200, Math.round(initialHeight + dy));

      if (snapToGridRef.current) {
        newW = Math.round(newW / 20) * 20;
        newH = Math.round(newH / 20) * 20;
      }

      lastW = newW;
      lastH = newH;
      setResizeZoneOffset({ id: zone.id, width: newW, height: newH });
    };

    const onZoneUp = () => {
      window.removeEventListener('pointermove', onZoneMove);
      window.removeEventListener('pointerup', onZoneUp);

      if (onUpdateZone) {
        onUpdateZone(zone.id, lastW, lastH);
      }

      setActiveResizeZoneId(null);
      setResizeZoneOffset(null);
    };

    window.addEventListener('pointermove', onZoneMove);
    window.addEventListener('pointerup', onZoneUp);
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
        {zones.map((zone) => {
          const isResizing = activeResizeZoneId === zone.id;
          const currentWidth = isResizing && resizeZoneOffset ? resizeZoneOffset.width : zone.width;
          const currentHeight = isResizing && resizeZoneOffset ? resizeZoneOffset.height : zone.height;

          return (
            <div
              key={zone.id}
              style={{
                left: `${zone.x}px`,
                top: `${zone.y}px`,
                width: `${currentWidth}px`,
                height: `${currentHeight}px`,
                backgroundColor: zone.color,
              }}
              className={`absolute rounded-3xl border-2 border-dashed border-slate-300/80 pointer-events-none p-5 flex flex-col justify-between group/zone ${
                isResizing ? 'ring-2 ring-blue-500/40 border-blue-400' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-700 bg-white/80 px-3 py-1 rounded-full shadow-xs border border-slate-200">
                    {zone.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover/zone:opacity-100 transition-opacity">
                    {currentWidth} × {currentHeight}px
                  </span>
                </div>
                {zone.description && (
                  <p className="text-xs text-slate-500 mt-2 ml-1 font-medium">
                    {zone.description}
                  </p>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-widest text-right">
                WHITEBOARD ZONE
              </div>

              {/* Resize Handle at Bottom-Right */}
              <div
                title="Drag to resize zone"
                onPointerDown={(e) => handleZoneResizeStart(e, zone)}
                className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-white border-2 border-slate-300 hover:border-blue-500 shadow-md flex items-center justify-center cursor-se-resize pointer-events-auto transition-transform hover:scale-115 text-slate-400 hover:text-blue-600 no-pan z-20 group"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400 group-hover:text-blue-600">
                  <path d="M10 2L10 10L2 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          );
        })}

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
