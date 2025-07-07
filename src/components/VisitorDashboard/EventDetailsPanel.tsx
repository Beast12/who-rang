import { Calendar, MapPin, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitorEvent } from '@/types/visitor';
import { WeatherDisplay } from '@/components/weather/WeatherDisplay';

interface EventDetailsPanelProps {
  visitor: VisitorEvent;
}

const formatFullTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    full: date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    relative: getRelativeTime(date),
  };
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export const EventDetailsPanel = ({ visitor }: EventDetailsPanelProps) => {
  const timeData = formatFullTimestamp(visitor.timestamp);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Event Details</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Timestamp */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">When</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="text-foreground font-medium">
              {timeData.relative}
            </div>
            <div className="text-sm text-muted-foreground">{timeData.full}</div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Location</span>
          </div>
          <div className="ml-6">
            <div className="text-foreground font-medium">
              {visitor.location}
            </div>
          </div>
        </div>

        {/* Enhanced Weather Display */}
        {(visitor.weather ||
          visitor.weather_condition ||
          visitor.weather_temperature) && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <span className="text-sm font-medium">
                Weather at time of visit
              </span>
            </div>
            <div className="ml-6">
              <WeatherDisplay
                weatherText={visitor.weather}
                weatherTemperature={visitor.weather_temperature}
                weatherCondition={visitor.weather_condition}
                weatherHumidity={visitor.weather_humidity}
                weatherData={visitor.weather_data}
              />
            </div>
          </div>
        )}

        {/* Device Info - only show if available */}
        {(visitor.device_name ||
          visitor.device_firmware ||
          visitor.device_battery) && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">Device</span>
            </div>
            <div className="ml-6 space-y-1">
              {visitor.device_name && (
                <div className="text-foreground font-medium">
                  {visitor.device_name}
                </div>
              )}
              {visitor.device_firmware && (
                <div className="text-sm text-muted-foreground">
                  Firmware {visitor.device_firmware}
                </div>
              )}
              {visitor.device_battery && (
                <div className="text-sm text-muted-foreground">
                  Battery: {visitor.device_battery}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event ID */}
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Event ID</span>
            <span className="font-mono text-foreground">{visitor.id}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
