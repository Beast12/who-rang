
import { Thermometer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { WeatherIcon } from './WeatherIcon';

interface WeatherData {
  temperature?: number;
  condition?: string;
  humidity?: number;
  wind_speed?: number;
  pressure?: number;
  forecast?: Array<{
    datetime: string;
    temperature: number;
    templow?: number;
    condition: string;
    precipitation?: number;
  }>;
}

interface WeatherDisplayProps {
  weatherText?: string;
  weatherTemperature?: number;
  weatherCondition?: string;
  weatherHumidity?: number;
  weatherData?: string;
}

export const WeatherDisplay = ({ 
  weatherText, 
  weatherTemperature, 
  weatherCondition, 
  weatherHumidity, 
  weatherData 
}: WeatherDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse weather data if available
  let parsedWeatherData: WeatherData | null = null;
  if (weatherData) {
    try {
      parsedWeatherData = JSON.parse(weatherData);
    } catch (error) {
      console.error('Error parsing weather data:', error);
    }
  }

  const displayCondition = weatherCondition || parsedWeatherData?.condition || weatherText;
  const displayTemperature = weatherTemperature ?? parsedWeatherData?.temperature;
  const displayHumidity = weatherHumidity ?? parsedWeatherData?.humidity;

  if (!displayCondition && !displayTemperature) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <WeatherIcon condition={displayCondition} className="w-6 h-6" />
          <div>
            <div className="flex items-center space-x-2">
              {displayTemperature && (
                <span className="text-lg font-semibold text-foreground">
                  {displayTemperature.toFixed(1)}°C
                </span>
              )}
              <Badge variant="secondary" className="text-xs">
                {displayCondition}
              </Badge>
            </div>
            {displayHumidity && (
              <div className="text-sm text-muted-foreground">
                Humidity: {displayHumidity}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forecast Section */}
      {parsedWeatherData?.forecast && parsedWeatherData.forecast.length > 0 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            <span>Weather Forecast</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-2 pl-6 border-l-2 border-muted">
              {parsedWeatherData.forecast.slice(0, 3).map((forecast, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <WeatherIcon condition={forecast.condition} className="w-4 h-4" />
                    <span className="text-muted-foreground">
                      {new Date(forecast.datetime).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-foreground font-medium">
                      {forecast.temperature.toFixed(1)}°C
                    </span>
                    {forecast.templow && (
                      <span className="text-muted-foreground text-xs">
                        / {forecast.templow.toFixed(1)}°C
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
