import React, { useState, useRef, useCallback } from 'react';
import type { WhiteboardImage } from '../../types';
import { Pin, Trash2 } from 'lucide-react';

interface WhiteboardImageCardProps {
  image: WhiteboardImage;
  zoom: number;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
  onTogglePin?: (id: string) => void;
}

const WhiteboardImageCardComponent: React.FC<WhiteboardImageCardProps> = ({
  image,
  zoom,
  onMove,
  onResize,
  onDelete,
  onTogglePin,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);
  const [localSize, setLocalSize] = useState<{ width: number; height: number } | null>(null);

  // Keep latest zoom in a ref for fluid pointermove calculations without re-attaching
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Handle Drag Move (Local GPU-accelerated during drag, persists ONCE on pointer up)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (image.pinned) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.resize-handle')) return;

    e.stopPropagation();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = image.x;
    const initialY = image.y;
    let lastX = initialX;
    let lastY = initialY;
    let hasMoved = false;

    const onPointerMove = (ev: PointerEvent) => {
      const z = zoomRef.current || 1;
      const dx = (ev.clientX - startX) / z;
      const dy = (ev.clientY - startY) / z;

      if (!hasMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        hasMoved = true;
      }

      if (hasMoved) {
        lastX = Math.round(initialX + dx);
        lastY = Math.round(initialY + dy);
        setLocalPos({ x: lastX, y: lastY });
      }
    };

    const onPointerUp = () => {
      setIsDragging(false);
      setLocalPos(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (hasMoved) {
        onMove(image.id, lastX, lastY);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
  }, [image.id, image.x, image.y, image.pinned, onMove]);

  // Handle Resize from Bottom-Right (Local during drag, persists ONCE on pointer up)
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const initialW = image.width;
    const initialH = image.height;
    const aspectRatio = initialW / (initialH || 1);
    let lastW = initialW;
    let lastH = initialH;
    let hasResized = false;

    const onResizeMove = (ev: PointerEvent) => {
      const z = zoomRef.current || 1;
      const dx = (ev.clientX - startX) / z;

      if (!hasResized && Math.abs(dx) > 2) {
        hasResized = true;
      }

      if (hasResized) {
        lastW = Math.max(120, Math.min(1600, Math.round(initialW + dx)));
        lastH = Math.round(lastW / aspectRatio);
        setLocalSize({ width: lastW, height: lastH });
      }
    };

    const onResizeUp = () => {
      setIsResizing(false);
      setLocalSize(null);
      window.removeEventListener('pointermove', onResizeMove);
      window.removeEventListener('pointerup', onResizeUp);

      if (hasResized) {
        onResize(image.id, lastW, lastH);
      }
    };

    window.addEventListener('pointermove', onResizeMove, { passive: true });
    window.addEventListener('pointerup', onResizeUp);
  }, [image.id, image.width, image.height, onResize]);

  const posX = localPos ? localPos.x : image.x;
  const posY = localPos ? localPos.y : image.y;
  const cardW = localSize ? localSize.width : image.width;
  const cardH = localSize ? localSize.height : image.height;

  return (
    <div
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
        width: `${cardW}px`,
        height: `${cardH}px`,
        willChange: isDragging || isResizing ? 'left, top, width, height' : 'auto',
        transform: 'translateZ(0)',
      }}
      onPointerDown={handlePointerDown}
      className={`absolute group bg-white/95 backdrop-blur-xs p-2 rounded-2xl shadow-md border border-slate-200/90 flex flex-col select-none transition-shadow ${
        isDragging ? 'shadow-2xl ring-2 ring-blue-500/50 cursor-grabbing z-40' : 'cursor-grab hover:shadow-xl z-10'
      } ${image.pinned ? 'ring-2 ring-amber-400/70' : ''}`}
    >
      {/* Washi Tape Accent */}
      <div className="washi-tape washi-tape-tech opacity-60" />

      {/* Action Overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200/80 shadow-xs">
        {onTogglePin && (
          <button
            type="button"
            title={image.pinned ? 'Sabitlemeyi kaldır' : 'Panoya sabitle'}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(image.id);
            }}
            className={`p-1 rounded-md text-xs hover:bg-slate-100 transition-colors cursor-pointer ${
              image.pinned ? 'text-amber-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Pin size={13} className={image.pinned ? 'fill-amber-500' : ''} />
          </button>
        )}

        <button
          type="button"
          title="Resmi Sil"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image.id);
          }}
          className="p-1 rounded-md text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Image container */}
      <div className="w-full h-full overflow-hidden rounded-xl bg-slate-100/60 flex items-center justify-center">
        <img
          src={image.dataUrl}
          alt="Whiteboard attached reference"
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Resize Handle (Bottom-Right) */}
      <div
        onPointerDown={handleResizeStart}
        title="Boyutlandır"
        className={`resize-handle absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-white border-2 border-slate-400 rounded-full shadow-sm cursor-se-resize flex items-center justify-center hover:scale-125 transition-transform z-30 ${
          isResizing ? 'bg-blue-500 border-blue-600 scale-125' : ''
        }`}
      >
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
      </div>
    </div>
  );
};

export const WhiteboardImageCard = React.memo(WhiteboardImageCardComponent);
