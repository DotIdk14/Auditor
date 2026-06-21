import React, { useState, useEffect } from 'react';
import { Folder, X, ChevronRight, ArrowLeft, Home, RefreshCw, Search, HardDrive, FileAudio } from 'lucide-react';

interface DriveExplorerProps {
  onImportFromDrive: (fileId: string, fileName: string) => void;
  isImporting: string | null;
  onClose: () => void;
}

export default function DriveExplorer({ onImportFromDrive, isImporting, onClose }: DriveExplorerProps) {
  const [isDriveLoading, setIsDriveLoading] = useState(true);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [activeFolderId, setActiveFolderId] = useState<string>('root');
  const [navigationHistory, setNavigationHistory] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'Mi Unidad' }
  ]);
  const [sharedDrives, setSharedDrives] = useState<any[]>([]);
  const [driveTab, setDriveTab] = useState<'my-drive' | 'shared-drives' | 'recent'>('my-drive');

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getAccessToken = (): string | null => {
    return localStorage.getItem('utel_google_drive_token');
  };

  const fetchDriveFiles = async (
    token: string,
    folderId: string = 'root',
    tab: 'my-drive' | 'shared-drives' | 'recent' = 'my-drive'
  ) => {
    setIsDriveLoading(true);
    try {
      if (tab === 'shared-drives') {
        const url = `https://www.googleapis.com/drive/v3/shareddrives?pageSize=50`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Error al listar las Unidades Compartidas. Es posible que tu cuenta no disponga de ellas.');
        }
        const data = await response.json();
        setSharedDrives(data.sharedDrives || data.items || []);
        setDriveFiles([]);
      } else if (tab === 'recent') {
        const q = encodeURIComponent("mimeType contains 'audio/' and trashed = false");
        const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size,modifiedTime)&pageSize=50&orderBy=modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Error al listar archivos recientes.');
        }
        const data = await response.json();
        setDriveFiles(data.files || []);
      } else {
        const q = encodeURIComponent(`'${folderId}' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'audio/' or name contains '.mp3' or name contains '.wav' or name contains '.mpeg' or name contains '.m4a' or name contains '.webm')`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size,modifiedTime)&pageSize=100&orderBy=folder,name,modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('No se pudo abrir esta carpeta en Google Drive.');
        }
        const data = await response.json();
        setDriveFiles(data.files || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleItemClick = async (item: any) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    if (item.mimeType === 'application/vnd.google-apps.folder') {
      const nextHistory = [...navigationHistory, { id: item.id, name: item.name }];
      setNavigationHistory(nextHistory);
      setActiveFolderId(item.id);
      await fetchDriveFiles(accessToken, item.id, 'my-drive');
    } else {
      onImportFromDrive(item.id, item.name);
    }
  };

  const handleSharedDriveClick = async (drive: any) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    setDriveTab('my-drive');
    setNavigationHistory([{ id: drive.id, name: drive.name }]);
    setActiveFolderId(drive.id);
    await fetchDriveFiles(accessToken, drive.id, 'my-drive');
  };

  const handleBreadcrumbClick = async (idx: number) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    const nextHistory = navigationHistory.slice(0, idx + 1);
    setNavigationHistory(nextHistory);
    const targetFolderId = nextHistory[nextHistory.length - 1].id;
    setActiveFolderId(targetFolderId);
    await fetchDriveFiles(accessToken, targetFolderId, 'my-drive');
  };

  const handleTabChange = async (tab: 'my-drive' | 'shared-drives' | 'recent') => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    setDriveTab(tab);
    setDriveSearchQuery('');
    if (tab === 'my-drive') {
      setNavigationHistory([{ id: 'root', name: 'Mi Unidad' }]);
      setActiveFolderId('root');
      await fetchDriveFiles(accessToken, 'root', 'my-drive');
    } else if (tab === 'shared-drives') {
      await fetchDriveFiles(accessToken, 'root', 'shared-drives');
    } else {
      await fetchDriveFiles(accessToken, 'root', 'recent');
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      fetchDriveFiles(token, 'root', 'my-drive');
    } else {
      setIsDriveLoading(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121212] w-full max-w-lg rounded-2xl border border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-white">Google Drive</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-gray-400 transition-colors"
            id="close-drive-explorer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-zinc-800 bg-[#151515] px-2 pt-2">
          <button
            onClick={() => handleTabChange('my-drive')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              driveTab === 'my-drive' 
                ? 'border-indigo-550 text-white' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Mi Unidad
          </button>
          <button
            onClick={() => handleTabChange('shared-drives')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              driveTab === 'shared-drives' 
                ? 'border-indigo-550 text-white' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Unidades Compartidas
          </button>
          <button
            onClick={() => handleTabChange('recent')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              driveTab === 'recent' 
                ? 'border-indigo-550 text-white' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Todos los Audios / Recientes
          </button>
        </div>

        {driveTab === 'my-drive' && (
          <div className="px-4 py-2.5 bg-[#181818] border-b border-zinc-800 flex items-center gap-1.5 flex-wrap overflow-x-auto text-[11px] text-gray-400">
            <Home className="w-3.5 h-3.5 text-gray-500 hover:text-white cursor-pointer" onClick={() => handleBreadcrumbClick(0)} />
            {navigationHistory.map((folder, index) => (
              <React.Fragment key={folder.id}>
                {index > 0 && <ChevronRight className="w-3 h-3 text-zinc-650" />}
                {index > 0 && (
                  <span 
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`hover:text-white cursor-pointer truncate max-w-[120px] ${
                      index === navigationHistory.length - 1 ? 'text-indigo-400 font-bold' : ''
                    }`}
                  >
                    {folder.name}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="p-3 border-b border-zinc-800 bg-[#161616]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input 
              type="text" 
              placeholder={driveTab === 'shared-drives' ? "Buscar unidades compartidas..." : "Buscar archivos o carpetas..."}
              value={driveSearchQuery}
              onChange={(e) => setDriveSearchQuery(e.target.value)}
              className="w-full bg-[#121212] border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[300px]">
          {isDriveLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-gray-400 font-medium">Buscando en Google Drive...</p>
            </div>
          ) : driveTab === 'shared-drives' ? (
            sharedDrives.filter(d => d.name.toLowerCase().includes(driveSearchQuery.toLowerCase())).length > 0 ? (
              sharedDrives.filter(d => d.name.toLowerCase().includes(driveSearchQuery.toLowerCase())).map((drive) => (
                <button
                  key={drive.id}
                  onClick={() => handleSharedDriveClick(drive)}
                  className="w-full text-left p-3 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-[#3bc] bg-opacity-10 flex items-center justify-center text-[#3bc] group-hover:bg-[#3bc] group-hover:text-black transition-all">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-gray-200 truncate pr-2">{drive.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">Unidad Compartida Organizacional</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Abrir
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                  <Folder className="w-8 h-8 text-zinc-700" />
                </div>
                <p className="text-sm font-medium text-gray-400 font-sans">No se encontraron Unidades Compartidas</p>
                <p className="text-xs text-gray-500 mt-1 px-8 leading-relaxed">Las cuentas institucionales suelen usar Unidades Compartidas. Si no tienes ninguna asignada, revisa la sección "Mi Unidad".</p>
              </div>
            )
          ) : (
            driveFiles.filter(f => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())).length > 0 ? (
              driveFiles.filter(f => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())).map((file) => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                return (
                  <button
                    key={file.id}
                    onClick={() => handleItemClick(file)}
                    className="w-full text-left p-3 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {isFolder ? (
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                          <Folder className="w-4 h-4 fill-amber-500/20 group-hover:fill-current" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          <FileAudio className="w-4 h-4" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-[13px] font-medium text-gray-200 truncate pr-2">{file.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {isFolder 
                            ? 'Carpeta / Directorio' 
                            : `${file.size ? formatBytes(parseInt(file.size)) : 'Tamaño desconocido'} • ${new Date(file.modifiedTime).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap ${
                      isImporting === file.id ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100 transition-opacity'
                    }`}>
                      {isImporting === file.id ? 'Importando...' : isFolder ? 'Abrir' : 'Importar'}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-zinc-700" />
                </div>
                <p className="text-sm font-medium text-gray-400">Carpeta vacía o sin audios</p>
                <p className="text-xs text-gray-500 mt-1 px-8 leading-relaxed">
                  Esta carpeta no tiene archivos de audio estándar (.mp3, .wav, .mpeg) ni subcarpetas.
                </p>
              </div>
            )
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-[#161616] flex items-center justify-between">
          <button 
            onClick={() => {
              const token = getAccessToken();
              if (token) fetchDriveFiles(token, activeFolderId, driveTab);
            }}
            className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar lista
          </button>
          {driveTab === 'my-drive' && navigationHistory.length > 1 && (
            <button
              onClick={() => handleBreadcrumbClick(navigationHistory.length - 2)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Subir nivel
            </button>
          )}
          <div className="text-[10px] text-gray-500 font-mono">
            {driveTab === 'my-drive' ? 'Vista Explorador' : driveTab === 'shared-drives' ? 'Unidades' : 'Audios'}
          </div>
        </div>
      </div>
    </div>
  );
}
