
import { X, ZoomIn, ZoomOut, Download, Share, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageModalHeaderProps {
  visitorId: string;
  currentIndex: number;
  totalVisitors: number;
  canNavigate: boolean;
  zoom: number;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownload: () => void;
  onShare: () => void;
  onClose: () => void;
}

export const ImageModalHeader = ({
  visitorId,
  currentIndex,
  totalVisitors,
  canNavigate,
  zoom,
  onNavigatePrev,
  onNavigateNext,
  onZoomIn,
  onZoomOut,
  onDownload,
  onShare,
  onClose,
}: ImageModalHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-foreground">
          Visitor {visitorId}
        </h2>
        {canNavigate && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{currentIndex + 1} of {totalVisitors}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Navigation buttons */}
        {canNavigate && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigatePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateNext}
              disabled={currentIndex === totalVisitors - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
        
        {/* Zoom controls */}
        <Button variant="ghost" size="sm" onClick={onZoomOut} disabled={zoom <= 0.5}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-2">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={onZoomIn} disabled={zoom >= 3}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        
        {/* Action buttons */}
        <Button variant="ghost" size="sm" onClick={onDownload}>
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onShare}>
          <Share className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
