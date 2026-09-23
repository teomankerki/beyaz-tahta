import React, { useState } from 'react';
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

export const WhiteboardImageCard: React.FC<WhiteboardImageCardProps> = ({
  image,
  zoom,
  onMove,
  onResize,
  onDelete,
  onTogglePin,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Handle Drag Move
  const handlePointerDown = (e: React.PointerEvent) => {
    if (image.pinned) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.resize-handle')) return;

    e.stopPropagation();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = image.x;
    const initialY = image.y;

    const onPointerMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      onMove(image.id, Math.round(initialX + dx), Math.round(initialY + dy));
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Handle Resize from Bottom-Right
  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const initialW = image.width;
    const initialH = image.height;
    const aspectRatio = initialW / initialH;

    const onResizeMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const newWidth = Math.max(120, Math.min(1200, Math.round(initialW + dx)));
      const newHeight = Math.round(newWidth / aspectRatio);
      onResize(image.id, newWidth, newHeight);
    };

    const onResizeUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', onResizeMove);
      window.removeEventListener('pointerup', onResizeUp);
    };

    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', onResizeUp);
  };

  return (
    <div
      style={{
        left: `${image.x}px`,
        top: `${image.y}px`,
        width: `${image.width}px`,
        height: `${image.height}px`,
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
