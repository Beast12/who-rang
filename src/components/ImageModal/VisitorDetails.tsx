
import { MapPin, Clock } from 'lucide-react';
import { VisitorEvent } from '@/types/visitor';
import { WeatherDisplay } from '@/components/weather/WeatherDisplay';

interface VisitorDetailsProps {
  visitor: VisitorEvent;
}

const formatFullTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const VisitorDetails = ({ visitor }: VisitorDetailsProps) => {
  return (
    <div className="w-80 bg-card border-l border-border p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* AI Message */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            AI Analysis
          </h3>
          {visitor.ai_title && (
            <p className="text-sm font-medium text-primary">
              {visitor.ai_title}
            </p>
          )}
          <p className="text-foreground leading-relaxed bg-muted p-4 rounded-lg border border-border">
            "{visitor.ai_message}"
          </p>
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Event Details
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Timestamp</span>
              </div>
              <span className="text-foreground text-sm">
                {formatFullTimestamp(visitor.timestamp)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Location</span>
              </div>
              <span className="text-foreground text-sm">
                {visitor.location}
              </span>
            </div>

            {/* Enhanced Weather Display */}
            {(visitor.weather || visitor.weather_condition || visitor.weather_temperature) && (
              <div className="py-2 border-b border-border">
                <div className="text-muted-foreground text-sm mb-2">Weather</div>
                <WeatherDisplay
                  weatherText={visitor.weather}
                  weatherTemperature={visitor.weather_temperature}
                  weatherCondition={visitor.weather_condition}
                  weatherHumidity={visitor.weather_humidity}
                  weatherData={visitor.weather_data}
                />
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <span className="w-4 h-4 flex items-center justify-center text-xs">#</span>
                <span>Visitor ID</span>
              </div>
              <span className="text-foreground text-sm font-mono">
                {visitor.visitor_id}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
