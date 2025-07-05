
import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  isLoading: boolean;
  delay: number;
}

export const StatsCard = ({ title, value, icon: Icon, gradient, isLoading, delay }: StatsCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Enhanced counter animation for numbers
  useEffect(() => {
    if (!isLoading && typeof value === 'number' && isVisible) {
      let start = 0;
      const end = value;
      const duration = 1200;
      const increment = end / (duration / 16);

      const counter = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(counter);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(counter);
    }
  }, [value, isLoading, isVisible]);

  return (
    <div 
      className={`
        group relative overflow-hidden rounded-2xl
        card-elevated p-8
        ${isVisible ? 'animate-slide-up' : 'opacity-0'}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary/20 rounded-full animate-float" />
        <div className="absolute top-1/3 -left-1 w-2 h-2 bg-primary/30 rounded-full animate-float animate-delay-200" />
        <div className="absolute bottom-4 right-1/4 w-3 h-3 bg-primary/15 rounded-full animate-float animate-delay-400" />
      </div>
      
      <div className="relative flex items-center justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="text-metric text-foreground font-extrabold">
            {isLoading ? (
              <div className="w-20 h-10 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg animate-shimmer" />
            ) : (
              <span 
                className="tabular-nums group-hover:text-primary transition-colors duration-300"
              >
                {displayValue.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        <div className={`
          relative p-4 rounded-2xl ${gradient} 
          shadow-medium group-hover:shadow-glow 
          transition-all duration-300 group-hover:scale-110
        `}>
          <Icon className="w-8 h-8 text-white drop-shadow-sm" />
          
          {/* Icon glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Hover shine effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-x-0 -top-1 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute inset-y-0 -left-1 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Subtle pulse animation for loading */}
      {isLoading && (
        <div className="absolute inset-0 rounded-2xl animate-pulse-glow" />
      )}
    </div>
  );
};
