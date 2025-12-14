export type ImageFormat = 'webp' | 'jpeg' | 'jpg' | 'png' | 'avif' | 'tiff';

export interface ConversionResult {
  format: ImageFormat;
  blob: Blob;
  url: string;
  size: number;
  filename: string;
  width: number;
  height: number;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

/**
 * Convert an image file to a different format
 */
export async function convertImageFormat(
  file: File,
  targetFormat: ImageFormat,
  quality = 0.9,
  resizeOptions?: ResizeOptions
): Promise<ConversionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Calculate dimensions based on resize options
      let targetWidth = img.width;
      let targetHeight = img.height;
      
      if (resizeOptions) {
        if (resizeOptions.width && resizeOptions.maintainAspectRatio !== false) {
          // Resize based on width, maintain aspect ratio
          const aspectRatio = img.height / img.width;
          targetWidth = resizeOptions.width;
          targetHeight = Math.round(resizeOptions.width * aspectRatio);
        } else if (resizeOptions.width && resizeOptions.height) {
          // Use both dimensions if provided and aspect ratio not maintained
          targetWidth = resizeOptions.width;
          targetHeight = resizeOptions.height;
        } else if (resizeOptions.width) {
          targetWidth = resizeOptions.width;
        } else if (resizeOptions.height) {
          targetHeight = resizeOptions.height;
        }
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: true });

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Enable high-quality image smoothing for better upscaling/downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw image with resize
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Determine MIME type and whether format supports quality
      let mimeType: string;
      let supportsQuality = true;
      
      switch (targetFormat) {
        case 'webp':
          mimeType = 'image/webp';
          break;
        case 'jpeg':
        case 'jpg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          supportsQuality = false; // PNG doesn't support quality parameter
          break;
        case 'avif':
          mimeType = 'image/avif';
          break;
        case 'tiff':
          mimeType = 'image/tiff';
          supportsQuality = false; // TIFF support varies by browser
          break;
        default:
          mimeType = 'image/png';
          supportsQuality = false;
      }

      // Use quality parameter only for formats that support it
      const blobQuality = supportsQuality ? quality : undefined;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image'));
            return;
          }

          const url = URL.createObjectURL(blob);
          const originalName = file.name.split('.').slice(0, -1).join('.');
          const filename = `${originalName}.${targetFormat}`;

          resolve({
            format: targetFormat,
            blob,
            url,
            size: blob.size,
            filename,
            width: targetWidth,
            height: targetHeight,
          });
        },
        mimeType,
        blobQuality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert image to multiple formats
 */
export async function convertToMultipleFormats(
  file: File,
  formats: ImageFormat[],
  quality = 0.9,
  resizeOptions?: ResizeOptions
): Promise<ConversionResult[]> {
  const conversions = formats.map((format) =>
    convertImageFormat(file, format, quality, resizeOptions)
  );
  return Promise.all(conversions);
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
