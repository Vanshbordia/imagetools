import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { ComparisonOverlay } from "./ComparisonOverlay";
import type { CanvasNodeState, ComparisonMode } from "../../hooks/useCanvas";
import type { ConversionResult } from "../../lib/imageConverter";
import { formatFileSize } from "../../lib/imageConverter";

interface CanvasNodeProps {
	nodeState: CanvasNodeState;
	image: {
		id: string;
		previewUrl: string;
		file: { name: string; size: number; type?: string };
		originalDimensions: { width: number; height: number } | null;
		conversions: ConversionResult[];
	};
	selected: boolean;
	onComparisonModeChange: (imageId: string, mode: ComparisonMode) => void;
	onSliderPositionChange: (imageId: string, position: number) => void;
	onSelectedFormatChange: (imageId: string, format: string) => void;
}

const COMPARISON_TABS: { mode: ComparisonMode; label: string }[] = [
	{ mode: "original", label: "Orig" },
	{ mode: "converted", label: "Conv" },
	{ mode: "half", label: "50/50" },
	{ mode: "slider", label: "Slide" },
];

function getFormatFromMime(mime: string | undefined): string {
	if (!mime) return "";
	const map: Record<string, string> = {
		"image/png": "PNG",
		"image/jpeg": "JPEG",
		"image/jpg": "JPG",
		"image/webp": "WEBP",
		"image/gif": "GIF",
		"image/avif": "AVIF",
		"image/tiff": "TIFF",
		"image/svg+xml": "SVG",
		"image/bmp": "BMP",
	};
	return map[mime] || mime.split("/")[1]?.toUpperCase() || "";
}

function useDominantColor(
	imageUrl: string,
): { r: number; g: number; b: number } | null {
	const [color, setColor] = useState<{
		r: number;
		g: number;
		b: number;
	} | null>(null);

	useEffect(() => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const size = 8;
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.drawImage(img, 0, 0, size, size);
			const data = ctx.getImageData(0, 0, size, size).data;
			let rSum = 0;
			let gSum = 0;
			let bSum = 0;
			let count = 0;
			for (let i = 0; i < data.length; i += 4) {
				if (data[i + 3] < 30) continue;
				rSum += data[i];
				gSum += data[i + 1];
				bSum += data[i + 2];
				count++;
			}
			if (count > 0) {
				setColor({
					r: Math.round(rSum / count),
					g: Math.round(gSum / count),
					b: Math.round(bSum / count),
				});
			}
		};
		img.src = imageUrl;
	}, [imageUrl]);

	return color;
}

