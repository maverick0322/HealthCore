## Marketing placeholders (to replace with real captures)

### Landing gallery cards
- File: `src/features/marketing/pages/LandingPage.tsx`
- Section: `explore.galleryTitle` and `explore.nutritionistTitle`
- Current state: cards render “rich mock UI” (no images yet) so they don’t look empty.
- Replace with: real screenshots (PNG/JPG/WebP) of:
  - Patient dashboard (daily log + weekly progress)
  - Nutritionist dashboard (patient list + feedback/adjustments)

Recommended implementation:
- Add images under `public/marketing/` (e.g. `public/marketing/patient-dashboard.webp`, `public/marketing/nutritionist-dashboard.webp`)
- Replace the mock blocks inside each card’s `CardContent` with:
  - `<img src="/marketing/..." alt="..." className="w-full rounded-xl border border-border" />`
  - Optional: keep the current mock blocks as a fallback while images are not present.

### Guided tour
- File: `src/features/marketing/pages/TourPage.tsx`
- Current state: interactive tour with dummy data and quick personalization inputs.
- Replace/extend with: real screenshots (optional) or richer dummy flows based on real product behavior.

### Demo data
- File: `src/features/marketing/pages/DemoPage.tsx`
- Current state: food items + timeline are sample-only and local state.
- Replace with: optional “guest mode” backed by API or persisted local profile (if later desired).
