import { Upload } from "lucide-react";
import { CanvasNode } from "./CanvasNode";
import type { CanvasNodeState, ComparisonMode } from "../../hooks/useCanvas";
import type { ConversionResult } from "../../lib/imageConverter";

interface InfiniteCanvasProps {
	containerRef: React.RefObject<HTMLDivElement | null>;
	pan: { x: number; y: number };
	zoom: number;
	nodeStates: Record<string, CanvasNodeState>;
	selectedIds: Set<string>;
	selectionBox: {
		startX: number;
		startY: number;
		endX: number;
		endY: number;
	} | null;
	images: {
		id: string;
		previewUrl: string;
		file: { name: string; size: number; type?: string };
		originalDimensions: { width: number; height: number } | null;
		conversions: ConversionResult[];
	}[];
	cursor: string;
	hasImages: boolean;
	onMouseDown: (e: React.MouseEvent) => void;
	onMouseMove: (e: React.MouseEvent) => void;
	onMouseUp: (e: React.MouseEvent) => void;
	onDoubleClick: (e: React.MouseEvent) => void;
	onWheel: (e: React.WheelEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	onDragOver: (e: React.DragEvent) => void;
	onComparisonModeChange: (imageId: string, mode: ComparisonMode) => void;
	onSliderPositionChange: (imageId: string, position: number) => void;
	onSelectedFormatChange: (imageId: string, format: string) => void;
	onMouseLeave: () => void;
}

export function InfiniteCanvas({
	containerRef,
	pan,
	zoom,
	nodeStates,
	selectedIds,
	selectionBox,
	images,
	cursor,
	hasImages,
	onMouseDown,
	onMouseMove,
	onMouseUp,
	onDoubleClick,
	onWheel,
	onDrop,
	onDragOver,
	onComparisonModeChange,
	onSliderPositionChange,
	onSelectedFormatChange,
	onMouseLeave,
}: InfiniteCanvasProps) {
	const gridSize = 24;

	return (
		<div
			ref={containerRef}
			className="w-full h-full overflow-hidden relative select-none"
			style={{ cursor }}
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onMouseUp={onMouseUp}
			onDoubleClick={onDoubleClick}
			onWheel={onWheel}
			onDrop={onDrop}
			onDragOver={onDragOver}
			onMouseLeave={onMouseLeave}
		>
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: `radial-gradient(circle, hsl(var(--border) / 0.4) 1px, transparent 1px)`,
					backgroundSize: `${gridSize}px ${gridSize}px`,
					backgroundPosition: `${pan.x % gridSize}px ${pan.y % gridSize}px`,
				}}
			/>

			<div
				style={{
					transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
					transformOrigin: "0 0",
					position: "absolute",
					top: 0,
					left: 0,
				}}
			>
				{images.map((img) => {
					const ns = nodeStates[img.id];
					if (!ns) return null;
					return (
						<CanvasNode
							key={img.id}
							nodeState={ns}
							image={img}
							selected={selectedIds.has(img.id)}
							onComparisonModeChange={onComparisonModeChange}
							onSliderPositionChange={onSliderPositionChange}
							onSelectedFormatChange={onSelectedFormatChange}
						/>
					);
				})}
			</div>

			{selectionBox &&
				(() => {
					const left = selectionBox.startX * zoom + pan.x;
					const top = selectionBox.startY * zoom + pan.y;
					const width = (selectionBox.endX - selectionBox.startX) * zoom;
					const height = (selectionBox.endY - selectionBox.startY) * zoom;
					return (
						<div
							className="absolute border-2 border-primary/60 bg-primary/10 pointer-events-none rounded-sm"
							style={{ left, top, width, height }}
						/>
					);
				})()}

			{!hasImages && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="flex flex-col items-center gap-3 text-muted-foreground">
						<Upload className="h-14 w-14 opacity-20" />
						<div className="text-center space-y-1.5">
							<p className="text-base font-medium opacity-50">
								Drop images here
							</p>
							<p className="text-xs opacity-30">or double-click to upload</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
