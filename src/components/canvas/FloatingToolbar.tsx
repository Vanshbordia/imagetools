import {
	Grid3x3,
	Image as ImageIcon,
	Maximize,
	MousePointer2,
	Settings,
	Trash2,
	Upload,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { Button } from "../ui/button";

interface FloatingToolbarProps {
	zoom: number;
	hasSelection: boolean;
	hasImages: boolean;
	leftPanelOpen: boolean;
	rightPanelOpen: boolean;
	onUpload: () => void;
	onSelectAll: () => void;
	onDelete: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFitToScreen: () => void;
	onZoomTo100: () => void;
	onArrange: () => void;
	onToggleLeftPanel: () => void;
	onToggleRightPanel: () => void;
}

export function FloatingToolbar({
	zoom,
	hasSelection,
	hasImages,
	leftPanelOpen,
	rightPanelOpen,
	onUpload,
	onSelectAll,
	onDelete,
	onZoomIn,
	onZoomOut,
	onFitToScreen,
	onZoomTo100,
	onArrange,
	onToggleLeftPanel,
	onToggleRightPanel,
}: FloatingToolbarProps) {
	return (
		<div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
			<div className="flex items-center gap-0.5 bg-card/90 backdrop-blur-xl border border-border/60 rounded-lg shadow-xl shadow-black/10 px-1.5 py-1">
				<Button
					variant={leftPanelOpen ? "secondary" : "ghost"}
					size="sm"
					onClick={onToggleLeftPanel}
					className="h-7 w-7 p-0"
					title="Images panel"
				>
					<ImageIcon className="h-3.5 w-3.5" />
				</Button>

				<div className="w-px h-5 bg-border/40 mx-0.5" />

				<Button
					variant="ghost"
					size="sm"
					onClick={onUpload}
					className="h-7 gap-1 text-xs"
				>
					<Upload className="h-3.5 w-3.5" />
					<span className="hidden sm:inline">Upload</span>
				</Button>

				{hasImages && (
					<>
						<Button
							variant="ghost"
							size="sm"
							onClick={onSelectAll}
							className="h-7 w-7 p-0"
							title="Select all"
						>
							<MousePointer2 className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={onArrange}
							className="h-7 w-7 p-0"
							title="Arrange images"
						>
							<Grid3x3 className="h-3.5 w-3.5" />
						</Button>
					</>
				)}

				{hasSelection && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onDelete}
						className="h-7 w-7 p-0 text-destructive hover:text-destructive"
						title="Delete selected"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				)}

				<div className="w-px h-5 bg-border/40 mx-0.5" />

				<Button
					variant="ghost"
					size="sm"
					onClick={onZoomOut}
					className="h-7 w-7 p-0"
					title="Zoom out"
				>
					<ZoomOut className="h-3.5 w-3.5" />
				</Button>
				<button
					type="button"
					onClick={onFitToScreen}
					className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors px-1 min-w-[36px] text-center"
					title="Fit to screen"
				>
					{Math.round(zoom * 100)}%
				</button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onZoomIn}
					className="h-7 w-7 p-0"
					title="Zoom in"
				>
					<ZoomIn className="h-3.5 w-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onFitToScreen}
					className="h-7 gap-1 text-[9px] px-1.5"
					title="Fit to screen"
				>
					<Maximize className="h-3 w-3" />
					<span className="hidden sm:inline">Fit</span>
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onZoomTo100}
					className="h-7 gap-1 text-[9px] px-1.5"
					title="Zoom to 100%"
				>
					<span className="font-mono font-semibold">1:1</span>
				</Button>

				<div className="w-px h-5 bg-border/40 mx-0.5" />

				<Button
					variant={rightPanelOpen ? "secondary" : "ghost"}
					size="sm"
					onClick={onToggleRightPanel}
					className="h-7 w-7 p-0"
					title="Properties panel"
				>
					<Settings className="h-3.5 w-3.5" />
				</Button>
			</div>
		</div>
	);
}
