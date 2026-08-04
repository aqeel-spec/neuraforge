import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { classes, focusRing } from "./shared.js";

export interface DropdownMenuItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  className?: string;
}

export function DropdownMenu({ trigger, items, className }: DropdownMenuProps) {
  const generatedId = useId();
  const menuId = `${generatedId}-menu`;
  const triggerId = `${generatedId}-trigger`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const actionableItems = items.filter((item) => !item.separator);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: globalThis.MouseEvent) {
      if (
        !triggerRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, closeMenu]);

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "Enter":
      case " ": {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex(actionableItems.length - 1);
        break;
      }
    }
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
      case "Home": {
        event.preventDefault();
        setActiveIndex(0);
        break;
      }
      case "End": {
        event.preventDefault();
        setActiveIndex(actionableItems.length - 1);
        break;
      }
    }
  }

  let actionableIndex = -1;

  return (
    <div className={classes("relative inline-block", className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={focusRing}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
      >
        {trigger}
      </button>
      {isOpen ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          tabIndex={-1}
          className="absolute right-0 z-20 mt-1 min-w-[12rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
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
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  isActive && "bg-slate-100",
                  item.destructive ? "text-red-600" : "text-slate-900",
                  item.disabled && "cursor-not-allowed opacity-50",
                  !item.disabled && "hover:bg-slate-100",
                )}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    closeMenu();
                  }
                }}
                onMouseEnter={() => setActiveIndex(currentActionIndex)}
              >
                {item.icon ? (
                  <span aria-hidden="true" className="h-4 w-4">
                    {item.icon}
                  </span>
                ) : null}
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
