from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageColor, ImageDraw, ImageFilter, ImageFont


CAMPAIGN_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
PUBLIC = REPOSITORY_ROOT / "apps" / "web" / "public"
BACKGROUND = CAMPAIGN_ROOT / "assets" / "achievement-system-launch-bg-9x16.png"
OUTPUT = CAMPAIGN_ROOT / "assets" / "achievement-system-launch-poster-9x16.png"

WIDTH = 2160
HEIGHT = 3840
ACID = "#C8F06A"
ACID_INK = "#18210F"
PAPER = "#F3F4EC"
MUTED = "#AEB9AE"
GOLD = "#E7C770"

ZH_FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
LATIN_FONT = "/System/Library/Fonts/Avenir Next.ttc"
MONO_FONT = "/System/Library/Fonts/SFNSMono.ttf"

BADGES = [
    # Exploration and habits
    "night-owl", "dual-agent", "streak-flame", "model-explorer", "cache-wizard",
    "weekend-builder", "deep-dive", "marathon-builder",
    # Advanced collection
    "tri-agent-commander", "model-museum", "session-voyager", "output-forge",
    "thirty-day-flame", "twelve-week-serial", "hundred-day-expedition",
    "daily-supernova", "cache-mithril", "cache-legend",
    # Legendary collection
    "agent-trinity", "model-constellation", "session-odyssey", "yearkeeper",
    "output-star", "night-sovereign", "token-cosmos",
]

MILESTONES = [
    ("I", "100M", "#D69A63", "#5F321C", "#F0C696"),
    ("II", "1B", "#8AD9A4", "#24583C", "#C8EFD5"),
    ("III", "10B", "#79C5F2", "#235785", "#C8E8FA"),
    ("IV", "50B", "#C49AEF", "#654293", "#E5D2F7"),
    ("V", "100B", "#F2D27F", "#8B5D19", "#FAE9B5"),
]


def font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size, index=index)


def fit_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    ratio = max(target_w / image.width, target_h / image.height)
    resized = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def rounded_panel(layer: Image.Image, box: tuple[int, int, int, int], radius: int, fill: tuple[int, int, int, int], outline=None, width=1) -> None:
    ImageDraw.Draw(layer).rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_brand_mark(draw: ImageDraw.ImageDraw, x: int, y: int, block: int = 21, gap: int = 7) -> None:
    colors = (PAPER, ACID, ACID, PAPER)
    for index, color in enumerate(colors):
        col = index % 2
        row = index // 2
        draw.rounded_rectangle(
            (x + col * (block + gap), y + row * (block + gap), x + col * (block + gap) + block, y + row * (block + gap) + block),
            radius=4,
            fill=color,
        )


def paste_badge(canvas: Image.Image, badge_source: Path | Image.Image, x: int, y: int, size: int, legendary: bool) -> None:
    badge = (Image.open(badge_source) if isinstance(badge_source, Path) else badge_source).convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
    alpha = badge.getchannel("A")

    halo = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    halo_draw = ImageDraw.Draw(halo)
    color = (231, 199, 112, 74) if legendary else (200, 240, 106, 38)
    halo_draw.ellipse((x + 42, y + 42, x + size - 42, y + size - 42), fill=color)
    halo = halo.filter(ImageFilter.GaussianBlur(42 if legendary else 34))
    canvas.alpha_composite(halo)

    shadow = Image.new("RGBA", badge.size, (0, 0, 0, 0))
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(18)))
    shadow_color = Image.new("RGBA", badge.size, (0, 0, 0, 150))
    shadow_color.putalpha(shadow.getchannel("A"))
    canvas.alpha_composite(shadow_color, (x + 4, y + 20))
    canvas.alpha_composite(badge, (x, y))


def milestone_badge(mark: str, target: str, accent: str, dark: str, light: str) -> Image.Image:
    badge = Image.new("RGBA", (640, 640), (0, 0, 0, 0))
    draw = ImageDraw.Draw(badge)
    center = 320

    # Concentric metal rings mirror the production CSS milestone badges.
    for radius, color in [(262, dark), (250, accent), (232, light), (220, dark), (207, accent)]:
        draw.ellipse((center - radius, center - radius, center + radius, center + radius), fill=color)
    for radius in range(198, 0, -1):
        mix = radius / 198
        outer = ImageColor.getrgb(accent)
        inner = ImageColor.getrgb(light)
        color = tuple(round(outer[channel] * mix + inner[channel] * (1 - mix)) for channel in range(3))
        draw.ellipse((center - radius, center - radius, center + radius, center + radius), fill=color)
    draw.ellipse((143, 143, 497, 497), outline=(23, 32, 22, 120), width=3)

    draw.text((center, 215), "LOVTOKENS", font=font(MONO_FONT, 22), fill=dark, anchor="mm")
    draw.text((center, 333), mark, font=font(LATIN_FONT, 142), fill="#172016", anchor="mm")
    draw.text((center, 429), target, font=font(LATIN_FONT, 51), fill="#172016", anchor="mm")
    draw.text((center, 482), "TOKEN MILESTONE", font=font(MONO_FONT, 19), fill=dark, anchor="mm")
    return badge


