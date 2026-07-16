import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus } from 'lucide-react';

interface FloatingWindowProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  darkMode: boolean;
  defaultWidth?: number;
}

const STORAGE_KEY = 'visor_floating_window_pos';

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
  title, isOpen, onClose, children, icon, darkMode, defaultWidth = 400
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

  const isD = darkMode;

  const win = (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: defaultWidth,
        zIndex: 9999,
      }}
      className={'select-none shadow-2xl ' + (isD ? 'dark' : '')}
    >
      <div
        onMouseDown={handleMouseDown}
        className={
          'flex items-center justify-between px-4 py-2.5 cursor-grab active:cursor-grabbing rounded-t-xl border ' +
          (isD
            ? 'bg-[#1c1a18] border-[#3e382f] text-[#f4f1eb]'
            : 'bg-[#fdfbf7] border-[#dfd9cc] text-stone-800')
        }
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className={
              'window-btn p-1 rounded-md transition-colors ' +
              (isD
                ? 'text-stone-400 hover:text-white hover:bg-[#2e2a24]'
                : 'text-stone-500 hover:text-stone-800 hover:bg-[#efebe4]')
            }
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className={
              'window-btn p-1 rounded-md transition-colors ' +
              (isD
                ? 'text-stone-400 hover:text-amber-400 hover:bg-amber-900/20'
                : 'text-stone-500 hover:text-rose-600 hover:bg-rose-50')
            }
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div
          className={
            'border-x border-b rounded-b-xl overflow-hidden ' +
            (isD
              ? 'bg-[#1c1a18] border-[#3e382f]'
              : 'bg-[#fdfbf7] border-[#dfd9cc]')
          }
        >
          {children}
        </div>
      )}
    </div>
  );

  return createPortal(win, document.body);
}
