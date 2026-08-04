import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar, Badge, DataTable, Stat } from "./data-display.js";

interface Person {
  id: string;
  name: string;
  role: string;
}

const columns = [
  { key: "name", header: "Name", cell: (person: Person) => person.name, rowHeader: true },
  { key: "role", header: "Role", cell: (person: Person) => person.role },
] as const;

describe("DataTable", () => {
  it("renders a labelled semantic table with row headers", () => {
    render(
      <DataTable
        caption="Project members"
        columns={columns}
        getRowKey={(person) => person.id}
        rows={[{ id: "ada", name: "Ada", role: "Engineer" }]}
      />,
    );

    const table = screen.getByRole("table", { name: "Project members" });
    expect(within(table).getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(within(table).getByRole("rowheader", { name: "Ada" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "Engineer" })).toBeInTheDocument();
  });

  it("keeps the empty state readable and retains the scrolling fallback", () => {
    const { container } = render(
      <DataTable
        caption="Empty report"
        columns={columns}
        getRowKey={(person) => person.id}
        rows={[]}
      />,
    );

    expect(screen.getByText("No data available.")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute(
      "data-capability-fallback",
      "horizontal-scroll",
    );
  });
});

describe("Stat", () => {
  it("presents its label, value, trend, and supporting description", () => {
    render(
      <Stat
        description="from last month"
        label="Revenue"
        trend={{ direction: "up", label: "12%" }}
        value="$42k"
      />,
    );

    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("$42k")).toBeInTheDocument();
    expect(screen.getByText(/12%/u)).toBeInTheDocument();
    expect(screen.getByText("from last month")).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("renders text independently of its visual tone", () => {
    render(<Badge tone="success">Published</Badge>);

    expect(screen.getByText("Published")).toBeInTheDocument();
  });
});

describe("Avatar", () => {
  it("uses initials when no image source is supplied", () => {
    render(<Avatar name="Ada Lovelace" />);

    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveTextContent("AL");
  });

  it("preserves the person's identity when an image fails", () => {
    render(<Avatar alt="Portrait of Ada" name="Ada Lovelace" src="/missing-avatar.png" />);

    fireEvent.error(screen.getByRole("img", { name: "Portrait of Ada" }));
    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveTextContent("AL");
  });
});
