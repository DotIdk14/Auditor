import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { LayoutGrid, Headphones, Users, FolderHeart, Settings, LogOut, StickyNote } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
  darkMode: boolean;
  onLogout: () => void;
}

interface DockIconProps {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
  action?: () => void;
  onTabChange: (tab: string) => void;
  mouseX: any;
  darkMode: boolean;
  isLogout?: boolean;
}

function DockIcon({ id, label, icon: Icon, isActive, action, onTabChange, mouseX, darkMode, isLogout }: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [44, 70, 44]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [44, 70, 44]);
  const widthIcon = useTransform(distance, [-150, 0, 150], [18, 28, 18]);
  const heightIcon = useTransform(distance, [-150, 0, 150], [18, 28, 18]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 155, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 155, damping: 12 });
  const wIcon = useSpring(widthIcon, { mass: 0.1, stiffness: 155, damping: 12 });
  const hIcon = useSpring(heightIcon, { mass: 0.1, stiffness: 155, damping: 12 });

  return (
    <div className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 8, scale: 0.9, x: '-50%' }}
            className={`absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg ${
              darkMode ? 'bg-[#1c1a18] border-[#3e382f] text-stone-200' : 'bg-[#faf8f5] border-[#dfd9cc] text-stone-800'
            } border text-[9.5px] font-bold tracking-wide whitespace-nowrap shadow-md select-none pointer-events-none z-50`}>
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={ref}
        onClick={() => { if (action) action(); else onTabChange(id); }}
        style={{ width, height }}
        className={`rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer relative ${
          isLogout
            ? darkMode ? 'bg-amber-950/40 hover:bg-amber-950 text-amber-300 border border-amber-900/30' : 'bg-amber-100/60 hover:bg-amber-100 text-amber-800 border border-amber-200/50'
            : isActive
              ? 'bg-[#faedcd] text-[#b57b54] border border-[#d4a373] shadow-md'
              : darkMode ? 'bg-[#24211e] hover:bg-[#2e2a24] text-stone-300 hover:text-white border border-[#3e382f]' : 'bg-white hover:bg-[#FAF6F0] text-stone-600 hover:text-stone-900 border border-[#e3dec3]'
        }`}>
        <motion.div style={{ width: wIcon, height: hIcon }} className="flex items-center justify-center text-current">
          <Icon className="w-full h-full text-current" />
        </motion.div>
        {isActive && <span className="absolute -bottom-1 w-1.5 h-1.5 bg-[#d4a373] rounded-full shadow-sm" />}
      </motion.button>
    </div>
  );
}

export default function Sidebar({ currentTab, onTabChange, userRole, darkMode, onLogout }: SidebarProps) {
  const mouseX = useMotionValue(Infinity);

  const navItems = [
    { id: 'inicio', label: 'Inicio 🍵', icon: LayoutGrid },
    { id: 'auditor', label: 'Auditor 🎧', icon: Headphones },
    { id: 'auditorias', label: 'Contactos 👤', icon: Users },
    { id: 'notas', label: 'Notas 📝', icon: StickyNote },
    { id: 'recursos', label: 'Recursos 📚', icon: FolderHeart },
    { id: 'ajustes', label: 'Preferencias ⚙️', icon: Settings },
    { id: 'logout', label: 'Cerrar sesión 👋', icon: LogOut, isLogout: true },
  ].filter(item => {
    if (item.id === 'auditor' && userRole === 'agente') return false;
    return true;
  });

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center select-none pointer-events-none">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={`flex items-end gap-3 sm:gap-4 ${
          darkMode ? 'bg-[#1c1a18]/95 border-[#3e382f] shadow-[0_12px_44px_rgba(0,0,0,0.4)]' : 'bg-[#fdfbf7]/95 border-[#dfd9cc] shadow-[0_12px_44px_rgba(139,121,98,0.12)]'
        } backdrop-blur-md px-6 py-2.5 sm:py-3.5 rounded-t-[60px] rounded-b-[15px] border pointer-events-auto transition-all relative`}>
        
        {navItems.map((item) => (
          <DockIcon
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            isActive={currentTab === item.id}
            action={item.id === 'logout' ? onLogout : undefined}
            onTabChange={onTabChange}
            mouseX={mouseX}
            darkMode={darkMode}
            isLogout={item.isLogout}
          />
        ))}
      </motion.div>
    </div>
  );
}
