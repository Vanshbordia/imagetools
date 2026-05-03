import { useState, useCallback, useRef, useEffect } from "react";
import {
	convertToMultipleFormats,
	downloadBlob,
	type ImageFormat,
	type ConversionResult,
	type ResizeOptions,
} from "../lib/imageConverter";
import { initializeVips } from "../lib/vips";
import { useImageConverterStore } from "../lib/store";

export type ComparisonMode = "original" | "converted" | "half" | "slider";

export interface CanvasNodeState {
	imageId: string;
	x: number;
	y: number;
	displayWidth: number;
	displayHeight: number;
	comparisonMode: ComparisonMode;
	sliderPosition: number;
	selectedFormat: string;
}

interface Point {
	x: number;
	y: number;
}

interface DragState {
	type: "none" | "pan" | "node" | "select";
	startScreenX: number;
	startScreenY: number;
	startPanX: number;
	startPanY: number;
	nodeStartPositions: Record<string, { x: number; y: number }>;
	hasMoved: boolean;
}

const MAX_NODE_SIZE = 360;
const NODE_PADDING = 48;
const ZOOM_MIN = 0.05;
const ZOOM_MAX = 50;
const ZOOM_STEP = 0.15;
const CARD_HEADER_H = 30;
const CARD_FOOTER_H = 44;

const SUPPORTED_FORMATS: ImageFormat[] = [
	"webp",
	"jpeg",
	"jpg",
	"png",
	"avif",
	"tiff",
];
const RESOLUTION_PRESETS = [
	{ name: "360p", width: 640 },
	{ name: "480p", width: 854 },
	{ name: "720p", width: 1280 },
	{ name: "1080p", width: 1920 },
	{ name: "1440p", width: 2560 },
	{ name: "4K", width: 3840 },
];

export { SUPPORTED_FORMATS, RESOLUTION_PRESETS, ZOOM_MIN, ZOOM_MAX };

function calcDisplaySize(origW: number, origH: number) {
	let dw = Math.min(origW, MAX_NODE_SIZE);
	let dh = dw * (origH / origW);
	if (dh > MAX_NODE_SIZE) {
		dh = MAX_NODE_SIZE;
		dw = dh * (origW / origH);
	}
	return { displayWidth: Math.round(dw), displayHeight: Math.round(dh) };
}

function getFullCardHeight(displayHeight: number) {
	return CARD_HEADER_H + displayHeight + CARD_FOOTER_H;
}

function getContentBounds(
	nodes: CanvasNodeState[],

) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const n of nodes) {
		const fullH = getFullCardHeight(n.displayHeight);
		if (n.x < minX) minX = n.x;
		if (n.y < minY) minY = n.y;
		if (n.x + n.displayWidth > maxX) maxX = n.x + n.displayWidth;
		if (n.y + fullH > maxY) maxY = n.y + fullH;
	}
	return {
		minX,
		minY,
		maxX,
		maxY,
		contentW: maxX - minX,
		contentH: maxY - minY,
	};
}

