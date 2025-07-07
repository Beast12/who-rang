import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisitorEvent } from '@/types/visitor';
import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/utils/imageUtils';
import { ImageModalHeader } from './ImageModalHeader';
import { ImageViewer } from './ImageViewer';
import { VisitorDetails } from './VisitorDetails';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: VisitorEvent;
  visitors?: VisitorEvent[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export const ImageModal = ({
  isOpen,
  onClose,
  visitor,
  visitors = [],
  currentIndex = 0,
  onNavigate,
}: ImageModalProps) => {
  const [zoom, setZoom] = useState(1);
  const imageUrl = getImageUrl(visitor.image_url);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `visitor-${visitor.visitor_id}-${new Date(visitor.timestamp).getTime()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Download started',
        description: 'Image download has been initiated.',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not download the image.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = () => {
    const shareData = {
      title: `Visitor ${visitor.visitor_id}`,
      text: visitor.ai_message,
      url: imageUrl,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(
        `${shareData.title}: ${shareData.text}\n${shareData.url}`
      );
      toast({
        title: 'Copied to clipboard',
        description: 'Visitor details have been copied to clipboard.',
      });
    }
  };

  const handleNavigatePrev = () => {
    onNavigate?.('prev');
  };

  const handleNavigateNext = () => {
    onNavigate?.('next');
  };

  const canNavigate = visitors.length > 1 && Boolean(onNavigate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] bg-background border border-border p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          Visitor Image - {visitor.visitor_id}
        </DialogTitle>

        <ImageModalHeader
          visitorId={visitor.visitor_id}
          currentIndex={currentIndex}
          totalVisitors={visitors.length}
          canNavigate={canNavigate}
          zoom={zoom}
          onNavigatePrev={handleNavigatePrev}
          onNavigateNext={handleNavigateNext}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onDownload={handleDownload}
          onShare={handleShare}
          onClose={onClose}
        />

        <div className="flex flex-1 overflow-hidden">
          <ImageViewer
            imageUrl={visitor.image_url}
            visitorId={visitor.visitor_id}
            zoom={zoom}
          />
          <VisitorDetails visitor={visitor} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
