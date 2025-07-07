import { useState } from 'react';
import {
  MapPin,
  Clock,
  Trash2,
  Eye,
  User,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { VisitorEvent } from '@/types/visitor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeleteVisitor } from '@/hooks/useVisitors';
import { getImageUrl, getPlaceholderImage } from '@/utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { FaceThumbnail } from '@/components/faces/FaceThumbnail';
import { QuickLabelDialog } from '@/components/faces/QuickLabelDialog';
import { AIAnalysisCard } from '@/components/AIAnalysisCard';

interface VisitorCardProps {
  visitor: VisitorEvent & {
    person_name?: string;
    recognition_confidence?: number;
  };
  index: number;
  visitors?: VisitorEvent[];
}

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInMinutes = Math.floor(
    (now.getTime() - then.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export const VisitorCard = ({ visitor, index }: VisitorCardProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const deleteVisitorMutation = useDeleteVisitor();
  const navigate = useNavigate();

  const imageUrl = getImageUrl(visitor.image_url);
  const isUnknownFace =
    !visitor.person_name &&
    visitor.confidence_score &&
    visitor.confidence_score > 0.7;

  const handleDelete = () => {
    if (
      visitor.id &&
      window.confirm('Are you sure you want to delete this visitor record?')
    ) {
      deleteVisitorMutation.mutate(visitor.id);
    }
  };

  const handleViewDetails = () => {
    if (visitor.id) {
      navigate(`/visitor/${visitor.id}`);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleLabelFace = () => {
    setShowLabelDialog(true);
  };

  return (
    <>
      <div
        className="group rounded-lg bg-card border p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in cursor-pointer relative"
        style={{ animationDelay: `${index * 50}ms` }}
        onClick={handleViewDetails}
      >
        {/* Unknown Face Indicator */}
        {isUnknownFace && (
          <div className="absolute -top-2 -right-2 z-10">
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 border-orange-200 animate-pulse"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Unknown
            </Badge>
          </div>
        )}

        <div className="flex space-x-4">
          {/* Visitor Image with Face Recognition */}
          <div className="relative">
            <FaceThumbnail
              imageUrl={visitor.image_url}
              personName={visitor.person_name}
              confidence={visitor.recognition_confidence}
              isUnknown={isUnknownFace}
              size="lg"
              showLabelButton={isUnknownFace}
              onLabelClick={isUnknownFace ? handleLabelFace : undefined}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Person Name or AI Title */}
                <div className="flex items-center space-x-2 mb-1">
                  {visitor.person_name ? (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-primary">
                        {visitor.person_name}
                      </p>
                      {visitor.recognition_confidence && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                        >
                          {Math.round(visitor.recognition_confidence * 100)}%
                          match
                        </Badge>
                      )}
                    </div>
                  ) : isUnknownFace ? (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <p className="text-sm font-medium text-orange-700">
                        Unrecognized Person
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLabelFace();
                        }}
                        className="text-xs h-6 text-orange-700 border-orange-200 hover:bg-orange-50"
                      >
                        Label
                      </Button>
                    </div>
                  ) : visitor.ai_title ? (
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {visitor.ai_title}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* AI Message */}
                <p className="text-card-foreground font-medium mb-2 leading-relaxed">
                  "{visitor.ai_message}"
                </p>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeAgo(visitor.timestamp)}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{visitor.location}</span>
                  </div>

                  {visitor.weather && (
                    <div className="flex items-center space-x-1">
                      <WeatherIcon
                        condition={visitor.weather}
                        className="w-4 h-4"
                      />
                      <span>{visitor.weather}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails();
                  }}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                {visitor.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    disabled={deleteVisitorMutation.isPending}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <AIAnalysisCard
            aiConfidenceScore={visitor.ai_confidence_score}
            aiObjectsDetected={visitor.ai_objects_detected}
            aiSceneAnalysis={visitor.ai_scene_analysis}
            aiProcessingComplete={visitor.ai_processing_complete}
            facesDetected={visitor.faces_detected}
            className="bg-muted/30 border-0"
          />
        </div>

        {/* Subtle border glow on hover */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </div>

      {/* Quick Label Dialog */}
      {isUnknownFace && visitor.id && (
        <QuickLabelDialog
          open={showLabelDialog}
          onOpenChange={setShowLabelDialog}
          visitorEvent={{
            id: visitor.id,
            image_url: visitor.image_url,
            visitor_id: visitor.visitor_id,
            ai_message: visitor.ai_message,
            timestamp: visitor.timestamp,
          }}
        />
      )}
    </>
  );
};