export function useCanvas() {
	const store = useImageConverterStore();

	const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [nodeStates, setNodeStates] = useState<Record<string, CanvasNodeState>>(
		{},
	);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [selectionBox, setSelectionBox] = useState<{
		startX: number;
		startY: number;
		endX: number;
		endY: number;
	} | null>(null);
	const [spaceHeld, setSpaceHeld] = useState(false);
	const [converting, setConverting] = useState(false);
	const [leftPanelOpen, setLeftPanelOpen] = useState(true);
	const [rightPanelOpen, setRightPanelOpen] = useState(false);
	const [conversionError, setConversionError] = useState<string | null>(null);

	const dragRef = useRef<DragState>({
		type: "none",
		startScreenX: 0,
		startScreenY: 0,
		startPanX: 0,
		startPanY: 0,
		nodeStartPositions: {},
		hasMoved: false,
	});
	const containerRef = useRef<HTMLDivElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		let cancelled = false;
		console.log("[useCanvas] Initializing VIPS...");
		initializeVips()
			.then(() => {
				if (!cancelled) {
					console.log("[useCanvas] VIPS ready");
					store.setVipsReady(true);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					console.error("[useCanvas] VIPS init failed:", err);
					store.setVipsReady(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const screenToCanvas = useCallback(
		(screenX: number, screenY: number): Point => {
			if (!containerRef.current) return { x: screenX, y: screenY };
			const rect = containerRef.current.getBoundingClientRect();
			return {
				x: (screenX - rect.left - pan.x) / zoom,
				y: (screenY - rect.top - pan.y) / zoom,
			};
		},
		[pan, zoom],
	);

	useEffect(() => {
		const onDown = (e: KeyboardEvent) => {
			if (
				e.code === "Space" &&
				!(
					e.target instanceof HTMLInputElement ||
					e.target instanceof HTMLSelectElement
				)
			) {
				e.preventDefault();
				setSpaceHeld(true);
			}
		};
		const onUp = (e: KeyboardEvent) => {
			if (e.code === "Space") setSpaceHeld(false);
		};
		window.addEventListener("keydown", onDown);
		window.addEventListener("keyup", onUp);
		return () => {
			window.removeEventListener("keydown", onDown);
			window.removeEventListener("keyup", onUp);
		};
	}, []);

	useEffect(() => {
		const onWheel = (e: WheelEvent) => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			if (
				e.clientX < rect.left ||
				e.clientX > rect.right ||
				e.clientY < rect.top ||
				e.clientY > rect.bottom
			)
				return;

			e.preventDefault();

			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			const isPinch = e.ctrlKey || e.metaKey;
			const factor = e.deltaY > 0
				? 1 - (isPinch ? ZOOM_STEP : ZOOM_STEP * 0.4)
				: 1 + (isPinch ? ZOOM_STEP : ZOOM_STEP * 0.4);

			setZoom((z) => {
				const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * factor));
				if (newZoom === z) return z;
				const canvasX = (mouseX - pan.x) / z;
				const canvasY = (mouseY - pan.y) / z;
				setPan({
					x: mouseX - canvasX * newZoom,
					y: mouseY - canvasY * newZoom,
				});
				return newZoom;
			});
		};
		window.addEventListener("wheel", onWheel, { passive: false });
		return () => window.removeEventListener("wheel", onWheel);
	}, [pan]);

	useEffect(() => {
		store.images.forEach((img) => {
			if (!img.originalDimensions) {
				const image = new Image();
				image.onload = () =>
					store.setOriginalDimensions(img.id, {
						width: image.width,
						height: image.height,
					});
				image.src = img.previewUrl;
			}
		});
	}, [store.images]);

	useEffect(() => {
		const existingIds = new Set(Object.keys(nodeStates));
		let added = false;
		const next = { ...nodeStates };

		const colCount = 3;
		const rowHeights: number[] = [];

		store.images.forEach((img, i) => {
			if (!existingIds.has(img.id) && img.originalDimensions) {
				const { displayWidth, displayHeight } = calcDisplaySize(
					img.originalDimensions.width,
					img.originalDimensions.height,
				);
				const col = i % colCount;
				const row = Math.floor(i / colCount);
				const fullH = getFullCardHeight(displayHeight);
				rowHeights[row] = Math.max(rowHeights[row] || 0, fullH);
				next[img.id] = {
					imageId: img.id,
					x: col * (MAX_NODE_SIZE + NODE_PADDING),
					y: 0,
					displayWidth,
					displayHeight,
					comparisonMode: "original",
					sliderPosition: 50,
					selectedFormat: img.conversions[0]?.format || "",
				};
				added = true;
			}
		});

		if (added) {
			let yAcc = 0;
			const rowYPositions: number[] = [];
			for (let r = 0; r < rowHeights.length; r++) {
				rowYPositions[r] = yAcc;
				yAcc += (rowHeights[r] || getFullCardHeight(MAX_NODE_SIZE)) + NODE_PADDING;
			}
			Object.keys(next).forEach((id) => {
				if (!existingIds.has(id)) {
					const img = store.images.find((i) => i.id === id);
					if (img) {
						const idx = store.images.indexOf(img);
						const row = Math.floor(idx / colCount);
						next[id] = { ...next[id], y: rowYPositions[row] || 0 };
					}
				}
			});
		}

		Object.keys(next).forEach((id) => {
			if (!store.images.find((img) => img.id === id)) {
				delete next[id];
				added = true;
			}
		});

		if (added) setNodeStates(next);
	}, [store.images]);

	useEffect(() => {
		if (store.images.length > 0) {
			const firstWithDims = store.images.find((img) => img.originalDimensions);
			if (
				firstWithDims &&
				Object.keys(nodeStates).length > 0 &&
				pan.x === 0 &&
				pan.y === 0
			) {
				const node = nodeStates[firstWithDims.id];
				if (node && containerRef.current) {
					const rect = containerRef.current.getBoundingClientRect();
					const fullH = getFullCardHeight(node.displayHeight);
					const fitZoom = Math.min(
						rect.width / (node.displayWidth + 80),
						rect.height / (fullH + 80),
						1,
					);
					setZoom(fitZoom);
					setPan({
						x: rect.width / 2 - (node.x + node.displayWidth / 2) * fitZoom,
						y: rect.height / 2 - (node.y + fullH / 2) * fitZoom,
					});
				}
			}
		}
	}, [store.images, nodeStates]);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (e.button === 1 || (e.button === 0 && spaceHeld)) {
				dragRef.current = {
					type: "pan",
					startScreenX: e.clientX,
					startScreenY: e.clientY,
					startPanX: pan.x,
					startPanY: pan.y,
					nodeStartPositions: {},
					hasMoved: false,
				};
				e.preventDefault();
				return;
			}

			if (e.button === 0) {
				const target = e.target as HTMLElement;
				const nodeEl = target.closest("[data-node-id]");
				if (nodeEl) {
					const imageId = nodeEl.getAttribute("data-node-id")!;
					const currentSelected = new Set(selectedIds);
					if (e.shiftKey) {
						if (currentSelected.has(imageId)) currentSelected.delete(imageId);
						else currentSelected.add(imageId);
					} else if (!currentSelected.has(imageId)) {
						currentSelected.clear();
						currentSelected.add(imageId);
					}
					setSelectedIds(currentSelected);
					if (currentSelected.size > 0) setRightPanelOpen(true);

					const positions: Record<string, { x: number; y: number }> = {};
					currentSelected.forEach((id) => {
						const ns = nodeStates[id];
						if (ns) positions[id] = { x: ns.x, y: ns.y };
					});
					dragRef.current = {
						type: "node",
						startScreenX: e.clientX,
						startScreenY: e.clientY,
						startPanX: pan.x,
						startPanY: pan.y,
						nodeStartPositions: positions,
						hasMoved: false,
					};
					return;
				}

				dragRef.current = {
					type: "select",
					startScreenX: e.clientX,
					startScreenY: e.clientY,
					startPanX: pan.x,
					startPanY: pan.y,
					nodeStartPositions: {},
					hasMoved: false,
				};
			}
		},
		[pan, selectedIds, spaceHeld, nodeStates],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const d = dragRef.current;
			if (d.type === "none") return;

			const dx = e.clientX - d.startScreenX;
			const dy = e.clientY - d.startScreenY;

			if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.hasMoved = true;

			if (d.type === "pan") {
				setPan({ x: d.startPanX + dx, y: d.startPanY + dy });
			} else if (d.type === "node") {
				const canvasDx = dx / zoom;
				const canvasDy = dy / zoom;
				setNodeStates((prev) => {
					const next = { ...prev };
					Object.entries(d.nodeStartPositions).forEach(([id, pos]) => {
						if (next[id])
							next[id] = {
								...next[id],
								x: pos.x + canvasDx,
								y: pos.y + canvasDy,
							};
					});
					return next;
				});
			} else if (d.type === "select") {
				const start = screenToCanvas(d.startScreenX, d.startScreenY);
				const end = screenToCanvas(e.clientX, e.clientY);
				setSelectionBox({
					startX: Math.min(start.x, end.x),
					startY: Math.min(start.y, end.y),
					endX: Math.max(start.x, end.x),
					endY: Math.max(start.y, end.y),
				});
			}
		},
		[zoom, screenToCanvas],
	);

	const handleMouseUp = useCallback(
		(e: React.MouseEvent) => {
			const d = dragRef.current;

			if (d.type === "select" && !d.hasMoved) {
				setSelectedIds(new Set());
			} else if (d.type === "select" && d.hasMoved && selectionBox) {
				const newSelection = new Set(e.shiftKey ? selectedIds : []);
				Object.entries(nodeStates).forEach(([id, ns]) => {
					const nodeRight = ns.x + ns.displayWidth;
					const nodeBottom = ns.y + ns.displayHeight;
					if (
						ns.x < selectionBox.endX &&
						nodeRight > selectionBox.startX &&
						ns.y < selectionBox.endY &&
						nodeBottom > selectionBox.startY
					) {
						newSelection.add(id);
					}
				});
				setSelectedIds(newSelection);
				if (newSelection.size > 0) setRightPanelOpen(true);
			}

			setSelectionBox(null);
			dragRef.current = {
				type: "none",
				startScreenX: 0,
				startScreenY: 0,
				startPanX: 0,
				startPanY: 0,
				nodeStartPositions: {},
				hasMoved: false,
			};
		},
		[selectionBox, selectedIds, nodeStates],
	);

	const handleDoubleClick = useCallback((e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		const nodeEl = target.closest("[data-node-id]");
		if (!nodeEl) {
			fileInputRef.current?.click();
		}
	}, []);

	const handleWheel = useCallback(
		(_e: React.WheelEvent) => {
		},
		[],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const files = Array.from(e.dataTransfer.files);
			files.forEach((file) => {
				if (file.type.startsWith("image/")) {
					store.addImage(file);
				}
			});
		},
		[store],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || []);
			files.forEach((file) => {
				if (file.type.startsWith("image/")) {
					store.addImage(file);
				}
			});
			if (e.target) e.target.value = "";
		},
		[store],
	);

	const toggleFormat = useCallback(
		(format: ImageFormat) => {
			const newFormats = new Set(store.selectedFormats);
			if (newFormats.has(format)) newFormats.delete(format);
			else newFormats.add(format);
			store.setSelectedFormats(newFormats);
		},
		[store],
	);

	const handleConvert = useCallback(async () => {
		const imagesToConvert =
			selectedIds.size > 0
				? store.images.filter((img) => selectedIds.has(img.id))
				: store.images;
		if (imagesToConvert.length === 0 || store.selectedFormats.size === 0)
			return;
		if (!store.vipsReady) {
			setConversionError("Image engine not ready yet. Please wait...");
			return;
		}

		setConverting(true);
		setConversionError(null);
		try {
			const resizeOptions: ResizeOptions | undefined = store.enableResize
				? { width: store.resizeWidth, maintainAspectRatio: true }
				: undefined;

			await Promise.all(
				imagesToConvert.map(async (img) => {
					const results = await convertToMultipleFormats(
						img.file,
						Array.from(store.selectedFormats),
						store.quality / 100,
						resizeOptions,
					);
					store.setConversions(img.id, results);
					setNodeStates((prev) => {
						const next = { ...prev };
						if (next[img.id]) {
							next[img.id] = {
								...next[img.id],
								comparisonMode: "half",
								selectedFormat: results[0]?.format || "",
							};
						}
						return next;
					});
				}),
			);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			console.error("Conversion error:", error);
			setConversionError(msg);
		} finally {
			setConverting(false);
		}
	}, [selectedIds, store]);

	const handleDownload = useCallback((result: ConversionResult) => {
		downloadBlob(result.blob, result.filename);
	}, []);

	const handleDownloadAll = useCallback(() => {
		const imagesToDownload =
			selectedIds.size > 0
				? store.images.filter((img) => selectedIds.has(img.id))
				: store.images;
		imagesToDownload.forEach((img) => {
			img.conversions.forEach((result, i) => {
				setTimeout(() => downloadBlob(result.blob, result.filename), i * 100);
			});
		});
	}, [selectedIds, store]);

	const handleDownloadZip = useCallback(async () => {
		const JSZip = (await import("jszip")).default;
		const zip = new JSZip();
		const imagesToDownload =
			selectedIds.size > 0
				? store.images.filter((img) => selectedIds.has(img.id))
				: store.images;
		imagesToDownload.forEach((img) => {
			img.conversions.forEach((result) => {
				zip.file(result.filename, result.blob);
			});
		});
		const zipBlob = await zip.generateAsync({ type: "blob" });
		downloadBlob(
			zipBlob,
			`converted_images_${new Date().toISOString().split("T")[0]}.zip`,
		);
	}, [selectedIds, store]);

	const removeImage = useCallback(
		(id: string) => {
			store.removeImage(id);
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		},
		[store],
	);

	const deleteSelected = useCallback(() => {
		selectedIds.forEach((id) => store.removeImage(id));
		setSelectedIds(new Set());
	}, [selectedIds, store]);

	const selectAll = useCallback(() => {
		setSelectedIds(new Set(store.images.map((img) => img.id)));
		setRightPanelOpen(true);
	}, [store.images]);

	const deselectAll = useCallback(() => {
		setSelectedIds(new Set());
	}, []);

	const focusImage = useCallback(
		(imageId: string) => {
			setSelectedIds(new Set([imageId]));
			setRightPanelOpen(true);
			const ns = nodeStates[imageId];
			store.images.find((i) => i.id === imageId);
			if (ns && containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect();
				const fullH = getFullCardHeight(ns.displayHeight);
				const pad = 60;
				const availW = rect.width - pad * 2;
				const availH = rect.height - pad * 2;
				const fitZoom = Math.min(availW / ns.displayWidth, availH / fullH, 1);
				setZoom(fitZoom);
				setPan({
					x: rect.width / 2 - (ns.x + ns.displayWidth / 2) * fitZoom,
					y: rect.height / 2 - (ns.y + fullH / 2) * fitZoom,
				});
			}
		},
		[nodeStates, store.images],
	);

	const setComparisonMode = useCallback(
		(imageId: string, mode: ComparisonMode) => {
			setNodeStates((prev) => {
				const ns = prev[imageId];
				if (!ns) return prev;
				return { ...prev, [imageId]: { ...ns, comparisonMode: mode } };
			});
		},
		[],
	);

	const setSliderPosition = useCallback((imageId: string, position: number) => {
		setNodeStates((prev) => {
			const ns = prev[imageId];
			if (!ns) return prev;
			return { ...prev, [imageId]: { ...ns, sliderPosition: position } };
		});
	}, []);

	const setSelectedFormat = useCallback((imageId: string, format: string) => {
		setNodeStates((prev) => {
			const ns = prev[imageId];
			if (!ns) return prev;
			return { ...prev, [imageId]: { ...ns, selectedFormat: format } };
		});
	}, []);

	const zoomIn = useCallback(
		() => setZoom((z) => Math.min(ZOOM_MAX, z * 1.2)),
		[],
	);
	const zoomOut = useCallback(
		() => setZoom((z) => Math.max(ZOOM_MIN, z / 1.2)),
		[],
	);
	const fitToScreen = useCallback(() => {
		if (store.images.length > 0 && containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();

			const allNodes = Object.values(nodeStates);
			if (allNodes.length === 0) return;

			const targetNodes =
				selectedIds.size > 0
					? allNodes.filter((n) => selectedIds.has(n.imageId))
					: allNodes;

			if (targetNodes.length === 0) return;
			const { minX, minY, contentW, contentH } = getContentBounds(
				targetNodes,
			);
			const padX = 60;
			const padY = 80;
			const availW = rect.width - padX * 2;
			const availH = rect.height - padY * 2;
			if (availW <= 0 || availH <= 0) return;
			const newZoom = Math.min(availW / contentW, availH / contentH);
			setZoom(newZoom);
			setPan({
				x: rect.width / 2 - (minX + contentW / 2) * newZoom,
				y: rect.height / 2 - (minY + contentH / 2) * newZoom,
			});
		} else {
			setZoom(1);
			setPan({ x: 0, y: 0 });
		}
	}, [store.images, nodeStates, selectedIds]);
	const zoomTo100 = useCallback(() => {
		setZoom(1);
		if (containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();

			const allNodes = Object.values(nodeStates);
			if (allNodes.length === 0) return;

			const targetNodes =
				selectedIds.size > 0
					? allNodes.filter((n) => selectedIds.has(n.imageId))
					: allNodes;

			if (targetNodes.length === 0) return;
			const { minX, minY, contentW, contentH } = getContentBounds(
				targetNodes,
			);
			setPan({
				x: rect.width / 2 - (minX + contentW / 2),
				y: rect.height / 2 - (minY + contentH / 2),
			});
		}
	}, [nodeStates, store.images, selectedIds]);

	const arrangeImages = useCallback(() => {
		const imagesWithDims = store.images.filter(
			(img) => img.originalDimensions && nodeStates[img.id],
		);
		if (imagesWithDims.length === 0) return;

		const n = imagesWithDims.length;
		if (!containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();

		const cardData = imagesWithDims.map((img) => {
			const ns = nodeStates[img.id];
			return {
				id: img.id,
				w: ns.displayWidth,
				h: getFullCardHeight(ns.displayHeight),
			};
		});

		const maxH = Math.max(...cardData.map((c) => c.h));
		const maxW = Math.max(...cardData.map((c) => c.w));
		const cellW = maxW + NODE_PADDING;
		const cellH = maxH + NODE_PADDING;

		const bestCols = Math.ceil(Math.sqrt(n));
		const rows = Math.ceil(n / bestCols);

		const totalGridW = bestCols * cellW - NODE_PADDING;
		const totalGridH = rows * cellH - NODE_PADDING;

		setNodeStates((prev) => {
			const next = { ...prev };
			cardData.forEach((card, i) => {
				const col = i % bestCols;
				const row = Math.floor(i / bestCols);
				const itemsInRow =
					row === rows - 1 ? n - row * bestCols : bestCols;
				const rowWidth = itemsInRow * cellW - NODE_PADDING;
				const rowStartX = -rowWidth / 2;
				const ns = next[card.id];
				if (ns) {
					const yOffset = maxH - card.h;
					next[card.id] = {
						...ns,
						x: rowStartX + col * cellW + (maxW - card.w) / 2,
						y: -totalGridH / 2 + row * cellH + yOffset,
					};
				}
			});
			return next;
		});

		const padX = 60;
		const padY = 60;
		const availW = rect.width - padX * 2;
		const availH = rect.height - padY * 2;
		if (availW > 0 && availH > 0 && totalGridW > 0 && totalGridH > 0) {
			const newZoom = Math.min(availW / totalGridW, availH / totalGridH);
			setZoom(newZoom);
			setPan({
				x: rect.width / 2,
				y: rect.height / 2,
			});
		}
	}, [store.images, nodeStates]);

	const cancelDrag = useCallback(() => {
		dragRef.current = {
			type: "none",
			startScreenX: 0,
			startScreenY: 0,
			startPanX: 0,
			startPanY: 0,
			nodeStartPositions: {},
			hasMoved: false,
		};
		setSelectionBox(null);
	}, []);

	const getCursor = useCallback(() => {
		if (dragRef.current.type === "pan") return "grabbing";
		if (spaceHeld) return "grab";
		return "default";
	}, [spaceHeld]);

	const selectedImages = store.images.filter((img) => selectedIds.has(img.id));
	const activeImage = selectedImages.length === 1 ? selectedImages[0] : null;
	const activeNodeState = activeImage ? nodeStates[activeImage.id] : null;

	return {
		containerRef,
		fileInputRef,
		pan,
		zoom,
		nodeStates,
		selectedIds,
		selectionBox,
		converting,
		conversionError,
		spaceHeld,
		leftPanelOpen,
		rightPanelOpen,
		setLeftPanelOpen,
		setRightPanelOpen,
		images: store.images,
		selectedFormats: store.selectedFormats,
		quality: store.quality,
		enableResize: store.enableResize,
		resizeWidth: store.resizeWidth,
		vipsReady: store.vipsReady,
		activeImage,
		activeNodeState,
		selectedImages,
		screenToCanvas,
		setQuality: store.setQuality,
		setEnableResize: store.setEnableResize,
		setResizeWidth: store.setResizeWidth,
		toggleFormat,
		handleConvert,
		handleDownload,
		handleDownloadAll,
		handleDownloadZip,
		deleteSelected,
		removeImage,
		selectAll,
		deselectAll,
		focusImage,
		setComparisonMode,
		setSliderPosition,
		setSelectedFormat,
		zoomIn,
		zoomOut,
		fitToScreen,
		zoomTo100,
		arrangeImages,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleDoubleClick,
		handleWheel,
		handleDrop,
		handleDragOver,
		handleFileSelect,
		cancelDrag,
		getCursor,
	};
}
