import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeSwitcher } from "./theme-switcher";

describe("ThemeSwitcher", () => {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-preference");
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false, addEventListener, removeEventListener }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("uses the system theme by default and follows a saved explicit choice", () => {
    const { unmount } = render(<ThemeSwitcher locale="en" />);
    expect(screen.getByRole("button", { name: "Use system theme" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    unmount();

    localStorage.setItem("lovtokens-theme", "dark");
    render(<ThemeSwitcher locale="en" />);
    expect(screen.getByRole("button", { name: "Use dark theme" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("persists a user-selected theme", () => {
    render(<ThemeSwitcher locale="zh" />);
    fireEvent.click(screen.getByRole("button", { name: "使用深色主题" }));
    expect(localStorage.getItem("lovtokens-theme")).toBe("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement).toHaveAttribute("data-theme-preference", "dark");
  });

  it("updates when the system theme changes while system mode is active", () => {
    render(<ThemeSwitcher locale="en" />);
    const handleSystemThemeChange = addEventListener.mock.calls.find(([event]) => event === "change")?.[1] as (() => void) | undefined;
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addEventListener, removeEventListener } as unknown as MediaQueryList);
    handleSystemThemeChange?.();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
