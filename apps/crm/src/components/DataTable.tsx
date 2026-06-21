"use client";

import type { ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  /** Column header text */
  header: string;
  /** Direct key accessor on the data object */
  accessorKey?: keyof T & string;
  /** Custom render function — takes precedence over accessorKey */
  cell?: (item: T) => ReactNode;
  /** Whether the column is sortable (reserved for future use) */
  sortable?: boolean;
  /** Additional classes for the <td> element */
  className?: string;
}

export interface DataTableProps<T> {
  /** Array of data items to render */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Whether the table is in a loading state */
  isLoading?: boolean;
  /** Total number of items (for pagination) */
  total?: number;
  /** Current page (1-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Callback fired when the page changes */
  onPageChange?: (page: number) => void;
  /** Message shown when there are no rows */
  emptyMessage?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  emptyMessage = "No se encontraron registros",
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.header} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <TableRow key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <TableCell key={colIdx} className={col.className}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border py-16">
        <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // ── Data rows ─────────────────────────────────────────────────────────
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.header} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, rowIdx) => (
              <TableRow key={String(item.id ?? rowIdx)}>
                {columns.map((col, colIdx) => (
                  <TableCell
                    key={colIdx}
                    className={cn("max-w-[300px] truncate", col.className)}
                  >
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                        ? String(item[col.accessorKey] ?? "")
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-2 py-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} de {total}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            <div className="flex items-center gap-1 px-2">
              {generatePageNumbers(page, totalPages).map((p, idx) =>
                p === "ellipsis" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange?.(p)}
                    aria-label={`Ir a página ${p}`}
                    aria-current={page === p ? "page" : undefined}
                  >
                    {p}
                  </Button>
                ),
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              aria-label="Página siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generates a compact list of page numbers to render with ellipsis gaps.
 * Eg. [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
 */
function generatePageNumbers(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis"> = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  // Window around current page
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  // Always show last page
  pages.push(total);

  return pages;
}