export function CanvasNode({
	nodeState,
	image,
	selected,
	onComparisonModeChange,
	onSliderPositionChange,
	onSelectedFormatChange,
}: CanvasNodeProps) {
	const dragStartRef = useRef<{ x: number; startPos: number } | null>(null);
	const nodeRef = useRef<HTMLDivElement>(null);

	const hasConversions = image.conversions.length > 0;
	const selectedConversion = nodeState.selectedFormat
		? image.conversions.find((r) => r.format === nodeState.selectedFormat)
		: image.conversions[0];

	const showComparison =
		hasConversions && nodeState.comparisonMode !== "original";

	const dominantColor = useDominantColor(selected ? image.previewUrl : "");

	const handleSliderDragStart = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();
			const startX = e.clientX;
			const startPos = nodeState.sliderPosition;
			dragStartRef.current = { x: startX, startPos };

			const onMove = (ev: MouseEvent) => {
				if (!nodeRef.current) return;
				const rect = nodeRef.current.getBoundingClientRect();
				const relX = (ev.clientX - rect.left) / rect.width;
				const pos = Math.max(0, Math.min(100, relX * 100));
				onSliderPositionChange(image.id, pos);
			};

			const onUp = () => {
				document.removeEventListener("mousemove", onMove);
				document.removeEventListener("mouseup", onUp);
			};

			document.addEventListener("mousemove", onMove);
			document.addEventListener("mouseup", onUp);
		},
		[image.id, nodeState.sliderPosition, onSliderPositionChange],
	);

	const originalFormat = getFormatFromMime(image.file.type);

	const selectionGlow = useMemo(() => {
		if (!selected || !dominantColor) return undefined;
		const { r, g, b } = dominantColor;
		return {
			borderColor: `rgba(${r}, ${g}, ${b}, 0.5)`,
			boxShadow: `0 0 12px 2px rgba(${r}, ${g}, ${b}, 0.25), 0 0 24px 4px rgba(${r}, ${g}, ${b}, 0.1)`,
		};
	}, [selected, dominantColor]);

	const resizedDims = (() => {
		if (!hasConversions || !image.originalDimensions) return null;
		const conv = image.conversions[0];
		if (!conv) return null;
		if (
			conv.width === image.originalDimensions.width &&
			conv.height === image.originalDimensions.height
		)
			return null;
		return `${conv.width}×${conv.height}`;
	})();

	return (
		<div
			ref={nodeRef}
			data-node-id={image.id}
			className="absolute group"
			style={{
				left: nodeState.x,
				top: nodeState.y,
				width: nodeState.displayWidth,
			}}
		>
			<div
				className={`
          rounded-lg overflow-hidden bg-card border shadow-lg transition-shadow
          ${selected ? "ring-2" : "border-border/60 hover:border-border hover:shadow-xl"}
        `}
				style={
					selected
						? selectionGlow || {
								borderColor: "hsl(var(--primary) / 0.5)",
								boxShadow:
									"0 0 12px 2px hsl(var(--primary) / 0.15), 0 0 24px 4px hsl(var(--primary) / 0.05)",
							}
						: undefined
				}
			>
				<div
				className="flex items-center gap-0.5 px-1 py-1 border-b border-border/40 bg-muted/30"
			>
				{hasConversions ? (
					<>
						{COMPARISON_TABS.map((tab) => (
							<button
								key={tab.mode}
								onClick={(e) => {
									e.stopPropagation();
									onComparisonModeChange(image.id, tab.mode);
								}}
								onMouseDown={(e) => e.stopPropagation()}
								className={`
                  px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors
                  ${
										nodeState.comparisonMode === tab.mode
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground hover:bg-muted"
									}
                `}
							>
								{tab.label}
							</button>
						))}
						{hasConversions && image.conversions.length > 1 && (
							<div
								className="ml-auto flex items-center gap-0.5"
								onClick={(e) => e.stopPropagation()}
								onMouseDown={(e) => e.stopPropagation()}
							>
								{image.conversions.map((r) => (
									<button
										key={r.format}
										onClick={(e) => {
											e.stopPropagation();
											onSelectedFormatChange(image.id, r.format);
										}}
										onMouseDown={(e) => e.stopPropagation()}
										className={`
                      px-1 py-0.5 rounded text-[9px] font-semibold uppercase transition-colors leading-none
                      ${
											nodeState.selectedFormat === r.format || (!nodeState.selectedFormat && r === image.conversions[0])
												? "bg-primary text-primary-foreground"
												: "text-muted-foreground hover:text-foreground hover:bg-muted"
										}
                    `}
									>
										{r.format}
									</button>
								))}
							</div>
						)}
					</>
				) : (
					<span className="px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50 uppercase">
						{originalFormat || "Image"}
					</span>
				)}
			</div>

				<div
					className="relative overflow-hidden bg-muted/20"
					style={{ height: nodeState.displayHeight }}
				>
					<img
						src={image.previewUrl}
						alt={image.file.name}
						className="w-full h-full object-contain pointer-events-none"
						draggable={false}
					/>

					{showComparison && selectedConversion && (
						<ComparisonOverlay
							conversion={selectedConversion}
							mode={nodeState.comparisonMode}
							sliderPosition={nodeState.sliderPosition}
							onSliderDragStart={handleSliderDragStart}
						/>
					)}
				</div>

				<div className="px-2 py-1.5 border-t border-border/40 bg-muted/20">
					<div className="flex items-center justify-between gap-2">
						<span className="text-[11px] text-muted-foreground truncate">
							{image.file.name}
						</span>
						{image.originalDimensions && (
							<span className="text-[9px] text-muted-foreground/50 tabular-nums whitespace-nowrap flex-shrink-0">
								{image.originalDimensions.width}×
								{image.originalDimensions.height}
							</span>
						)}
					</div>
					<div className="flex items-center justify-between gap-2 mt-0.5">
						<div className="flex items-center gap-1 min-w-0 flex-wrap">
							{originalFormat && (
								<span className="text-[9px] text-muted-foreground/50 tabular-nums whitespace-nowrap inline-flex items-center gap-0.5">
									<span className="uppercase font-semibold text-[8px]">
										{originalFormat}
									</span>
									{formatFileSize(image.file.size)}
								</span>
							)}
							{!originalFormat && (
								<span className="text-[9px] text-muted-foreground/60 tabular-nums whitespace-nowrap">
									{formatFileSize(image.file.size)}
								</span>
							)}
							{hasConversions &&
								image.conversions.map((r) => (
									<span
										key={r.format}
										className="text-[9px] text-muted-foreground/50 tabular-nums whitespace-nowrap inline-flex items-center gap-0.5"
									>
										<span className="text-muted-foreground/30">·</span>
										<span className="uppercase font-semibold text-[8px]">
											{r.format}
										</span>
										{formatFileSize(r.size)}
									</span>
								))}
						</div>
						{resizedDims && (
							<span className="text-[9px] text-muted-foreground/35 tabular-nums whitespace-nowrap flex-shrink-0">
								{resizedDims}
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
