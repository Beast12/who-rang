
import { useState } from 'react';
import { User, Tag, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getImageUrl, getPlaceholderImage } from '@/utils/imageUtils';

interface FaceThumbnailProps {
  imageUrl?: string;
  src?: string; // Support both props for compatibility
  personName?: string;
  confidence?: number;
  isUnknown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onLabelClick?: () => void;
  showLabelButton?: boolean;
  className?: string;
  alt?: string;
}

export const FaceThumbnail = ({
  imageUrl,
  src,
  personName,
  confidence,
  isUnknown = false,
  size = 'md',
  onLabelClick,
  showLabelButton = false,
  className,
  alt,
}: FaceThumbnailProps) => {
  const [imageError, setImageError] = useState(false);

  // Use imageUrl or src for compatibility
  const finalImageUrl = imageUrl || src;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const badgeSizes = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-muted relative group`}>
        <img
          src={imageError ? getPlaceholderImage() : getImageUrl(finalImageUrl)}
          alt={alt || personName || 'Face thumbnail'}
          className={`w-full h-full object-cover ${className || ''}`}
          onError={handleImageError}
        />
        
        {/* Unknown face overlay */}
        {isUnknown && (
          <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </div>
        )}

        {/* Label button overlay */}
        {showLabelButton && onLabelClick && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Button
              size="sm"
              variant="secondary"
              onClick={onLabelClick}
              className="text-xs"
            >
              Label
            </Button>
          </div>
        )}
      </div>

      {/* Person name badge */}
      {personName && (
        <Badge
          variant="secondary"
          className={`absolute -bottom-1 -right-1 ${badgeSizes[size]} flex items-center space-x-1`}
        >
          <User className="w-3 h-3" />
          <span className="truncate max-w-20">{personName}</span>
        </Badge>
      )}

      {/* Unknown person badge */}
      {isUnknown && !personName && (
        <Badge
          variant="outline"
          className={`absolute -bottom-1 -right-1 ${badgeSizes[size]} flex items-center space-x-1 bg-orange-50 text-orange-700 border-orange-200`}
        >
          <AlertCircle className="w-3 h-3" />
          <span>Unknown</span>
        </Badge>
      )}

      {/* Confidence badge */}
      {confidence && confidence > 0 && (
        <Badge
          variant="outline"
          className={`absolute -top-1 -right-1 ${badgeSizes[size]} bg-green-50 text-green-700 border-green-200`}
        >
          {Math.round(confidence * 100)}%
        </Badge>
      )}
    </div>
  );
};
