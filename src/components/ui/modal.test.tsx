import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./modal";

function setup(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <>
      <button>Opener</button>
      <Modal open onClose={onClose} title="Check in" {...props}>
        <input aria-label="Notes" />
      </Modal>
    </>
  );
  return { onClose, ...utils };
}

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden">
        body
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a labelled modal dialog and moves focus to its first field", () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: "Check in" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText("Notes")).toHaveFocus();
  });

  it("closes on Escape, the close button and a backdrop click", () => {
    const { onClose } = setup();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("does not close when the click starts inside the dialog", () => {
    const { onClose } = setup();
    fireEvent.mouseDown(screen.getByLabelText("Notes"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("cannot be dismissed while a request is running", () => {
    const { onClose } = setup({ dismissible: false });
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("locks page scroll while open and restores it, and focus, on close", () => {
    const { rerender } = render(
      <>
        <button>Opener</button>
        <Modal open={false} onClose={() => {}} title="T">
          <input aria-label="Notes" />
        </Modal>
      </>
    );
    screen.getByText("Opener").focus();
    rerender(
      <>
        <button>Opener</button>
        <Modal open onClose={() => {}} title="T">
          <input aria-label="Notes" />
        </Modal>
      </>
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <>
        <button>Opener</button>
        <Modal open={false} onClose={() => {}} title="T">
          <input aria-label="Notes" />
        </Modal>
      </>
    );
    expect(document.body.style.overflow).toBe("");
    expect(screen.getByText("Opener")).toHaveFocus();
  });
});
