import { useCallback, useRef, useState } from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { classes, focusRing } from "./shared.js";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  tabs: readonly TabItem[];
  defaultTab?: string;
  selectedTab?: string;
  onTabChange?: (tabId: string) => void;
  label: string;
}

/**
 * A tabbed interface implementing the WAI-ARIA Tabs pattern.
 *
 * - `role="tablist"` with `aria-label` for the tab strip.
 * - Each tab is `role="tab"` with `aria-selected` and `aria-controls`.
 * - Each panel is `role="tabpanel"` with `aria-labelledby`.
 * - Keyboard: ArrowLeft/ArrowRight cycles through enabled tabs (wraps).
 *   Home/End jumps to first/last enabled tab. Disabled tabs are skipped.
 * - Activation follows focus (automatic activation pattern).
 * - Visible focus ring on the active tab trigger.
 * - Supports both controlled (`selectedTab` + `onTabChange`) and uncontrolled (`defaultTab`) modes.
 */
export function Tabs({
  tabs,
  defaultTab,
  selectedTab: controlledTab,
  onTabChange,
  label,
  className,
  ...props
}: TabsProps) {
  const firstEnabledTab = tabs.find((tab) => !tab.disabled);
  const [internalTab, setInternalTab] = useState(defaultTab ?? firstEnabledTab?.id ?? "");

  const activeTabId = controlledTab ?? internalTab;
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const selectTab = useCallback(
    (tabId: string) => {
      if (controlledTab === undefined) {
        setInternalTab(tabId);
      }
      onTabChange?.(tabId);
    },
    [controlledTab, onTabChange],
  );

  const enabledTabs = tabs.filter((tab) => !tab.disabled);

  const focusAndSelect = useCallback(
    (tabId: string) => {
      selectTab(tabId);
      tabRefs.current.get(tabId)?.focus();
    },
    [selectTab],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = enabledTabs.findIndex((tab) => tab.id === activeTabId);
    if (currentIndex === -1) return;

    let nextIndex: number | undefined;

    switch (event.key) {
      case "ArrowRight": {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % enabledTabs.length;
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
        break;
      }
      case "Home": {
        event.preventDefault();
        nextIndex = 0;
        break;
      }
      case "End": {
        event.preventDefault();
        nextIndex = enabledTabs.length - 1;
        break;
      }
      default:
        return;
    }

    const nextTab = enabledTabs[nextIndex];
    if (nextTab) {
      focusAndSelect(nextTab.id);
    }
  }

  const activePanel = tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className={className} {...props}>
      <div
        role="tablist"
        aria-label={label}
        className="flex border-b border-slate-200"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const isSelected = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) {
                  tabRefs.current.set(tab.id, el);
                } else {
                  tabRefs.current.delete(tab.id);
                }
              }}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`tabpanel-${tab.id}`}
              aria-disabled={tab.disabled ? true : undefined}
              tabIndex={isSelected && !tab.disabled ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => {
                if (!tab.disabled) {
                  selectTab(tab.id);
                }
              }}
              className={classes(
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
                isSelected && !tab.disabled
                  ? "text-slate-950 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-indigo-600"
                  : !tab.disabled
                    ? "text-slate-600 hover:text-slate-950"
                    : "cursor-not-allowed text-slate-400",
                focusRing,
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activePanel ? (
        <div
          key={activePanel.id}
          role="tabpanel"
          id={`tabpanel-${activePanel.id}`}
          aria-labelledby={`tab-${activePanel.id}`}
          tabIndex={0}
          className={classes("pt-4", focusRing)}
        >
          {activePanel.content}
        </div>
      ) : null}
    </div>
  );
}
