import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChoiceGroup } from "./choice-group";
import { SelectField, TextField } from "./field";

describe("TextField", () => {
  it("connects the label to the input", () => {
    render(<TextField label="Email" type="email" defaultValue="a@b.co" />);
    expect(screen.getByLabelText("Email")).toHaveValue("a@b.co");
  });

  it("shows a hint, and swaps it for the error, linking either to the input", () => {
    const { rerender } = render(<TextField label="Phone" hint="Include the country code" />);
    const input = screen.getByLabelText("Phone");
    expect(input).toHaveAccessibleDescription("Include the country code");
    expect(input).not.toHaveAttribute("aria-invalid");

    rerender(<TextField label="Phone" hint="Include the country code" error="Enter a valid phone number" />);
    expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription("Enter a valid phone number");
    expect(screen.getByLabelText("Phone")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Include the country code")).not.toBeInTheDocument();
  });

  it("marks optional fields", () => {
    render(<TextField label="GST" optional />);
    expect(screen.getByText("Optional")).toBeInTheDocument();
  });

  it("gives every field its own id", () => {
    render(
      <>
        <TextField label="One" />
        <TextField label="Two" />
      </>
    );
    expect(screen.getByLabelText("One").id).not.toBe(screen.getByLabelText("Two").id);
  });

  it("reveals and hides a password on request", () => {
    render(<TextField label="Password" type="password" revealable />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("has no reveal button unless asked", () => {
    render(<TextField label="Password" type="password" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("SelectField", () => {
  it("renders a labelled select", () => {
    render(
      <SelectField label="Day" defaultValue="tue">
        <option value="mon">Monday</option>
        <option value="tue">Tuesday</option>
      </SelectField>
    );
    expect(screen.getByLabelText("Day")).toHaveValue("tue");
  });
});

const choices = [
  { value: "a", label: "Alpha", description: "First" },
  { value: "b", label: "Beta", trailing: "₹10" },
];

describe("ChoiceGroup", () => {
  it("is a radio group with the current value checked", () => {
    render(<ChoiceGroup ariaLabel="Pick one" choices={choices} value="b" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: "Pick one" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Beta/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Alpha/ })).not.toBeChecked();
  });

  it("reports the chosen value and shows description and trailing slot", () => {
    const onChange = vi.fn();
    render(<ChoiceGroup ariaLabel="Pick one" choices={choices} value="b" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /Alpha/ }));
    expect(onChange).toHaveBeenCalledWith("a");
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("₹10")).toBeInTheDocument();
  });

  it("supports several selections, adding and removing", () => {
    const onChange = vi.fn();
    const { rerender } = render(<ChoiceGroup multiple ariaLabel="Crops" choices={choices} values={["a"]} onChange={onChange} />);
    expect(screen.getByRole("group", { name: "Crops" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Alpha/ })).toBeChecked();

    fireEvent.click(screen.getByRole("checkbox", { name: /Beta/ }));
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);

    rerender(<ChoiceGroup multiple ariaLabel="Crops" choices={choices} values={["a", "b"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Alpha/ }));
    expect(onChange).toHaveBeenLastCalledWith(["b"]);
  });
});

import { findUntranslated } from "@/test/translation";

describe("translation", () => {
  it("every built-in string in the form primitives has Kannada and Hindi", () => {
    const { container } = render(
      <>
        <TextField label="Optional field" optional />
        <TextField label="Password" type="password" revealable />
      </>
    );
    // "Optional field" is a test label; only the component's own strings matter.
    expect(findUntranslated(container).filter((text) => text !== "Optional field")).toEqual([]);
  });
});
