<div align="center">

# Image Tools

A fast, no-nonsense image converter that runs entirely in your browser.

[**imagetools-57v.pages.dev**](https://imagetools-57v.pages.dev/)

</div>

---

## Why I built this

I needed WebP images at specific dimensions and quality levels, on a per-image basis. Writing a shell script felt wrong because every image needed slightly different treatment. Photoshop takes forever to boot and is overkill for this. Canva and similar tools are either too restrictive or put things behind a paywall. I just wanted something that opens instantly, lets me see what I'm doing, and gets out of the way.

So I built this. Everything runs in the browser via libvips compiled to WebAssembly. No backend, no uploads, no waiting for a server. Drop an image, pick a format and quality, convert, download. Done.

## What it does

**Multi-format conversion.** Output to WebP, JPEG, JPG, PNG, AVIF, and TIFF, all at the same time. Accepts pretty much any image format as input, including SVG (auto-rasterized before conversion).

**Quality control.** A 10-100% slider for dialing in the quality/size tradeoff. After conversion, each result shows how much you saved (or didn't), like "73% smaller" or "4% larger".

**Resizing.** Toggle it on, pick a preset (360p through 4K) or enter a custom width up to 10,000px. Aspect ratio is always preserved.

**Rotating, cropping, and flipping.** Basic transforms without leaving the app.

**Watermarking.** Bulk-apply text or image watermarks across all selected images. Useful for batch-branding assets without opening a separate tool.

**Color palette extraction.** Pull dominant colors from any image, with hex values and a live preview. Sort of like an eyedropper for the whole image. If the image maps close enough to a Pantone color, it'll surface that too.

**Image metadata viewer and editor.** See EXIF data (camera, lens, exposure, GPS, etc.) and edit what you need before re-exporting. Strip location data from photos in two clicks.

**Comparison overlay.** Four modes on each canvas node: original only, converted only, 50/50 split, or a draggable slider you can position anywhere. Useful for spotting compression artifacts at a glance.

**Infinite canvas.** Every image you upload becomes a draggable card on a freeform canvas. Pan with Space+drag or middle mouse, zoom with scroll (Ctrl for bigger steps), select with click or marquee-drag, and hit Arrange to snap everything into a clean grid. Selected nodes pick up a glow in the image's dominant color, which is a small thing but I like it.

**Batch download.** Convert once, download individually or grab everything at once. There's also a ZIP export if you're converting a batch and don't want to click through each one.

**Fully offline-capable.** The vips WASM module is around 15MB on first load but after that the app basically functions like a local tool. COOP/COEP headers are set so SharedArrayBuffer works, which vips needs.

## Keyboard shortcuts

| Shortcut | What it does |
|----------|-------------|
| Space + drag | Pan the canvas |
| Tab | Toggle both side panels |
| Delete / Backspace | Remove selected images |
| Ctrl+A | Select all |
| Ctrl+0 | Fit everything to screen |
| Ctrl+= | Zoom in |
| Ctrl+- | Zoom out |
| Escape | Deselect all |
| Double-click empty canvas | Open file picker |

## How it works

1. Drop images on the canvas or click upload
2. Pick your formats and quality in the right panel
3. Hit Convert (the button says "Loading engine..." until vips finishes initializing, which takes a few seconds on first load)
4. Compare results right on the canvas node
5. Download what you need, or export everything as a ZIP

## Tech

This started as a "can I run libvips in the browser" experiment and grew from there.

| What | Why |
|------|-----|
| [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | UI |
| [Vite 8](https://vitejs.dev/) | Build tool |
| [wasm-vips](https://github.com/nicokant/wasm-vips) | The actual image processing. libvips compiled to WASM |
| [Zustand](https://zustand.docs.pmnd.rs/) | State management, keeps things simple |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | Component library (New York variant) |
| [TanStack Router](https://tanstack.com/router) | File-based routing |
| [JSZip](https://stuk.github.io/jszip/) | ZIP export |
| [Biome](https://biomejs.dev/) | Linting and formatting, replaced ESLint + Prettier because one tool is better than two |

## Running locally

You need Node.js 18+ and pnpm.

```bash
git clone https://github.com/vanshbordia/imagetools.git
cd imagetools
pnpm install
pnpm dev
```

Dev server runs on `localhost:4500`.

For a production build:

```bash
pnpm build
```

Output goes to `dist/`.

To lint and format:

```bash
pnpm check
```

## Things worth knowing

- The vips WASM modules live in `public/` and include support for SVG rendering (resvg), JPEG XL, and HEIF, even though the UI only exposes the six main output formats right now.
- SVG files get rasterized client-side via a canvas element, capped at 4096px on the longest side, before being handed off to vips.
- The dot-grid background on the canvas shifts with pan, which is subtle but helps with spatial orientation when you're zoomed in and panning around.
- Dark mode is the default because of course it is.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, code style, and PR conventions.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Short version: be decent.

## Roadmap-ish

Things I'd like to get to at some point, in no particular order:

- JPEG XL output support (the WASM module is already bundled)
- HEIF/HEIC input support (same)
- Before/after diff view that highlights pixel-level changes
- Drag-and-drop reordering in the images panel
- Remember settings across sessions (localStorage)
- Paste from clipboard
- Crop tool

If any of these sound interesting to you, that's a great starting point for a contribution.

## License

[MIT](LICENSE). Do what you want with it.
