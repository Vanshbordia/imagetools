import {
	X,
	Loader2,
	Download,
	CheckCircle2,
	AlertCircle,
	Sparkles,
	ArrowDownToLine,
	FileArchive,
	Ruler,
	Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { SUPPORTED_FORMATS, RESOLUTION_PRESETS } from "../../hooks/useCanvas";
import {
	formatFileSize,
	type ConversionResult,
	type ImageFormat,
} from "../../lib/imageConverter";

interface PropertiesPanelProps {
	selectedIds: Set<string>;
	activeImage: {
		id: string;
		file: { name: string; size: number };
		previewUrl: string;
		originalDimensions: { width: number; height: number } | null;
		conversions: ConversionResult[];
	} | null;
	selectedFormats: Set<ImageFormat>;
	quality: number;
	enableResize: boolean;
	resizeWidth: number;
	vipsReady: boolean;
	converting: boolean;
	conversionError: string | null;
	images: {
		id: string;
		file: { name: string };
		conversions: ConversionResult[];
	}[];
	onToggleFormat: (format: ImageFormat) => void;
	onQualityChange: (quality: number) => void;
	onEnableResizeChange: (enable: boolean) => void;
	onResizeWidthChange: (width: number) => void;
	onConvert: () => void;
	onDownload: (result: ConversionResult) => void;
	onDownloadAll: () => void;
	onDownloadZip: () => void;
	onDelete: () => void;
	onClose: () => void;
}

function getCompressionInfo(result: ConversionResult, originalSize: number) {
	const diff = originalSize - result.size;
	const percentage = Math.abs((diff / originalSize) * 100);
	if (diff > 0)
		return {
			text: `${percentage.toFixed(1)}% smaller`,
			color: "text-emerald-500",
		};
	if (diff < 0)
		return {
			text: `${percentage.toFixed(1)}% larger`,
			color: "text-amber-500",
		};
	return { text: "Same size", color: "text-muted-foreground" };
}

export function PropertiesPanel({
	selectedIds,
	activeImage,
	selectedFormats,
	quality,
	enableResize,
	resizeWidth,
	vipsReady,
	converting,
	conversionError,
	images,
	onToggleFormat,
	onQualityChange,
	onEnableResizeChange,
	onResizeWidthChange,
	onConvert,
	onDownload,
	onDownloadAll,
	onDownloadZip,
	onDelete,
	onClose,
}: PropertiesPanelProps) {
	const totalConversions = images
		.filter((img) => selectedIds.has(img.id))
		.reduce((sum, img) => sum + img.conversions.length, 0);

	const hasSelection = selectedIds.size > 0;

	return (
		<div className="h-full flex flex-col">
			<div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
				<span className="text-[13px] font-semibold text-foreground/80">
					Convert
				</span>
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
					{!hasSelection ? (
						<div className="flex flex-col items-center justify-center h-full px-4 text-center min-h-[300px]">
							<div className="w-12 h-12 rounded-xl bg-muted/30 border border-border/20 flex items-center justify-center mb-3">
								<Sparkles className="h-6 w-6 text-muted-foreground/25" />
							</div>
							<p className="text-[12px] text-muted-foreground/50 font-medium">
								No selection
							</p>
							<p className="text-[11px] text-muted-foreground/30 mt-1">
								Select an image to convert
							</p>
						</div>
					) : (
						<div className="p-4 space-y-5">
						{selectedIds.size > 1 ? (
							<div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/20 border border-border/15">
								<Badge
									variant="secondary"
									className="h-6 text-[11px] font-semibold px-2"
								>
									{selectedIds.size}
								</Badge>
								<span className="text-[12px] text-muted-foreground">
									images selected
								</span>
							</div>
						) : (
							activeImage && (
								<div className="flex items-center gap-3.5">
									<div className="w-12 h-12 rounded-lg border border-border/25 overflow-hidden flex-shrink-0 bg-muted/15">
										<img
											src={activeImage.previewUrl}
											alt=""
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-[12px] font-medium text-foreground truncate">
											{activeImage.file.name}
										</p>
										{activeImage.originalDimensions && (
											<p className="text-[11px] text-muted-foreground/60 tabular-nums mt-0.5">
												{activeImage.originalDimensions.width}×
												{activeImage.originalDimensions.height} ·{" "}
												{formatFileSize(activeImage.file.size)}
											</p>
										)}
									</div>
								</div>
							)
						)}

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-[12px] font-medium text-foreground/70">
									Output Format
								</span>
								{selectedFormats.size > 0 && (
									<span className="text-[10px] text-muted-foreground/40 tabular-nums">
										{selectedFormats.size} selected
									</span>
								)}
							</div>
							<div className="grid grid-cols-3 gap-1.5">
								{SUPPORTED_FORMATS.map((format) => {
									const active = selectedFormats.has(format);
									return (
										<button
											type="button"
											key={format}
											onClick={() => onToggleFormat(format)}
											className={`
                        flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-[11px] font-semibold uppercase
                        transition-all border
                        ${
													active
														? "bg-primary text-primary-foreground border-primary shadow-sm"
														: "bg-muted/15 text-muted-foreground/70 border-border/25 hover:bg-muted/30 hover:text-foreground/80"
												}
                      `}
										>
											{active && <CheckCircle2 className="h-3 w-3" />}
											{format}
										</button>
									);
								})}
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-[12px] font-medium text-foreground/70">
									Quality
								</span>
								<span className="text-[11px] font-mono font-medium text-foreground/50 bg-muted/20 px-2 py-0.5 rounded">
									{quality}%
								</span>
							</div>
							<Slider
								min={10}
								max={100}
								step={5}
								value={[quality]}
								onValueChange={(v) => onQualityChange(v[0])}
							/>
							<div className="flex justify-between">
								<span className="text-[10px] text-muted-foreground/30">
									Smaller file
								</span>
								<span className="text-[10px] text-muted-foreground/30">
									Better quality
								</span>
							</div>
						</div>

						<div className="rounded-lg border border-border/25 bg-muted/8 p-3.5 space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Ruler className="h-4 w-4 text-muted-foreground/50" />
									<span className="text-[12px] font-medium text-foreground/70">
										Resize
									</span>
								</div>
								<Switch
									checked={enableResize}
									onCheckedChange={onEnableResizeChange}
								/>
							</div>
							{enableResize && (
								<div className="space-y-2.5">
									<div className="grid grid-cols-3 gap-1">
										{RESOLUTION_PRESETS.map((preset) => (
											<button
												type="button"
												key={preset.name}
												onClick={() => {
													onResizeWidthChange(preset.width);
													onEnableResizeChange(true);
												}}
												className={`
                          px-1 py-2 rounded-md text-[10px] font-semibold border transition-all
                          ${
														resizeWidth === preset.width
															? "bg-primary text-primary-foreground border-primary"
															: "bg-muted/15 text-muted-foreground/60 border-border/25 hover:bg-muted/30"
													}
                        `}
											>
												{preset.name}
											</button>
										))}
									</div>
									<div className="flex items-center gap-2">
										<Input
											type="number"
											min={100}
											max={10000}
											value={resizeWidth}
											onChange={(e) =>
												onResizeWidthChange(Number(e.target.value))
											}
											className="h-8 text-[12px] flex-1"
										/>
										<span className="text-[10px] text-muted-foreground/40 flex-shrink-0">
											px wide
										</span>
									</div>
								</div>
							)}
						</div>

						<Button
							onClick={onConvert}
							disabled={selectedFormats.size === 0 || converting || !vipsReady}
							className="w-full h-10 text-[12px] font-semibold gap-2"
							size="sm"
						>
							{converting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Converting...
								</>
							) : !vipsReady ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Loading engine...
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4" />
									Convert{" "}
									{selectedIds.size > 1 ? `${selectedIds.size} images` : ""}
								</>
							)}
						</Button>

						{conversionError && (
							<div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/8 border border-destructive/15">
								<AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
								<p className="text-[11px] text-destructive leading-relaxed">
									{conversionError}
								</p>
							</div>
						)}

						{totalConversions > 0 && (
							<div className="space-y-4">
								<Separator className="opacity-40" />

								<div className="flex items-center justify-between">
									<span className="text-[12px] font-medium text-foreground/70">
										Results
									</span>
									<Badge
										variant="secondary"
										className="text-[10px] h-5 px-2 tabular-nums"
									>
										{totalConversions}
									</Badge>
								</div>

								{activeImage &&
									activeImage.conversions.length > 0 &&
									selectedIds.size === 1 && (
										<div className="space-y-2">
											{activeImage.conversions.map((result) => {
												const comp = getCompressionInfo(
													result,
													activeImage.file.size,
												);
												return (
													<div
														key={result.format}
														className="flex items-center gap-3 p-2.5 rounded-lg border border-border/20 bg-muted/8"
													>
														<Badge
															variant="outline"
															className="text-[10px] uppercase font-bold h-6 px-2"
														>
															{result.format}
														</Badge>
														<div className="min-w-0 flex-1">
															<p className="text-[11px] text-foreground/70 tabular-nums">
																{formatFileSize(result.size)}
															</p>
															<p
																className={`text-[10px] font-medium ${comp.color}`}
															>
																{comp.text}
															</p>
														</div>
														<Button
															size="sm"
															variant="ghost"
															onClick={() => onDownload(result)}
															className="h-7 w-7 p-0 flex-shrink-0 hover:bg-muted/50"
														>
															<Download className="h-3.5 w-3.5" />
														</Button>
													</div>
												);
											})}
										</div>
									)}

								<div className="grid grid-cols-2 gap-2">
									<Button
										onClick={onDownloadAll}
										variant="outline"
										size="sm"
										className="h-8 text-[11px] gap-1.5 font-medium"
									>
										<ArrowDownToLine className="h-3.5 w-3.5" />
										Download All
									</Button>
									<Button
										onClick={onDownloadZip}
										size="sm"
										className="h-8 text-[11px] gap-1.5 font-medium"
									>
										<FileArchive className="h-3.5 w-3.5" />
										Export ZIP
									</Button>
								</div>
							</div>
						)}

						<Separator className="opacity-30" />

						<Button
							onClick={onDelete}
							variant="outline"
							size="sm"
							className="w-full h-8 text-[11px] gap-2 text-destructive/70 hover:text-destructive hover:bg-destructive/8 hover:border-destructive/20 font-medium"
						>
							<Trash2 className="h-3.5 w-3.5" />
							Delete
						</Button>
					</div>
				)}
				</ScrollArea>
			</div>
		</div>
	);
}
