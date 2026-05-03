# Contributing to Image Tools

Thanks for taking the time to contribute. Here's how to get started.

## Quick start

1. Fork the repo
2. Clone your fork: `git clone https://github.com/vanshbordia/imagetools.git`
3. Install dependencies: `pnpm install`
4. Start the dev server: `pnpm dev`
5. Create a branch: `git checkout -b fix/whatever`
6. Make your changes
7. Run `pnpm check` to make sure linting and formatting pass
8. Push and open a PR against `main`

## Code style

This project uses [Biome](https://biomejs.dev/) for linting and formatting. There's no ESLint or Prettier. If your editor has a Biome extension, use it. Otherwise, running `pnpm check` before you push will catch most things.

General conventions:

- TypeScript, strict mode. No `any` unless there's a genuinely good reason.
- React functional components with hooks. No class components.
- Tailwind for styling. Don't add CSS files unless there's no other way.
- Keep the existing patterns. If the file you're editing uses a certain import style or naming convention, follow it.

## Pull requests

- One concern per PR. A bug fix and a new feature should be separate PRs.
- If you're adding a significant feature, consider opening an issue first to discuss the approach. Saves everyone time if the design direction isn't aligned.
- Write a decent PR description. What does it change, why, and anything reviewers should watch out for.
- Commits should be atomic and descriptive. `fix comparison overlay not updating on format switch` is better than `fix bug`.

## Reporting bugs

Open an [issue](https://github.com/vanshbordia/imagetools/issues) with:

- What you did
- What you expected to happen
- What actually happened
- Browser and OS (WASM behavior varies across browsers, this matters)
- Console errors if any

## Feature requests

Same place, open an [issue](https://github.com/vanshbordia/imagetools/issues). I'm open to ideas but this is a side project so turnaround isn't guaranteed. If you want something badly enough, a PR carries more weight than an issue.

## Project structure

```
src/
  hooks/
    useCanvas.ts              Canvas logic (pan, zoom, selection, conversion)
  lib/
    store.ts                  Zustand store
    imageConverter.ts         Conversion pipeline (vips-backed)
    vips.ts                   WASM initialization
  components/
    ImageConverter.tsx         Main layout
    canvas/
      InfiniteCanvas.tsx      Canvas viewport
      CanvasNode.tsx          Individual image card
      ComparisonOverlay.tsx   Original vs converted overlay
      PropertiesPanel.tsx    Right panel (formats, quality, resize, download)
      ImagesPanel.tsx         Left panel (image list)
      FloatingToolbar.tsx     Top toolbar
    ui/                       shadcn/ui primitives
```

## A note on WASM

The image processing is handled by wasm-vips (libvips compiled to WebAssembly). The WASM modules live in `public/` and are loaded at runtime. This means:

- First load takes a few seconds while the engine initializes
- The dev server needs COOP/COEP headers (already configured in `vite.config.ts`) for SharedArrayBuffer support
- Some image processing features that seem simple on the server side might require working through the vips API, which has its own conventions

If you're adding a feature that involves image manipulation, check [`src/lib/vips.ts`](src/lib/vips.ts) and [`src/lib/imageConverter.ts`](src/lib/imageConverter.ts) first to understand how the vips instance is set up and used.
