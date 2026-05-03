import { useEffect, useRef, useState, useCallback } from "react";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";
import { useCanvas } from "../hooks/useCanvas";
import { InfiniteCanvas } from "./canvas/InfiniteCanvas";
import { FloatingToolbar } from "./canvas/FloatingToolbar";
import { PropertiesPanel } from "./canvas/PropertiesPanel";
import { ImagesPanel } from "./canvas/ImagesPanel";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "./ui/resizable";

export function ImageConverter() {
	const {
		containerRef,
		fileInputRef,
		pan,
		zoom,
		nodeStates,
		selectedIds,
		selectionBox,
		converting,
		conversionError,
		images,
		selectedFormats,
		quality,
		enableResize,
		resizeWidth,
		vipsReady,
		activeImage,

		leftPanelOpen,
		rightPanelOpen,
		setLeftPanelOpen,
		setRightPanelOpen,
		setQuality,
		setEnableResize,
		setResizeWidth,
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
	} = useCanvas();

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLSelectElement
			)
				return;

			if (e.key === "Tab") {
				e.preventDefault();
				const anyOpen = leftPanelOpen || rightPanelOpen;
				setLeftPanelOpen(!anyOpen);
				setRightPanelOpen(!anyOpen);
				return;
			}

			if (e.key === "Delete" || e.key === "Backspace") {
				if (selectedIds.size > 0) {
					e.preventDefault();
					deleteSelected();
				}
			}

			if ((e.ctrlKey || e.metaKey) && e.key === "a") {
				e.preventDefault();
				selectAll();
			}

			if ((e.ctrlKey || e.metaKey) && e.key === "0") {
				e.preventDefault();
				fitToScreen();
			}

			if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
				e.preventDefault();
				zoomIn();
			}

			if ((e.ctrlKey || e.metaKey) && e.key === "-") {
				e.preventDefault();
				zoomOut();
			}

			if (e.key === "Escape") {
				deselectAll();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [
		selectedIds,
		deleteSelected,
		selectAll,
		deselectAll,
		fitToScreen,
		zoomIn,
		zoomOut,
		leftPanelOpen,
		rightPanelOpen,
		setLeftPanelOpen,
		setRightPanelOpen,
	]);

	const leftPanelRef = useRef<PanelImperativeHandle>(null);
	const rightPanelRef = useRef<PanelImperativeHandle>(null);
	const [leftPanelWidth, setLeftPanelWidth] = useState(0);

	const handleLeftResize = useCallback((size: PanelSize) => {
		setLeftPanelWidth(size.inPixels);
		if (size.asPercentage === 0) setLeftPanelOpen(false);
		else if (leftPanelOpen === false) setLeftPanelOpen(true);
	}, [leftPanelOpen]);

	const handleRightResize = useCallback((size: PanelSize) => {
		if (size.asPercentage === 0) setRightPanelOpen(false);
		else if (rightPanelOpen === false) setRightPanelOpen(true);
	}, [rightPanelOpen]);

	useEffect(() => {
		if (leftPanelOpen) {
			leftPanelRef.current?.expand();
		} else {
			leftPanelRef.current?.collapse();
		}
	}, [leftPanelOpen]);

	useEffect(() => {
		if (rightPanelOpen) {
			rightPanelRef.current?.resize("320px");
		} else {
			rightPanelRef.current?.collapse();
		}
	}, [rightPanelOpen]);

	return (
		<div className="h-screen w-screen bg-background text-foreground overflow-hidden relative">
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				onChange={handleFileSelect}
				className="hidden"
			/>

			<div className="absolute inset-0 z-0">
				<InfiniteCanvas
					containerRef={containerRef}
					pan={pan}
					zoom={zoom}
					nodeStates={nodeStates}
					selectedIds={selectedIds}
					selectionBox={selectionBox}
					images={images}
					cursor={getCursor()}
					hasImages={images.length > 0}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onDoubleClick={handleDoubleClick}
					onWheel={handleWheel}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onComparisonModeChange={setComparisonMode}
					onSliderPositionChange={setSliderPosition}
					onSelectedFormatChange={setSelectedFormat}
					onMouseLeave={cancelDrag}
				/>
			</div>

			<FloatingToolbar
				zoom={zoom}
				hasSelection={selectedIds.size > 0}
				hasImages={images.length > 0}
				leftPanelOpen={leftPanelOpen}
				rightPanelOpen={rightPanelOpen}
				onUpload={() => fileInputRef.current?.click()}
				onSelectAll={selectAll}
				onDelete={deleteSelected}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onFitToScreen={fitToScreen}
				onZoomTo100={zoomTo100}
				onArrange={arrangeImages}
				onToggleLeftPanel={() => setLeftPanelOpen(!leftPanelOpen)}
				onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
			/>

			<ResizablePanelGroup
				orientation="horizontal"
				defaultLayout={{
					"left-panel": 15,
					"center-panel": 85,
					"right-panel": 0,
				}}
				className="absolute inset-0 pointer-events-none z-10"
			>
				<ResizablePanel
					id="left-panel"
					defaultSize="15%"
					minSize="10%"
					maxSize="25%"
					collapsible
					collapsedSize="0%"
					panelRef={leftPanelRef}
					onResize={handleLeftResize}
					className="pointer-events-auto overflow-hidden"
				>
					<div className="h-full py-4 pl-3">
						<div className="h-full flex flex-col bg-background/80 backdrop-blur-2xl border border-border/40 rounded-xl shadow-2xl shadow-black/20 overflow-hidden">
							<ImagesPanel
								images={images}
								selectedIds={selectedIds}
								panelWidth={leftPanelWidth}
								onFocusImage={focusImage}
								onRemoveImage={removeImage}
								onUpload={() => fileInputRef.current?.click()}
								onClose={() => setLeftPanelOpen(false)}
							/>
						</div>
					</div>
				</ResizablePanel>

				<ResizableHandle withHandle className="pointer-events-auto bg-transparent" />

				<ResizablePanel
					id="center-panel"
					defaultSize="60%"
					minSize="5%"
					className="pointer-events-none"
				/>

				<ResizableHandle withHandle className="pointer-events-auto bg-transparent" />

				<ResizablePanel
					id="right-panel"
					defaultSize="320px"
					minSize="240px"
					maxSize="40%"
					collapsible
					collapsedSize="0%"
					panelRef={rightPanelRef}
					onResize={handleRightResize}
					className="pointer-events-auto overflow-hidden"
				>
					<div className="h-full py-4 pr-3">
						<div className="h-full flex flex-col bg-background/80 backdrop-blur-2xl border border-border/40 rounded-xl shadow-2xl shadow-black/20 overflow-hidden">
							<PropertiesPanel
								selectedIds={selectedIds}
								activeImage={activeImage}
								selectedFormats={selectedFormats}
								quality={quality}
								enableResize={enableResize}
								resizeWidth={resizeWidth}
								vipsReady={vipsReady}
								converting={converting}
								conversionError={conversionError}
								images={images}
								onToggleFormat={toggleFormat}
								onQualityChange={setQuality}
								onEnableResizeChange={setEnableResize}
								onResizeWidthChange={setResizeWidth}
								onConvert={handleConvert}
								onDownload={handleDownload}
								onDownloadAll={handleDownloadAll}
								onDownloadZip={handleDownloadZip}
								onDelete={deleteSelected}
								onClose={() => setRightPanelOpen(false)}
							/>
						</div>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
