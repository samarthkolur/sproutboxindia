import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type Column } from "./data-table";

interface Row {
  id: string;
  name: string;
  city: string;
  score: number;
}

const rows: Row[] = [
  { id: "a", name: "Asha", city: "Mysuru", score: 82 },
  { id: "b", name: "Bala", city: "Hubballi", score: 64 },
];

const columns: Column<Row>[] = [
  { key: "name", header: "Name", cell: (r) => r.name },
  { key: "city", header: "City", cell: (r) => r.city },
  { key: "score", header: "Score", cell: (r) => r.score, align: "right" },
];

describe("DataTable", () => {
  it("renders a captioned table with one body row per item", () => {
    render(<DataTable caption="Growers" columns={columns} rows={rows} rowKey={(r) => r.id} />);
    const table = screen.getByRole("table", { name: "Growers" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Name", "City", "Score"]);
    // header row + 2 body rows
    expect(within(table).getAllByRole("row")).toHaveLength(3);
  });

  it("renders the mobile card list with a label for every non-title column", () => {
    const { container } = render(<DataTable caption="Growers" columns={columns} rows={rows} rowKey={(r) => r.id} />);
    const cards = container.querySelectorAll("ul > li");
    expect(cards).toHaveLength(2);
    expect(within(cards[0] as HTMLElement).getByText("City")).toBeInTheDocument();
    expect(within(cards[0] as HTMLElement).getByText("Score")).toBeInTheDocument();
  });

  it("makes the title cell a link when rows have an href", () => {
    render(
      <DataTable
        caption="Growers"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        rowHref={(r) => `/admin/growers/${r.id}`}
        rowLabel={(r) => `Open ${r.name}`}
      />
    );
    const links = screen.getAllByRole("link", { name: "Open Asha" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toHaveAttribute("href", "/admin/growers/a");
  });

  it("honours an explicit mobile title column and hides hidden ones", () => {
    const cols: Column<Row>[] = [
      { key: "id", header: "Id", cell: (r) => r.id, mobile: "hidden" },
      { key: "name", header: "Name", cell: (r) => r.name, mobile: "title" },
      { key: "city", header: "City", cell: (r) => r.city },
    ];
    const { container } = render(<DataTable caption="x" columns={cols} rows={rows} rowKey={(r) => r.id} />);
    const card = container.querySelector("ul > li") as HTMLElement;
    expect(within(card).getByText("Asha")).toBeInTheDocument();
    expect(within(card).queryByText("Id")).not.toBeInTheDocument();
    expect(within(card).getByText("City")).toBeInTheDocument();
  });

  it("shows the empty state instead of an empty table", () => {
    render(
      <DataTable caption="Growers" columns={columns} rows={[]} rowKey={(r) => r.id} empty={<p>No growers yet</p>} />
    );
    expect(screen.getByText("No growers yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  describe("selection", () => {
    function setup(selected: string[] = []) {
      const onToggle = vi.fn();
      const onToggleAll = vi.fn();
      render(
        <DataTable
          caption="Payouts"
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          rowLabel={(r) => r.name}
          selection={{ selected: new Set(selected), onToggle, onToggleAll }}
        />
      );
      return { onToggle, onToggleAll };
    }

    it("toggles a single row by its id", () => {
      const { onToggle } = setup();
      fireEvent.click(screen.getAllByLabelText("Select Bala")[0]);
      expect(onToggle).toHaveBeenCalledWith("b");
    });

    it("reflects the selected set", () => {
      setup(["a"]);
      expect(screen.getAllByLabelText("Select Asha")[0]).toBeChecked();
      expect(screen.getAllByLabelText("Select Bala")[0]).not.toBeChecked();
      expect(screen.getByLabelText("Select all")).not.toBeChecked();
    });

    it("checks select-all only when every row is selected", () => {
      setup(["a", "b"]);
      expect(screen.getByLabelText("Select all")).toBeChecked();
    });

    it("calls onToggleAll from the header checkbox", () => {
      const { onToggleAll } = setup();
      fireEvent.click(screen.getByLabelText("Select all"));
      expect(onToggleAll).toHaveBeenCalledTimes(1);
    });
  });
});
