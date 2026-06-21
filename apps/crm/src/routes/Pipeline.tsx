"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getPipelineWithStages, getKanbanContacts } from "@/api/pipeline";
import { moveContactStage } from "@/api/contacts";
import type { Contact, PipelineStage } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  Kanban,
  AlertCircle,
  RefreshCw,
  Building2,
  Clock,
  DollarSign,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface KanbanColumn {
  stage: PipelineStage;
  contacts: Contact[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Pipeline() {
  const queryClient = useQueryClient();
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  // ── Sensors ─────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // ── Fetch pipeline with stages ──────────────────────────────────────────
  const {
    data: pipelineData,
    isLoading: stagesLoading,
    isError: stagesError,
    error: stagesErr,
    refetch: refetchStages,
  } = useQuery({
    queryKey: ["pipeline"],
    queryFn: () => getPipelineWithStages(),
  });

  // ── Fetch Kanban contacts ───────────────────────────────────────────────
  const {
    data: kanbanData,
    isLoading: kanbanLoading,
    isError: kanbanError,
    refetch: refetchKanban,
  } = useQuery({
    queryKey: ["kanban"],
    queryFn: () => getKanbanContacts(),
  });

  // ── Mutation ────────────────────────────────────────────────────────────
  const moveMutation = useMutation({
    mutationFn: ({
      contactId,
      stageId,
    }: {
      contactId: string;
      stageId: string;
    }) => moveContactStage(contactId, stageId),
    onMutate: async ({ contactId, stageId }) => {
      await queryClient.cancelQueries({ queryKey: ["kanban"] });

      const previous = queryClient.getQueryData<typeof kanbanData>([
        "kanban",
      ]);

      if (previous) {
        const updated = previous.map((col) => ({
          ...col,
          contacts:
            col.stageId === stageId
              ? [
                  ...col.contacts,
                  ...previous
                    .flatMap((c) => c.contacts)
                    .filter((c) => c.id === contactId),
                ]
              : col.contacts.filter((c) => c.id !== contactId),
        }));
        queryClient.setQueryData(["kanban"], updated);
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["kanban"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  // ── Build columns ───────────────────────────────────────────────────────
  const stages = pipelineData?.stages ?? [];
  const kanban = kanbanData ?? [];

  const columns: KanbanColumn[] = stages
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((stage) => {
      const stageKanban = kanban.find((k) => k.stageId === stage.id);
      return {
        stage,
        contacts: stageKanban?.contacts ?? [],
      };
    });

  // ── Drag handlers ───────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const contactId = event.active.id as string;
    // Find the contact in any column
    for (const col of kanban) {
      const contact = col.contacts.find((c) => c.id === contactId);
      if (contact) {
        setActiveContact(contact);
        break;
      }
    }
  }, [kanban]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveContact(null);

      const { active, over } = event;
      if (!over) return;

      const contactId = active.id as string;

      // Determine the target stage from the droppable ID
      // Droppable IDs are prefixed with "stage-"
      const overId = over.id as string;
      if (!overId.startsWith("stage-")) return;

      const targetStageId = overId.replace("stage-", "");

      // Find current stage of the contact
      for (const col of kanban) {
        const contact = col.contacts.find((c) => c.id === contactId);
        if (contact) {
          // Only move if it's a different stage
          if (col.stageId !== targetStageId) {
            moveMutation.mutate({ contactId, stageId: targetStageId });
          }
          return;
        }
      }
    },
    [kanban, moveMutation],
  );

  // ── Loading state ───────────────────────────────────────────────────────
  if (stagesLoading) {
    return <PipelineSkeleton />;
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Arrastra contactos entre etapas para actualizar su progreso
          </p>
        </div>
        {pipelineData?.pipeline && (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">Pipeline:</span>
            <span className="font-medium">{pipelineData.pipeline.name}</span>
          </div>
        )}
      </div>

      {/* Error state */}
      {(stagesError || kanbanError) && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="flex-1 text-sm text-destructive">
              {stagesError
                ? stagesErr instanceof Error
                  ? stagesErr.message
                  : "Error al cargar etapas"
                : "Error al cargar contactos del Kanban"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchStages();
                refetchKanban();
              }}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      {stagesLoading || kanbanLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex w-72 shrink-0 flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-24 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : columns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Kanban className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="font-semibold">Sin etapas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Este pipeline no tiene etapas configuradas.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((col) => (
              <KanbanColumn
                key={col.stage.id}
                stage={col.stage}
                contacts={col.contacts}
              />
            ))}
          </div>

          <DragOverlay>
            {activeContact ? (
              <KanbanCard contact={activeContact} isDragOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────

function KanbanColumn({ stage, contacts }: KanbanColumn) {
  const droppableId = `stage-${stage.id}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 transition-colors",
        isOver && "bg-muted/60 ring-2 ring-primary/30",
      )}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between rounded-t-xl px-4 py-3"
        style={{ backgroundColor: stage.color ? `${stage.color}15` : undefined }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: stage.color || "#888" }}
          />
          <h3 className="text-sm font-semibold">{stage.name}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {contacts.length}
        </Badge>
      </div>

      {/* Column body - droppable */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 p-3"
        style={{ minHeight: 200 }}
      >
        <SortableContext
          items={contacts.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {contacts.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-4">
              <p className="text-center text-xs text-muted-foreground">
                Arrastra contactos aquí
              </p>
            </div>
          ) : (
            contacts.map((contact) => (
              <SortableKanbanCard key={contact.id} contact={contact} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Sortable Kanban Card ───────────────────────────────────────────────────

function SortableKanbanCard({ contact }: { contact: Contact }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard contact={contact} />
    </div>
  );
}

// ─── Kanban Card ────────────────────────────────────────────────────────────

function KanbanCard({
  contact,
  isDragOverlay = false,
}: {
  contact: Contact;
  isDragOverlay?: boolean;
}) {
  // Calculate days in stage (rough estimate from lastActivityAt or createdAt)
  const stageDate = contact.lastActivityAt || contact.createdAt;
  const daysInStage = stageDate
    ? Math.floor(
        (Date.now() - new Date(stageDate).getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <Card
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragOverlay && "shadow-xl rotate-2 scale-105",
      )}
    >
      <CardContent className="p-3">
        <p className="text-sm font-medium leading-tight">{contact.fullName}</p>

        {contact.company && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{contact.company}</span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {contact.email && (
            <span className="truncate text-xs text-muted-foreground">
              {contact.email}
            </span>
          )}
        </div>

        {daysInStage !== null && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{daysInStage}d en etapa</span>
          </div>
        )}

        {/* Contact metadata value if any */}
        {contact.metadata?.value != null && (
          <div className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
            <DollarSign className="h-3 w-3" />
            <span>{formatCurrency(Number(contact.metadata.value))}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function PipelineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-56" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex w-72 shrink-0 flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-28 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
