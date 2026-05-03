import { getVips } from "./vips";

export type ImageFormat = "webp" | "jpeg" | "jpg" | "png" | "avif" | "tiff";

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

async function rasterizeSvg(file: File): Promise<Blob> {
	const url = URL.createObjectURL(file);
	const img = new Image();
	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = reject;
		img.src = url;
	});
	const scale = Math.min(
		1,
		4096 / Math.max(img.naturalWidth, img.naturalHeight),
	);
	const w = Math.round(img.naturalWidth * scale);
	const h = Math.round(img.naturalHeight * scale);
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d")!;
	ctx.drawImage(img, 0, 0, w, h);
	URL.revokeObjectURL(url);
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error("Failed to rasterize SVG"));
		}, "image/png");
	});
}

export async function convertImageFormat(
	file: File,
	targetFormat: ImageFormat,
	quality = 0.9,
	resizeOptions?: ResizeOptions,
): Promise<ConversionResult> {
	const vips = getVips();
	let inputBuffer: ArrayBuffer;
	if (
		file.type === "image/svg+xml" ||
		file.name.toLowerCase().endsWith(".svg")
	) {
		const pngBlob = await rasterizeSvg(file);
		inputBuffer = await pngBlob.arrayBuffer();
	} else {
		inputBuffer = await file.arrayBuffer();
	}
	const image = vips.Image.newFromBuffer(inputBuffer);

	// Calculate target dimensions
	let targetWidth = image.width;
	let targetHeight = image.height;

	if (resizeOptions) {
		if (resizeOptions.width && resizeOptions.maintainAspectRatio !== false) {
			// Resize based on width, maintain aspect ratio
			const aspectRatio = image.height / image.width;
			targetWidth = resizeOptions.width;
			targetHeight = Math.round(resizeOptions.width * aspectRatio);
		} else if (resizeOptions.width && resizeOptions.height) {
			// Use both dimensions
			targetWidth = resizeOptions.width;
			targetHeight = resizeOptions.height;
		} else if (resizeOptions.width) {
			targetWidth = resizeOptions.width;
		} else if (resizeOptions.height) {
			targetHeight = resizeOptions.height;
		}
	}

	// Resize if needed
	let processedImage = image;
	if (targetWidth !== image.width || targetHeight !== image.height) {
		if (
			resizeOptions?.maintainAspectRatio === false &&
			resizeOptions.width &&
			resizeOptions.height
		) {
			// Embed to exact size
			processedImage = image.embed(0, 0, targetWidth, targetHeight, {
				extend: "background",
			});
		} else {
			// Resize with maintain aspect ratio
			const scaleX = targetWidth / image.width;
			const scaleY = targetHeight / image.height;
			processedImage = image.resize(Math.min(scaleX, scaleY));
		}
	}

	// Set output options
	const options: any = {};
	if (["jpeg", "jpg", "webp"].includes(targetFormat)) {
		options.Q = Math.round(quality * 100);
	}

	const outputBuffer = processedImage.writeToBuffer(
		`.${targetFormat}`,
		options,
	);
	const blob = new Blob([outputBuffer]);
	const url = URL.createObjectURL(blob);
	const originalName = file.name.split(".").slice(0, -1).join(".");
	const filename = `${originalName}.${targetFormat}`;

	return {
		format: targetFormat,
		blob,
		url,
		size: blob.size,
		filename,
		width: processedImage.width,
		height: processedImage.height,
	};
}

/**
 * Convert image to multiple formats
 */
export async function convertToMultipleFormats(
	file: File,
	formats: ImageFormat[],
	quality = 0.9,
	resizeOptions?: ResizeOptions,
): Promise<ConversionResult[]> {
	const conversions = formats.map((format) =>
		convertImageFormat(file, format, quality, resizeOptions),
	);
	return Promise.all(conversions);
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
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
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}
