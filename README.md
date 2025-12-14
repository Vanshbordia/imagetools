# Image Tools

A powerful, open-source web application for converting, compressing, and resizing images directly in your browser. Built with modern web technologies, Image Tools offers a seamless experience for optimizing your visual assets.

## Features

- **Multi-Format Conversion**: Convert images to **WebP, JPEG, PNG, AVIF, and TIFF** simultaneously.
- **Advanced Compression**: Fine-tune quality with a precision slider to balance file size and visual fidelity.
- **Smart Resizing**:
  - Quick presets (360p, 720p, 1080p, 4K, etc.)
  - Custom width input with automatic aspect ratio maintenance.
  - Upscaling detection and warnings.
- **Visual Comparison**:
  - **Slider Mode**: Interactively slide between the original and processed image.
  - **Side-by-Side**: View images next to each other.
  - **Synchronized Zoom & Pan**: Inspect details closely; zooming on one image mirrors the other.
- **Batch Processing**: Select multiple output formats and generate them all in one click.
- **Privacy-First**: All processing happens client-side in your browser. Your images are never uploaded to a server.
- **User-Friendly Interface**:
  - Drag & drop support.
  - Grid and List views for results.
  - Real-time file size delta indicators (e.g., "45% smaller").

## Privacy & Security

Image Tools is designed with a strict **privacy-first** philosophy.

- **100% Client-Side Processing**: All image conversions and edits happen locally within your browser. 
- **No Server Uploads**: Your images **never** leave your device. There is no backend server to view, store, or analyze your files.
- **No Tracking**: We do not track your usage or collect any personal data.
- **Offline Capable**: Once loaded, the app functions essentially as a local desktop tool, leveraging the power of WebAssembly and modern browser APIs for speed and security.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Tooling**: [Biome](https://biomejs.dev/) (Linting & Formatting)
- **Key Libraries**:
  - `browser-image-compression` for optimization.
  - `react-compare-slider` for diffing.
  - `react-zoom-pan-pinch` for detailed inspection.
  - `lucide-react` for iconography.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vanshbordia/imagetools.git
   cd imagetools
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```
   Open http://localhost:3000 to view it in the browser.

### Building for Production

To create a production-ready build:

```bash
pnpm build
```

This will generate optimized static assets in the `dist` directory.

## Usage

1. **Upload**: Drag and drop an image or click to select one from your device.
2. **Configure**:
   - Select one or more output formats (e.g., WebP + JPG).
   - Adjust the quality slider.
   - (Optional) Toggle resizing and pick a preset or custom width.
3. **Convert**: Click **"Convert Image"**.
4. **Review**:
   - Check the file size savings.
   - Click on any result to open the **Comparison View**.
5. **Download**: Download individual files or use **"Download All"** to grab everything at once.

## Contributing

We welcome contributions! Whether it's fixing bugs, improving documentation, or suggesting new features, here's how you can help:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some amazing feature'`).
5. Push to the branch (`git push origin feature/amazing-feature`).
6. Open a Pull Request.

Please ensure your code passes the linting and formatting checks:

```bash
pnpm check
```

## License

This project is open source and available under the [MIT License](LICENSE).
