import { useState, useEffect } from 'react';
import {
  MoreVertical,
  ArrowUpRight,
  Plus,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useDashboardKPIs, useDashboardCalls } from '../hooks/useDashboard';
import type { CallItem } from '@auditor/shared-types';

function scoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-100 text-emerald-700'
  if (score >= 65) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

function typeColor(type: string): { bg: string; text: string } {
  switch (type) {
    case 'CALIDAD': return { bg: 'bg-purple-light', text: 'text-purple-tag' };
    case 'EXPERIENCIA': return { bg: 'bg-pink-light', text: 'text-pink-tag' };
    case 'CUMPLIMIENTO': return { bg: 'bg-blue-light', text: 'text-blue-tag' };
    default: return { bg: 'bg-muted', text: 'text-muted-foreground' };
  }
}

export function HomePage() {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: calls, isLoading: callsLoading } = useDashboardCalls();

  const kanbanColumns = [
    {
      id: 'todo',
      title: 'Por auditar',
      dot: 'bg-purple-tag',
      status: 'por_auditar' as const,
    },
    {
      id: 'review',
      title: 'En revisión',
      dot: 'bg-pink-tag',
      status: 'en_revision' as const,
    },
    {
      id: 'done',
      title: 'Completadas',
      dot: 'bg-blue-tag',
      status: 'completada' as const,
    },
  ];

  const getCardsForColumn = (status: string) =>
    calls.filter((c: CallItem) => c.status === status);

  const chartData = kpis
    ? [
        { range: 'Score', value: Math.round(kpis.qa.averagePceScore) },
        { range: 'Cumplimiento', value: Math.round(kpis.qa.complianceRate) },
        { range: 'Auditorías', value: Math.min(kpis.qa.totalAudits, 100) },
      ]
    : [
        { range: 'Score', value: 0 },
        { range: 'Cumplimiento', value: 0 },
        { range: 'Auditorías', value: 0 },
      ];

  const isLoading = kpisLoading || callsLoading;

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 text-white">
          <div className="relative z-10 max-w-md">
            <h1 className="text-2xl font-bold leading-snug mb-4">Panel de Control</h1>
            <p className="text-sm opacity-90">
              {kpis
                ? `${kpis.qa.totalAudits} auditorías · ${kpis.qa.averagePceScore.toFixed(1)}% score promedio`
                : 'Cargando indicadores...'}
            </p>
          </div>
        </div>

        {/* Kanban Board */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Pendientes</h2>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {kanbanColumns.map((col) => {
              const cards = getCardsForColumn(col.status);
              return (
                <div key={col.id} className="bg-muted/40 rounded-xl p-3 flex flex-col gap-3 min-h-[260px]">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <span className="text-xs font-semibold text-foreground">{col.title}</span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-card rounded-full px-2 py-0.5">
                        {cards.length}
                      </span>
                    </div>
                    <button className="w-6 h-6 rounded-md hover:bg-card flex items-center justify-center text-muted-foreground">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {cards.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-[10px] text-muted-foreground">Sin llamadas</p>
                      </div>
                    ) : (
                      cards.slice(0, 6).map((card: CallItem) => {
                        const tc = typeColor(card.category);
                        return (
                          <div key={card.id} className="bg-card rounded-lg border border-border p-3 hover:shadow-sm transition-shadow cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`inline-block text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${tc.bg} ${tc.text}`}>
                                {card.category}
                              </span>
                              {col.id === 'done' ? (
                                <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </span>
                              ) : (
                                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                            <h3 className="text-xs font-semibold text-foreground leading-snug mb-3 line-clamp-2">{card.title}</h3>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                                {card.avatar || card.agent?.charAt(0) || '?'}
                              </div>
                              <p className="text-[11px] font-medium text-foreground">{card.agent}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Auditorías Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Auditorías por agente</h2>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1.4fr_110px_1.6fr_90px_60px] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
              <span>Agente</span><span>Auditorías</span><span>Score</span><span>Calidad</span><span className="text-right">Acción</span>
            </div>
            {kpis?.qa.auditsByAgent && kpis.qa.auditsByAgent.length > 0 ? (
              kpis.qa.auditsByAgent.map((agent) => (
                <div key={agent.agentId} className="grid grid-cols-[1.4fr_110px_1.6fr_90px_60px] px-4 py-3 items-center border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {agent.agentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{agent.agentName}</p>
                      <p className="text-xs text-muted-foreground">{agent.count} auditorías</p>
                    </div>
                  </div>
                  <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-purple-light text-purple-tag w-fit">QA</span>
                  <p className="text-sm text-foreground truncate pr-4">{agent.avgScore.toFixed(1)}%</p>
                  <span className={`inline-flex items-center justify-center text-xs font-bold px-2 py-1 rounded-md w-fit ${scoreColor(agent.avgScore)}`}>
                    {agent.avgScore >= 80 ? 'Excelente' : agent.avgScore >= 65 ? 'Regular' : 'Mejorable'}
                  </span>
                  <button className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors justify-self-end">
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <AlertCircle className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sin datos de auditorías</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Stats */}
      <aside className="w-72 shrink-0 space-y-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4">
            {kpis ? `Score: ${kpis.qa.averagePceScore.toFixed(1)}%` : 'Estadísticas'}
          </h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={index === 1 ? 'var(--primary)' : 'var(--purple-light)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {kpis && (
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>Total auditorías: {kpis.qa.totalAudits}</p>
              <p>Cumplimiento: {kpis.qa.complianceRate.toFixed(1)}%</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
