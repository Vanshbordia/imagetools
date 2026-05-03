import { Image as ImageIcon, X } from 'lucide-react';
import type { ConversionResult } from '../../lib/imageConverter';

interface LayersPanelProps {
  isOpen: boolean;
  images: {
    id: string;
    previewUrl: string;
    file: { name: string; size: number };
    originalDimensions: { width: number; height: number } | null;
    conversions: ConversionResult[];
  }[];
  selectedIds: Set<string>;
  onFocusImage: (id: string) => void;
  onRemoveImage: (id: string) => void;
  onClose: () => void;
}

export function LayersPanel({
  isOpen, images, selectedIds, onFocusImage, onRemoveImage, onClose,
}: LayersPanelProps) {
  return (
    <div
      className={`
        absolute top-3 left-3 bottom-3 z-30 w-52
        bg-background/90 backdrop-blur-2xl border border-border/50
        rounded-xl shadow-2xl shadow-black/30
        transition-all duration-200 ease-out
        flex flex-col overflow-hidden
        ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
      `}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Layers</span>
        <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted/50">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {images.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <ImageIcon className="h-6 w-6 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-[10px] text-muted-foreground/50">No images yet</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {images.map((img) => {
              const isSelected = selectedIds.has(img.id);
              const hasConversions = img.conversions.length > 0;
              return (
                <div
                  key={img.id}
                  onClick={() => onFocusImage(img.id)}
                  className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group
                    ${isSelected
                      ? 'bg-primary/10 ring-1 ring-primary/25'
                      : 'hover:bg-muted/40'
                    }
                  `}
                >
                  <div className="w-7 h-7 rounded-md bg-muted/40 border border-border/20 flex-shrink-0 overflow-hidden">
                    <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] truncate leading-tight ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {img.file.name}
                    </p>
                    <div className="flex items-center gap-1">
                      {img.originalDimensions && (
                        <span className="text-[8px] text-muted-foreground/40 tabular-nums">
                          {img.originalDimensions.width}×{img.originalDimensions.height}
                        </span>
                      )}
                      {hasConversions && (
                        <span className="text-[8px] text-emerald-500/70 font-medium">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveImage(img.id); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive transition-all p-0.5 rounded"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="px-3 py-2 border-t border-border/20">
          <p className="text-[8px] text-muted-foreground/30">{images.length} layer{images.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  );
}
