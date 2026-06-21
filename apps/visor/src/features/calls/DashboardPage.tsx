import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useCalls, useMoveCall } from '../../hooks/useCalls';
import { useAuthStore } from '../../auth/authStore';
import QuickActionMenu from './QuickActionMenu';
import AddContactModal from './AddContactModal';
import AddCallModal from './AddCallModal';
import AddNoteModal from './AddNoteModal';
import { motion } from 'motion/react';
import { 
  Plus, MoreVertical, CheckCircle2, ArrowUpRight, Search,
  ChevronLeft, ChevronRight, Star, BarChart, Headphones,
  PhoneForwarded, UserPlus, FolderHeart
} from 'lucide-react';
import type { CallItem, CallStatus } from '@auditor/shared-types';

export default function DashboardPage() {
  const { searchQuery, darkMode } = useOutletContext<{ searchQuery: string; darkMode: boolean }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const visorRole = useAuthStore(s => s.visorRole);
  const isAgent = visorRole() === 'agente';
  
  const [agentTab, setAgentTab] = useState<'seguimientos' | 'llamadas' | 'completadas'>('seguimientos');
  const [activeCardMenuId, setActiveCardMenuId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isContactAddOpen, setIsContactAddOpen] = useState(false);
  const [isNoteAddOpen, setIsNoteAddOpen] = useState(false);

  const { data: calls = [], isLoading, error } = useCalls({ search: searchQuery || undefined });
  const moveCall = useMoveCall();

  const filteredCalls = calls.filter((call: CallItem) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return call.title.toLowerCase().includes(q) || call.agent.toLowerCase().includes(q) || call.category.toLowerCase().includes(q);
  });

  const getCallsByStatus = (status: CallStatus) => filteredCalls.filter((c: CallItem) => c.status === status);

  const handleAuditSelect = (callId: string) => {
    if (isAgent) {
      // Show modal or redirect based on role
    }
    navigate(`/auditor/${callId}`);
  };

  // Stats
  const userAudits = calls.filter((c: CallItem) => c.agentId === user?.sub && c.status === 'completada');
  const avgScore = userAudits.length > 0 
    ? userAudits.reduce((acc: number, curr: CallItem) => acc + (curr.score || 0), 0) / userAudits.length 
    : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 h-full items-start overflow-y-auto w-full pb-28">
      
      <div className="flex-1 space-y-8 w-full">
        
        {/* Quick Action Menu */}
        <QuickActionMenu
          isAgent={isAgent}
          darkMode={darkMode}
          onNewAudit={() => handleAuditSelect('default')}
          onNewCall={() => setIsAddOpen(true)}
          onAddContact={() => setIsContactAddOpen(true)}
          onAddNote={() => setIsNoteAddOpen(true)}
          onOpenMetrics={() => {}}
          onOpenResources={() => navigate('/resources')}
        />

        {/* Kanban */}
        {isAgent ? (
          <AgentView
            calls={filteredCalls.filter((c: CallItem) => c.agentId === user?.sub)}
            darkMode={darkMode}
            agentTab={agentTab}
            setAgentTab={setAgentTab}
            onAuditSelect={handleAuditSelect}
          />
        ) : (
          <KanbanBoard
            calls={filteredCalls}
            darkMode={darkMode}
            getCallsByStatus={getCallsByStatus}
            activeCardMenuId={activeCardMenuId}
            setActiveCardMenuId={setActiveCardMenuId}
            onAuditSelect={handleAuditSelect}
            onMoveCall={(id: string, status: CallStatus) => moveCall.mutate({ id, status })}
            onAdd={() => setIsAddOpen(true)}
          />
        )}

        {/* Completed Audits Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className={`text-sm md:text-base font-bold font-display ${darkMode ? 'text-[#f4f1eb]' : 'text-stone-850'}`}>
                Tus auditorías
              </h2>
              <span className="text-[9px] font-bold tracking-wider uppercase border px-2.5 py-0.5 rounded-full text-[#b57b54] bg-[#faedcd]/40 border-[#d4a373]/30 dark:text-[#ffd8b3] dark:bg-[#3e342a]/40 dark:border-[#d4a373]/20">
                Historial
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCalls.filter((c: CallItem) => c.status === 'completada').slice(0, 4).map((call: CallItem) => (
              <div key={call.id}
                onClick={() => handleAuditSelect(call.id)}
                className={`p-4 rounded-[5px] border-[3px] cursor-pointer hover:border-emerald-500 transition-all ${
                  darkMode ? 'bg-[#1c1a18] border-[#3e382f] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#dfd9cc] shadow-[4px_4px_0px_#dfd9cc]'
                }`}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    {call.category}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className={`font-bold text-xs leading-snug ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{call.title}</h3>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-[10px] text-stone-500">{call.agent}</span>
                  <span className="text-[11px] font-bold text-emerald-600">{call.score?.toFixed(1) || '—'}</span>
                </div>
              </div>
            ))}
            {filteredCalls.filter((c: CallItem) => c.status === 'completada').length === 0 && (
              <div className="col-span-full py-12 text-center text-xs font-black uppercase tracking-widest opacity-40">
                Sin auditorías completadas
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/10 z-50">
          <div className="w-8 h-8 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
        </div>
      )}

      {/* Modals */}
      {isAddOpen && <AddCallModal darkMode={darkMode} onClose={() => setIsAddOpen(false)} />}
      {isContactAddOpen && <AddContactModal darkMode={darkMode} onClose={() => setIsContactAddOpen(false)} />}
      {isNoteAddOpen && <AddNoteModal darkMode={darkMode} onClose={() => setIsNoteAddOpen(false)} />}
    </div>
  );
}

