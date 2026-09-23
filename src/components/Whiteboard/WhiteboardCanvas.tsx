import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Project, WhiteboardZone, DrawingStroke, WhiteboardImage } from '../../types';
import { ProjectCard } from './ProjectCard';
import { WhiteboardImageCard } from './WhiteboardImageCard';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Move,
  Hand,
  Pen,
  ImagePlus,
  Undo2,
  Trash2,
} from 'lucide-react';

interface WhiteboardCanvasProps {
  projects: Project[];
  zones?: WhiteboardZone[];
  drawings?: DrawingStroke[];
  images?: WhiteboardImage[];
  onUpdateProjectPosition: (id: string, x: number, y: number) => void;
  onOpenProject: (project: Project) => void;
  onQuickUpdate: (project: Project) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onTogglePin?: (id: string, e: React.MouseEvent) => void;
  onCanvasDoubleClick?: (x: number, y: number) => void;
  onUpdateZone?: (zoneId: string, updates: { x?: number; y?: number; width?: number; height?: number }) => void;
  onUpdateDrawings?: (drawings: DrawingStroke[]) => void;
  onUpdateImages?: (images: WhiteboardImage[]) => void;
}

// Convert points array to a smooth SVG path string
function pointsToSvgPath(points: { x: number; y: number }[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    d += ` Q ${p0.x} ${p0.y}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

const PENCIL_COLORS = [
  { value: '#1e293b', label: 'Kömür Siyahı' },
  { value: '#2563eb', label: 'Mavi' },
  { value: '#dc2626', label: 'Kırmızı' },
  { value: '#16a34a', label: 'Yeşil' },
  { value: '#d97706', label: 'Kehribar' },
  { value: '#db2777', label: 'Pembe' },
];

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  projects,
  zones = [],
  drawings = [],
  images = [],
  onUpdateProjectPosition,
  onOpenProject,
  onQuickUpdate,
  onDeleteProject,
  onTogglePin,
  onCanvasDoubleClick,
  onUpdateZone,
  onUpdateDrawings,
  onUpdateImages,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [zoom, setZoom] = useState<number>(0.95);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const snapToGridRef = useRef(snapToGrid);
  snapToGridRef.current = snapToGrid;

  // Tool selection: 'hand' (pan/select) vs 'pencil' (draw)
  const [activeTool, setActiveTool] = useState<'hand' | 'pencil'>('hand');
  const [pencilColor, setPencilColor] = useState<string>('#1e293b');
  const [pencilWidth, setPencilWidth] = useState<number>(3);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);

  // Active interaction states for visual indicators
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
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

  // Pointer down on canvas (start pan OR start drawing)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('.no-pan') || target.closest('button') || target.closest('input')) {
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // PENCIL TOOL: Draw freehand strokes
    if (activeTool === 'pencil') {
      if (target.closest('.group') || target.closest('.resize-handle')) {
        return;
      }

      setIsDrawing(true);
      const startWorldX = Math.round((e.clientX - rect.left - pan.x) / zoom);
      const startWorldY = Math.round((e.clientY - rect.top - pan.y) / zoom);

      let strokePoints = [{ x: startWorldX, y: startWorldY }];
      setCurrentStroke(strokePoints);

      const onDrawMove = (ev: PointerEvent) => {
        const currentWorldX = Math.round((ev.clientX - rect.left - pan.x) / zoom);
        const currentWorldY = Math.round((ev.clientY - rect.top - pan.y) / zoom);

        const lastPoint = strokePoints[strokePoints.length - 1];
        const dist = Math.hypot(currentWorldX - lastPoint.x, currentWorldY - lastPoint.y);
        if (dist >= 2) {
          strokePoints = [...strokePoints, { x: currentWorldX, y: currentWorldY }];
          setCurrentStroke(strokePoints);
        }
      };

      const onDrawUp = () => {
        setIsDrawing(false);
        window.removeEventListener('pointermove', onDrawMove);
        window.removeEventListener('pointerup', onDrawUp);

        if (strokePoints.length > 0 && onUpdateDrawings) {
          const newStroke: DrawingStroke = {
            id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            points: strokePoints,
            color: pencilColor,
            width: pencilWidth,
          };
          onUpdateDrawings([...drawings, newStroke]);
        }
        setCurrentStroke(null);
      };

      window.addEventListener('pointermove', onDrawMove);
      window.addEventListener('pointerup', onDrawUp);
      return;
    }

    // HAND TOOL: Pan the whiteboard canvas
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

  // Process an image file from clipboard paste or file picker
  const processImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        let width = img.width || 320;
        let height = img.height || 220;
        const maxDim = 380;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const rect = containerRef.current?.getBoundingClientRect();
        const viewW = rect?.width || window.innerWidth;
        const viewH = rect?.height || window.innerHeight;
        const spawnX = Math.round((viewW / 2 - pan.x) / zoom - width / 2);
        const spawnY = Math.round((viewH / 2 - pan.y) / zoom - height / 2);

        const newImage: WhiteboardImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          dataUrl,
          x: spawnX,
          y: spawnY,
          width,
          height,
          createdAt: new Date().toISOString(),
        };

        if (onUpdateImages) {
          onUpdateImages([...images, newImage]);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [pan, zoom, images, onUpdateImages]);

  // Global clipboard paste listener for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImageFile]);

  // Drawing undo & clear handlers
  const handleUndoDrawing = useCallback(() => {
    if (drawings.length > 0 && onUpdateDrawings) {
      onUpdateDrawings(drawings.slice(0, -1));
    }
  }, [drawings, onUpdateDrawings]);

  const handleClearDrawings = useCallback(() => {
    if (drawings.length > 0 && onUpdateDrawings) {
      if (window.confirm('Tüm çizimleri temizlemek istediğinize emin misiniz?')) {
        onUpdateDrawings([]);
      }
    }
  }, [drawings, onUpdateDrawings]);

  // Keyboard shortcut: Ctrl+Z for undoing strokes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        if (drawings.length > 0) {
          e.preventDefault();
          handleUndoDrawing();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawings, handleUndoDrawing]);

  // Image manipulation handlers
  const handleImageMove = (id: string, x: number, y: number) => {
    if (!onUpdateImages) return;
    onUpdateImages(images.map((img) => img.id === id ? { ...img, x, y } : img));
  };

  const handleImageResize = (id: string, width: number, height: number) => {
    if (!onUpdateImages) return;
    onUpdateImages(images.map((img) => img.id === id ? { ...img, width, height } : img));
  };

  const handleImageDelete = (id: string) => {
    if (!onUpdateImages) return;
    onUpdateImages(images.filter((img) => img.id !== id));
  };

  const handleImageTogglePin = (id: string) => {
    if (!onUpdateImages) return;
    onUpdateImages(images.map((img) => img.id === id ? { ...img, pinned: !img.pinned } : img));
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
      const currentZoom = zoomRef.current;
      const dx = (ev.clientX - startX) / currentZoom;
      const dy = (ev.clientY - startY) / currentZoom;

      if (!hasMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        hasMoved = true;
      }

      if (hasMoved) {
        let newX = initialProjX + dx;
        let newY = initialProjY + dy;

        if (snapToGridRef.current) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        } else {
          newX = Math.round(newX);
          newY = Math.round(newY);
        }

        lastX = newX;
        lastY = newY;
        setDragOffset({ id: project.id, x: newX, y: newY });
      }
    };

    const onCardUp = () => {
      setActiveCardId(null);
      setDragOffset(null);
      window.removeEventListener('pointermove', onCardMove);
      window.removeEventListener('pointerup', onCardUp);

      if (hasMoved) {
        onUpdateProjectPosition(project.id, lastX, lastY);
      }
    };

    window.addEventListener('pointermove', onCardMove);
    window.addEventListener('pointerup', onCardUp);
  };

  // Start dragging / moving the entire zone
  const handleZoneDragStart = (e: React.PointerEvent, zone: WhiteboardZone) => {
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialZoneX = zone.x;
    const initialZoneY = zone.y;
    let hasMoved = false;
    let lastX = initialZoneX;
    let lastY = initialZoneY;

    setActiveDragZoneId(zone.id);

    const onZoneMove = (ev: PointerEvent) => {
      const currentZoom = zoomRef.current;
      const dx = (ev.clientX - startX) / currentZoom;
      const dy = (ev.clientY - startY) / currentZoom;

      if (!hasMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        hasMoved = true;
      }

      if (hasMoved) {
        let newX = initialZoneX + dx;
        let newY = initialZoneY + dy;

        if (snapToGridRef.current) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        } else {
          newX = Math.round(newX);
          newY = Math.round(newY);
        }

        lastX = newX;
        lastY = newY;
        setDragZoneOffset({ id: zone.id, x: newX, y: newY });
      }
    };

    const onZoneUp = () => {
      setActiveDragZoneId(null);
      setDragZoneOffset(null);
      window.removeEventListener('pointermove', onZoneMove);
      window.removeEventListener('pointerup', onZoneUp);

      if (hasMoved && onUpdateZone) {
        onUpdateZone(zone.id, { x: lastX, y: lastY });
      }
    };

    window.addEventListener('pointermove', onZoneMove);
    window.addEventListener('pointerup', onZoneUp);
  };

  // Start resizing a zone from any of the 4 corners: 'nw', 'ne', 'se', 'sw'
  const handleZoneResizeStart = (
    e: React.PointerEvent,
    zone: WhiteboardZone,
    corner: 'nw' | 'ne' | 'se' | 'sw'
  ) => {
    e.stopPropagation();

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = zone.x;
    const startY = zone.y;
    const startWidth = zone.width;
    const startHeight = zone.height;

    setActiveResizeZoneId(zone.id);

    let finalX = startX;
    let finalY = startY;
    let finalWidth = startWidth;
    let finalHeight = startHeight;

    const onZoneResizeMove = (ev: PointerEvent) => {
      const currentZoom = zoomRef.current;
      const dx = (ev.clientX - startClientX) / currentZoom;
      const dy = (ev.clientY - startClientY) / currentZoom;

      let newX = startX;
      let newY = startY;
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (corner === 'se') {
        newWidth = Math.max(300, startWidth + dx);
        newHeight = Math.max(200, startHeight + dy);
      } else if (corner === 'ne') {
        newWidth = Math.max(300, startWidth + dx);
        const attemptedHeight = startHeight - dy;
        if (attemptedHeight >= 200) {
          newHeight = attemptedHeight;
          newY = startY + dy;
        } else {
          newHeight = 200;
          newY = startY + (startHeight - 200);
        }
      } else if (corner === 'sw') {
        newHeight = Math.max(200, startHeight + dy);
        const attemptedWidth = startWidth - dx;
        if (attemptedWidth >= 300) {
          newWidth = attemptedWidth;
          newX = startX + dx;
        } else {
          newWidth = 300;
          newX = startX + (startWidth - 300);
        }
      } else if (corner === 'nw') {
        const attemptedWidth = startWidth - dx;
        if (attemptedWidth >= 300) {
          newWidth = attemptedWidth;
          newX = startX + dx;
        } else {
          newWidth = 300;
          newX = startX + (startWidth - 300);
        }

        const attemptedHeight = startHeight - dy;
        if (attemptedHeight >= 200) {
          newHeight = attemptedHeight;
          newY = startY + dy;
        } else {
          newHeight = 200;
          newY = startY + (startHeight - 200);
        }
      }

      if (snapToGridRef.current) {
        newWidth = Math.round(newWidth / 20) * 20;
        newHeight = Math.round(newHeight / 20) * 20;
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      } else {
        newWidth = Math.round(newWidth);
        newHeight = Math.round(newHeight);
        newX = Math.round(newX);
        newY = Math.round(newY);
      }

      finalX = newX;
      finalY = newY;
      finalWidth = newWidth;
      finalHeight = newHeight;

      setResizeZoneOffset({
        id: zone.id,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    };

    const onZoneResizeUp = () => {
      window.removeEventListener('pointermove', onZoneResizeMove);
      window.removeEventListener('pointerup', onZoneResizeUp);

      if (onUpdateZone) {
        onUpdateZone(zone.id, {
          x: finalX,
          y: finalY,
          width: finalWidth,
          height: finalHeight,
        });
      }

      setActiveResizeZoneId(null);
      setResizeZoneOffset(null);
    };

    window.addEventListener('pointermove', onZoneResizeMove);
    window.addEventListener('pointerup', onZoneResizeUp);
  };

  // Double click canvas to add new project right here
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (activeTool !== 'hand') return;
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
      className={`relative w-full h-full overflow-hidden bg-dot-grid select-none ${
        activeTool === 'pencil'
          ? isDrawing
            ? 'cursor-crosshair'
            : 'cursor-crosshair hover:cursor-crosshair'
          : isPanning
          ? 'cursor-grabbing'
          : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processImageFile(file);
            e.target.value = '';
          }
        }}
      />

      {/* Transformable Canvas Layer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute top-0 left-0 w-[8000px] h-[8000px] pointer-events-auto"
      >
        {/* 1. Background Whiteboard Zones */}
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
              className={`absolute rounded-3xl border-2 border-dashed border-slate-300/70 p-5 pointer-events-auto select-none group/zone transition-colors ${
                isDraggingZone ? 'ring-2 ring-blue-400 border-blue-400 z-10 shadow-lg' : ''
              } ${isResizing ? 'ring-2 ring-amber-400 border-amber-400 z-10' : ''}`}
            >
              {/* Zone Header Banner with Move Drag Handle */}
              <div className="flex items-center justify-between border-b border-black/5 pb-2 mb-2 select-none">
                <div className="flex items-center gap-2">
                  <div
                    onPointerDown={(e) => handleZoneDragStart(e, zone)}
                    title="Alanı Panoda Taşı"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-black/5 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <Move size={14} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-tight text-slate-700">
                      {zone.title}
                    </h2>
                    {zone.description && (
                      <p className="text-[11px] text-slate-500 font-medium">
                        {zone.description}
                      </p>
                    )}
                  </div>
                </div>

                {isResizing && (
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full shadow-2xs">
                    {Math.round(currentWidth)} × {Math.round(currentHeight)}px
                  </span>
                )}
              </div>

              {/* 4-Corner Resizing Handles */}
              <div
                onPointerDown={(e) => handleZoneResizeStart(e, zone, 'ne')}
                title="Sağ Üstten Boyutlandır"
                className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full cursor-ne-resize opacity-0 group-hover/zone:opacity-100 hover:scale-125 hover:border-blue-500 transition-all z-20 shadow-xs"
              />
              <div
                onPointerDown={(e) => handleZoneResizeStart(e, zone, 'se')}
                title="Sağ Alttan Boyutlandır"
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full cursor-se-resize opacity-0 group-hover/zone:opacity-100 hover:scale-125 hover:border-blue-500 transition-all z-20 shadow-xs"
              />
              <div
                onPointerDown={(e) => handleZoneResizeStart(e, zone, 'nw')}
                title="Sol Üstten Boyutlandır"
                className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full cursor-nw-resize opacity-0 group-hover/zone:opacity-100 hover:scale-125 hover:border-blue-500 transition-all z-20 shadow-xs"
              />
              <div
                onPointerDown={(e) => handleZoneResizeStart(e, zone, 'sw')}
                title="Sol Alttan Boyutlandır"
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full cursor-sw-resize opacity-0 group-hover/zone:opacity-100 hover:scale-125 hover:border-blue-500 transition-all z-20 shadow-xs"
              />
            </div>
          );
        })}

        {/* 2. Freehand SVG Drawings Layer */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-5 overflow-visible">
          {drawings.map((stroke) => (
            <path
              key={stroke.id}
              d={pointsToSvgPath(stroke.points)}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.88}
            />
          ))}
          {currentStroke && currentStroke.length > 0 && (
            <path
              d={pointsToSvgPath(currentStroke)}
              stroke={pencilColor}
              strokeWidth={pencilWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.92}
            />
          )}
        </svg>

        {/* 3. Pasted Images Layer */}
        {images.map((img) => (
          <WhiteboardImageCard
            key={img.id}
            image={img}
            zoom={zoom}
            onMove={handleImageMove}
            onResize={handleImageResize}
            onDelete={handleImageDelete}
            onTogglePin={handleImageTogglePin}
          />
        ))}

        {/* 4. Project Cards Layer */}
        {projects.map((project) => {
          const isBeingDragged = activeCardId === project.id;
          const currentPos = isBeingDragged && dragOffset ? { x: dragOffset.x, y: dragOffset.y } : project.position;

          return (
            <div
              key={project.id}
              style={{
                position: 'absolute',
                left: `${currentPos.x}px`,
                top: `${currentPos.y}px`,
                width: '320px',
                zIndex: isBeingDragged ? 50 : 20,
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
        {/* Tool Switcher: Hand vs Pencil */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTool('hand')}
            title="Taşı / Seçim Modu (El)"
            className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              activeTool === 'hand'
                ? 'bg-white text-blue-600 shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hand size={15} />
            <span className="hidden sm:inline">Taşı</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('pencil')}
            title="Serbest Çizim / Kalem Modu"
            className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              activeTool === 'pencil'
                ? 'bg-white text-blue-600 shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pen size={15} />
            <span className="hidden sm:inline">Kalem</span>
          </button>
        </div>

        {/* Add Image Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Resim Ekle (veya doğrudan panoya Ctrl+V ile yapıştır)"
          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
        >
          <ImagePlus size={16} />
          <span className="hidden md:inline">Resim</span>
        </button>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Zoom Controls */}
        <button
          type="button"
          onClick={() => handleZoom(-0.15)}
          title="Uzaklaş"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ZoomOut size={16} />
        </button>

        <span className="text-xs font-mono font-medium text-slate-700 min-w-10 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => handleZoom(0.15)}
          title="Yakınlaş"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={handleResetView}
          title="Görünümü Sıfırla"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RotateCcw size={15} />
        </button>

        <button
          type="button"
          onClick={() => setSnapToGrid(!snapToGrid)}
          title={snapToGrid ? 'Izgaraya Hizala: AÇIK' : 'Izgaraya Hizala: KAPALI'}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            snapToGrid ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Grid size={15} />
        </button>
      </div>

      {/* Pencil Sub-Toolbar (Floats above main toolbar when pencil tool is active) */}
      {activeTool === 'pencil' && (
        <div className="absolute bottom-20 right-6 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-slate-200/90 no-pan z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Colors */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
            {PENCIL_COLORS.map((col) => (
              <button
                key={col.value}
                type="button"
                onClick={() => setPencilColor(col.value)}
                title={col.label}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                  pencilColor === col.value
                    ? 'scale-125 ring-2 ring-blue-500 ring-offset-1 shadow-xs'
                    : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: col.value }}
              />
            ))}
          </div>

          {/* Stroke Widths */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setPencilWidth(w)}
                title={w === 2 ? 'İnce çizgi' : w === 4 ? 'Normal çizgi' : 'Kalın çizgi'}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  pencilWidth === w ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {w === 2 ? '2px' : w === 4 ? '4px' : '8px'}
              </button>
            ))}
          </div>

          {/* Undo Drawing */}
          <button
            type="button"
            onClick={handleUndoDrawing}
            disabled={!drawings || drawings.length === 0}
            title="Son Çizimi Geri Al (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Undo2 size={15} />
          </button>

          {/* Clear Drawings */}
          <button
            type="button"
            onClick={handleClearDrawings}
            disabled={!drawings || drawings.length === 0}
            title="Tüm Çizimleri Temizle"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      {/* Helper hint pill (Bottom Left) */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 text-xs text-slate-500 pointer-events-none z-30">
        <Move size={13} className="text-slate-400" />
        {activeTool === 'pencil' ? (
          <span>Kalem modu aktif • Çizim yapmak için sürükle • Ctrl+Z ile geri al</span>
        ) : (
          <span>Pano sürükleme aktif • Çift tıklama kart ekler • Ctrl+V ile resim yapıştır</span>
        )}
      </div>
    </div>
  );
};
