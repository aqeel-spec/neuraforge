import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { classes } from "./shared.js";

export interface ContextMenuItem {
  label: string;
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
}

export interface ContextMenuProps {
  children: ReactNode;
  items: ContextMenuItem[];
  className?: string;
}

export function ContextMenu({ children, items, className }: ContextMenuProps) {
  const generatedId = useId();
  const menuId = `${generatedId}-ctx-menu`;

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const actionableItems = items.filter((item) => !item.separator);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: globalThis.MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }
    function handleScroll() {
      closeMenu();
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, closeMenu]);

  function handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
    setActiveIndex(-1);
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1 >= actionableItems.length ? 0 : prev + 1));
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 < 0 ? actionableItems.length - 1 : prev - 1));
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        const item = actionableItems[activeIndex];
        if (item && !item.disabled) {
          item.onClick?.();
          closeMenu();
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        closeMenu();
        break;
      }
    }
  }

  let actionableIndex = -1;

  return (
    <div ref={containerRef} className={className} onContextMenu={handleContextMenu}>
      {children}
      {isOpen ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          tabIndex={-1}
          className="fixed z-50 min-w-[10rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          style={{ top: position.y, left: position.x }}
          onKeyDown={handleMenuKeyDown}
          autoFocus
        >
          {items.map((item, index) => {
            if (item.separator) {
              return (
                <div key={`sep-${index}`} className="my-1 h-px bg-slate-200" role="separator" />
              );
            }
            actionableIndex++;
            const currentActionIndex = actionableIndex;
            const isActive = currentActionIndex === activeIndex;
            return (
              <button
                key={`${item.label}-${index}`}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                tabIndex={-1}
                className={classes(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                  isActive && "bg-slate-100",
                  item.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "text-slate-900 hover:bg-slate-100",
                )}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    closeMenu();
                  }
                }}
                onMouseEnter={() => setActiveIndex(currentActionIndex)}
              >
                <span>{item.label}</span>
                {item.shortcut ? (
                  <span className="ml-6 text-xs text-slate-400">{item.shortcut}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
