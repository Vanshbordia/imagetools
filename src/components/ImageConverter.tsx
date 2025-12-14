import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import {
  convertToMultipleFormats,
  downloadBlob,
  formatFileSize,
  type ImageFormat,
  type ConversionResult,
  type ResizeOptions,
} from '../lib/imageConverter';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

const SUPPORTED_FORMATS: ImageFormat[] = ['webp', 'jpeg', 'jpg', 'png', 'avif', 'tiff'];

const RESOLUTION_PRESETS = [
  { name: '360p', width: 640, label: '640×360' },
  { name: '480p', width: 854, label: '854×480' },
  { name: '720p', width: 1280, label: '1280×720' },
  { name: '1080p', width: 1920, label: '1920×1080' },
  { name: '1440p', width: 2560, label: '2560×1440' },
  { name: '4K', width: 3840, label: '3840×2160' },
];

export function ImageConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [converting, setConverting] = useState(false);
  const [conversions, setConversions] = useState<ConversionResult[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<Set<ImageFormat>>(
    new Set(['webp'])
  );
  const [quality, setQuality] = useState<number>(90);
  const [enableResize, setEnableResize] = useState<boolean>(false);
  const [resizeWidth, setResizeWidth] = useState<number>(1920);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [viewingImage, setViewingImage] = useState<ConversionResult | null>(null);
  const [compareMode, setCompareMode] = useState<'slider' | 'side-by-side'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalTransformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const convertedTransformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const syncingRef = useRef(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      // Revoke previous preview URL to avoid leaks
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setConversions([]);
      
      // Get original dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setResizeWidth(Math.min(img.width, 1920)); // Default to original or 1920px
      };
      img.src = url;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setConversions([]);
      
      // Get original dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setResizeWidth(Math.min(img.width, 1920)); // Default to original or 1920px
      };
      img.src = url;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const toggleFormat = (format: ImageFormat) => {
    const newFormats = new Set(selectedFormats);
    if (newFormats.has(format)) {
      newFormats.delete(format);
    } else {
      newFormats.add(format);
    }
    setSelectedFormats(newFormats);
  };

  const handleConvert = async () => {
    if (!selectedFile || selectedFormats.size === 0) return;

    setConverting(true);
    try {
      const resizeOptions: ResizeOptions | undefined = enableResize
        ? { width: resizeWidth, maintainAspectRatio: true }
        : undefined;
      
      const results = await convertToMultipleFormats(
        selectedFile,
        Array.from(selectedFormats),
        quality / 100,
        resizeOptions
      );
      setConversions(results);
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Failed to convert image. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = (result: ConversionResult) => {
    downloadBlob(result.blob, result.filename);
  };

  const handleDownloadAll = () => {
    conversions.forEach((result) => {
      setTimeout(() => downloadBlob(result.blob, result.filename), 100);
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setConversions([]);
    setOriginalDimensions(null);
    setEnableResize(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const calculateResizedHeight = () => {
    if (!originalDimensions) return 0;
    const aspectRatio = originalDimensions.height / originalDimensions.width;
    return Math.round(resizeWidth * aspectRatio);
  };
  
  const handlePresetSelect = (presetWidth: number) => {
    if (!originalDimensions) return;
    // Allow upscaling - use preset width directly
    setResizeWidth(presetWidth);
    setEnableResize(true);
  };

  useEffect(() => {
    if (viewingImage) {
      setCompareMode('slider');
      setSliderPosition(50);
      originalTransformRef.current?.resetTransform();
      convertedTransformRef.current?.resetTransform();
    }
  }, [viewingImage]);

  const handleSyncTransforms = useCallback(
    (source: 'original' | 'converted', state: { positionX: number; positionY: number; scale: number }) => {
      if (syncingRef.current) return;
      const targetRef = source === 'original' ? convertedTransformRef.current : originalTransformRef.current;
      if (!targetRef) return;

      syncingRef.current = true;
      targetRef.setTransform(state.positionX, state.positionY, state.scale, 0);
      syncingRef.current = false;
    },
    []
  );

  const getCompressionText = (result: ConversionResult) => {
    if (!selectedFile) return null;
    const diff = selectedFile.size - result.size;
    const percentage = Math.abs((diff / selectedFile.size) * 100);
    
    if (diff > 0) {
      // File got smaller
      return { text: `${percentage.toFixed(1)}% smaller`, color: 'text-green-600' };
    } else if (diff < 0) {
      // File got larger
      return { text: `${percentage.toFixed(1)}% larger`, color: 'text-orange-600' };
    } else {
      return { text: 'Same size', color: 'text-muted-foreground' };
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-none px-6 md:px-12 lg:px-20 py-8">
        <header className="space-y-3">
          <p className="uppercase text-[13px] tracking-[0.4em] text-muted-foreground">convert • compress • resize</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">Image Tools</h1>
        </header>

        <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16 items-start">
          <div className="flex flex-col gap-10">
            {/* Settings Section */}
            <section className="border border-border/60 bg-card/60 backdrop-blur-sm p-8 space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl font-medium">1. Configure output</h2>
                <p className="text-sm text-muted-foreground">Choose formats, adjust size, and fine-tune compression.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SUPPORTED_FORMATS.map((format) => (
                  <Button
                    key={format}
                    variant={selectedFormats.has(format) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleFormat(format)}
                    className="uppercase tracking-[0.18em]"
                  >
                    {selectedFormats.has(format) && <CheckCircle2 className="h-4 w-4 mr-1" />}
                    {format}
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                {/* Resize Controls */}
                <div className="space-y-3 border border-border/60 p-5 bg-white/70">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="resize-toggle" className="text-sm font-medium">
                        Resize Image
                      </Label>
                      {originalDimensions && (
                        <p className="text-xs text-muted-foreground">
                          Original: {originalDimensions.width} × {originalDimensions.height}px
                        </p>
                      )}
                    </div>
                    <Switch
                      id="resize-toggle"
                      checked={enableResize}
                      onCheckedChange={setEnableResize}
                      disabled={!selectedFile}
                    />
                  </div>

                  {originalDimensions && (
                    <div className="space-y-3 pt-2">
                      {/* Preset Buttons */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Quick Presets</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {RESOLUTION_PRESETS.map((preset) => {
                            const willUpscale = preset.width > originalDimensions.width;
                            const isActive = enableResize && resizeWidth === preset.width;
                            return (
                              <Button
                                key={preset.name}
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handlePresetSelect(preset.width)}
                                className="text-xs h-8 relative"
                                title={willUpscale ? `${preset.label} (will upscale)` : preset.label}
                              >
                                {preset.name}
                                {willUpscale && <span className="ml-1 text-[10px] opacity-70">↑</span>}
                              </Button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground">↑ = Will upscale (may reduce quality)</p>
                      </div>

                      {/* Manual Input */}
                      {enableResize && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="resize-width" className="text-xs">
                                Width (px)
                              </Label>
                              <Input
                                id="resize-width"
                                type="number"
                                min={100}
                                max={10000}
                                value={resizeWidth}
                                onChange={(e) => setResizeWidth(Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="resize-height" className="text-xs">
                                Height (px)
                              </Label>
                              <Input
                                id="resize-height"
                                type="number"
                                value={calculateResizedHeight()}
                                disabled
                                className="h-8 bg-muted"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Aspect ratio maintained • New size: {resizeWidth} × {calculateResizedHeight()}px
                            {resizeWidth > originalDimensions.width && <span className="text-orange-600 font-medium"> (Upscaling)</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quality Controls */}
                <div className="space-y-2 border border-border/60 p-5 bg-white/70">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quality-slider">Quality / Compression</Label>
                    <span className="text-sm font-medium">{quality}%</span>
                  </div>
                  <Slider
                    id="quality-slider"
                    min={10}
                    max={100}
                    step={5}
                    value={[quality]}
                    onValueChange={(value) => setQuality(value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Smaller file (10%)</span>
                    <span>Best quality (100%)</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleConvert}
                  disabled={!selectedFile || selectedFormats.size === 0 || converting}
                  className="flex-1"
                >
                  {converting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Convert Image
                    </>
                  )}
                </Button>
              </div>
            </section>

            {/* Upload Section */}
            <section className="border border-border/60 bg-card/60 backdrop-blur-sm p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-medium">2. Add your image</h2>
                  <p className="text-sm text-muted-foreground">Supports PNG, JPG, WebP, AVIF, TIFF and more</p>
                </div>
                {selectedFile && (
                  <Button variant="secondary" size="sm" onClick={handleReset}>
                    Reset
                  </Button>
                )}
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative flex flex-col items-center justify-center gap-4 border border-dashed border-border/80 bg-muted/40 px-8 py-16 text-center transition-colors hover:border-foreground cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm uppercase tracking-[0.3em] text-muted-foreground">drop image</span>
                  <span className="text-xs text-muted-foreground">or click to browse</span>
                </div>
              </div>

              {selectedFile && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border border-border/60 bg-white px-4 py-3">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>

                  {previewUrl && (
                    <div className="border border-border/60 bg-white/80">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto max-h-[28rem] object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border border-border/60 p-5 space-y-3 bg-card/50">
                      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">original dimensions</p>
                      {originalDimensions ? (
                        <p className="text-lg font-medium">{originalDimensions.width} × {originalDimensions.height}px</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                      )}
                    </div>
                    <div className="border border-border/60 p-5 space-y-3 bg-card/50">
                      <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">current quality</p>
                      <p className="text-lg font-medium">{quality}%</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Results Section */}
          <section className="border border-border/60 bg-card/60 backdrop-blur-sm p-8 space-y-8 sticky top-0">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-medium">3. Review &amp; download</h2>
                <p className="text-sm text-muted-foreground">
                  {conversions.length > 0
                    ? `${conversions.length} format${conversions.length > 1 ? 's' : ''} ready with accurate size deltas.`
                    : 'Run a conversion to see downloads and size comparisons here.'}
                </p>
              </div>
              {conversions.length > 0 && (
                <Button onClick={handleDownloadAll} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              )}
            </div>

            {conversions.length > 0 ? (
              <Tabs defaultValue="grid" className="w-full">
                <TabsList className="mb-6 inline-flex gap-1 border-b border-border/60 bg-transparent rounded-none">
                  <TabsTrigger value="grid" className="rounded-none px-3 py-1.5 text-xs tracking-[0.24em] uppercase data-[state=active]:text-foreground">
                    Grid
                  </TabsTrigger>
                  <TabsTrigger value="list" className="rounded-none px-3 py-1.5 text-xs tracking-[0.24em] uppercase data-[state=active]:text-foreground">
                    List
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="grid" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {conversions.map((result) => (
                      <article key={result.format} className="border border-border/60 bg-white/70">
                        <div
                          className="aspect-video bg-muted relative cursor-pointer transition-opacity hover:opacity-90"
                          onClick={() => setViewingImage(result)}
                          title="Click to view full size"
                        >
                          <img
                            src={result.url}
                            alt={result.format}
                            className="w-full h-full object-contain pointer-events-none"
                            loading="lazy"
                            decoding="async"
                          />
                          <Badge className="absolute top-3 right-3 uppercase tracking-[0.18em]">
                            {result.format}
                          </Badge>
                        </div>
                        <div className="p-5 space-y-3 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Size</span>
                            <span className="text-foreground font-medium">{formatFileSize(result.size)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground text-xs">
                            <span>Dimensions</span>
                            <span className="text-foreground font-medium">{result.width} × {result.height}px</span>
                          </div>
                          {(() => {
                            const compression = getCompressionText(result);
                            return compression ? (
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Size delta</span>
                                <span className={`${compression.color} font-medium`}>{compression.text}</span>
                              </div>
                            ) : null;
                          })()}
                          <Button onClick={() => handleDownload(result)} className="w-full" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="list" className="space-y-3">
                  {conversions.map((result) => (
                    <article
                      key={result.format}
                      className="flex items-center gap-4 border border-border/60 bg-white/70 px-5 py-4 transition-colors hover:bg-muted/40"
                    >
                      <div
                        className="w-16 h-16 overflow-hidden bg-muted flex-shrink-0 cursor-pointer transition-opacity hover:opacity-90"
                        onClick={() => setViewingImage(result)}
                        title="Click to view full size"
                      >
                        <img
                          src={result.url}
                          alt={result.format}
                          className="w-full h-full object-cover pointer-events-none"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.filename}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <Badge variant="secondary" className="uppercase tracking-[0.18em]">
                            {result.format}
                          </Badge>
                          <span>{formatFileSize(result.size)}</span>
                          <span>{result.width} × {result.height}px</span>
                          {(() => {
                            const compression = getCompressionText(result);
                            return compression ? <span className={`${compression.color} font-medium`}>{compression.text}</span> : null;
                          })()}
                        </div>
                      </div>
                      <Button onClick={() => handleDownload(result)} size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </article>
                  ))}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="border border-dashed border-border/60 bg-muted/20 px-8 py-16 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Converted results will appear here after processing.
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-white">
                <h3 className="text-lg font-semibold">
                  {viewingImage.filename}
                </h3>
                <p className="text-sm text-white/70">
                  {viewingImage.width} × {viewingImage.height}px • {formatFileSize(viewingImage.size)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(viewingImage);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => setViewingImage(null)}
                  variant="secondary"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <Tabs value={compareMode} className="w-full" onValueChange={(v) => setCompareMode(v as 'slider' | 'side-by-side')}>
                <TabsList>
                  <TabsTrigger value="slider">Slider</TabsTrigger>
                  <TabsTrigger value="side-by-side">Side by side</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {compareMode === 'slider' ? (
              <div className="flex-1 min-h-0 overflow-hidden rounded-lg bg-black/50">
                <ReactCompareSlider
                  itemOne={
                    <ReactCompareSliderImage
                      src={previewUrl ?? viewingImage.url}
                      alt="original"
                      loading="lazy"
                      decoding="async"
                    />
                  }
                  itemTwo={
                    <ReactCompareSliderImage
                      src={viewingImage.url}
                      alt="converted"
                      loading="lazy"
                      decoding="async"
                    />
                  }
                  className="w-full h-full"
                  position={sliderPosition}
                  onPositionChange={(position) => {
                    if (typeof position === 'number') {
                      setSliderPosition(position);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0 gap-2">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      originalTransformRef.current?.resetTransform();
                      convertedTransformRef.current?.resetTransform();
                    }}
                  >
                    Reset View
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
                  <TransformWrapper
                    ref={originalTransformRef}
                    minScale={0.2}
                    maxScale={8}
                    initialScale={1}
                    wheel={{ step: 0.15 }}
                    doubleClick={{ disabled: true }}
                    onTransformed={(_, state) => handleSyncTransforms('original', state)}
                  >
                    <TransformComponent
                      wrapperClass="w-full h-full"
                      contentClass="w-full h-full flex items-center justify-center"
                    >
                      <img
                        src={previewUrl ?? viewingImage.url}
                        alt="original"
                        className="max-w-full max-h-full object-contain select-none"
                        decoding="async"
                      />
                    </TransformComponent>
                  </TransformWrapper>
                  <TransformWrapper
                    ref={convertedTransformRef}
                    minScale={0.2}
                    maxScale={8}
                    initialScale={1}
                    wheel={{ step: 0.15 }}
                    doubleClick={{ disabled: true }}
                    onTransformed={(_, state) => handleSyncTransforms('converted', state)}
                  >
                    <TransformComponent
                      wrapperClass="w-full h-full"
                      contentClass="w-full h-full flex items-center justify-center"
                    >
                      <img
                        src={viewingImage.url}
                        alt="converted"
                        className="max-w-full max-h-full object-contain select-none"
                        decoding="async"
                      />
                    </TransformComponent>
                  </TransformWrapper>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
