/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Option {
  p: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Buscar programa...',
  label,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setSearchTerm('');
    setIsOpen(false);
  };

  const currentOption = options.find(o => o.p === value);

  return (
    <div className={`flex flex-col relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 px-0.5">
          {label}
        </label>
      )}
      
      <div 
        className="relative group h-[38px]"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
      >
        <div className={`w-full h-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 flex items-center justify-between cursor-text transition-all group-hover:border-indigo-400 dark:group-hover:border-slate-500 ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500 dark:border-indigo-500' : ''}`}>
          <div className="flex items-center gap-2 overflow-hidden w-full">
            <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="bg-transparent border-none outline-none text-sm font-bold text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 w-full"
              placeholder={value ? value : placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 w-full mt-11 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-[300px] flex flex-col"
          >
            <div className="overflow-y-auto py-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => (
                  <button
                    key={idx}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${
                      value === option.p 
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20' 
                        : 'text-gray-700 dark:text-slate-300'
                    }`}
                    onClick={() => handleSelect(option.p)}
                  >
                    <span className="truncate pr-2">{option.p}</span>
                    {value === option.p && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-gray-400 italic text-center">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
};
