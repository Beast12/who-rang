import { useState } from 'react';
import { Clock, MapPin, Thermometer, ChevronDown, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useBreakpoint';
import type { VisitorEvent } from '@/types/visitor';

interface ResponsiveVisitorCardProps {
  visitor: VisitorEvent & {
    person_name?: string;
    recognition_confidence?: number;
  };
  index: number;
}

export const ResponsiveVisitorCard = ({
  visitor,
  index,
}: ResponsiveVisitorCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isMobile) {
    return (
      <Card
        className="card-modern animate-slide-up"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardContent className="p-4">
          {/* Mobile Layout: Vertical Stack */}
          <div className="space-y-4">
            {/* Header with image and basic info */}
            <div className="flex items-start space-x-3">
              {/* Visitor Image */}
              <div
                className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer hover-lift"
                onClick={() => navigate(`/visitor/${visitor.id}`)}
              >
                <img
                  src={visitor.image_url}
                  alt="Visitor"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {visitor.person_name && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <User className="w-3 h-3 text-white m-1" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {visitor.ai_title || 'Visitor Detected'}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(visitor.timestamp)}</span>
                      <span>•</span>
                      <span>{formatDate(visitor.timestamp)}</span>
                    </div>
                  </div>

                  <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                </div>

                {/* Person Recognition */}
                {visitor.person_name && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    <User className="w-3 h-3 mr-1" />
                    {visitor.person_name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Collapsible Details */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleContent className="space-y-3">
                {/* Location and Weather */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{visitor.location}</span>
                  </div>
                  {visitor.weather && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Thermometer className="w-3 h-3" />
                      <span className="truncate">{visitor.weather}</span>
                    </div>
                  )}
                </div>

                {/* AI Message */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {visitor.ai_message}
                  </p>
                </div>

                {/* Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => navigate(`/visitor/${visitor.id}`)}
                >
                  View Details
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop Layout: Original horizontal design
  return (
    <Card
      className="card-modern hover-lift animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Visitor Image */}
          <div
            className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer hover-lift"
            onClick={() => navigate(`/visitor/${visitor.id}`)}
          >
            <img
              src={visitor.image_url}
              alt="Visitor"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {visitor.person_name && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <User className="w-4 h-4 text-white m-2" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {visitor.ai_title || 'Visitor Detected'}
                </h3>
                <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTime(visitor.timestamp)} •{' '}
                      {formatDate(visitor.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{visitor.location}</span>
                  </div>
                  {visitor.weather && (
                    <div className="flex items-center space-x-1">
                      <Thermometer className="w-4 h-4" />
                      <span>{visitor.weather}</span>
                    </div>
                  )}
                </div>
              </div>

              {visitor.person_name && (
                <Badge variant="secondary" className="ml-2">
                  <User className="w-3 h-3 mr-1" />
                  {visitor.person_name}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {visitor.ai_message}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/visitor/${visitor.id}`)}
              className="mt-2"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
