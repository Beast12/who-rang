
import { getImageUrl } from '@/utils/imageUtils';

interface ImageViewerProps {
  imageUrl: string;
  visitorId: string;
  zoom: number;
}

export const ImageViewer = ({ imageUrl, visitorId, zoom }: ImageViewerProps) => {
  const fullImageUrl = getImageUrl(imageUrl);

  return (
    <div className="flex-1 flex items-center justify-center bg-muted overflow-hidden">
      <div 
        className="transition-transform duration-200 cursor-move"
        style={{ transform: `scale(${zoom})` }}
      >
        <img
          src={fullImageUrl}
          alt={`Visitor ${visitorId}`}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
};
