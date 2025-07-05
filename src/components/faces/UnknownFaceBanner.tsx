
import { useState, useEffect } from 'react';
import { AlertCircle, X, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FaceThumbnail } from './FaceThumbnail';
import { QuickLabelDialog } from './QuickLabelDialog';

interface UnknownFace {
  id: number;
  image_url: string;
  visitor_id: string;
  ai_message: string;
  timestamp: string;
}

interface UnknownFaceBannerProps {
  unknownFaces: UnknownFace[];
  onDismiss?: () => void;
}

export const UnknownFaceBanner = ({ unknownFaces, onDismiss }: UnknownFaceBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedFace, setSelectedFace] = useState<UnknownFace | null>(null);
  const [showLabelDialog, setShowLabelDialog] = useState(false);

  useEffect(() => {
    if (unknownFaces.length > 0) {
      setIsVisible(true);
    }
  }, [unknownFaces]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleLabelFace = (face: UnknownFace) => {
    setSelectedFace(face);
    setShowLabelDialog(true);
  };

  const handleLabelDialogClose = () => {
    setShowLabelDialog(false);
    setSelectedFace(null);
  };

  if (!isVisible || unknownFaces.length === 0) {
    return null;
  }

  return (
    <>
      <Alert className="mb-6 border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 mr-4">
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">
                    {unknownFaces.length} unrecognized face{unknownFaces.length > 1 ? 's' : ''} detected
                  </span>
                  <p className="text-sm mt-1">
                    Help improve face recognition by identifying these visitors.
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {unknownFaces.length} pending
                </Badge>
              </div>
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-orange-600 hover:text-orange-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>

      {/* Face thumbnails grid */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-3">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Click on a face to identify:
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {unknownFaces.slice(0, 8).map((face) => (
            <div key={face.id} className="relative">
              <FaceThumbnail
                imageUrl={face.image_url}
                isUnknown={true}
                size="md"
                showLabelButton={true}
                onLabelClick={() => handleLabelFace(face)}
              />
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span className="text-xs text-muted-foreground">
                  {new Date(face.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {unknownFaces.length > 8 && (
            <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-muted border-2 border-dashed border-muted-foreground/30">
              <span className="text-xs text-muted-foreground font-medium">
                +{unknownFaces.length - 8}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Label Dialog */}
      <QuickLabelDialog
        open={showLabelDialog}
        onOpenChange={handleLabelDialogClose}
        visitorEvent={selectedFace || undefined}
      />
    </>
  );
};
