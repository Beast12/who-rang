import { useState } from 'react';
import { StatsCard } from '@/components/StatsCard';
import { Users, Clock, TrendingUp } from 'lucide-react';
import { useTouchGestures } from '@/hooks/useTouchGestures';

interface MobileStatsGridProps {
  stats: {
    today: number;
    week: number;
    month: number;
    isOnline: boolean;
  };
  isLoading: boolean;
}

export const MobileStatsGrid = ({ stats, isLoading }: MobileStatsGridProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const statsData = [
    {
      title: 'Today',
      value: stats.today,
      icon: Clock,
      gradient: 'gradient-primary',
    },
    {
      title: 'This Week',
      value: stats.week,
      icon: TrendingUp,
      gradient: 'gradient-cyber',
    },
    {
      title: 'Total Visitors',
      value: stats.month,
      icon: Users,
      gradient: 'gradient-neon',
    },
  ];

  const touchGestures = useTouchGestures({
    onSwipeLeft: () => {
      setCurrentIndex((prev) => Math.min(prev + 1, statsData.length - 1));
    },
    onSwipeRight: () => {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    },
  });

  return (
    <div className="space-y-4">
      {/* Mobile: Single card with swipe navigation */}
      <div className="block sm:hidden">
        <div 
          className="relative overflow-hidden"
          {...touchGestures}
        >
          <div 
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {statsData.map((stat, index) => (
              <div key={stat.title} className="w-full flex-shrink-0 px-1">
                <StatsCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  gradient={stat.gradient}
                  isLoading={isLoading}
                  delay={0}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center space-x-2 mt-4">
          {statsData.map((_, index) => (
            <button
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${index === currentIndex 
                  ? 'bg-primary w-6' 
                  : 'bg-muted-foreground/30'
                }
              `}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Tablet & Desktop: Original grid layout */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
        {statsData.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            gradient={stat.gradient}
            isLoading={isLoading}
            delay={index * 100}
          />
        ))}
      </div>
    </div>
  );
};