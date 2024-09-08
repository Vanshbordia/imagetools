"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Camera, Download, X } from "lucide-react";
import { removeBackground } from '@imgly/background-removal';

export default function Page() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
      setError(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    setError(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleRemoveBackground = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setProcessedImages([]);

    try {
      const processedResults = await Promise.all(
        selectedFiles.map(async (file) => {
          const result = await removeBackground(file);
          return URL.createObjectURL(result);
        })
      );
      setProcessedImages(processedResults);
    } catch (error) {
      console.error('Background removal failed:', error);
      setError("Failed to process one or more images. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const originalFileName = selectedFiles[index].name;
    const fileExtension = originalFileName.split('.').pop();
    const newFileName = `${originalFileName.replace(`.${fileExtension}`, '')}_removedbg.png`;

    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = newFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-1/3 p-6 overflow-y-auto sticky top-0 h-screen">
        <h1 className="text-2xl font-bold mb-6">Image Background Remover</h1>
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
              <p className="text-sm text-gray-500">You can select multiple images</p>
            </Label>
          </div>
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Selected Files:</h3>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex justify-between items-center mb-1">
                <span>{file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleRemoveBackground}
          disabled={selectedFiles.length === 0 || isProcessing || !removeBackground}
          className="w-full mb-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Remove Background
            </>
          )}
        </Button>
        
        {processedImages.length > 0 && (
          <Button onClick={() => processedImages.forEach((image, index) => handleDownload(image, index))} className="w-full" variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download All
          </Button>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
      
      <div className="w-2/3 p-6 overflow-y-auto h-screen">
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Original Images:</h2>
            <div className="grid grid-cols-2 gap-4">
              {selectedFiles.map((file, index) => (
                <img
                  key={`original-${index}`}
                  src={URL.createObjectURL(file)}
                  alt={`Original ${index + 1}`}
                  className="max-w-full h-auto"
                />
              ))}
            </div>
          </div>
        )}
        {processedImages.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold mb-2">Processed Images:</h2>
            <div className="grid grid-cols-2 gap-4">
              {processedImages.map((image, index) => (
                <div key={`processed-${index}`} className="relative">
                  <img
                    src={image}
                    alt={`Processed ${index + 1}`}
                    className="max-w-full h-auto"
                  />
                  <Button
                    onClick={() => handleDownload(image, index)}
                    className="absolute top-2 right-2 p-2"
                    size="icon"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
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

