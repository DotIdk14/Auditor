import React, { useEffect, useRef, useState } from 'react';
import { FileAudio, ChevronDown, Check, RefreshCw } from 'lucide-react';
import type { DemoScenario } from '../types';

export const DEMO_SCENARIOS: { id: DemoScenario; label: string; description: string }[] = [
  { id: 'excelente', label: 'Excelente', description: 'Venta cerrada · Rúbrica 10.0' },
  { id: 'regular', label: 'Regular', description: 'Seguimiento · Rúbrica 6.4' },
  { id: 'deficiente', label: 'Deficiente', description: 'Objeciones mal manejadas · 3.6' },
];

interface DemoCallMenuProps {
  onLoad: (scenario: DemoScenario) => void;
  isLoading?: boolean;
  buttonClassName?: string;
  showIcon?: boolean;
  label?: string;
  loadingLabel?: string;
}

export default function DemoCallMenu({
  onLoad,
  isLoading = false,
  buttonClassName = '',
  showIcon = true,
  label = 'Caso de Prueba',
  loadingLabel = 'Generando...',
}: DemoCallMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (scenario: DemoScenario) => {
    setIsOpen(false);
    onLoad(scenario);
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        disabled={isLoading}
        className={`flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${buttonClassName}`}
      >
        {isLoading ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          showIcon && <FileAudio className="w-3.5 h-3.5" />
        )}
        <span>{isLoading ? loadingLabel : label}</span>
        {!isLoading && <ChevronDown className="w-3 h-3" />}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 right-0 min-w-[260px] bg-[#181818] border border-zinc-700 rounded-xl shadow-2xl p-1.5 animate-fadeIn">
          <div className="px-3 py-1.5 border-b border-zinc-800 mb-1">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono font-bold">
              Elige un caso de prueba
            </span>
          </div>
          {DEMO_SCENARIOS.map(sc => (
            <button
              key={sc.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(sc.id);
              }}
              className="w-full text-left p-2.5 rounded-lg hover:bg-indigo-500/10 flex items-start justify-between gap-2 transition-colors cursor-pointer group"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-bold text-gray-200 group-hover:text-indigo-300">
                  {sc.label}
                </span>
                <span className="text-[10px] text-gray-500 leading-tight">{sc.description}</span>
              </div>
              <Check className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
