"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Camera, Download } from "lucide-react";

export default function Page(params:type) {
  

const [selectedFiles, setSelectedFiles] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [removeBackground, setRemoveBackground] = useState(null);

  useEffect(() => {
    const loadBackgroundRemoval = async () => {
      try {
        const module = await import('@imgly/background-removal');
        setRemoveBackground(() => module.removeBackground);
      } catch (err) {
        console.error("Failed to load @imgly/background-removal:", err);
        setError("Failed to load background removal tool. Please try again later.");
      }
    };

    loadBackgroundRemoval();
  }, []);

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    setError(null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    setError(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleRemoveBackground = async () => {
    if (selectedFiles.length === 0 || !removeBackground) return;

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

  const handleDownload = (imageUrl, index) => {
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `processed_image_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  return (
    <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto p-4 gap-8">
      <div className="flex flex-col gap-4 md:w-1/3 md:sticky md:top-4 md:self-start">
        <h1 className="text-2xl font-bold">Image Background Remover</h1>
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
        <Button
          onClick={handleRemoveBackground}
          disabled={selectedFiles.length === 0 || isProcessing || !removeBackground}
          className="w-full"
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
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
      <div className="flex flex-col gap-4 md:w-2/3">
        {selectedFiles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Original Images:</h2>
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
        {processedImages.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Processed Images:</h2>
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
        )}
      </div>
    </div>
  );
};


