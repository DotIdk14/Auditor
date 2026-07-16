import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../auth/authStore';
import Sidebar from './Sidebar';
import NotesPanel from './NotesPanel';
import {
  Bell, MessageSquare, Search, Sun, Moon, Plus, X, User, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { user, logout, visorRole, roleLabel } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('visor_dark_mode') === 'true');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{ title: string; content: string; date: string } | null>(null);

  // Sync dark mode
  useState(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('visor_dark_mode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentTab = location.pathname === '/' ? 'inicio'
    : location.pathname.startsWith('/auditor') ? 'auditor'
    : location.pathname.startsWith('/contacts') ? 'auditorias'
    : location.pathname.startsWith('/resources') ? 'recursos'
    : 'ajustes';

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${
      darkMode ? 'bg-[#1c1c1c] text-[#ebe5da]' : 'bg-[#FAF7F2] text-stone-800'
    } font-sans antialiased relative`}>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Top Header */}
        <header className={`h-16 shrink-0 ${
          darkMode ? 'bg-[#1c1c1c]/90 border-[#2e2a24] text-white' : 'bg-white/90 border-[#dfd9cc] text-stone-800'
        } border-b backdrop-blur-md px-6 flex items-center justify-between z-30 shadow-xs`}>
          
          {/* Brand */}
          <div className="flex items-center gap-2.5 mr-6 select-none shrink-0">
            <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-stone-800' : 'bg-[#faedcd]'} flex items-center justify-center text-stone-900 font-bold shadow-xs`}>
              <Plus className={`w-4.5 h-4.5 ${darkMode ? 'text-[#d4a373]' : 'text-[#141210]'}`} />
            </div>
            <span className={`font-display font-black text-lg tracking-wide ${darkMode ? 'text-[#f4f1eb]' : 'text-stone-800'} flex items-center gap-1`}>
              Visor <span className="text-sm">🍵✨</span>
            </span>
          </div>

          {/* Search */}
          <div className="relative w-full max-w-md">
            <span className={`absolute inset-y-0 left-3 flex items-center pointer-events-none ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar llamadas, agentes o auditorías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${
                darkMode
                  ? 'bg-[#24211e] border-[#3e382f] text-stone-100 placeholder-stone-500 focus:border-[#d4a373] focus:ring-[#d4a373] focus:bg-[#2c2824]'
                  : 'bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 placeholder-stone-450 focus:bg-white focus:border-[#d4a373] focus:ring-[#d4a373]'
              } border rounded-full py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none transition-all`}
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4 shrink-0">
            <button className={`p-2 rounded-full border transition-all cursor-pointer ${
              darkMode ? 'bg-[#24211e] hover:bg-[#2e2a24] text-stone-300 border-[#3e382f]/50' : 'bg-white hover:bg-[#FAF6F0] text-stone-600 border-[#dfd9cc]/40'
            }`}>
              <MessageSquare className="w-4 h-4" />
            </button>

            <div className="relative">
              <button onClick={() => { setShowNotifications(!showNotifications); setNotificationCount(0); }}
                className={`p-2 rounded-full border transition-all relative cursor-pointer ${
                  darkMode ? 'bg-[#24211e] hover:bg-[#2e2a24] text-stone-300 border-[#3e382f]/50' : 'bg-white hover:bg-[#FAF6F0] text-stone-600 border-[#dfd9cc]/40'
                }`}>
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#d4a373] text-white text-[8px] font-bold font-mono rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>

            <button onClick={toggleDarkMode}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                darkMode ? 'bg-[#24211e] hover:bg-[#2e2a24] text-amber-400 border-[#3e382f]/50' : 'bg-white hover:bg-[#FAF6F0] text-stone-600 border-[#dfd9cc]/40'
              }`}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="h-6 w-px bg-[#dfd9cc] dark:bg-[#3e382f]" />

            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Perfil</p>
                <p className={`text-xs font-bold ${darkMode ? 'text-stone-200' : 'text-stone-900'}`}>
                  {user?.displayName || 'Usuario'}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full overflow-hidden border ${darkMode ? 'border-[#3e382f] bg-[#24211e]' : 'border-[#dfd9cc] bg-white'} flex items-center justify-center`}>
                <span className="text-[#b57b54] font-bold text-xs">
                  {(user?.displayName || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-hidden h-full">
          <Outlet context={{ searchQuery, darkMode, openNotesPanel: () => setShowNotesPanel(true) }} />
        </main>
      </div>

      {/* Global Alert Toast */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed bottom-6 right-6 z-[9999]"
            onClick={() => setActiveAlert(null)}
          >
            <div className="alert-card shadow-2xl">
              <h3 className="card__title">{activeAlert.title}</h3>
              <p className="card__content">{activeAlert.content}</p>
              <div className="card__date">{activeAlert.date}</div>
              <div className="card__arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="15" width="15">
                  <path fill="#fff" d="M13.4697 17.9697C13.1768 18.2626 13.1768 18.7374 13.4697 19.0303C13.7626 19.3232 14.2374 19.3232 14.5303 19.0303L20.3232 13.2374C21.0066 12.554 21.0066 11.446 20.3232 10.7626L14.5303 4.96967C14.2374 4.67678 13.7626 4.67678 13.4697 4.96967C13.1768 5.26256 13.1768 5.73744 13.4697 6.03033L18.6893 11.25H4C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75H18.6893L13.4697 17.9697Z" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Panel (Slide-up) */}
      <NotesPanel
        isOpen={showNotesPanel}
        onClose={() => setShowNotesPanel(false)}
        darkMode={darkMode}
      />

      {/* Bottom Sidebar (Dock) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          const routes: Record<string, string> = {
            inicio: '/',
            auditor: '/auditor',
            auditorias: '/contacts',
            recursos: '/resources',
          };
          if (tab === 'logout') {
            handleLogout();
          } else if (tab === 'notas') {
            setShowNotesPanel(true);
          } else if (routes[tab]) {
            navigate(routes[tab]);
          }
        }}
        userRole={visorRole()}
        darkMode={darkMode}
        onLogout={handleLogout}
      />
    </div>
  );
}
