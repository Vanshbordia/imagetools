"use client"

import React, { useState, useCallback } from 'react';
import RgbQuant from 'rgbquant';
import { AlertCircle, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function Page(params: any) {
  const [image, setImage] = useState(null);
  const [palette, setPalette] = useState([]);
  const [colorCount, setColorCount] = useState(5);
  const [error, setError] = useState('');

  const extractColors = useCallback((imageData, pixelCount) => {
    const pixels = [];
    for (let i = 0; i < pixelCount; i += 4) {
      pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
    }

    const q = new RgbQuant({ colors: colorCount });
    q.sample(pixels);
    const colorMap = q.palette();
    return colorMap.map(color => [color[0], color[1], color[2]]); // Ensure it returns RGB array
  }, [colorCount]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const extractedColors = extractColors(imageData, imageData.length);
          setPalette(extractedColors);
          setImage(e.target.result);
          setError('');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please upload a valid image file.');
    }
  };

  const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [
      Math.round(h * 360),
      Math.round(s * 100),
      Math.round(l * 100)
    ];
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 p-4 flex flex-col">
        <Label htmlFor="image-upload" className="mb-2">Upload Image</Label>
        <Input id="image-upload" type="file" onChange={handleImageUpload} className="mb-4" />
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {image && (
          <div className="flex-grow flex items-center justify-center">
            <img src={image} alt="Uploaded" className="max-w-full max-h-full object-contain" />
          </div>
        )}
      </div>
      <div className="w-1/2 p-4 flex flex-col">
        <Label htmlFor="color-count" className="mb-2">Number of Colors</Label>
        <Slider
          id="color-count"
          min={1}
          max={10}
          step={1}
          value={[colorCount]}
          onValueChange={(value) => setColorCount(value[0])}
          className="mb-4"
        />
        <div className="flex-grow overflow-y-auto">
          {palette.map((color, index) => (
            <div key={index} className="flex items-center mb-4">
              <div
                className="w-16 h-16 mr-4"
                style={{ backgroundColor: `rgb(${color.join(',')})` }}
              ></div>
              <div>
                <p>RGB: {color.join(', ')}</p>
                <p>HEX: {rgbToHex(...color)}</p>
                <p>HSL: {rgbToHsl(...color).join(', ')}</p>
                <div className="flex space-x-2 mt-2">
                  <Button size="sm" onClick={() => copyToClipboard(`rgb(${color.join(',')})`)}>Copy RGB</Button>
                  <Button size="sm" onClick={() => copyToClipboard(rgbToHex(...color))}>Copy HEX</Button>
                  <Button size="sm" onClick={() => copyToClipboard(`hsl(${rgbToHsl(...color).join(',')})`)}>Copy HSL</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

