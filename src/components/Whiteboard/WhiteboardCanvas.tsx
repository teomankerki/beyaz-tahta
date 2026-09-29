import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Project, WhiteboardZone, DrawingStroke, WhiteboardImage, Category, CanvasTool, BoardItemType, TableData } from '../../types';
import { ProjectCard } from './ProjectCard';
import { WhiteboardImageCard } from './WhiteboardImageCard';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Move,
  Hand,
  MousePointer,
  Pen,
  Eraser,
  ImagePlus,
  Plus,
  Rocket,
  StickyNote,
  Link2,
  Table2,
  Type,
  Frame,
  Undo2,
  Trash2,
} from 'lucide-react';

interface WhiteboardCanvasProps {
  projects: Project[];
  categories?: Category[];
  zones?: WhiteboardZone[];
  drawings?: DrawingStroke[];
  images?: WhiteboardImage[];
  onUpdateProjectPosition: (id: string, x: number, y: number) => void;
  onOpenProject: (project: Project) => void;
  onQuickUpdate: (project: Project) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onTogglePin?: (id: string, e: React.MouseEvent) => void;
  onToggleTodo?: (projectId: string, todoId: string) => void;
  onAddTodo?: (projectId: string, title: string) => void;
  onDeleteTodo?: (projectId: string, todoId: string) => void;
  onUpdateNote?: (projectId: string, newNote: string) => void;
  onAddLink?: (projectId: string, title: string, url: string) => void;
  onDeleteLink?: (projectId: string, linkId: string) => void;
  onUpdateTable?: (projectId: string, tableData: TableData) => void;
  onCanvasDoubleClick?: (x: number, y: number, itemType?: BoardItemType) => void;
  onAddZone?: (zone: WhiteboardZone) => void;
  onUpdateZone?: (
    zoneId: string,
    updates: { x?: number; y?: number; width?: number; height?: number; title?: string; description?: string; color?: string },
    movedItems?: { dx: number; dy: number; zoneIds?: string[]; projectIds: string[]; imageIds?: string[] }
  ) => void;
  onDeleteZone?: (zoneId: string) => void;
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

// Point-to-segment distance for smooth stroke erasing
function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function strokeHitsEraser(stroke: DrawingStroke, ex: number, ey: number, radius: number): boolean {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return false;
  const threshold = radius + (stroke.width || 3) / 2;
  if (pts.length === 1) {
    return Math.hypot(pts[0].x - ex, pts[0].y - ey) <= threshold;
  }
  for (let i = 1; i < pts.length; i++) {
    if (distanceToSegment(ex, ey, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= threshold) {
      return true;
    }
  }
  return false;
}

const PENCIL_COLORS = [
  { value: '#1e293b', label: 'Kömür Siyahı' },
  { value: '#2563eb', label: 'Mavi' },
  { value: '#dc2626', label: 'Kırmızı' },
  { value: '#16a34a', label: 'Yeşil' },
  { value: '#d97706', label: 'Kehribar' },
  { value: '#db2777', label: 'Pembe' },
];

const FRAME_COLORS = [
  { value: 'rgba(100, 116, 139, 0.06)', dot: '#64748b', label: 'Arduvaz' },
  { value: 'rgba(59, 130, 246, 0.06)', dot: '#3b82f6', label: 'Mavi' },
  { value: 'rgba(16, 185, 129, 0.06)', dot: '#10b981', label: 'Zümrüt' },
  { value: 'rgba(245, 158, 11, 0.06)', dot: '#f59e0b', label: 'Kehribar' },
  { value: 'rgba(168, 85, 247, 0.06)', dot: '#a855f7', label: 'Mor' },
  { value: 'rgba(244, 63, 94, 0.06)', dot: '#f43f5e', label: 'Mercan' },
];

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  projects,
  categories = [],
  zones = [],
  drawings = [],
  images = [],
  onUpdateProjectPosition,
  onOpenProject,
  onQuickUpdate,
  onDeleteProject,
  onTogglePin,
  onToggleTodo,
  onAddTodo,
  onDeleteTodo,
  onUpdateNote,
  onAddLink,
  onDeleteLink,
  onUpdateTable,
  onCanvasDoubleClick,
  onAddZone,
  onUpdateZone,
  onDeleteZone,
  onUpdateDrawings,
  onUpdateImages,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [zoom, setZoom] = useState<number>(0.95);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const snapToGridRef = useRef(snapToGrid);
  snapToGridRef.current = snapToGrid;

  const drawingsRef = useRef(drawings);
  drawingsRef.current = drawings;

  // Tool selection: 'hand' (T), 'pointer' (P), 'pencil' (K), 'eraser' (S)
  const [activeTool, setActiveTool] = useState<CanvasTool>('pointer');
  const [pencilColor, setPencilColor] = useState<string>('#1e293b');
  const [pencilWidth, setPencilWidth] = useState<number>(3);
  const [eraserSize, setEraserSize] = useState<number>(20);
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);

