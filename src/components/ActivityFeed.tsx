
import { VisitorEvent } from '@/types/visitor';
import { VisitorCard } from './VisitorCard';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ActivityFeedProps {
  visitors: VisitorEvent[];
  isLoading: boolean;
  error?: any;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export const ActivityFeed = ({ visitors, isLoading, error, hasMore, onLoadMore }: ActivityFeedProps) => {
  if (error) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Connection Error</h3>
        <p className="text-muted-foreground mb-4">
          {error.message || 'Unable to load visitor data. Please check your connection.'}
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading && visitors.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg bg-card border p-6 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-20 h-20 bg-muted rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visitors.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔔</span>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No visitors yet</h3>
        <p className="text-muted-foreground">Visitor activity will appear here when your doorbell is triggered.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visitors.map((visitor, index) => (
        <VisitorCard 
          key={visitor.id || visitor.visitor_id} 
          visitor={visitor} 
          index={index}
        />
      ))}
      
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onLoadMore}
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
};
