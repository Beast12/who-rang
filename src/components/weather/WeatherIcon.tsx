
import { Sun, Cloud, CloudRain, CloudSnow, Wind, CloudDrizzle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherIconProps {
  condition?: string;
  className?: string;
}

export const WeatherIcon = ({ condition, className }: WeatherIconProps) => {
  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition?.toLowerCase() || '';
    
    if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
      return CloudRain;
    }
    if (conditionLower.includes('drizzle')) {
      return CloudDrizzle;
    }
    if (conditionLower.includes('snow') || conditionLower.includes('sleet')) {
      return CloudSnow;
    }
    if (conditionLower.includes('wind')) {
      return Wind;
    }
    if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
      return Cloud;
    }
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return Sun;
    }
    
    // Default to sun for unknown conditions
    return Sun;
  };

  const IconComponent = getWeatherIcon(condition || '');
  
  return <IconComponent className={cn("text-muted-foreground", className)} />;
};
