import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Tag, 
  Database, 
  Columns, 
  ArrowLeft, 
  Lock, 
  User, 
  ShieldAlert, 
  Save, 
  LogOut, 
  Palette, 
  Eye, 
  Sparkles,
  ClipboardCheck,
  CheckCircle,
  HelpCircle,
  FolderLock
} from 'lucide-react';
import { PreciosConfig, AppConfig } from '../../types';
import { PROG, ACCS } from '../../data/catalogs';

interface AdminScreenProps {
  config: AppConfig;
  precios: PreciosConfig;
  onSave: (
    dom: number, 
    tit0: boolean, 
    plat: boolean, 
    primaryColor: string,
    firmaCopiar?: boolean,
    bloquearInspeccion?: boolean
  ) => void;
  setPrecios: (precios: PreciosConfig) => void;
  onClose: () => void; // Volver a la Calculadora
  passwordValidation: (pwd: string) => boolean;
  onMatrixEdit: () => void;
  onSaveToServer: () => Promise<{ success: boolean; message?: string; error?: string }>;
  isDarkTheme: boolean;
  setIsDarkTheme: (dark: boolean) => void;
  initialAuthenticated?: boolean;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ 
  config, 
  precios, 
  onSave, 
  setPrecios,
  onClose,
  passwordValidation,
  onMatrixEdit,
  onSaveToServer,
  isDarkTheme,
  setIsDarkTheme,
  initialAuthenticated = false
}) => {
  // Estado de Autenticación de Administrador / Desarrollo
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const adminSession = localStorage.getItem('utel_admin_session_v2');
    if (adminSession) {
      try {
        const parsed = JSON.parse(adminSession);
        // Sesión de admin válida por 24 horas
        return initialAuthenticated || (parsed && parsed.isAuthed && Date.now() < parsed.expireAt);
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<'general' | 'accesorios' | 'matriz'>('general');

  // Para decirnos si ya guardamos los cambios en la cajita fuerte del servidor.
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Estado de selección de la matriz
  const [selectedCat, setSelectedCat] = useState('online_general');
  const [selectedLevel, setSelectedLevel] = useState('alto');
  const [selectedSegment, setSelectedSegment] = useState('hot');
  const [selectedJornadaAdmin, setSelectedJornadaAdmin] = useState('intensiva');

  // Estado para la edición de accesorios y certificaciones
  const [selectedAccSec, setSelectedAccSec] = useState<'lic' | 'mae' | 'ms' | 'doc'>('lic');

  const PROG_CATS = [
    { key: 'online_general', label: 'Licenciatura General' },
    { key: 'ingenieria', label: 'Ingenierías' },
    { key: 'arquitectura', label: 'Arquitectura' },
    { key: 'robotica', label: 'Robótica' },
    { key: 'mae_online', label: 'MAE (Online)' },
    { key: 'mae_ejecutiva', label: 'MAE (Ejecutiva)' },
    { key: 'arq_software', label: 'Arq. de Software' },
    { key: 'master', label: 'Máster' },
    { key: 'arq_software_ms', label: 'Arq. de Software (MS)' },
    { key: 'doctorado', label: 'Doctorado' },
    { key: 'doc_especial', label: 'Doc. Especial' },
    { key: 'uve', label: 'UVE' },
    { key: 'unica', label: 'ÚNICA' }
  ];

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');

    const user = usernameInput.trim().toLowerCase();
    const pwd = passwordInput.trim();

    if (!user || !pwd) {
      setLoginError('Por favor, ingresa el usuario y la contraseña.');
      return;
    }

    // Permitir usuario 'admin' o 'desarrollo'
    if (user !== 'admin' && user !== 'desarrollo') {
      setLoginError('Usuario administrador o de desarrollo incorrecto.');
      return;
    }

    if (passwordValidation(pwd)) {
      setIsAdminAuthenticated(true);
      // Guardar sesión por 24 horas
      localStorage.setItem(
        'utel_admin_session_v2', 
        JSON.stringify({ isAuthed: true, expireAt: Date.now() + 86400000 })
      );
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError('Contraseña incorrecta.');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('utel_admin_session_v2');
    setIsAdminAuthenticated(false);
    onClose();
  };

  // Obtener los datos del nivel activo de la matriz
  const getActiveLevelData = () => {
    const categoryData = PROG[selectedCat];
    if (!categoryData) return null;
    
    // Si la categoría tiene o admite modalidades
    if (categoryData.intensiva || categoryData.completa || categoryData.super || categoryData.superintensiva) {
      const realJor = selectedJornadaAdmin === 'superintensiva' && categoryData.superintensiva && !categoryData.super ? 'superintensiva' : selectedJornadaAdmin;
      
      // Inicializar dinámicamente si no existe la modalidad
      if (!categoryData[realJor]) {
        try {
          const source = categoryData.intensiva || categoryData.niveles || categoryData;
          categoryData[realJor] = JSON.parse(JSON.stringify(source));
        } catch (e) {
          categoryData[realJor] = categoryData.intensiva || categoryData.niveles || categoryData;
        }
      }
      
      const jorData = categoryData[realJor];
      if (selectedJornadaAdmin === 'completa' && jorData && !jorData.niveles) {
        return jorData;
      }
      return jorData.niveles?.[selectedLevel] || jorData.niveles?.alto || jorData;
    }
    
    return categoryData.niveles?.[selectedLevel] || categoryData.niveles?.alto || categoryData;
  };

  const levelData = getActiveLevelData();
  const isDirectLevel = levelData && Array.isArray(levelData.p);
  const availableSegments = levelData && !isDirectLevel ? Object.keys(levelData) : [];
  const currentSegment = isDirectLevel 
    ? '_direct_' 
    : (availableSegments.includes(selectedSegment) ? selectedSegment : (availableSegments[0] || ''));

  const segmentObj = isDirectLevel ? levelData : (levelData && currentSegment ? levelData[currentSegment] : null);

  const handleMatrixTextChange = (field: 'pkg' | 'esc', val: string) => {
    if (segmentObj) {
      segmentObj[field] = val;
      onMatrixEdit();
    }
  };

  const handleAccPriceChange = (sec: 'lic' | 'mae' | 'ms' | 'doc', itemId: string, value: string) => {
    const val = Number(value) || 0;
    const structure = ACCS[sec];
    if (structure) {
      structure.optional.forEach(grp => {
        const item = grp.items.find(i => i.id === itemId);
        if (item) {
          item.price = val;
        }
      });
      onMatrixEdit();
    }
  };

  const handleMatrixPriceChange = (priceIdx: number, val: string) => {
    if (segmentObj && segmentObj.p) {
      const updatedPrices = [...segmentObj.p];
      const numericVal = Number(val) || 0;
      
      if (priceIdx === 2) {
        for (let i = 2; i < updatedPrices.length; i++) {
          updatedPrices[i] = numericVal;
        }
      } else {
        updatedPrices[priceIdx] = numericVal;
      }
      
      segmentObj.p = updatedPrices;
      onMatrixEdit();
    }
  };

  const handleTriggerServerSave = async () => {
    setSaveStatus('saving');
    setSaveMessage('');
    try {
      const res = await onSaveToServer();
      if (res.success) {
        setSaveStatus('success');
        setSaveMessage(res.message || '¡Cambios guardados en el servidor exitosamente!');
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('error');
        setSaveMessage(res.error || 'Error al persistir cambios.');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage(err.message || 'Error de conexión.');
    }
  };

  // --- STAGE 1: Admin Authorization Screen ---
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-250">
        {/* Subtle decorative mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary-100),_transparent_45%)] pointer-events-none opacity-40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.05),_transparent_40%)] pointer-events-none"></div>

        <header className="max-w-md w-full mx-auto text-center shrink-0">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">SISTEMA INTEGRAL UTEL</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mb-2">Panel de Control & Desarrollo</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">Área ultra-restringida para desarrolladores e ingenieros de tarifas.</p>
        </header>

        <main className="max-w-md w-full mx-auto my-auto py-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="bg-slate-950/80 backdrop-blur-md rounded-3xl p-8 border border-slate-800/80 shadow-2xl relative"
          >
            <div className="mx-auto h-12 w-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
              <FolderLock className="h-6 w-6 font-semibold animate-pulse" />
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase block pl-1">Usuario Administrativo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Escribe 'admin' o 'desarrollo'"
                    className="w-full bg-slate-900/60 border border-slate-800 text-white rounded-xl pl-9 pr-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase block pl-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Ingresa clave de seguridad"
                    className="w-full bg-slate-900/60 border border-slate-800 text-white rounded-xl pl-9 pr-4 py-3 text-sm font-semibold tracking-widest outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 placeholder:tracking-normal font-sans"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings className="h-4 w-4" /> Autenticar Acceso
              </motion.button>
            </form>

            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs font-semibold"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{loginError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors py-2 px-4 rounded-xl hover:bg-slate-800/40 border border-transparent hover:border-slate-800 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a la Calculadora
            </button>
          </div>
        </main>

        <footer className="text-center shrink-0 text-[10px] text-slate-500 font-medium">
          CONFIDENCIAL — Conexiones auditadas por protocolo de seguridad UTEL
        </footer>
      </div>
    );
  }

  // --- STAGE 2: Full Admin Dashboard Screen ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col transition-colors duration-250 pb-12">
      {/* Decorative background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary-100),_transparent_40%)] pointer-events-none opacity-20"></div>

      {/* Top dashboard navigation bar */}
      <header className="bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Volver a la Calculadora"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-md font-black tracking-tight text-white uppercase text-xs">Administrador de Precios y Cotizaciones</h1>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Conectado como: <span className="text-indigo-400 font-bold uppercase">Superusuario de Desarrollo</span></p>
          </div>
        </div>

        {/* Big Tab Switches */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer uppercase ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="h-3.5 w-3.5" /> Configuración General
          </button>
          <button
            onClick={() => setActiveTab('accesorios')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer uppercase ${
              activeTab === 'accesorios'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="h-3.5 w-3.5" /> Accesorios y Certificaciones
          </button>
          <button
            onClick={() => setActiveTab('matriz')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer uppercase ${
              activeTab === 'matriz'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="h-3.5 w-3.5" /> Matriz de Programas (PROG)
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-950 hover:bg-rose-950/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Cerrar sesión de administrador"
          >
            <LogOut className="h-3.5 w-3.5" /> Salir del Panel
          </button>
        </div>
      </header>

      {/* Main Board Arena */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-400" /> Parámetros Generales de Cotización
                </h3>
                <p className="text-xs text-slate-450 mt-1">Modifica las variables regulatorias y visuales globales de la calculadora académica.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-white mb-2 flex items-center gap-1.5">
                      <Palette className="h-4 w-4 text-indigo-400" /> Configuración de Tarifa & Color UI
                    </h4>
                    <p className="text-xs text-slate-400 mb-5 leading-normal">
                      Controla el porcentaje oficial que se descontará a los alumnos que domicilien sus colegiaturas y personaliza el color de acento corporativo.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/50">
                      <span className="text-xs font-bold text-slate-200">Descuento por domiciliación oficial</span>
                      <select
                        value={config.domiciliacion}
                        onChange={(e) => onSave(parseInt(e.target.value), config.tituloCosto0, config.platziPreview, config.primaryColor, config.firmaCopiar, config.bloquearInspeccion)}
                        className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs font-semibold text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="5">5% del total mensual</option>
                        <option value="10">10% del total mensual</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-xs font-bold text-slate-200">Color primario del tema</span>
                      <input 
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => onSave(config.domiciliacion, config.tituloCosto0, config.platziPreview, e.target.value, config.firmaCopiar, config.bloquearInspeccion)}
                        className="bg-transparent border-0 cursor-pointer h-7 w-12 rounded focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 space-y-5">
                  <h4 className="text-sm font-extrabold text-white mb-1 flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-indigo-400" /> Funcionalidades & Parámetros Especiales
                  </h4>

                  <div className="flex items-center justify-between py-3 border-b border-slate-800/50">
                    <div>
                      <label className="text-xs font-bold text-slate-200 block">Título Costo $0 (Titulación Becada)</label>
                      <span className="text-[10px] text-slate-450">Habilita o deshabilita los cargos de trámites oficiales de titulación.</span>
                    </div>
                    <button
                      onClick={() => onSave(config.domiciliacion, !config.tituloCosto0, config.platziPreview, config.primaryColor, config.firmaCopiar, config.bloquearInspeccion)}
                      className={`h-5.5 w-10 rounded-full relative transition-colors cursor-pointer ${config.tituloCosto0 ? 'bg-indigo-600' : 'bg-slate-800'}`}
                    >
                      <motion.div 
                        animate={{ x: config.tituloCosto0 ? 18 : 3 }}
                        className="h-4 w-4 bg-white rounded-full absolute top-[3px]" 
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-800/50">
                    <div>
                      <label className="text-xs font-bold text-slate-200 block">Vista previa de Platzi 🧪</label>
                      <span className="text-[10px] text-slate-450">Muestra Platzi como opción seleccionable para la educación de posgrados.</span>
                    </div>
                    <button
                      onClick={() => onSave(config.domiciliacion, config.tituloCosto0, !config.platziPreview, config.primaryColor, config.firmaCopiar, config.bloquearInspeccion)}
                      className={`h-5.5 w-10 rounded-full relative transition-colors cursor-pointer ${config.platziPreview ? 'bg-indigo-600' : 'bg-slate-800'}`}
                    >
                      <motion.div 
                        animate={{ x: config.platziPreview ? 18 : 3 }}
                        className="h-4 w-4 bg-white rounded-full absolute top-[3px]" 
                      />
                    </button>
                  </div>



                  <div className="flex items-center justify-between py-3">
                    <div>
                      <label className="text-xs font-bold text-slate-200 block">Bloquear Inspección de Código Fuertemente 🔒</label>
                      <span className="text-[10px] text-slate-450">Previene la apertura de DevTools, clic derecho y atajos F12 / Ctrl+I para salvaguardar costos.</span>
                    </div>
                    <button
                      onClick={() => onSave(config.domiciliacion, config.tituloCosto0, config.platziPreview, config.primaryColor, config.firmaCopiar, !config.bloquearInspeccion)}
                      className={`h-5.5 w-10 rounded-full relative transition-colors cursor-pointer ${config.bloquearInspeccion ? 'bg-indigo-600' : 'bg-slate-800'}`}
                    >
                      <motion.div 
                        animate={{ x: config.bloquearInspeccion ? 18 : 3 }}
                        className="h-4 w-4 bg-white rounded-full absolute top-[3px]" 
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'accesorios' && (
            <motion.div
              key="accesorios"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <Tag className="h-5 w-5 text-indigo-400" /> Tarifas de Accesorios y Certificaciones
                  </h3>
                  <p className="text-xs text-slate-450 mt-1">Configura el precio unitario base cobrado por cada diplomado, certificado, curso complementario, etc.</p>
                </div>

                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0">
                  {(['lic', 'mae', 'ms', 'doc'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedAccSec(s)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all uppercase cursor-pointer ${
                        selectedAccSec === s
                          ? 'bg-slate-800 text-indigo-400 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s === 'lic' ? 'Lic' : s === 'mae' ? 'Mae' : s === 'ms' ? 'Master' : 'Doc'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                {ACCS[selectedAccSec].optional.map((group) => (
                  <div key={group.cat} className="space-y-4 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{group.cat}s Adicionales</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {group.items.map((item) => (
                        <div key={item.id} className="bg-slate-950/75 p-3 rounded-xl border border-slate-850 flex flex-col justify-between h-24">
                          <label className="text-[10px] font-bold text-slate-300 block leading-tight truncate-two-lines" title={item.name}>
                            {item.name}
                          </label>
                          <div className="relative mt-2">
                            <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-500 font-bold">$</span>
                            <input
                              type="number"
                              value={item.price || 0}
                              onChange={(e) => handleAccPriceChange(selectedAccSec, item.id, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg pl-6 pr-2 py-2 text-xs font-bold focus:border-indigo-500 outline-none transition-all font-sans"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-4 flex gap-3 text-slate-400 text-[10px] leading-relaxed">
                <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  * Los complementos que ya vienen indicados como incluidos por defecto en las tablas de simulación se calcularán a costo cero ($0) automáticamente para el prospecto. Los cambios guardados acá se aplicarán en tiempo real sobre la cotización de los accesorios opcionales seleccionables.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'matriz' && (
            <motion.div
              key="matriz"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-400" /> Editor de Precios de Programas Académicos (PROG)
                </h3>
                <p className="text-xs text-slate-450 mt-1">Navega y edita la matriz integral de cuotas de colegiaturas (12 meses) según nivel y tipo de campaña/lead.</p>
              </div>

              {/* Selector Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/50 p-6 border border-slate-850 rounded-2xl">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 pl-1">Categoría Académica</label>
                  <select
                    value={selectedCat}
                    onChange={(e) => {
                      setSelectedCat(e.target.value);
                      setSelectedSegment('hot');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white focus:border-indigo-500 outline-none"
                  >
                    {PROG_CATS.map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {(PROG[selectedCat]?.intensiva || PROG[selectedCat]?.completa || PROG[selectedCat]?.super || PROG[selectedCat]?.superintensiva) ? (
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 pl-1">Modalidad de Tránsito</label>
                    <select
                      value={selectedJornadaAdmin}
                      onChange={(e) => {
                        setSelectedJornadaAdmin(e.target.value);
                        setSelectedSegment('hot');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="intensiva">Colegiatura Intensiva</option>
                      <option value="completa">Colegiatura Completa</option>
                      <option value="superintensiva">Colegiatura Superintensiva</option>
                    </select>
                  </div>
                ) : (
                  <div className="hidden lg:block"></div>
                )}

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 pl-1">Pricing del Plan</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => {
                      setSelectedLevel(e.target.value);
                      setSelectedSegment('hot');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="alto">Alto</option>
                    <option value="medio">{selectedCat === 'unica' ? 'Medio (Flat)' : 'Medio'}</option>
                    <option value="bajo">Bajo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5 pl-1">Segmentación Lead / Campaña</label>
                  <select
                    value={currentSegment}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                    disabled={isDirectLevel || availableSegments.length === 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white focus:border-indigo-500 outline-none disabled:opacity-40"
                  >
                    {isDirectLevel ? (
                      <option value="_direct_">Nivel Único (Sin Segmentos)</option>
                    ) : availableSegments.length === 0 ? (
                      <option value="">No disponible</option>
                    ) : (
                      availableSegments.map(seg => (
                         <option key={seg} value={seg}>{seg.toUpperCase()}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {segmentObj ? (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 p-6 border border-slate-850 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Parámetros de Integración Académica</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase pl-1">Código de Paquete (pkg)</label>
                          <input
                            type="text"
                            value={segmentObj.pkg || ''}
                            onChange={(e) => handleMatrixTextChange('pkg', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-semibold text-white font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase pl-1">Escenario de Facturación (esc)</label>
                          <input
                            type="text"
                            value={segmentObj.esc || ''}
                            onChange={(e) => handleMatrixTextChange('esc', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-semibold text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-850/60 flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold text-indigo-400 uppercase">Validador de Tarifas</span>
                        <h5 className="text-xs font-bold text-white">Configuración estructurada correctamente</h5>
                        <p className="text-[10px] text-slate-450 mt-0.5">La base cargada corresponde a los códigos validados de la Secretaría Técnica Educativa.</p>
                      </div>
                    </div>
                  </div>

                  {/* Arreglo de Precios (12 Meses) */}
                  <div className="bg-slate-900/30 p-6 border border-slate-850 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                      <Columns className="h-4 w-4 text-indigo-400" /> Mensualidades y Valores de Colegiatura (Planes de 12 Meses)
                    </h4>

                    {segmentObj?.p && Array.isArray(segmentObj.p) ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {segmentObj.p.map((price: number, idx: number) => {
                          const label = idx === 0 ? "Mes 1" : idx === 1 ? "Mes 2" : `Mes ${idx + 1}${idx === 2 ? ' *' : ''}`;
                          return (
                            <div key={idx} className="space-y-1 bg-slate-950 rounded-xl p-3 border border-slate-850 hover:border-slate-850 hover:shadow-xs transition-all">
                              <span className="text-[9px] text-slate-450 font-extrabold block text-center uppercase tracking-wider">{label}</span>
                              <div className="relative mt-1">
                                <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-600 font-bold">$</span>
                                <input
                                  type="number"
                                  value={price}
                                  onChange={(e) => handleMatrixPriceChange(idx, e.target.value)}
                                  className="w-full bg-slate-900 text-white text-xs font-bold text-center pl-6 pr-1.5 py-2 rounded-lg border border-slate-800 focus:border-indigo-500 transition-all font-sans"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-rose-450 italic">Este programa/segmento no cuenta con una tabla de mensualidades válida de mensualidad p[].</p>
                    )}
                    
                    <p className="text-[9px] text-slate-450 italic block pt-1">
                      *(Mes 3) Automatización: Al modificar el precio del Mes 3, para tu comodidad el sistema sincronizará ese mismo precio para todos los meses del 3 al 12 en un solo paso.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-2xl p-6 text-xs text-center font-bold">
                  No se encontró configuración para los criterios de matriz especificados.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global sticky bar to Save back to server */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-lg">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-indigo-400 font-bold animate-pulse">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
                Guardando cambios permanentemente en el servidor oficial del simulador...
              </span>
            )}
            {saveStatus === 'success' && (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                {saveMessage}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-400 font-extrabold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                {saveMessage}
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="text-slate-400 leading-normal block">
                Los cambios se aplican de manera local en el navegador, pero **debes guardarlos en el servidor** para persistir los cambios reales de forma permanente del simulador.
              </span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTriggerServerSave}
            disabled={saveStatus === 'saving'}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Database className="h-4 w-4" />
            {saveStatus === 'saving' ? 'Guardando...' : 'Guardar en Servidor (Real)'}
          </motion.button>
        </div>
      </main>
    </div>
  );
};
