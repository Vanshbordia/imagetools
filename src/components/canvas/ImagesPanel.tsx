import {
	Image as ImageIcon,
	X,
	CheckCircle2,
	Circle,
	Trash2,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { formatFileSize } from "../../lib/imageConverter";
import type { ConversionResult } from "../../lib/imageConverter";

interface ImagesPanelProps {
	images: {
		id: string;
		previewUrl: string;
		file: { name: string; size: number };
		originalDimensions: { width: number; height: number } | null;
		conversions: ConversionResult[];
	}[];
	selectedIds: Set<string>;
	panelWidth: number;
	onFocusImage: (id: string) => void;
	onRemoveImage: (id: string) => void;
	onUpload: () => void;
	onClose: () => void;
}

const THUMB = 32;
const PAD_X = 28;
const GAPS = 16;
const ICONS = 52;

export function ImagesPanel({
	images,
	selectedIds,
	panelWidth,
	onFocusImage,
	onRemoveImage,
	onUpload,
	onClose,
}: ImagesPanelProps) {
	const nameWidth = Math.max(panelWidth - THUMB - PAD_X - GAPS - ICONS, 24);

	return (
		<div
			className="h-full flex flex-col"
			onDoubleClick={(e) => {
				if ((e.target as HTMLElement).closest("[data-image-item]")) return;
				onUpload();
			}}
		>
			<div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
				<div className="flex items-center gap-2">
					<span className="text-[13px] font-semibold text-foreground/80">
						Images
					</span>
					{images.length > 0 && (
						<Badge
							variant="secondary"
							className="h-5 min-w-5 px-1.5 text-[10px] tabular-nums"
						>
							{images.length}
						</Badge>
					)}
				</div>
				<button
					type="button"
					onClick={onClose}
					className="text-muted-foreground/40 hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			<div className="flex-1 min-h-0">
				<ScrollArea className="h-full">
					{images.length === 0 ? (
						<div className="flex flex-col items-center justify-center px-4 py-20 text-center">
							<div className="w-12 h-12 rounded-xl bg-muted/30 border border-border/20 flex items-center justify-center mb-3">
								<ImageIcon className="h-6 w-6 text-muted-foreground/25" />
							</div>
							<p className="text-[12px] text-muted-foreground/50 font-medium">
								No images yet
							</p>
							<p className="text-[11px] text-muted-foreground/30 mt-1">
								Drop or upload to start
							</p>
						</div>
					) : (
						<div className="p-2 space-y-1">
							{images.map((img) => {
								const isSelected = selectedIds.has(img.id);
								const hasConversions = img.conversions.length > 0;
								return (
									<div
										key={img.id}
										data-image-item
										onClick={() => onFocusImage(img.id)}
										className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all group ${
											isSelected
												? "bg-primary/8 ring-1 ring-primary/20"
												: "hover:bg-muted/30"
										}`}
									>
										<div
											className={`w-8 h-8 rounded border flex-shrink-0 overflow-hidden ${
												isSelected
													? "border-primary/30"
													: "border-border/30 bg-muted/20"
											}`}
										>
											<img
												src={img.previewUrl}
												alt=""
												className="w-full h-full object-cover"
											/>
										</div>
										<div className="flex-1 min-w-0">
											<span
												className={`block text-[11px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis ${
													isSelected
														? "text-foreground font-medium"
														: "text-muted-foreground"
												}`}
												style={{ maxWidth: nameWidth }}
											>
												{img.file.name}
											</span>
											<div className="flex items-center gap-1.5 mt-0.5">
												{img.originalDimensions && (
													<span className="text-[9px] text-muted-foreground/50 tabular-nums whitespace-nowrap">
														{img.originalDimensions.width}
														<span className="text-muted-foreground/30">×</span>
														{img.originalDimensions.height}
													</span>
												)}
												<span className="text-[9px] text-muted-foreground/35 whitespace-nowrap">
													{formatFileSize(img.file.size)}
												</span>
											</div>
										</div>
										<div className="flex items-center flex-shrink-0">
											{hasConversions ? (
												<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
											) : (
												<Circle className="h-3.5 w-3.5 text-muted-foreground/25" />
											)}
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													onRemoveImage(img.id);
												}}
												className="text-muted-foreground/30 hover:text-destructive transition-colors p-0.5 rounded hover:bg-destructive/10 ml-0.5"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</ScrollArea>
			</div>

			{images.length > 0 && (
				<div className="px-4 py-2.5 border-t border-border/20">
					<p className="text-[10px] text-muted-foreground/40 tabular-nums">
						{images.length} image{images.length !== 1 ? "s" : ""} ·{" "}
						{images.filter((i) => i.conversions.length > 0).length} converted
					</p>
				</div>
			)}
		</div>
	);
}