  // Active interaction states for visual indicators
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ id: string; x: number; y: number } | null>(null);
  
  // Zone drag (movement) & 4-corner resize states
  const [activeDragZoneId, setActiveDragZoneId] = useState<string | null>(null);
  const [dragZoneOffset, setDragZoneOffset] = useState<{
    id: string;
    x: number;
    y: number;
    dx: number;
    dy: number;
    zoneIds: string[];
    projectIds: string[];
    imageIds: string[];
  } | null>(null);
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

  // Pointer down on canvas (start pan OR start drawing OR start erasing)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('.no-pan') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // ERASER TOOL: Erase strokes touched by eraser circle
    if (activeTool === 'eraser' && e.button === 0) {
      if (target.closest('.group') || target.closest('.resize-handle')) {
        return;
      }

      setIsDrawing(true);

      const eraseAtClientPos = (clientX: number, clientY: number) => {
        const worldX = Math.round((clientX - rect.left - pan.x) / zoom);
        const worldY = Math.round((clientY - rect.top - pan.y) / zoom);
        setEraserPos({ x: worldX, y: worldY });

        const currentDrawings = drawingsRef.current;
        if (!currentDrawings || currentDrawings.length === 0 || !onUpdateDrawings) return;

        const remaining = currentDrawings.filter(
          (stroke) => !strokeHitsEraser(stroke, worldX, worldY, eraserSize)
        );
        if (remaining.length !== currentDrawings.length) {
          drawingsRef.current = remaining;
          onUpdateDrawings(remaining);
        }
      };

      eraseAtClientPos(e.clientX, e.clientY);

      const onEraseMove = (ev: PointerEvent) => {
        eraseAtClientPos(ev.clientX, ev.clientY);
      };

      const onEraseUp = () => {
        setIsDrawing(false);
        setEraserPos(null);
        window.removeEventListener('pointermove', onEraseMove);
        window.removeEventListener('pointerup', onEraseUp);
      };

      window.addEventListener('pointermove', onEraseMove);
      window.addEventListener('pointerup', onEraseUp);
      return;
    }

    // PENCIL TOOL: Draw freehand strokes
    if (activeTool === 'pencil' && e.button === 0) {
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
          onUpdateDrawings([...drawingsRef.current, newStroke]);
        }
        setCurrentStroke(null);
      };

      window.addEventListener('pointermove', onDrawMove);
      window.addEventListener('pointerup', onDrawUp);
      return;
    }

    // TEXT TOOL: Click anywhere on canvas to immediately place a simple text box
    if (activeTool === 'text' && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      if (!containerRef.current || !onCanvasDoubleClick) return;
      const worldX = Math.round((e.clientX - rect.left - pan.x) / zoom);
      const worldY = Math.round((e.clientY - rect.top - pan.y) / zoom);
      onCanvasDoubleClick(worldX, worldY, 'text');
      setActiveTool('pointer');
      return;
    }

    // POINTER TOOL: Do not pan on left-click drag on empty canvas (middle-click still pans)
    if (activeTool === 'pointer' && e.button === 0) {
      return;
    }

    // HAND TOOL (or middle mouse button): Pan the whiteboard canvas
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
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

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
      onUpdateDrawings([]);
    }
  }, [drawings, onUpdateDrawings]);

  // Keyboard shortcuts: H (Hand/El), P (Pointer/İmleç), T (Text/Metin), K (Pencil/Kalem), S/E (Eraser/Silgi), Ctrl+Z (Undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const activeTag = (activeEl?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || activeEl?.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        if (drawings.length > 0) {
          e.preventDefault();
          handleUndoDrawing();
        }
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'h') {
          e.preventDefault();
          setActiveTool('hand');
        } else if (key === 'p') {
          e.preventDefault();
          setActiveTool('pointer');
        } else if (key === 't') {
          e.preventDefault();
          setActiveTool('text');
        } else if (key === 'k') {
          e.preventDefault();
          setActiveTool('pencil');
        } else if (key === 's' || key === 'e') {
          e.preventDefault();
          setActiveTool('eraser');
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

  // Start dragging / moving the entire zone or frame along with all zones/items inside it
  const handleZoneDragStart = (e: React.PointerEvent, zone: WhiteboardZone) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialZoneX = zone.x;
    const initialZoneY = zone.y;
    let hasMoved = false;
    let lastX = initialZoneX;
    let lastY = initialZoneY;

    // 1. If this is a Frame (or larger outer container), find any Category Zones encompassed inside it
    const attachedZones = zones.filter((other) => {
      if (other.id === zone.id) return false;
      // A Frame encompasses non-frame Category Zones (or smaller frames) inside its bounds
      if (!zone.isFrame && other.isFrame) return false;
      if (!zone.isFrame && zone.width * zone.height <= other.width * other.height) return false;

      const otherCenterX = other.x + other.width / 2;
      const otherCenterY = other.y + other.height / 2;
      return (
        (otherCenterX >= zone.x &&
          otherCenterX <= zone.x + zone.width &&
          otherCenterY >= zone.y &&
          otherCenterY <= zone.y + zone.height) ||
        (other.x >= zone.x - 20 &&
          other.x <= zone.x + zone.width - 60 &&
          other.y >= zone.y - 20 &&
          other.y <= zone.y + zone.height - 60)
      );
    });
    const attachedZoneIds = attachedZones.map((z) => z.id);
    const activeContainerZones = [zone, ...attachedZones];

    // 2. Find all objects (projects, notepads, linkboxes, texts, images) inside this zone/frame or any encompassed category zone
    const attachedProjectIds = projects
      .filter((p) => {
        if (p.pinned) return false;
        const itemWidth = p.itemType === 'text' ? 180 : 320;
        const itemHeight = p.itemType === 'text' ? 40 : 140;
        const centerX = p.position.x + itemWidth / 2;
        const centerY = p.position.y + itemHeight / 2;
        return activeContainerZones.some(
          (cz) =>
            (centerX >= cz.x &&
              centerX <= cz.x + cz.width &&
              centerY >= cz.y &&
              centerY <= cz.y + cz.height) ||
            (p.position.x >= cz.x - 20 &&
              p.position.x <= cz.x + cz.width - 40 &&
              p.position.y >= cz.y - 20 &&
              p.position.y <= cz.y + cz.height - 40)
        );
      })
      .map((p) => p.id);

    const attachedImageIds = images
      .filter((img) => {
        if (img.pinned) return false;
        const w = img.width || 240;
        const h = img.height || 180;
        const centerX = img.x + w / 2;
        const centerY = img.y + h / 2;
        return activeContainerZones.some(
          (cz) =>
            (centerX >= cz.x &&
              centerX <= cz.x + cz.width &&
              centerY >= cz.y &&
              centerY <= cz.y + cz.height) ||
            (img.x >= cz.x - 20 &&
              img.x <= cz.x + cz.width - 40 &&
              img.y >= cz.y - 20 &&
              img.y <= cz.y + cz.height - 40)
        );
      })
      .map((img) => img.id);

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
        setDragZoneOffset({
          id: zone.id,
          x: newX,
          y: newY,
          dx: newX - initialZoneX,
          dy: newY - initialZoneY,
          zoneIds: attachedZoneIds,
          projectIds: attachedProjectIds,
          imageIds: attachedImageIds,
        });
      }
    };

    const onZoneUp = () => {
      setActiveDragZoneId(null);
      setDragZoneOffset(null);
      window.removeEventListener('pointermove', onZoneMove);
      window.removeEventListener('pointerup', onZoneUp);

      if (hasMoved && onUpdateZone) {
        onUpdateZone(
          zone.id,
          { x: lastX, y: lastY },
          {
            dx: lastX - initialZoneX,
            dy: lastY - initialZoneY,
            zoneIds: attachedZoneIds,
            projectIds: attachedProjectIds,
            imageIds: attachedImageIds,
          }
        );
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

  // Open new item modal centered on the current viewport
  const handleAddProjectFromToolbar = (itemType: BoardItemType = 'project') => {
    setIsAddMenuOpen(false);
    if (!onCanvasDoubleClick) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const viewW = rect?.width || window.innerWidth;
    const viewH = rect?.height || window.innerHeight;
    const spawnX = Math.round((viewW / 2 - pan.x) / zoom - 160);
    const spawnY = Math.round((viewH / 2 - pan.y) / zoom - 110);
    onCanvasDoubleClick(spawnX, spawnY, itemType);
  };

  // Add a new outer Frame directly onto the canvas (does not appear in Categories)
  const handleAddFrameFromToolbar = () => {
    setIsAddMenuOpen(false);
    if (!onAddZone) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const viewW = rect?.width || window.innerWidth;
    const viewH = rect?.height || window.innerHeight;
    const frameCount = zones.filter((z) => z.isFrame).length;
    const spawnX = Math.round((viewW / 2 - pan.x) / zoom - 540 + (frameCount % 3) * 40);
    const spawnY = Math.round((viewH / 2 - pan.y) / zoom - 360 + (frameCount % 3) * 40);

    const newFrame: WhiteboardZone = {
      id: `frame-${Date.now()}`,
      title: `Çerçeve ${frameCount + 1}`,
      description: '',
      color: 'rgba(100, 116, 139, 0.06)',
      x: spawnX,
      y: spawnY,
      width: 1120,
      height: 760,
      isFrame: true,
    };
    onAddZone(newFrame);
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
      onPointerMove={(e) => {
        if (activeTool === 'eraser' && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const worldX = Math.round((e.clientX - rect.left - pan.x) / zoom);
          const worldY = Math.round((e.clientY - rect.top - pan.y) / zoom);
          setEraserPos({ x: worldX, y: worldY });
        }
      }}
      onPointerLeave={() => {
        if (activeTool === 'eraser' && !isDrawing) {
          setEraserPos(null);
        }
      }}
      className={`relative w-full h-full overflow-hidden bg-dot-grid select-none ${
        activeTool === 'pencil' || activeTool === 'eraser'
          ? 'cursor-crosshair hover:cursor-crosshair'
          : activeTool === 'pointer'
          ? isPanning
            ? 'cursor-grabbing'
            : 'cursor-default'
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
        {/* 1. Background Frames & Category Zones (Frames render first so Category Zones sit inside them) */}
        {[...zones]
          .sort((a, b) => (a.isFrame === b.isFrame ? 0 : a.isFrame ? -1 : 1))
          .map((zone) => {
            const isResizing = activeResizeZoneId === zone.id;
            const isDraggingZone = activeDragZoneId === zone.id;
            const isMovedByParentFrame =
              !isDraggingZone &&
              dragZoneOffset &&
              dragZoneOffset.zoneIds.includes(zone.id);

            const currentX =
              isDraggingZone && dragZoneOffset
                ? dragZoneOffset.x
                : isMovedByParentFrame && dragZoneOffset
                ? zone.x + dragZoneOffset.dx
                : isResizing && resizeZoneOffset
                ? resizeZoneOffset.x
                : zone.x;
            const currentY =
              isDraggingZone && dragZoneOffset
                ? dragZoneOffset.y
                : isMovedByParentFrame && dragZoneOffset
                ? zone.y + dragZoneOffset.dy
                : isResizing && resizeZoneOffset
                ? resizeZoneOffset.y
                : zone.y;
            const currentWidth =
              isResizing && resizeZoneOffset ? resizeZoneOffset.width : zone.width;
            const currentHeight =
              isResizing && resizeZoneOffset ? resizeZoneOffset.height : zone.height;

            const isFrame = Boolean(zone.isFrame);

            return (
              <div
                key={zone.id}
                onPointerDown={(e) => {
                  if (activeTool !== 'pointer') return;
                  const target = e.target as HTMLElement;
                  if (
                    target.closest('button') ||
                    target.closest('input') ||
                    target.closest('.zone-resize-handle')
                  ) {
                    return;
                  }
                  handleZoneDragStart(e, zone);
                }}
                style={{
                  left: `${currentX}px`,
                  top: `${currentY}px`,
                  width: `${currentWidth}px`,
                  height: `${currentHeight}px`,
                  backgroundColor: zone.color,
                  zIndex: isDraggingZone ? 12 : isFrame ? 1 : 3,
                }}
                className={`absolute p-5 pointer-events-auto select-none group/zone transition-colors ${
                  isFrame
                    ? 'rounded-[28px] border-2 border-solid border-slate-400/70 shadow-2xs'
                    : 'rounded-3xl border-2 border-dashed border-slate-300/70'
                } ${
                  activeTool === 'pointer' ? 'cursor-grab active:cursor-grabbing' : ''
                } ${
                  isDraggingZone ? 'ring-2 ring-blue-400 border-blue-400 shadow-lg' : ''
                } ${isResizing ? 'ring-2 ring-amber-400 border-amber-400' : ''}`}
              >
                {/* Zone / Frame Header Banner with Move Drag Handle & Inline Editable Title */}
                <div
                  onPointerDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('input')) return;
                    handleZoneDragStart(e, zone);
                  }}
                  className="flex items-center justify-between border-b border-black/5 pb-2 mb-2 select-none cursor-grab active:cursor-grabbing gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      title={
                        isFrame
                          ? 'Çerçeveyi ve İçindeki Kategorileri / Öğeleri Taşı'
                          : 'Kategori Alanını ve İçindekileri Taşı'
                      }
                      className="p-1 rounded-md text-slate-400 group-hover/zone:text-slate-700 hover:bg-black/5 transition-colors shrink-0"
                    >
                      {isFrame ? <Frame size={14} /> : <Move size={14} />}
                    </div>

                    {isFrame && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800/10 text-slate-700 shrink-0">
                        Çerçeve
                      </span>
                    )}

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={zone.title}
                        onChange={(e) =>
                          onUpdateZone?.(zone.id, { title: e.target.value })
                        }
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={isFrame ? 'Çerçeve Başlığı...' : 'Alan Başlığı...'}
                        className="w-full text-sm font-black tracking-tight text-slate-800 bg-transparent focus:bg-white/80 focus:px-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 rounded transition-all select-text cursor-text"
                      />
                      {zone.description && (
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {zone.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Quick Color Dots on Hover */}
                    <div className="hidden group-hover/zone:flex items-center gap-1 bg-white/80 px-1.5 py-1 rounded-full border border-black/5">
                      {FRAME_COLORS.map((fc) => (
                        <button
                          key={fc.value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateZone?.(zone.id, { color: fc.value });
                          }}
                          title={`Renk: ${fc.label}`}
                          style={{ backgroundColor: fc.dot }}
                          className={`w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-125 ${
                            zone.color === fc.value ? 'ring-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>

                    {isResizing && (
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full shadow-2xs">
                        {Math.round(currentWidth)} × {Math.round(currentHeight)}px
                      </span>
                    )}
                    {onDeleteZone && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteZone(zone.id);
                        }}
                        title={isFrame ? 'Bu Çerçeveyi Kaldır' : 'Bu Pano Alanını Kaldır'}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover/zone:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4-Corner Resizing Handles */}
                <div
                  onPointerDown={(e) => handleZoneResizeStart(e, zone, 'ne')}
                  title="Sağ Üstten Boyutlandır"
                  className="zone-resize-handle absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full cursor-ne-resize opacity-0 group-hover/zone:opacity-100 hover:scale-125 hover:border-blue-500 transition-all z-20 shadow-xs"
                />
                <div
                  onPointerDown={(e) => handleZoneResizeStart(e, zone, 'se')}
                  title="Sağ Alttan Boyutlandır"
                  className="zone-resize-handle absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full cursor-se-resize opacity-0 group-hover/zone:opacity-100 hover:scale-125 hover:border-blue-500 transition-all z-20 shadow-xs"
                />
                <div
                  onPointerDown={(e) => handleZoneResizeStart(e, zone, 'nw')}
                  title="Sol Üstten Boyutlandır"
                  className="zone-resize-handle absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full cursor-nw-resize opacity-0 group-hover/zone:opacity-100 hover:scale-125 hover:border-blue-500 transition-all z-20 shadow-xs"
                />
                <div
                  onPointerDown={(e) => handleZoneResizeStart(e, zone, 'sw')}
                  title="Sol Alttan Boyutlandır"
                  className="zone-resize-handle absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full cursor-sw-resize opacity-0 group-hover/zone:opacity-100 hover:scale-125 hover:border-blue-500 transition-all z-20 shadow-xs"
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
          {activeTool === 'eraser' && eraserPos && (
            <circle
              cx={eraserPos.x}
              cy={eraserPos.y}
              r={eraserSize}
              fill="rgba(244, 63, 94, 0.12)"
              stroke="#f43f5e"
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
          )}
        </svg>

        {/* 3. Pasted Images Layer */}
        {images.map((img) => {
          const isImgMovedByZone =
            dragZoneOffset && dragZoneOffset.imageIds.includes(img.id);
          const effectiveImg =
            isImgMovedByZone && dragZoneOffset
              ? { ...img, x: img.x + dragZoneOffset.dx, y: img.y + dragZoneOffset.dy }
              : img;

          return (
            <WhiteboardImageCard
              key={img.id}
              image={effectiveImg}
              zoom={zoom}
              onMove={handleImageMove}
              onResize={handleImageResize}
              onDelete={handleImageDelete}
              onTogglePin={handleImageTogglePin}
            />
          );
        })}

        {/* 4. Project Cards Layer */}
        {projects.map((project) => {
          const isBeingDragged = activeCardId === project.id;
          const isMovedByZone =
            !isBeingDragged &&
            dragZoneOffset &&
            dragZoneOffset.projectIds.includes(project.id);
          const currentPos =
            isBeingDragged && dragOffset
              ? { x: dragOffset.x, y: dragOffset.y }
              : isMovedByZone && dragZoneOffset
              ? {
                  x: project.position.x + dragZoneOffset.dx,
                  y: project.position.y + dragZoneOffset.dy,
                }
              : project.position;

          return (
            <div
              key={project.id}
              style={{
                position: 'absolute',
                left: `${currentPos.x}px`,
                top: `${currentPos.y}px`,
                width: project.itemType === 'table' ? 'auto' : '320px',
                zIndex: isBeingDragged ? 50 : 20,
              }}
              className="no-pan"
            >
              <ProjectCard
                project={project}
                categories={categories}
                activeTool={activeTool}
                zoom={zoom}
                onOpen={onOpenProject}
                onQuickUpdate={onQuickUpdate}
                onDelete={onDeleteProject}
                onTogglePin={onTogglePin}
                onToggleTodo={onToggleTodo}
                onAddTodo={onAddTodo}
                onDeleteTodo={onDeleteTodo}
                onUpdateNote={onUpdateNote}
                onAddLink={onAddLink}
                onDeleteLink={onDeleteLink}
                onUpdateTable={onUpdateTable}
                isDragging={isBeingDragged}
                onDragStart={handleCardDragStart}
              />
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-slate-200 no-pan z-40">
        {/* Tool Switcher: Hand (H) vs Pointer (P) vs Text (T) vs Pencil (K) vs Eraser (S) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTool('hand')}
            title="El / Pano Taşıma Modu (Kısayol: H)"
            className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              activeTool === 'hand'
                ? 'bg-white text-blue-600 shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hand size={15} />
            <span className="hidden sm:inline">El (H)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('pointer')}
            title="İmleç / Seçim Modu — Karta çift tıklayınca detaylar açılır (Kısayol: P)"
            className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              activeTool === 'pointer'
                ? 'bg-white text-blue-600 shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MousePointer size={15} />
            <span className="hidden sm:inline">İmleç (P)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('text')}
            title="Basit Metin Aracı — Panoda tıkladığın yere doğrudan yazı ekler (Kısayol: T)"
            className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              activeTool === 'text'
                ? 'bg-white text-blue-600 shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Type size={15} />
            <span className="hidden sm:inline">Metin (T)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('pencil')}
            title="Kalem / Serbest Çizim Modu (Kısayol: K)"
            className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              activeTool === 'pencil'
                ? 'bg-white text-blue-600 shadow-xs ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pen size={15} />
            <span className="hidden sm:inline">Kalem (K)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('eraser')}
            title="Silgi Modu — Çizgilerin üzerinden geçerek silin (Kısayol: S)"
            className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              activeTool === 'eraser'
                ? 'bg-white text-rose-600 shadow-xs ring-1 ring-rose-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eraser size={15} />
            <span className="hidden sm:inline">Silgi (S)</span>
          </button>
        </div>

        {/* Add Item Button & Pop-up Menu (Next to Image Button) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAddMenuOpen((prev) => !prev)}
            title="Yeni Öğe Ekle (Proje, Not/Hatırlatıcı, Link Kutusu, Tablo, Basit Metin)"
            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-2xs"
          >
            <Plus size={15} />
            <span className="hidden md:inline">Ekle</span>
          </button>

          {isAddMenuOpen && (
            <div className="absolute bottom-11 left-0 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Panoya Ne Eklemek İstersin?
              </div>
              <button
                type="button"
                onClick={() => handleAddProjectFromToolbar('project')}
                className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <span className="p-1 rounded-md bg-blue-100 text-blue-700">
                  <Rocket size={13} />
                </span>
                <div>
                  <div className="font-bold">Proje / Etkinlik</div>
                  <div className="text-[10px] text-slate-400 font-normal">Özet, durum ve yapılacaklar</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddProjectFromToolbar('notepad')}
                className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <span className="p-1 rounded-md bg-amber-100 text-amber-700">
                  <StickyNote size={13} />
                </span>
                <div>
                  <div className="font-bold">Not / Hatırlatıcı</div>
                  <div className="text-[10px] text-slate-400 font-normal">Serbest not defteri ve maddeler</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddProjectFromToolbar('linkbox')}
                className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <span className="p-1 rounded-md bg-cyan-100 text-cyan-700">
                  <Link2 size={13} />
                </span>
                <div>
                  <div className="font-bold">Link Kutusu</div>
                  <div className="text-[10px] text-slate-400 font-normal">Başlık ve istediğin kadar link</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddProjectFromToolbar('table')}
                className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <span className="p-1 rounded-md bg-emerald-100 text-emerald-700">
                  <Table2 size={13} />
                </span>
                <div>
                  <div className="font-bold">Tablo (Excel)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Satır, sütun ve formüllü tablo</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddProjectFromToolbar('text')}
                className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <span className="p-1 rounded-md bg-slate-200 text-slate-700">
                  <Type size={13} />
                </span>
                <div>
                  <div className="font-bold">Basit Metin (T)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Doğrudan panoya sade yazı</div>
                </div>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                type="button"
                onClick={handleAddFrameFromToolbar}
                className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <span className="p-1 rounded-md bg-indigo-100 text-indigo-700">
                  <Frame size={13} />
                </span>
                <div>
                  <div className="font-bold">Çerçeve (Frame)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Kategorileri kapsayan üst çerçeve</div>
                </div>
              </button>
            </div>
          )}
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

      {/* Pencil & Eraser Sub-Toolbar (Floats above main toolbar when pencil or eraser is active) */}
      {(activeTool === 'pencil' || activeTool === 'eraser') && (
        <div className="absolute bottom-20 right-6 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-slate-200/90 no-pan z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Quick switch between Pencil and Eraser */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTool('pencil')}
              title="Kalem (K)"
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                activeTool === 'pencil' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Pen size={13} />
              <span>Kalem</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              title="Silgi (S)"
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                activeTool === 'eraser' ? 'bg-rose-100 text-rose-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eraser size={13} />
              <span>Silgi</span>
            </button>
          </div>

          {activeTool === 'pencil' ? (
            <>
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
            </>
          ) : (
            /* Eraser Sizes */
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
              {[
                { size: 12, label: 'Küçük' },
                { size: 24, label: 'Orta' },
                { size: 42, label: 'Büyük' },
              ].map((er) => (
                <button
                  key={er.size}
                  type="button"
                  onClick={() => setEraserSize(er.size)}
                  title={`Silgi Boyutu: ${er.label}`}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    eraserSize === er.size ? 'bg-rose-100 text-rose-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {er.label}
                </button>
              ))}
            </div>
          )}

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
    </div>
  );
};
