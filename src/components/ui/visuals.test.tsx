import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarPairChart } from "./bar-pair-chart";
import { Meter } from "./meter";
import { Ring } from "./ring";
import { Sparkline } from "./sparkline";
import { StatTile } from "./stat-tile";

describe("Meter", () => {
  it("exposes its value to assistive tech and sizes the fill", () => {
    const { container } = render(<Meter value={5} max={15} label="Trays used" />);
    const meter = screen.getByRole("meter", { name: "Trays used" });
    expect(meter).toHaveAttribute("aria-valuenow", "5");
    expect(meter).toHaveAttribute("aria-valuemax", "15");
    expect((container.querySelector('[role="meter"] > div') as HTMLElement).style.width).toBe("33.33333333333333%");
  });

  it("clamps over-capacity values to a full bar", () => {
    const { container } = render(<Meter value={30} max={15} label="Over" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "15");
    expect((container.querySelector('[role="meter"] > div') as HTMLElement).style.width).toBe("100%");
  });

  it("does not divide by zero", () => {
    const { container } = render(<Meter value={3} max={0} label="Empty" />);
    expect((container.querySelector('[role="meter"] > div') as HTMLElement).style.width).toBe("0%");
  });

  it("prints the percentage inside a thick bar once it is wide enough to hold it", () => {
    const { rerender } = render(<Meter value={50} size="thick" label="m" />);
    expect(screen.getByText("50%")).toBeInTheDocument();
    rerender(<Meter value={5} size="thick" label="m" />);
    expect(screen.queryByText("5%")).not.toBeInTheDocument();
  });
});

describe("Ring", () => {
  it("labels itself with the percentage by default and clamps out-of-range values", () => {
    const { rerender } = render(<Ring percent={44.4} />);
    expect(screen.getByRole("img", { name: "44%" })).toBeInTheDocument();
    rerender(<Ring percent={180} />);
    expect(screen.getByRole("img", { name: "100%" })).toBeInTheDocument();
    rerender(<Ring percent={-10} />);
    expect(screen.getByRole("img", { name: "0%" })).toBeInTheDocument();
  });

  it("uses a custom label and renders its centre content", () => {
    render(
      <Ring percent={44} label="Day 4 of 9">
        <span>Day 4</span>
      </Ring>
    );
    expect(screen.getByRole("img", { name: "Day 4 of 9" })).toHaveTextContent("Day 4");
  });
});

describe("Sparkline", () => {
  it("draws nothing without at least two points", () => {
    const { container } = render(<Sparkline values={[3]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("draws a line for a series, including a flat one", () => {
    const { container, rerender } = render(<Sparkline values={[1, 3, 2, 5]} />);
    expect(container.querySelector("polyline")).toBeInTheDocument();
    rerender(<Sparkline values={[4, 4, 4]} />);
    expect(container.querySelector("polyline")?.getAttribute("points")).not.toContain("NaN");
  });
});

describe("StatTile", () => {
  it("shows the label, the number and the caption that explains it", () => {
    render(<StatTile label="Active trays" value={42} caption="Across 6 growers" />);
    expect(screen.getByText("Active trays")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Across 6 growers")).toBeInTheDocument();
  });

  it("becomes a link when given an href", () => {
    render(<StatTile label="QC" value={3} caption="Waiting" href="/admin/qc" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/admin/qc");
  });
});

describe("BarPairChart", () => {
  const data = [
    { label: "Mon", a: 10, b: 8 },
    { label: "Tue", a: 20, b: 15 },
  ];
  const props = { data, aLabel: "Ordered", bLabel: "Delivered", ariaLabel: "Ordered vs delivered kg", format: (v: number) => `${v} kg` };

  it("exposes the same numbers as a screen-reader table", () => {
    render(<BarPairChart {...props} />);
    const table = screen.getByRole("table", { name: "Ordered vs delivered kg" });
    const tuesday = within(table).getByRole("row", { name: /Tue/ });
    expect(within(tuesday).getAllByRole("cell").map((c) => c.textContent)).toEqual(["20 kg", "15 kg"]);
  });

  it("shows a tooltip on hover and on keyboard focus, and hides it after", () => {
    const { container } = render(<BarPairChart {...props} />);
    const columns = container.querySelectorAll<HTMLElement>('[role="img"] > [tabindex="0"]');
    expect(columns).toHaveLength(2);

    fireEvent.mouseEnter(columns[0]);
    expect(within(columns[0]).getByText("Ordered")).toBeInTheDocument();
    fireEvent.mouseLeave(columns[0]);
    expect(within(columns[0]).queryByText("Ordered")).not.toBeInTheDocument();

    fireEvent.focus(columns[1]);
    expect(within(columns[1]).getByText("Delivered")).toBeInTheDocument();
  });

  it("renders without data instead of crashing", () => {
    expect(() => render(<BarPairChart {...props} data={[]} />)).not.toThrow();
  });
});
