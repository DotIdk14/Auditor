import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingWindowProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  defaultWidth?: number;
  className?: string;
}

const STORAGE_KEY = 'crm_floating_notes_pos';

function loadPosition() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { x: window.innerWidth - 420, y: 80 };
}

function savePosition(x: number, y: number) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y })); } catch {}
}

export default function FloatingWindow({
  title, isOpen, onClose, children, icon, defaultWidth = 380, className
}: FloatingWindowProps) {
  const [pos, setPos] = useState(loadPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, elX: 0, elY: 0 });

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({
        x: Math.max(0, dragRef.current.elX + dx),
        y: Math.max(0, dragRef.current.elY + dy),
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      savePosition(pos.x, pos.y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-btn')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      elX: pos.x, elY: pos.y,
    };
  }, [pos]);

  if (!isOpen) return null;

  const win = (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: defaultWidth,
        zIndex: 9999,
      }}
      className={cn('select-none shadow-2xl', className)}
    >
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between bg-sidebar border-b px-4 py-2.5 rounded-t-lg cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="window-btn p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="window-btn p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div className="bg-card text-card-foreground border-x border-b rounded-b-lg overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );

  return createPortal(win, document.body);
}
