# Image Processor

A web-based tool for image compression and resizing.

## Features

- Upload multiple images via drag-and-drop or file selection
- Compress images with adjustable quality settings
- Resize images with preset or custom dimensions
- Convert images to different formats (JPG, JPEG, PNG, WebP)
- Set maximum file size for output images
- Batch process multiple images
- Preview processed images
- Download individual processed images or all at once

## Upcoming Features

- Background removal tool
- Image upscaler using AI
- Color palette extraction from images
- Bulk image renaming
- Image cropping and rotation
- Apply filters and effects (e.g., grayscale, sepia, blur)
- Metadata viewer and editor
- Image comparison tool (before/after)
- Watermark addition
- OCR (Optical Character Recognition) for text extraction from images

## Technologies Used

- React
- Next.js
- TypeScript
- browser-image-compression library
- Lucide React for icons
- ShadCN for UI

## Installation

1. Clone the repository:
   ```bash
    git clone https://github.com/Vanshbordia/imagetools.git
    ```

2. Navigate to the project directory:
   ```bash
   cd imagetools 
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## Usage

1. Upload images by dragging and dropping them into the designated area or clicking to select files.
2. Choose the desired output format (JPG, JPEG, PNG, or WebP).
3. Adjust the compression level using the slider.
4. Enable resizing if needed and select a preset resolution or set a custom width.
5. Set the maximum file size for the output images.
6. Click "Process Images" to start the compression and resizing.
7. Preview the processed images and their new sizes.
8. Download individual images or use the "Download All" button to get all processed images.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
