import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Navbar, Sidebar, Tabs } from "./index.js";
import type { NavigationItem, SidebarSection, TabItem } from "./index.js";

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

const navItems: NavigationItem[] = [
  { label: "Home", href: "/", current: true },
  { label: "About", href: "/about" },
  { label: "Disabled", href: "/disabled", disabled: true },
];

describe("Navbar", () => {
  it("renders a navigation landmark with accessible label", () => {
    render(<Navbar brand="Acme" items={navItems} label="Site nav" />);
    expect(screen.getByRole("navigation", { name: "Site nav" })).toBeInTheDocument();
  });

  it("marks the current page with aria-current", () => {
    render(<Navbar brand="Acme" items={navItems} />);
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("aria-current", "page");
  });

  it("renders disabled items with aria-disabled and no link", () => {
    render(<Navbar brand="Acme" items={navItems} />);
    const disabled = screen.getAllByText("Disabled");
    for (const el of disabled) {
      expect(el).toHaveAttribute("aria-disabled", "true");
      expect(el.tagName).not.toBe("A");
    }
  });

  it("toggles the mobile menu on trigger click", async () => {
    const user = userEvent.setup();
    render(<Navbar brand="Acme" items={navItems} />);
    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    const mobileMenu = document.getElementById("navbar-mobile-menu");
    expect(mobileMenu).toBeInTheDocument();
  });

  it("closes the mobile menu on Escape", async () => {
    const user = userEvent.setup();
    render(<Navbar brand="Acme" items={navItems} />);
    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("has visible focus classes on links", () => {
    render(<Navbar brand="Acme" items={navItems} />);
    const link = screen.getByRole("link", { name: "About" });
    expect(link.className).toContain("focus-visible:ring-2");
  });
});

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

const sidebarSections: SidebarSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", current: true },
      { label: "Projects", href: "/projects" },
      { label: "Locked", href: "/locked", disabled: true },
    ],
  },
  {
    title: "Settings",
    items: [{ label: "Account", href: "/account" }],
  },
];

describe("Sidebar", () => {
  it("renders a navigation landmark with accessible label", () => {
    render(<Sidebar sections={sidebarSections} label="App sidebar" />);
    expect(screen.getByRole("navigation", { name: "App sidebar" })).toBeInTheDocument();
  });

  it("groups sections with headings and aria-labelledby", () => {
    render(<Sidebar sections={sidebarSections} />);
    const group = screen.getByRole("group", { name: "Main" });
    expect(group).toBeInTheDocument();
  });

  it("marks the current page link with aria-current", () => {
    render(<Sidebar sections={sidebarSections} />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  });

  it("renders disabled items with aria-disabled", () => {
    render(<Sidebar sections={sidebarSections} />);
    expect(screen.getByText("Locked")).toHaveAttribute("aria-disabled", "true");
  });

  it("renders header and footer when provided", () => {
    render(
      <Sidebar sections={sidebarSections} header={<span>Logo</span>} footer={<span>v1.0</span>} />,
    );
    expect(screen.getByText("Logo")).toBeInTheDocument();
    expect(screen.getByText("v1.0")).toBeInTheDocument();
  });

  it("has visible focus ring classes on links", () => {
    render(<Sidebar sections={sidebarSections} />);
    const link = screen.getByRole("link", { name: "Projects" });
    expect(link.className).toContain("focus-visible:ring-2");
  });
});

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const tabItems: TabItem[] = [
  { id: "tab1", label: "Tab 1", content: <div>Content 1</div> },
  { id: "tab2", label: "Tab 2", content: <div>Content 2</div> },
  { id: "tab3", label: "Tab 3", content: <div>Content 3</div>, disabled: true },
  { id: "tab4", label: "Tab 4", content: <div>Content 4</div> },
];

describe("Tabs", () => {
  it("renders a tablist with accessible label", () => {
    render(<Tabs tabs={tabItems} label="Settings tabs" />);
    expect(screen.getByRole("tablist", { name: "Settings tabs" })).toBeInTheDocument();
  });

  it("shows the first enabled tab as selected by default", () => {
    render(<Tabs tabs={tabItems} label="Tabs" />);
    expect(screen.getByRole("tab", { name: "Tab 1", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "Tab 1" })).toHaveTextContent("Content 1");
  });

  it("selects a tab on click", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabItems} label="Tabs" />);
    await user.click(screen.getByRole("tab", { name: "Tab 2" }));
    expect(screen.getByRole("tab", { name: "Tab 2", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "Tab 2" })).toHaveTextContent("Content 2");
  });

  it("does not select a disabled tab on click", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabItems} label="Tabs" />);
    await user.click(screen.getByRole("tab", { name: "Tab 3" }));
    // Tab 1 remains selected
    expect(screen.getByRole("tab", { name: "Tab 1", selected: true })).toBeInTheDocument();
  });

  it("navigates with ArrowRight, skipping disabled tabs", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabItems} label="Tabs" />);
    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    tab1.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Tab 2", selected: true })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    // Should skip disabled Tab 3 and go to Tab 4
    expect(screen.getByRole("tab", { name: "Tab 4", selected: true })).toHaveFocus();
  });

  it("navigates with ArrowLeft, wrapping around", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabItems} label="Tabs" />);
    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    tab1.focus();
    await user.keyboard("{ArrowLeft}");
    // Should wrap to Tab 4 (last enabled)
    expect(screen.getByRole("tab", { name: "Tab 4", selected: true })).toHaveFocus();
  });

  it("Home goes to first enabled tab, End goes to last enabled", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabItems} label="Tabs" defaultTab="tab2" />);
    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    tab2.focus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Tab 1", selected: true })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Tab 4", selected: true })).toHaveFocus();
  });

  it("calls onTabChange when tab changes", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Tabs tabs={tabItems} label="Tabs" onTabChange={onChange} />);
    await user.click(screen.getByRole("tab", { name: "Tab 2" }));
    expect(onChange).toHaveBeenCalledWith("tab2");
  });

  it("supports controlled mode", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <Tabs tabs={tabItems} label="Tabs" selectedTab="tab2" onTabChange={onChange} />,
    );
    expect(screen.getByRole("tab", { name: "Tab 2", selected: true })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Tab 1" }));
    expect(onChange).toHaveBeenCalledWith("tab1");
    // Still shows tab2 until parent updates
    expect(screen.getByRole("tabpanel", { name: "Tab 2" })).toBeInTheDocument();
    rerender(<Tabs tabs={tabItems} label="Tabs" selectedTab="tab1" onTabChange={onChange} />);
    expect(screen.getByRole("tabpanel", { name: "Tab 1" })).toBeInTheDocument();
  });

  it("renders disabled tabs with aria-disabled", () => {
    render(<Tabs tabs={tabItems} label="Tabs" />);
    const disabledTab = screen.getByRole("tab", { name: "Tab 3" });
    expect(disabledTab).toHaveAttribute("aria-disabled", "true");
    expect(disabledTab).toBeDisabled();
  });

  it("has focus ring classes on tabs", () => {
    render(<Tabs tabs={tabItems} label="Tabs" />);
    const tab = screen.getByRole("tab", { name: "Tab 1" });
    expect(tab.className).toContain("focus-visible:ring-2");
  });

  it("tabpanel is focusable and has focus ring", () => {
    render(<Tabs tabs={tabItems} label="Tabs" />);
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("tabindex", "0");
    expect(panel.className).toContain("focus-visible:ring-2");
  });
});
