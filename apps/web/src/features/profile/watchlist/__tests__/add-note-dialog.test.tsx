/// <reference types="@testing-library/jest-dom" />

import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { AddNoteDialog } from "../components/dialog/add-note-dialog";

describe("AddNoteDialog", () => {
  it("calls onSaveNote with trimmed text on save", async () => {
    const onSaveNote = vi.fn();
    render(<AddNoteDialog onSaveNote={onSaveNote} open vin="VIN123" />);

    const textarea = screen.getByRole("textbox");
    await userEvent.type(textarea, "  Great condition  ");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSaveNote).toHaveBeenCalledWith("Great condition");
  });

  it("disables save when textarea is empty", () => {
    render(<AddNoteDialog onSaveNote={vi.fn()} open vin="VIN123" />);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("disables save when over 500 characters", () => {
    const longNote = "a".repeat(501);
    render(<AddNoteDialog initialNote={longNote} onSaveNote={vi.fn()} open vin="VIN123" />);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("shows character counter", async () => {
    render(<AddNoteDialog onSaveNote={vi.fn()} open vin="VIN123" />);

    expect(screen.getByText("0/500")).toBeInTheDocument();

    await userEvent.type(screen.getByRole("textbox"), "hello");
    expect(screen.getByText("5/500")).toBeInTheDocument();
  });

  it("prefills text in edit mode", () => {
    render(<AddNoteDialog initialNote="Existing note" onSaveNote={vi.fn()} open vin="VIN123" />);

    expect(screen.getByRole("textbox")).toHaveValue("Existing note");
  });

  it("renders Edit note title when initialNote is provided", () => {
    render(<AddNoteDialog initialNote="Something" onSaveNote={vi.fn()} open vin="VIN123" />);

    expect(screen.getByRole("heading", { name: "Edit note" })).toBeInTheDocument();
  });

  it("renders Add note title when no initialNote", () => {
    render(<AddNoteDialog onSaveNote={vi.fn()} open vin="VIN123" />);

    expect(screen.getByRole("heading", { name: "Add note" })).toBeInTheDocument();
  });
});
