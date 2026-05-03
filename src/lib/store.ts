import { create } from 'zustand';
import type { ConversionResult, ImageFormat } from './imageConverter';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  originalDimensions: { width: number; height: number } | null;
  conversions: ConversionResult[];
}

interface ImageConverterState {
  images: ImageItem[];
  activeImageId: string | null;
  converting: boolean;
  selectedFormats: Set<ImageFormat>;
  quality: number;
  enableResize: boolean;
  resizeWidth: number;
  vipsReady: boolean;
  addImage: (file: File) => void;
  removeImage: (id: string) => void;
  setActiveImage: (id: string) => void;
  setConverting: (converting: boolean) => void;
  setConversions: (id: string, conversions: ConversionResult[]) => void;
  setSelectedFormats: (formats: Set<ImageFormat>) => void;
  setQuality: (quality: number) => void;
  setEnableResize: (enable: boolean) => void;
  setResizeWidth: (width: number) => void;
  setOriginalDimensions: (id: string, dims: { width: number; height: number }) => void;
  setVipsReady: (ready: boolean) => void;
  clearAll: () => void;
}

export const useImageConverterStore = create<ImageConverterState>((set) => ({
  images: [],
  activeImageId: null,
  converting: false,
  selectedFormats: new Set(['webp']),
  quality: 90,
  enableResize: false,
  resizeWidth: 1920,
  vipsReady: false,
  addImage: (file) => set((state) => {
    const id = `${file.name}-${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    const newImage: ImageItem = {
      id,
      file,
      previewUrl,
      originalDimensions: null,
      conversions: [],
    };
    return {
      images: [...state.images, newImage],
      activeImageId: state.activeImageId || id,
    };
  }),
  removeImage: (id) => set((state) => {
    const image = state.images.find(img => img.id === id);
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
    }
    const newImages = state.images.filter(img => img.id !== id);
    const newActiveId = state.activeImageId === id
      ? (newImages.length > 0 ? newImages[0].id : null)
      : state.activeImageId;
    return {
      images: newImages,
      activeImageId: newActiveId,
    };
  }),
  setActiveImage: (id) => set({ activeImageId: id }),
  setConverting: (converting) => set({ converting }),
  setConversions: (id, conversions) => set((state) => ({
    images: state.images.map(img =>
      img.id === id ? { ...img, conversions } : img
    ),
  })),
  setSelectedFormats: (formats) => set({ selectedFormats: formats }),
  setQuality: (quality) => set({ quality }),
  setEnableResize: (enable) => set({ enableResize: enable }),
  setResizeWidth: (width) => set({ resizeWidth: width }),
  setOriginalDimensions: (id, dims) => set((state) => ({
    images: state.images.map(img =>
      img.id === id ? { ...img, originalDimensions: dims } : img
    ),
  })),
  setVipsReady: (ready) => set({ vipsReady: ready }),
  clearAll: () => set((state) => {
    state.images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    return {
      images: [],
      activeImageId: null,
      converting: false,
    };
  }),
}));