def render() -> None:
    if not BACKGROUND.exists():
        raise FileNotFoundError(f"Missing generated background: {BACKGROUND}")

    canvas = fit_cover(Image.open(BACKGROUND).convert("RGB"), (WIDTH, HEIGHT)).convert("RGBA")

    # Dark glass layers preserve type contrast and keep the badge collection legible.
    shade = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shade_draw = ImageDraw.Draw(shade)
    shade_draw.rectangle((0, 0, WIDTH, 1110), fill=(3, 8, 8, 174))
    shade_draw.rectangle((0, 3280, WIDTH, HEIGHT), fill=(3, 8, 8, 210))
    shade_draw.rounded_rectangle((105, 1085, WIDTH - 105, 3290), radius=66, fill=(3, 12, 11, 112), outline=(200, 240, 106, 35), width=2)
    canvas.alpha_composite(shade)
    draw = ImageDraw.Draw(canvas)

    # Brand row.
    draw_brand_mark(draw, 124, 118)
    draw.text((201, 113), "LOVTOKENS", font=font(LATIN_FONT, 44), fill=PAPER)
    draw.text((WIDTH - 126, 125), "ACHIEVEMENT SYSTEM  /  2026", font=font(MONO_FONT, 25), fill=MUTED, anchor="ra")
    draw.line((124, 205, WIDTH - 124, 205), fill=(200, 240, 106, 65), width=2)

    # Editorial launch headline: a quiet overline, oversized title, and a
    # slightly tilted acid-green release tape create a stronger campaign lockup.
    draw.text((126, 292), "TRACK  ·  UNLOCK  ·  COLLECT", font=font(MONO_FONT, 30), fill=ACID)
    title_font = font(ZH_FONT, 248, index=0)
    draw.text((112, 340), "成就体系", font=title_font, fill=(200, 240, 106, 82), stroke_width=8, stroke_fill=(200, 240, 106, 28))
    draw.text((124, 326), "成就体系", font=title_font, fill=PAPER)

    tape = Image.new("RGBA", (860, 204), (0, 0, 0, 0))
    tape_draw = ImageDraw.Draw(tape)
    tape_draw.polygon([(28, 7), (850, 7), (826, 197), (4, 197)], fill=ACID)
    tape_draw.text((427, 102), "全新上线", font=font(ZH_FONT, 112), fill=ACID_INK, anchor="mm")
    tape = tape.rotate(-2.4, resample=Image.Resampling.BICUBIC, expand=True)
    tape_shadow = Image.new("RGBA", tape.size, (5, 10, 8, 145))
    tape_shadow.putalpha(tape.getchannel("A").filter(ImageFilter.GaussianBlur(20)))
    canvas.alpha_composite(tape_shadow, (130, 666))
    canvas.alpha_composite(tape, (116, 642))
    draw = ImageDraw.Draw(canvas)

    draw.line((1070, 680, 1070, 866), fill=(200, 240, 106, 115), width=3)
    draw.text((1110, 681), "记录你的 AI 创作轨迹", font=font(ZH_FONT, 49), fill=PAPER)
    draw.text((1110, 756), "解锁真实数据驱动的收藏徽章", font=font(ZH_FONT, 42), fill=(208, 218, 207))
    draw.text((126, 914), "让每一次 Token 轨迹，都成为值得收藏的勋章。", font=font(ZH_FONT, 42), fill=MUTED)

    # Collection legend.
    legend_y = 1001
    legend_items = [("探索  08", ACID), ("进阶  10", "#89C8EF"), ("传奇  07", GOLD), ("里程碑  05", "#C49AEF")]
    legend_x = 128
    for label, color in legend_items:
        label_font = font(ZH_FONT, 26)
        label_w = draw.textbbox((0, 0), label, font=label_font)[2]
        draw.rounded_rectangle((legend_x, legend_y, legend_x + label_w + 68, legend_y + 58), radius=29, fill=(8, 18, 15, 205), outline=color, width=2)
        draw.ellipse((legend_x + 22, legend_y + 22, legend_x + 34, legend_y + 34), fill=color)
        draw.text((legend_x + 45, legend_y + 27), label, font=label_font, fill=PAPER, anchor="lm")
        legend_x += label_w + 92

    # Keep the exact 25 production illustrations, then add the five fixed
    # milestone medals rendered from the same tier colors used by the product.
    size = 350
    x_start = 125
    y_start = 1125
    x_step = 390
    y_step = 350
    for index, badge_name in enumerate(BADGES):
        row, col = divmod(index, 5)
        x = x_start + col * x_step
        y = y_start + row * y_step
        paste_badge(canvas, PUBLIC / "achievements" / f"{badge_name}.png", x, y, size, legendary=index >= 18)
    for offset, milestone in enumerate(MILESTONES, start=len(BADGES)):
        row, col = divmod(offset, 5)
        x = x_start + col * x_step
        y = y_start + row * y_step
        paste_badge(canvas, milestone_badge(*milestone), x, y, size, legendary=milestone[0] == "V")

    # Footer copy and CTA.
    footer_top = 3330
    draw.line((124, footer_top, WIDTH - 124, footer_top), fill=(200, 240, 106, 72), width=2)
    draw.text((126, 3410), "30 枚固定徽章  ·  月度收藏持续解锁", font=font(ZH_FONT, 48), fill=PAPER)
    draw.text((126, 3492), "由真实使用数据解锁：智能体、模型、会话、连续活跃与 Token 轨迹。", font=font(ZH_FONT, 33), fill=MUTED)

    cta_box = (126, 3600, 1335, 3734)
    draw.rounded_rectangle(cta_box, radius=67, fill=ACID)
    draw.text((178, 3667), "立即开启你的成就收藏", font=font(ZH_FONT, 42), fill=ACID_INK, anchor="lm")
    draw.line((1197, 3667, 1270, 3667), fill=ACID_INK, width=8)
    draw.polygon([(1270, 3667), (1245, 3648), (1245, 3686)], fill=ACID_INK)
    draw.text((WIDTH - 126, 3671), "LOVTOKENS.COM", font=font(MONO_FONT, 31), fill=PAPER, anchor="rm")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUTPUT, quality=96, optimize=True, subsampling=0)
    print(OUTPUT)


if __name__ == "__main__":
    render()
