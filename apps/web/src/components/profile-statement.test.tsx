import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProfileStatement } from "./profile-statement";

afterEach(cleanup);

describe("ProfileStatement", () => {
  it("shows the builder's own words", () => {
    render(<ProfileStatement isOwner={false} locale="en" settingsPath="/settings/profile" statement="Build gently. Ship boldly." />);
    expect(screen.getByText("Build gently. Ship boldly.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("prompts only the owner when the statement is empty", () => {
    const { rerender } = render(<ProfileStatement isOwner={false} locale="zh" settingsPath="/zh/settings/profile" statement="" />);
    expect(screen.queryByText("作者态度")).not.toBeInTheDocument();
    rerender(<ProfileStatement isOwner locale="zh" settingsPath="/zh/settings/profile" statement="" />);
    expect(screen.getByRole("link", { name: /写一句/ })).toHaveAttribute("href", "/zh/settings/profile");
  });
});
