"use client"

import React, { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Camera, X, Download } from "lucide-react"

type ProcessedImage = {
  original: File;
  processed: string;
  size: number;
  width: number;
  height: number;
};
type CompressionOptions = {
  maxSizeMB: number;
  maxWidthOrHeight?: number;
  useWebWorker: boolean;
  fileType?: string;
  quality?: number;
};
export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState<string>('jpeg');
  const [compressionLevel, setCompressionLevel] = useState<number>(80);
  const [width, setWidth] = useState<number | null>(null);
  const [resizeEnabled, setResizeEnabled] = useState<boolean>(false);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [maxFileSize, setMaxFileSize] = useState<number>(102400); // 1MB default

  const resolutionPresets: Record<string, number | 'original'> = {
    'Original': 'original',
    'HD (720p)': 720,
    'Full HD (1080p)': 1080,
    'QHD (1440p)': 1440,
    '4K (2160p)': 2160,
  };

  const outputFormats = [
    'jpg', 'jpeg', 'png', 'webp'
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file): file is File => file instanceof File);
    setSelectedFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handlePresetChange = (value: string) => {
    if (value === 'original') {
      setResizeEnabled(false);
      setWidth(null);
    } else {
      setResizeEnabled(true);
      setWidth(parseInt(value));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const processImages = async () => {
    const processedImagesPromises = selectedFiles.map(async (file) => {
      const options: CompressionOptions = {
        maxSizeMB: maxFileSize / 1024,
        maxWidthOrHeight: resizeEnabled && width ? width : undefined,
        useWebWorker: true,
        fileType: `image/${outputFormat}`,
        quality: compressionLevel / 100,
      };

      try {
        const compressedFile = await imageCompression(file, options);
        const processedImageUrl = URL.createObjectURL(compressedFile);
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = processedImageUrl;
        });

        return {
          original: file,
          processed: processedImageUrl,
          size: compressedFile.size,
          width: img.width,
          height: img.height
        };
      } catch (error) {
        console.error('Error processing image:', error);
        return null;
      }
    });

    const results = await Promise.all(processedImagesPromises);
    setProcessedImages(results.filter((result): result is ProcessedImage => result !== null));
  };
  const downloadAll = () => {
    processedImages.forEach((image) => {
      const link = document.createElement('a');
      link.href = image.processed;
      link.download = `${image.original.name.split('.')[0]}_${image.width}x${image.height}.${outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-1/3 p-6 overflow-y-auto sticky top-0 h-screen">
        <h1 className="text-2xl font-bold mb-6">Image Processor</h1>
        
        <div className="mb-4">
          <Label htmlFor="image-upload">Upload Images</Label>
          <div 
            className="border-2 border-dashed border-gray-300 p-4 text-center cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Input 
              id="image-upload" 
              type="file" 
              onChange={handleFileChange} 
              accept="image/*"
              multiple
              className="hidden"
            />
            <Label htmlFor="image-upload" className="cursor-pointer">
              <Camera className="mx-auto text-gray-400" />
              <p>Click to upload or drag and drop</p>
            </Label>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Selected Files:</h3>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex justify-between items-center mb-1">
                <span>{file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="mb-4">
          <Label htmlFor="output-format">Output Format</Label>
          <Select onValueChange={setOutputFormat} defaultValue={outputFormat}>
            <SelectTrigger id="output-format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {outputFormats.map(format => (
                <SelectItem key={format} value={format}>{format.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="mb-4">
          <Label htmlFor="compression">Compression Level: {compressionLevel}%</Label>
          <Slider
            id="compression"
            min={0}
            max={100}
            step={1}
            value={[compressionLevel]}
            onValueChange={(value) => setCompressionLevel(value[0])}
          />
        </div>
        
        <div className="mb-4 flex items-center space-x-2">
          <Switch
            id="resize-switch"
            checked={resizeEnabled}
            onCheckedChange={setResizeEnabled}
          />
          <Label htmlFor="resize-switch">Enable Resizing</Label>
        </div>
        
        {resizeEnabled && (
          <>
            <div className="mb-4">
              <Label htmlFor="preset">Preset Resolutions</Label>
              <Select onValueChange={handlePresetChange}>
                <SelectTrigger id="preset">
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(resolutionPresets).map(([name, value]) => (
                    <SelectItem key={name} value={value.toString()}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="width">Width: {width || 'Original'}</Label>
              <Slider
                id="width"
                min={50}
                max={3840}
                step={10}
                value={[width || 0]}
                onValueChange={(value) => setWidth(value[0])}
                disabled={!resizeEnabled}
              />
            </div>
          </>
        )}

        <div className="mb-4">
          <Label htmlFor="max-size">Max File Size (KB): {maxFileSize}</Label>
          <Slider
            id="max-size"
            min={100}
            max={10240}
            step={100}
            value={[maxFileSize]}
            onValueChange={(value) => setMaxFileSize(value[0])}
          />
        </div>
        
        <Button onClick={processImages} className="w-full mb-2" disabled={selectedFiles.length === 0}>
          Process Images
        </Button>

        {processedImages.length > 0 && (
          <Button onClick={downloadAll} className="w-full" variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download All
          </Button>
        )}
      </div>
      
      <div className="w-2/3 p-6 overflow-y-auto h-screen">
        {processedImages.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold mb-2">Processed Images</h2>
            {processedImages.map((image, index) => (
              <div key={index} className="mb-4">
                <img src={image.processed} alt={`Processed ${index}`} className="max-w-full h-auto mb-2" />
                <div className="flex justify-between items-center">
                  <span>Size: {(image.size / 1024).toFixed(2)} KB | Dimensions: {image.width}x{image.height}</span>
                  <a href={image.processed} download={`${image.original.name.split('.')[0]}_${image.width}x${image.height}.${outputFormat}`}>
                    <Button variant="outline">Download</Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Processed images will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};


