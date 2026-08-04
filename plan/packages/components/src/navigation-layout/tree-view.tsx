import { type KeyboardEvent, type ReactNode, useCallback, useState } from "react";
import { classes, focusRing } from "./shared.js";

export interface TreeNode {
  id: string;
  label: string;
  icon?: ReactNode;
  children?: TreeNode[];
}

export interface TreeViewProps {
  data: TreeNode[];
  defaultExpanded?: string[];
  onSelect?: (id: string) => void;
  className?: string;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  expanded: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

function TreeItem({ node, level, expanded, selectedId, onToggle, onSelect }: TreeItemProps) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "Enter":
      case " ": {
        event.preventDefault();
        onSelect(node.id);
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        if (hasChildren && !isExpanded) {
          onToggle(node.id);
        }
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        if (hasChildren && isExpanded) {
          onToggle(node.id);
        }
        break;
      }
    }
  };

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
    >
      <div
        role="button"
        tabIndex={0}
        className={classes(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors",
          isSelected ? "bg-indigo-50 text-indigo-900" : "text-slate-900 hover:bg-slate-100",
          focusRing,
        )}
        style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) onToggle(node.id);
        }}
        onKeyDown={handleKeyDown}
      >
        {hasChildren ? (
          <svg
            aria-hidden="true"
            className={classes(
              "h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-150",
              isExpanded && "rotate-90",
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <span className="inline-block h-3.5 w-3.5" />
        )}
        {node.icon ? (
          <span aria-hidden="true" className="h-4 w-4 shrink-0">
            {node.icon}
          </span>
        ) : null}
        <span className="truncate">{node.label}</span>
      </div>
      {hasChildren && isExpanded ? (
        <ul role="group" className="list-none">
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function TreeView({ data, defaultExpanded = [], onSelect, className }: TreeViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      onSelect?.(id);
    },
    [onSelect],
  );

  return (
    <ul role="tree" aria-label="Tree view" className={classes("list-none space-y-0.5", className)}>
      {data.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          expanded={expanded}
          selectedId={selectedId}
          onToggle={handleToggle}
          onSelect={handleSelect}
        />
      ))}
    </ul>
  );
}
