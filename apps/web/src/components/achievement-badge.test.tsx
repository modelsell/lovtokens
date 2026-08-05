import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AchievementBadge, type AchievementBadgeData } from "./achievement-badge";

const badge: AchievementBadgeData = {
  key: "100m",
  title: "蓝宝石信标",
  description: "累计处理一亿 Token。",
  mark: "III",
  tier: "sapphire",
  tokens: 40_000_000,
  target: 100_000_000,
  unlocked: false,
};

afterEach(cleanup);

describe("AchievementBadge", () => {
  it("renders unreached milestones as locked badges with progress", () => {
    const { container } = render(<AchievementBadge achievement={badge} locale="zh" siteOrigin="https://lovtokens.test" />);

    expect(container.querySelector("[data-locked]")).toBeInTheDocument();
    expect(screen.getByText("尚未解锁")).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("exposes proof and both collectible downloads after unlock", () => {
    render(<AchievementBadge achievement={{ ...badge, unlocked: true, certificateId: "cert-1", issuedAt: 1_735_689_600 }} locale="zh" siteOrigin="https://lovtokens.test" />);

    expect(screen.getByText("已解锁")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /查看证明/ })).toHaveAttribute("href", "/zh/certificate/cert-1");
    expect(screen.getByRole("link", { name: /金属卡/ })).toHaveAttribute("href", expect.stringContaining("style=collector"));
    expect(screen.getByRole("link", { name: /档案卡/ })).toHaveAttribute("href", expect.stringContaining("style=archive"));
    expect(screen.getByRole("button", { name: /分享成就/ })).toBeInTheDocument();
  });

  it("renders generated artwork as a grayscale collection slot before unlock", () => {
    const { container } = render(<AchievementBadge achievement={{ ...badge, image: "/achievements/night-owl.png", tier: "special", title: "夜猫子" }} locale="zh" siteOrigin="https://lovtokens.test" />);

    expect(container.querySelector('[data-art="true"][data-locked="true"]')).toBeInTheDocument();
    expect(container.querySelector('img[src*="night-owl.png"]')).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "夜猫子" })).toBeInTheDocument();
  });

  it("shows custom non-token progress labels for activity badges", () => {
    render(<AchievementBadge achievement={{ ...badge, progressLabel: "4 / 7 天", target: 7, tokens: 4 }} locale="zh" siteOrigin="https://lovtokens.test" />);

    expect(screen.getByText(/4 \/ 7 天/)).toBeInTheDocument();
  });

  it("offers the badge studio for earned visual achievements", () => {
    render(<AchievementBadge achievement={{ ...badge, key: "night-owl", image: "/achievements/night-owl.png", unlocked: true, issuedAt: 1_735_689_600 }} locale="zh" shareProfile={{ displayName: "Jie", handle: "jie", isPublic: true }} siteOrigin="https://lovtokens.test" />);

    expect(screen.getByRole("button", { name: "分享徽章" })).toBeInTheDocument();
  });
});
