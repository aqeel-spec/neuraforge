import { classes } from "./shared.js";

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanProps {
  columns: KanbanColumn[];
  onCardMove?: (cardId: string, fromCol: string, toCol: string) => void;
  className?: string;
}

/**
 * A visual-only Kanban board layout. Renders columns with cards in a
 * horizontal scrollable layout. Does not implement drag-and-drop;
 * `onCardMove` is provided as a callback prop for consumer-driven
 * state management.
 */
export function Kanban({ columns, className }: KanbanProps) {
  return (
    <div
      className={classes("flex gap-4 overflow-x-auto p-4", className)}
      role="region"
      aria-label="Kanban board"
    >
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50"
          role="list"
          aria-label={column.title}
        >
          {/* Column header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">{column.title}</h3>
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-medium text-slate-600">
              {column.cards.length}
            </span>
          </div>
          {/* Cards */}
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
            {column.cards.length > 0 ? (
              column.cards.map((card) => (
                <div
                  key={card.id}
                  role="listitem"
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="text-sm font-medium text-slate-900">{card.title}</p>
                  {card.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {card.description}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="flex flex-1 items-center justify-center py-8">
                <p className="text-xs text-slate-400">No cards</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
