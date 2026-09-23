import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Project, WhiteboardZone } from '../../types';
import { ProjectCard } from './ProjectCard';
import { ZoomIn, ZoomOut, RotateCcw, Grid, Move, LayoutGrid } from 'lucide-react';

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
  onUpdateZone?: (zoneId: string, updates: { x?: number; y?: number; width?: number; height?: number }) => void;
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
  
  // Zone drag (movement) & 4-corner resize states
  const [activeDragZoneId, setActiveDragZoneId] = useState<string | null>(null);
  const [dragZoneOffset, setDragZoneOffset] = useState<{ id: string; x: number; y: number } | null>(null);
  const [activeResizeZoneId, setActiveResizeZoneId] = useState<string | null>(null);
  const [resizeZoneOffset, setResizeZoneOffset] = useState<{ id: string; x: number; y: number; width: number; height: number } | null>(null);

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

  // Start dragging / moving the entire zone
  const handleZoneDragStart = (e: React.PointerEvent, zone: WhiteboardZone) => {
    e.stopPropagation();
    setActiveDragZoneId(zone.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = zone.x;
    const initialY = zone.y;
    let lastX = initialX;
    let lastY = initialY;

    const onZoneDragMove = (ev: PointerEvent) => {
      const curZoom = zoomRef.current;
      const dx = (ev.clientX - startX) / curZoom;
      const dy = (ev.clientY - startY) / curZoom;

      let newX = Math.round(initialX + dx);
      let newY = Math.round(initialY + dy);

      if (snapToGridRef.current) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      }

      lastX = newX;
      lastY = newY;
      setDragZoneOffset({ id: zone.id, x: newX, y: newY });
    };

    const onZoneDragUp = () => {
      window.removeEventListener('pointermove', onZoneDragMove);
      window.removeEventListener('pointerup', onZoneDragUp);

      onUpdateZone?.(zone.id, { x: lastX, y: lastY });

      setActiveDragZoneId(null);
      setDragZoneOffset(null);
    };

    window.addEventListener('pointermove', onZoneDragMove);
    window.addEventListener('pointerup', onZoneDragUp);
  };

  // Start resizing a zone from any of the 4 corners: 'nw', 'ne', 'se', 'sw'
  const handleZoneResizeStart = (
    e: React.PointerEvent,
    zone: WhiteboardZone,
    corner: 'nw' | 'ne' | 'se' | 'sw'
  ) => {
    e.stopPropagation();
    setActiveResizeZoneId(zone.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = zone.x;
    const initialY = zone.y;
    const initialWidth = zone.width;
    const initialHeight = zone.height;

    let finalUpdates = { x: initialX, y: initialY, width: initialWidth, height: initialHeight };

    const onZoneResizeMove = (ev: PointerEvent) => {
      const curZoom = zoomRef.current;
      const dx = (ev.clientX - startX) / curZoom;
      const dy = (ev.clientY - startY) / curZoom;

      let newX = initialX;
      let newY = initialY;
      let newW = initialWidth;
      let newH = initialHeight;

      if (corner === 'se') {
        // Bottom-Right
        newW = Math.max(280, initialWidth + dx);
        newH = Math.max(180, initialHeight + dy);
      } else if (corner === 'ne') {
        // Top-Right
        newW = Math.max(280, initialWidth + dx);
        const proposedH = initialHeight - dy;
        if (proposedH >= 180) {
          newY = initialY + dy;
          newH = proposedH;
        } else {
          newH = 180;
          newY = initialY + initialHeight - 180;
        }
      } else if (corner === 'sw') {
        // Bottom-Left
        newH = Math.max(180, initialHeight + dy);
        const proposedW = initialWidth - dx;
        if (proposedW >= 280) {
          newX = initialX + dx;
          newW = proposedW;
        } else {
          newW = 280;
          newX = initialX + initialWidth - 280;
        }
      } else if (corner === 'nw') {
        // Top-Left
        const proposedW = initialWidth - dx;
        const proposedH = initialHeight - dy;
        if (proposedW >= 280) {
          newX = initialX + dx;
          newW = proposedW;
        } else {
          newW = 280;
          newX = initialX + initialWidth - 280;
        }
        if (proposedH >= 180) {
          newY = initialY + dy;
          newH = proposedH;
        } else {
          newH = 180;
          newY = initialY + initialHeight - 180;
        }
      }

      if (snapToGridRef.current) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
        newW = Math.round(newW / 20) * 20;
        newH = Math.round(newH / 20) * 20;
      }

      finalUpdates = { x: newX, y: newY, width: newW, height: newH };
      setResizeZoneOffset({ id: zone.id, ...finalUpdates });
    };

    const onZoneResizeUp = () => {
      window.removeEventListener('pointermove', onZoneResizeMove);
      window.removeEventListener('pointerup', onZoneResizeUp);

      onUpdateZone?.(zone.id, finalUpdates);

      setActiveResizeZoneId(null);
      setResizeZoneOffset(null);
    };

    window.addEventListener('pointermove', onZoneResizeMove);
    window.addEventListener('pointerup', onZoneResizeUp);
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
          const isDraggingZone = activeDragZoneId === zone.id;

          const currentX = isDraggingZone && dragZoneOffset ? dragZoneOffset.x : (isResizing && resizeZoneOffset ? resizeZoneOffset.x : zone.x);
          const currentY = isDraggingZone && dragZoneOffset ? dragZoneOffset.y : (isResizing && resizeZoneOffset ? resizeZoneOffset.y : zone.y);
          const currentWidth = isResizing && resizeZoneOffset ? resizeZoneOffset.width : zone.width;
          const currentHeight = isResizing && resizeZoneOffset ? resizeZoneOffset.height : zone.height;

          return (
            <div
              key={zone.id}
              style={{
                left: `${currentX}px`,
                top: `${currentY}px`,
                width: `${currentWidth}px`,
                height: `${currentHeight}px`,
                backgroundColor: zone.color,
              }}
              className={`absolute rounded-3xl border-2 border-dashed border-slate-300/80 pointer-events-none p-5 flex flex-col justify-between group/zone ${
                isResizing || isDraggingZone ? 'ring-2 ring-blue-500/50 border-blue-400' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  {/* Draggable Zone Header */}
                  <div
                    title="Tut ve sürükle (Alanı Taşı)"
                    onPointerDown={(e) => handleZoneDragStart(e, zone)}
                    className="pointer-events-auto cursor-grab active:cursor-grabbing flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-xs border border-slate-200 hover:border-blue-400 hover:bg-blue-50/70 transition-all select-none no-pan"
                  >
                    <Move size={13} className="text-slate-400 group-hover/zone:text-blue-600" />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      {zone.title}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover/zone:opacity-100 transition-opacity select-none">
                    {currentWidth} × {currentHeight}px
                  </span>
                </div>

                {zone.description && (
                  <p className="text-xs text-slate-500 mt-2 ml-1 font-medium select-none">
                    {zone.description}
                  </p>
                )}
              </div>

              <div className="text-[10px] text-slate-400 font-mono tracking-widest text-right select-none">
                WHITEBOARD ZONE
              </div>

              {/* 4 Corner Resize Handles */}
              {/* Top-Right (NE) */}
              <div
                title="Sağ Üstten Boyutlandır"
                onPointerDown={(e) => handleZoneResizeStart(e, zone, 'ne')}
                className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white border-2 border-slate-300 hover:border-blue-500 shadow-md flex items-center justify-center cursor-nesw-resize pointer-events-auto transition-transform hover:scale-115 text-slate-400 hover:text-blue-600 no-pan z-20 group"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-slate-400 group-hover:text-blue-600">
                  <path d="M8 8L8 2L2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Bottom-Right (SE) */}
              <div
                title="Sağ Alttan Boyutlandır"
                onPointerDown={(e) => handleZoneResizeStart(e, zone, 'se')}
                className="absolute -bottom-3 -right-3 w-7 h-7 rounded-full bg-white border-2 border-slate-300 hover:border-blue-500 shadow-md flex items-center justify-center cursor-nwse-resize pointer-events-auto transition-transform hover:scale-115 text-slate-400 hover:text-blue-600 no-pan z-20 group"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-slate-400 group-hover:text-blue-600">
                  <path d="M8 2L8 8L2 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Top-Left (NW) */}
              <div
                title="Sol Üstten Boyutlandır"
                onPointerDown={(e) => handleZoneResizeStart(e, zone, 'nw')}
                className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-white border-2 border-slate-300 hover:border-blue-500 shadow-md flex items-center justify-center cursor-nwse-resize pointer-events-auto transition-transform hover:scale-115 text-slate-400 hover:text-blue-600 no-pan z-20 group"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-slate-400 group-hover:text-blue-600">
                  <path d="M2 8L2 2L8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Bottom-Left (SW) */}
              <div
                title="Sol Alttan Boyutlandır"
                onPointerDown={(e) => handleZoneResizeStart(e, zone, 'sw')}
                className="absolute -bottom-3 -left-3 w-7 h-7 rounded-full bg-white border-2 border-slate-300 hover:border-blue-500 shadow-md flex items-center justify-center cursor-nesw-resize pointer-events-auto transition-transform hover:scale-115 text-slate-400 hover:text-blue-600 no-pan z-20 group"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-slate-400 group-hover:text-blue-600">
                  <path d="M2 2L2 8L8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
          title="Panoyu Düzenle"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <LayoutGrid size={13} className="text-slate-500" />
          <span>Düzenle</span>
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
