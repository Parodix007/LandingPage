import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

function renderModal(open: boolean, onClose = vi.fn()) {
  render(
    <Modal open={open} onClose={onClose} labelledBy="modal-title">
      <h2 id="modal-title">Modal title</h2>
      <a href="/first">First link</a>
      <button type="button">Middle button</button>
      <a href="/last">Last link</a>
    </Modal>,
  );
  return onClose;
}

describe("Modal", () => {
  it("renders nothing when open is false", () => {
    render(
      <Modal open={false} onClose={() => {}} labelledBy="modal-title">
        <h2 id="modal-title">Modal title</h2>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a dialog with aria-modal and aria-labelledby when open", () => {
    renderModal(true);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
  });

  it("focuses the close button on open", () => {
    renderModal(true);
    expect(screen.getByRole("button", { name: "Zamknij" })).toHaveFocus();
  });

  it("calls onClose on Escape", () => {
    const onClose = renderModal(true);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the overlay (backdrop)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} labelledBy="modal-title">
        <h2 id="modal-title">Modal title</h2>
      </Modal>,
    );
    // The overlay is the element containing the dialog but is not the dialog itself.
    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement as HTMLElement;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the dialog content", async () => {
    const user = userEvent.setup();
    const onClose = renderModal(true);
    await user.click(screen.getByText("Modal title"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when the × close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = renderModal(true);
    await user.click(screen.getByRole("button", { name: "Zamknij" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("wraps Tab from the last focusable element to the first", () => {
    renderModal(true);
    const last = screen.getByRole("link", { name: "Last link" });
    last.focus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(screen.getByRole("button", { name: "Zamknij" })).toHaveFocus();
  });

  it("wraps Shift+Tab from the first focusable element to the last", () => {
    renderModal(true);
    const closeButton = screen.getByRole("button", { name: "Zamknij" });
    closeButton.focus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab", shiftKey: true });
    const last = screen.getByRole("link", { name: "Last link" });
    expect(last).toHaveFocus();
  });
});
