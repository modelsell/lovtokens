# Achievement System Launch

Marketing archive for the LovTokens achievement system launch campaign.

## Assets

- `assets/achievement-system-launch-poster-9x16.png`: primary 2160 x 3840 X and
  social-media poster.
- `assets/achievement-system-launch-bg-9x16.png`: generated 9:16 background
  plate used by the renderer.
- `assets/achievement-system-launch-poster.png`: archived 2160 x 2700 poster.
- `assets/achievement-system-launch-bg.png`: archived 4:5 background plate.

The poster contains all 25 illustrated production badges plus the five fixed
Token milestone badges. The illustrated badge sources remain in
`apps/web/public/achievements/` because they are also used by the product.

## Regenerate the 9:16 poster

From the repository root:

```bash
python3 marketing/achievement-system-launch/scripts/render-achievement-launch-poster.py
```

The renderer requires Pillow and the macOS system fonts referenced in the
script. It writes the finished poster back into this campaign's `assets/`
directory.
