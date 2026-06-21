"use client";

import { useQuery } from "@tanstack/react-query";
import { getSalesKPIs, getQAKPIs, getUnifiedDashboard } from "@/api/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Users,
  UserCheck,
  ClipboardCheck,
  BarChart3,
  RefreshCw,
  AlertCircle,
  PieChart,
  Smile,
  Meh,
  Frown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SalesKPIs, QAKPIs, UnifiedDashboard } from "@/api/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function statusBadgeVariant(
  value: number,
  type: "higher" | "lower" = "higher",
): "default" | "secondary" | "destructive" {
  if (type === "higher") {
    if (value >= 80) return "default";
    if (value >= 50) return "secondary";
    return "destructive";
  }
  // lower is better (unused for now)
  if (value <= 20) return "default";
  if (value <= 50) return "secondary";
  return "destructive";
}

// ─── Skeleton Components ────────────────────────────────────────────────────

function KPICardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-1 h-7 w-28" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2" style={{ height: 180 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${40 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sales Tab ──────────────────────────────────────────────────────────────

function SalesTab() {
  const { data, isLoading, isError, error, refetch } = useQuery<SalesKPIs>({
    queryKey: ["dashboard", "sales"],
    queryFn: () => getSalesKPIs(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KPICardsSkeleton />
        <ChartSkeleton />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Error al carrar KPIs de ventas"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return <EmptyState message="No hay datos de ventas disponibles." />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor del Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.pipelineValue)}</div>
            <p className="text-xs text-muted-foreground">Valor total en pipe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversionRate.toFixed(1)}%</div>
            <Badge variant={statusBadgeVariant(data.conversionRate)} className="mt-1">
              {data.conversionRate >= 80 ? "Excelente" : data.conversionRate >= 50 ? "Regular" : "Bajo"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Leads registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Clientes activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Contacts by Stage - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Contactos por Etapa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.contactsByStage.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay contactos en etapas aún.
            </p>
          ) : (
            <div className="space-y-4">
              {data.contactsByStage.map((stage) => {
                const maxCount = Math.max(...data.contactsByStage.map((s) => s.count), 1);
                const percentage = (stage.count / maxCount) * 100;
                return (
                  <div key={stage.stageId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.stageId}</span>
                      <span className="text-muted-foreground">
                        {stage.count} contactos · {formatCurrency(stage.value)}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity by Agent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Actividad por Agente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.activityByAgent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay actividad registrada aún.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agente</TableHead>
                    <TableHead className="text-right">Llamadas</TableHead>
                    <TableHead className="text-right">Tareas</TableHead>
                    <TableHead className="text-right">Contactos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.activityByAgent.map((agent) => (
                    <TableRow key={agent.agentId}>
                      <TableCell className="font-medium">{agent.agentName}</TableCell>
                      <TableCell className="text-right">{agent.callsCount}</TableCell>
                      <TableCell className="text-right">{agent.tasksCount}</TableCell>
                      <TableCell className="text-right">{agent.contactsCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── QA Tab ─────────────────────────────────────────────────────────────────

function QATab() {
  const { data, isLoading, isError, error, refetch } = useQuery<QAKPIs>({
    queryKey: ["dashboard", "qa"],
    queryFn: () => getQAKPIs(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KPICardsSkeleton />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-6" style={{ height: 160 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="w-20"
                  style={{ height: `${50 + Math.random() * 50}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Error al cargar KPIs de calidad"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return <EmptyState message="No hay datos de calidad disponibles." />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PCE Promedio</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averagePceScore.toFixed(1)}%</div>
            <Badge variant={statusBadgeVariant(data.averagePceScore)} className="mt-1">
              {data.averagePceScore >= 80 ? "Excelente" : data.averagePceScore >= 60 ? "Regular" : "Por mejorar"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Auditorías</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalAudits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Auditorías realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Cumplimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.complianceRate.toFixed(1)}%</div>
            <Badge variant={statusBadgeVariant(data.complianceRate)} className="mt-1">
              {data.complianceRate >= 80 ? "Excelente" : data.complianceRate >= 60 ? "Regular" : "Por mejorar"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Emotional Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Tendencia Emocional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-center gap-8 py-4">
            {/* Positive */}
            <div className="flex flex-col items-center gap-2">
              <Smile className="h-6 w-6 text-emerald-500" />
              <div
                className="w-16 rounded-t-md bg-emerald-500 transition-all duration-500"
                style={{
                  height: `${Math.max((data.emotionalTrend.positive / Math.max(data.emotionalTrend.positive + data.emotionalTrend.neutral + data.emotionalTrend.negative, 1)) * 200, 10)}px`,
                }}
              />
              <span className="text-sm font-medium">{data.emotionalTrend.positive}</span>
              <span className="text-xs text-muted-foreground">Positivas</span>
            </div>

            {/* Neutral */}
            <div className="flex flex-col items-center gap-2">
              <Meh className="h-6 w-6 text-amber-500" />
              <div
                className="w-16 rounded-t-md bg-amber-500 transition-all duration-500"
                style={{
                  height: `${Math.max((data.emotionalTrend.neutral / Math.max(data.emotionalTrend.positive + data.emotionalTrend.neutral + data.emotionalTrend.negative, 1)) * 200, 10)}px`,
                }}
              />
              <span className="text-sm font-medium">{data.emotionalTrend.neutral}</span>
              <span className="text-xs text-muted-foreground">Neutrales</span>
            </div>

            {/* Negative */}
            <div className="flex flex-col items-center gap-2">
              <Frown className="h-6 w-6 text-red-500" />
              <div
                className="w-16 rounded-t-md bg-red-500 transition-all duration-500"
                style={{
                  height: `${Math.max((data.emotionalTrend.negative / Math.max(data.emotionalTrend.positive + data.emotionalTrend.neutral + data.emotionalTrend.negative, 1)) * 200, 10)}px`,
                }}
              />
              <span className="text-sm font-medium">{data.emotionalTrend.negative}</span>
              <span className="text-xs text-muted-foreground">Negativas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audits by Agent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Auditorías por Agente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.auditsByAgent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay auditorías registradas aún.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agente</TableHead>
                    <TableHead className="text-right">Auditorías</TableHead>
                    <TableHead className="text-right">Puntaje Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.auditsByAgent.map((agent) => (
                    <TableRow key={agent.agentId}>
                      <TableCell className="font-medium">{agent.agentName}</TableCell>
                      <TableCell className="text-right">{agent.count}</TableCell>
                      <TableCell className="text-right">{agent.avgScore.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Unified Tab ─────────────────────────────────────────────────────────────

function UnifiedTab() {
  const { data, isLoading, isError, error, refetch } = useQuery<UnifiedDashboard>({
    queryKey: ["dashboard", "unified"],
    queryFn: () => getUnifiedDashboard(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KPICardsSkeleton />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Error al cargar dashboard unificado"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return <EmptyState message="No hay datos del dashboard unificado." />;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold tracking-tight">Resumen Comercial</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor del Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(data.sales.pipelineValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.sales.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.sales.totalLeads.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.sales.totalCustomers.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <SeparatorLine />

      <h3 className="text-lg font-semibold tracking-tight">Resumen de Calidad</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">PCE Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.qa.averagePceScore.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Auditorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.qa.totalAudits.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.qa.complianceRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Emotional trend mini */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PieChart className="h-4 w-4 text-primary" />
            Tendencia Emocional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Smile className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">{data.qa.emotionalTrend.positive}</span>
            </div>
            <div className="flex items-center gap-2">
              <Meh className="h-4 w-4 text-amber-500" />
              <span className="text-sm">{data.qa.emotionalTrend.neutral}</span>
            </div>
            <div className="flex items-center gap-2">
              <Frown className="h-4 w-4 text-red-500" />
              <span className="text-sm">{data.qa.emotionalTrend.negative}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="font-semibold text-destructive">Error al cargar datos</h3>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function SeparatorLine() {
  return <div className="h-px bg-border" />;
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de indicadores clave
        </p>
      </div>

      <Tabs defaultValue="comercial" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="comercial" className="flex-1 sm:flex-none">
            Comercial
          </TabsTrigger>
          <TabsTrigger value="calidad" className="flex-1 sm:flex-none">
            Calidad
          </TabsTrigger>
          <TabsTrigger value="unificado" className="flex-1 sm:flex-none">
            Unificado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comercial" className="mt-6">
          <SalesTab />
        </TabsContent>

        <TabsContent value="calidad" className="mt-6">
          <QATab />
        </TabsContent>

        <TabsContent value="unificado" className="mt-6">
          <UnifiedTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
