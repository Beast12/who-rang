
import { Users, Clock, TrendingUp } from 'lucide-react';
import { StatsCard } from './StatsCard';

interface StatsCardsProps {
  stats: {
    today: number;
    week: number;
    month: number;
    isOnline: boolean;
  };
  isLoading: boolean;
}

export const StatsCards = ({ stats, isLoading }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
      <StatsCard
        title="Today"
        value={stats.today}
        icon={Clock}
        gradient="gradient-primary"
        isLoading={isLoading}
        delay={0}
      />
      <StatsCard
        title="This Week"
        value={stats.week}
        icon={TrendingUp}
        gradient="gradient-cyber"
        isLoading={isLoading}
        delay={100}
      />
      <StatsCard
        title="Total Visitors"
        value={stats.month}
        icon={Users}
        gradient="gradient-neon"
        isLoading={isLoading}
        delay={200}
      />
    </div>
  );
};
