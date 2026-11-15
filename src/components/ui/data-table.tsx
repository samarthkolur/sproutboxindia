import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
  /**
   * How the column appears in the mobile card list:
   * "title" (the card heading, link target), "meta" (label: value row), "hidden".
   * Default: first column = title, the rest = meta.
   */
  mobile?: "title" | "meta" | "hidden";
}

export interface DataTableSelection {
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

// People-style table (Grovia): one panel, muted header labels, no row borders
// beyond hairlines, whole row clickable. Becomes a card list under md.
//
// Row link: the title cell gets a stretched link, so the entire row is a click
// target without nesting buttons inside an anchor. Interactive cells (buttons,
// links) must sit above it with `relative z-10`.
//
// Hook-free on purpose: usable from server pages (cells are plain functions).
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  rowLabel,
  selection,
  empty,
  caption,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  /** Accessible name for the row link, e.g. the person's name. */
  rowLabel?: (row: T) => string;
  selection?: DataTableSelection;
  empty?: React.ReactNode;
  caption: string;
  className?: string;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  const titleIndex = Math.max(
    0,
    columns.findIndex((column) => column.mobile === "title")
  );
  const allSelected = selection ? rows.length > 0 && rows.every((row) => selection.selected.has(rowKey(row))) : false;

  return (
    <div className={cn("panel overflow-hidden !p-0", className)}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="text-micro text-ink-muted">
              {selection && (
                <th scope="col" className="w-10 py-3 pl-4">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={selection.onToggleAll}
                    className="h-4 w-4 accent-[rgb(var(--c-brand))]"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn("px-4 py-3 font-medium", column.align === "right" && "text-right", column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = rowKey(row);
              const selected = selection?.selected.has(id);
              return (
                <tr
                  key={id}
                  className={cn(
                    "relative border-t border-hairline/60 transition-colors",
                    rowHref && "hover:bg-inset/50",
                    selected && "bg-leaf-soft/60"
                  )}
                >
                  {selection && (
                    <td className="relative z-10 w-10 py-3 pl-4">
                      <input
                        type="checkbox"
                        aria-label={rowLabel ? `Select ${rowLabel(row)}` : "Select row"}
                        checked={Boolean(selected)}
                        onChange={() => selection.onToggle(id)}
                        className="h-4 w-4 accent-[rgb(var(--c-brand))]"
                      />
                    </td>
                  )}
                  {columns.map((column, index) => {
                    const content = column.cell(row);
                    const isLinkCell = rowHref && index === titleIndex;
                    return (
                      <td
                        key={column.key}
                        className={cn("px-4 py-3 text-ink-soft", column.align === "right" && "text-right tabular-nums", column.className)}
                      >
                        {isLinkCell ? (
                          <Link
                            href={rowHref(row)}
                            aria-label={rowLabel?.(row)}
                            className="font-medium text-ink after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-brand/50"
                          >
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <ul className="divide-y divide-hairline/60 md:hidden">
        {rows.map((row) => {
          const id = rowKey(row);
          const selected = selection?.selected.has(id);
          return (
            <li key={id} className={cn("relative space-y-2 p-4", selected && "bg-leaf-soft/60")}>
              <div className="flex items-start gap-3">
                {selection && (
                  <input
                    type="checkbox"
                    aria-label={rowLabel ? `Select ${rowLabel(row)}` : "Select row"}
                    checked={Boolean(selected)}
                    onChange={() => selection.onToggle(id)}
                    className="relative z-10 mt-1 h-4 w-4 accent-[rgb(var(--c-brand))]"
                  />
                )}
                <div className="min-w-0 flex-1 text-base font-medium text-ink">
                  {rowHref ? (
                    <Link
                      href={rowHref(row)}
                      aria-label={rowLabel?.(row)}
                      className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-brand/50"
                    >
                      {columns[titleIndex].cell(row)}
                    </Link>
                  ) : (
                    columns[titleIndex].cell(row)
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {columns.map((column, index) => {
                  if (index === titleIndex || column.mobile === "hidden") return null;
                  return (
                    <div key={column.key} className="min-w-0">
                      <dt className="text-micro text-ink-muted">{column.header}</dt>
                      <dd className="truncate text-ink-soft">{column.cell(row)}</dd>
                    </div>
                  );
                })}
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
