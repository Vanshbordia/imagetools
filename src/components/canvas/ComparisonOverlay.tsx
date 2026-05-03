import type { ConversionResult } from '../../lib/imageConverter';
import type { ComparisonMode } from '../../hooks/useCanvas';

interface ComparisonOverlayProps {
  conversion: ConversionResult;
  mode: ComparisonMode;
  sliderPosition: number;
  onSliderDragStart: (e: React.MouseEvent) => void;
}

export function ComparisonOverlay({
  conversion,
  mode,
  sliderPosition,
  onSliderDragStart,
}: ComparisonOverlayProps) {
  if (mode === 'converted') {
    return (
      <div className="absolute inset-0">
        <img
          src={conversion.url}
          alt={`Converted ${conversion.format}`}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  const clipLeft = mode === 'half' ? 50 : sliderPosition;

  return (
    <>
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${clipLeft}%)` }}
      >
        <img
          src={conversion.url}
          alt={`Converted ${conversion.format}`}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-px bg-white/80 shadow-sm pointer-events-none"
        style={{ left: `${clipLeft}%` }}
      />

      {mode === 'slider' && (
        <div
          className="absolute top-0 bottom-0 z-10 cursor-ew-resize"
          style={{ left: `${clipLeft}%`, transform: 'translateX(-50%)', width: 24 }}
          onMouseDown={onSliderDragStart}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-md" />
        </div>
      )}

      <div
        className="absolute top-1.5 pointer-events-none"
        style={{ left: `${clipLeft}%`, transform: 'translateX(-50%)' }}
      >
        <div className="bg-black/50 text-white text-[9px] px-1 rounded">
          {conversion.format.toUpperCase()}
        </div>
      </div>
    </>
  );
}