function AgentView({ calls, darkMode, agentTab, setAgentTab, onAuditSelect }: any) {
  return (
    <div className="space-y-6">
      <div className={`inline-flex p-1.5 rounded-2xl ${darkMode ? 'bg-[#1c1a18] border border-[#3e382f]' : 'bg-stone-50 border border-stone-200 shadow-sm'}`}>
        {['seguimientos', 'llamadas', 'completadas'].map((tab) => (
          <button key={tab}
            onClick={() => setAgentTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              agentTab === tab
                ? darkMode ? 'bg-amber-900/40 text-amber-500 shadow-inner' : 'bg-white text-[#b57b54] shadow-md border border-[#dfd9cc]'
                : darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-500 hover:text-stone-800'
            }`}>
            {tab === 'seguimientos' ? 'Mis Seguimientos' : tab === 'llamadas' ? 'En Proceso' : 'Completadas'}
          </button>
        ))}
      </div>

      {agentTab === 'seguimientos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calls.filter((c: any) => c.status !== 'completada').length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs font-black uppercase tracking-widest opacity-40">
              Sin llamadas asignadas
            </div>
          ) : (
            calls.filter((c: any) => c.status !== 'completada').map((call: any) => (
              <div key={call.id} className={`p-6 rounded-[5px] border-[3px] ${darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'}`}>
                <h3 className="font-black font-display text-sm">{call.title}</h3>
                <p className={`text-[11px] mt-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                  {call.status === 'en_revision' ? 'En revisión' : 'Pendiente de auditoría'}
                </p>
              </div>
            ))
          )}
        </div>
      )}
      {agentTab === 'llamadas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calls.filter((c: any) => c.status === 'por_auditar' || c.status === 'en_revision').map((call: any) => (
            <CallCard key={call.id} call={call} darkMode={darkMode} onClick={() => onAuditSelect(call.id)} />
          ))}
        </div>
      )}
      {agentTab === 'completadas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calls.filter((c: any) => c.status === 'completada').map((call: any) => (
            <CallCard key={call.id} call={call} darkMode={darkMode} onClick={() => onAuditSelect(call.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanBoard({ calls, darkMode, getCallsByStatus, activeCardMenuId, setActiveCardMenuId, onAuditSelect, onMoveCall, onAdd }: any) {
  const columns = [
    { id: 'por_auditar', title: 'Por auditar', color: 'bg-orange-400', dotColor: 'bg-orange-400' },
    { id: 'en_revision', title: 'En revisión', color: 'bg-purple-400', dotColor: 'bg-purple-400' },
    { id: 'completada', title: 'Completadas', color: 'bg-emerald-500', dotColor: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-bold font-display flex items-center gap-1 ${darkMode ? 'text-[#f4f1eb]' : 'text-stone-800'}`}>
          Llamadas en Proceso <span className="text-sm">🗣️</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.id} className={`p-5 flex flex-col space-y-4 min-h-[350px] rounded-[5px] border-[3px] transition-all hover:-translate-x-1 hover:-translate-y-1 ${
            darkMode ? 'bg-stone-900 border-stone-800 shadow-[4px_4px_0px_#1c1a18]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
          }`}>
            <div className="flex items-center justify-between px-1">
              <div className={`flex items-center gap-2 ${darkMode ? 'text-stone-300' : 'text-stone-800'}`}>
                <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <span className="text-sm font-bold font-display">{col.title}</span>
                <span className={`text-xs border rounded-full px-2 py-0.5 font-semibold ${
                  darkMode ? 'bg-[#24211e] text-stone-300 border-[#3e382f]' : 'bg-white text-stone-600 border-[#dfd9cc]/65'
                }`}>
                  {getCallsByStatus(col.id).length}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {getCallsByStatus(col.id).length === 0 ? (
                <div className={`h-40 border border-dashed rounded-xl flex items-center justify-center ${darkMode ? 'border-[#2e2a24]' : 'border-[#dfd9cc]'}`}>
                  <p className="text-xs text-stone-500">Sin llamadas</p>
                </div>
              ) : (
                getCallsByStatus(col.id).map((call: any) => (
                  <div key={call.id}
                    onClick={() => onAuditSelect(call.id)}
                    className={`border-[3px] rounded-[5px] p-4 transition-all cursor-pointer hover:-translate-x-1 hover:-translate-y-1 ${
                      darkMode ? 'bg-[#24211e] border-[#4a4036] hover:bg-[#2e2a24] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] hover:bg-stone-50 shadow-[4px_4px_0px_#2d2d2d]'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider border ${
                        call.category === 'CALIDAD' ? 'bg-amber-50 text-amber-800 border-amber-200/50 dark:bg-amber-900/30 dark:text-amber-300' :
                        call.category === 'EXPERIENCIA' ? 'bg-blue-50 text-blue-800 border-blue-200/50 dark:bg-indigo-900/30 dark:text-indigo-300' :
                        'bg-emerald-50 text-emerald-800 border-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}>
                        {call.category}
                      </span>
                      
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveCardMenuId(activeCardMenuId === call.id ? null : call.id)}
                          className={`p-1 rounded-lg ${darkMode ? 'hover:bg-[#2e2a24] text-stone-400' : 'hover:bg-stone-100 text-stone-400'}`}>
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        
                        {activeCardMenuId === call.id && (
                          <div className={`absolute right-0 top-6 w-44 border rounded-xl shadow-lg z-20 py-1 text-xs ${
                            darkMode ? 'bg-[#1c1a18] border-[#3e382f]' : 'bg-white border-[#dfd9cc]'
                          }`}>
                            {col.id !== 'en_revision' && (
                              <button className={`w-full text-left px-3 py-2 ${darkMode ? 'hover:bg-[#24211e] text-stone-200' : 'hover:bg-[#FAF6F0] text-stone-700'}`}
                                onClick={() => { onMoveCall(call.id, 'en_revision'); setActiveCardMenuId(null); }}>
                                Mover a: En revisión
                              </button>
                            )}
                            {col.id !== 'completada' && (
                              <button className={`w-full text-left px-3 py-2 ${darkMode ? 'hover:bg-[#24211e] text-stone-200' : 'hover:bg-[#FAF6F0] text-stone-700'}`}
                                onClick={() => { onMoveCall(call.id, 'completada'); setActiveCardMenuId(null); }}>
                                Mover a: Completada
                              </button>
                            )}
                            {col.id !== 'por_auditar' && (
                              <button className={`w-full text-left px-3 py-2 ${darkMode ? 'hover:bg-[#24211e] text-stone-200' : 'hover:bg-[#FAF6F0] text-stone-700'}`}
                                onClick={() => { onMoveCall(call.id, 'por_auditar'); setActiveCardMenuId(null); }}>
                                Mover a: Por auditar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className={`text-xs font-bold tracking-tight mb-3 ${darkMode ? 'text-stone-100' : 'text-stone-850'}`}>
                      {call.title}
                    </h3>

                    <div className="flex items-center gap-2">
                      <div className={`w-[22px] h-[22px] border rounded-full flex items-center justify-center text-[10px] font-semibold ${
                        darkMode ? 'bg-[#3e342a] text-[#ffd8b3] border-[#70563e]/40' : 'bg-[#faedcd] text-[#b57b54] border-[#d4a373]/30'
                      }`}>
                        {call.avatar || call.agent?.charAt(0) || '?'}
                      </div>
                      <span className={`text-[11px] font-medium truncate ${darkMode ? 'text-stone-300' : 'text-[#8c7b6c]'}`}>
                        {call.agent}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CallCard({ call, darkMode, onClick }: any) {
  return (
    <div onClick={onClick}
      className={`p-6 rounded-[5px] border-[3px] cursor-pointer transition-all hover:scale-[1.02] ${
        darkMode ? 'bg-[#24211e] border-[#4a4036] shadow-[4px_4px_0px_#151311]' : 'bg-white border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d]'
      }`}>
      <h3 className="font-black font-display text-sm">{call.title}</h3>
      <p className={`text-[11px] mt-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{call.category}</p>
      {call.score && <span className="text-xs font-bold text-emerald-600 mt-2 block">{call.score.toFixed(1)}</span>}
    </div>
  );
}
