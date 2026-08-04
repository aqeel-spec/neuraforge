import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { classes, focusRing } from "./shared.js";

export interface MenubarItem {
  label: string;
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
}

export interface MenubarMenu {
  label: string;
  items: MenubarItem[];
}

export interface MenubarProps {
  menus: MenubarMenu[];
  className?: string;
}

export function Menubar({ menus, className }: MenubarProps) {
  const generatedId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState(-1);
  const barRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<(HTMLDivElement | null)[]>([]);

  const closeAll = useCallback(() => {
    setOpenIndex(null);
    setActiveItemIndex(-1);
  }, []);

  useEffect(() => {
    if (openIndex === null) return;
    function handleOutsideClick(event: globalThis.MouseEvent) {
      if (!barRef.current?.contains(event.target as Node)) {
        closeAll();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openIndex, closeAll]);

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>, menuIndex: number) {
    switch (event.key) {
      case "ArrowDown":
      case "Enter":
      case " ": {
        event.preventDefault();
        setOpenIndex(menuIndex);
        setActiveItemIndex(0);
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        const next = (menuIndex + 1) % menus.length;
        setOpenIndex(next);
        setActiveItemIndex(0);
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        const prev = (menuIndex - 1 + menus.length) % menus.length;
        setOpenIndex(prev);
        setActiveItemIndex(0);
        break;
      }
      case "Escape": {
        event.preventDefault();
        closeAll();
        break;
      }
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>, menu: MenubarMenu) {
    const actionableItems = menu.items.filter((item) => !item.separator);
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setActiveItemIndex((prev) => (prev + 1 >= actionableItems.length ? 0 : prev + 1));
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setActiveItemIndex((prev) => (prev - 1 < 0 ? actionableItems.length - 1 : prev - 1));
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        if (openIndex !== null) {
          const next = (openIndex + 1) % menus.length;
          setOpenIndex(next);
          setActiveItemIndex(0);
        }
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        if (openIndex !== null) {
          const prev = (openIndex - 1 + menus.length) % menus.length;
          setOpenIndex(prev);
          setActiveItemIndex(0);
        }
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        const item = actionableItems[activeItemIndex];
        if (item && !item.disabled) {
          item.onClick?.();
          closeAll();
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        closeAll();
        break;
      }
    }
  }

  return (
    <div
      ref={barRef}
      role="menubar"
      className={classes(
        "flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-1 shadow-sm",
        className,
      )}
    >
      {menus.map((menu, menuIndex) => {
        const isOpen = openIndex === menuIndex;
        let actionableIdx = -1;

        return (
          <div key={menu.label} className="relative">
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={`${generatedId}-menu-${menuIndex}`}
              className={classes(
                "rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100",
                isOpen && "bg-slate-100",
                focusRing,
              )}
              onClick={() => {
                if (isOpen) {
                  closeAll();
                } else {
                  setOpenIndex(menuIndex);
                  setActiveItemIndex(0);
                }
              }}
              onMouseEnter={() => {
                if (openIndex !== null && openIndex !== menuIndex) {
                  setOpenIndex(menuIndex);
                  setActiveItemIndex(-1);
                }
              }}
              onKeyDown={(e) => handleTriggerKeyDown(e, menuIndex)}
            >
              {menu.label}
            </button>
            {isOpen ? (
              <div
                ref={(el) => {
                  menuRefs.current[menuIndex] = el;
                }}
                id={`${generatedId}-menu-${menuIndex}`}
                role="menu"
                tabIndex={-1}
                className="absolute left-0 z-20 mt-1 min-w-[12rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                onKeyDown={(e) => handleMenuKeyDown(e, menu)}
                autoFocus
              >
                {menu.items.map((item, itemIndex) => {
                  if (item.separator) {
                    return (
                      <div
                        key={`sep-${itemIndex}`}
                        className="my-1 h-px bg-slate-200"
                        role="separator"
                      />
                    );
                  }
                  actionableIdx++;
                  const currentIdx = actionableIdx;
                  const isActive = currentIdx === activeItemIndex;
                  return (
                    <button
                      key={`${item.label}-${itemIndex}`}
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
                          closeAll();
                        }
                      }}
                      onMouseEnter={() => setActiveItemIndex(currentIdx)}
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
      })}
    </div>
  );
}
