import { describe, expect, it } from "vitest";
import { parsePositiveIntOrNull } from "./forms";

describe("parsePositiveIntOrNull", () => {
  it("returns null when the field is empty", () => {
    const formData = new FormData();
    expect(parsePositiveIntOrNull(formData, "team_count", "Times")).toBeNull();
  });

  it("parses a positive integer", () => {
    const formData = new FormData();
    formData.set("team_count", "8");
    expect(parsePositiveIntOrNull(formData, "team_count", "Times")).toBe(8);
  });

  it("truncates decimal input", () => {
    const formData = new FormData();
    formData.set("team_count", "8.7");
    expect(parsePositiveIntOrNull(formData, "team_count", "Times")).toBe(8);
  });

  it("throws for zero or negative values", () => {
    const formData = new FormData();
    formData.set("team_count", "0");
    expect(() => parsePositiveIntOrNull(formData, "team_count", "Times")).toThrow();
  });

  it("throws for non-numeric input", () => {
    const formData = new FormData();
    formData.set("team_count", "abc");
    expect(() => parsePositiveIntOrNull(formData, "team_count", "Times")).toThrow();
  });
});
