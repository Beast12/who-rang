
import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/Header';
import { StatsCards } from '@/components/StatsCards';
import { FilterBar } from '@/components/FilterBar';
import { VisitorCard } from '@/components/VisitorCard';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';

import { MobileStatsGrid } from '@/components/mobile/MobileStatsGrid';
import { ResponsiveVisitorCard } from '@/components/mobile/ResponsiveVisitorCard';
import { MobileFilterSheet } from '@/components/mobile/MobileFilterSheet';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useVisitors, useAddVisitor } from '@/hooks/useVisitors';
import { useStats } from '@/hooks/useStats';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw, AlertCircle, Sparkles, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Index = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [weatherFilter, setWeatherFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<{ from: Date; to: Date } | null>(null);
  const [objectFilter, setObjectFilter] = useState<string | null>(null);

  const isMobile = useIsMobile();

  const { 
    data: visitorsData, 
    isLoading: visitorsLoading, 
    error: visitorsError,
    refetch: refetchVisitors,
    isFetching: visitorsRefetching 
  } = useVisitors(currentPage, 20, searchTerm);
  
  const { data: stats, error: statsError, refetch: refetchStats, isLoading: statsLoading } = useStats();
  const addVisitorMutation = useAddVisitor();

  // WebSocket connection
  const { isConnected: wsConnected, connectionStatus } = useWebSocket(
    (newVisitor) => {
      addVisitorMutation.mutate(newVisitor);
    },
    (newStats) => {
      refetchStats();
    },
    () => {
      refetchVisitors();
      refetchStats();
    }
  );

  const visitors = visitorsData?.visitors || [];
  const hasVisitorsError = visitorsError !== null;
  const hasStatsError = statsError !== null;
  const hasAnyError = hasVisitorsError || hasStatsError;

  // Filter visitors by location, weather, date, and objects
  const filteredVisitors = visitors.filter(visitor => {
    const matchesLocation = selectedLocation === 'all' || visitor.location === selectedLocation;
    const matchesWeather = !weatherFilter || visitor.weather === weatherFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const visitorDate = new Date(visitor.timestamp);
      const fromDate = new Date(dateFilter.from);
      const toDate = new Date(dateFilter.to);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = visitorDate >= fromDate && visitorDate <= toDate;
    }
    
    let matchesObject = true;
    if (objectFilter) {
      try {
        // Try both field names for compatibility
        const visitorWithAI = visitor as any;
        const objectsData = visitorWithAI.ai_objects_detected || visitor.objects_detected;
        const detectedObjects = objectsData ? JSON.parse(objectsData) : [];
        if (Array.isArray(detectedObjects)) {
          matchesObject = detectedObjects.some(obj => 
            obj.object && obj.object.toLowerCase() === objectFilter.toLowerCase()
          );
        } else {
          matchesObject = false;
        }
      } catch (error) {
        matchesObject = false;
      }
    }
    
    return matchesLocation && matchesWeather && matchesDate && matchesObject;
  });

  // Sort visitors
  const sortedVisitors = [...filteredVisitors].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const handleRetryAll = useCallback(() => {
    refetchVisitors();
    refetchStats();
  }, [refetchVisitors, refetchStats]);

  // Pull to refresh functionality
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await Promise.all([refetchVisitors(), refetchStats()]);
    },
    enabled: isMobile,
  });

  const handleClearFilters = () => {
    setWeatherFilter(null);
    setDateFilter(null);
    setObjectFilter(null);
    setSortBy('newest');
  };

  const activeFilters = [weatherFilter, dateFilter, objectFilter].filter(Boolean).length;

  // Show error state if there are critical connection issues
  if (hasAnyError && !visitorsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <ConnectionBanner />
          
          <Alert variant="destructive" className="glass border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="mt-2">
              Unable to connect to the backend service. This could be due to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Backend server not running</li>
                <li>Network connectivity issues</li>
                <li>Server configuration problems</li>
                <li>Firewall or proxy blocking requests</li>
              </ul>
              <div className="mt-4 space-x-2">
                <Button onClick={handleRetryAll} variant="outline" size="sm" className="hover-lift">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const containerClass = isMobile 
    ? "min-h-screen bg-background text-foreground pb-20" 
    : "min-h-screen bg-background text-foreground";

  return (
    <div className={containerClass}>
      {/* Mobile Header */}
      {isMobile ? (
        <MobileHeader 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm}
          onRefresh={handleRetryAll}
          isRefreshing={visitorsRefetching}
        />
      ) : (
        <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      )}
      
      <div 
        ref={pullToRefresh.containerRef}
        className={`
          container mx-auto px-4 py-8 max-w-6xl space-y-8
          ${isMobile ? 'py-4' : 'py-8'}
        `}
        {...(isMobile ? pullToRefresh.handlers : {})}
      >
        {/* Pull to refresh indicator */}
        {isMobile && pullToRefresh.pullDistance > 0 && (
          <div 
            className="flex items-center justify-center py-4 transition-opacity"
            style={{ 
              opacity: pullToRefresh.pullProgress,
              transform: `translateY(${Math.min(pullToRefresh.pullDistance - 60, 0)}px)`
            }}
          >
            <RefreshCw 
              className={`w-6 h-6 text-primary ${
                pullToRefresh.isRefreshing ? 'animate-spin' : ''
              }`} 
            />
          </div>
        )}

        <ConnectionBanner />
        
        {/* Enhanced Dashboard Header - Hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Activity className="w-8 h-8 text-primary animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-neon rounded-full animate-breathe" />
                </div>
                <div>
                  <h2 className="text-display bg-gradient-to-r from-foreground via-primary to-accent-cyber bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-muted-foreground font-medium">
                    AI-powered doorbell monitoring & analytics
                  </p>
                </div>
              </div>
            </div>
            <ConnectionStatus isConnected={wsConnected} status={connectionStatus} />
          </div>
        )}

        {/* Stats Cards - Mobile optimized */}
        {isMobile ? (
          <MobileStatsGrid 
            stats={stats || { today: 0, week: 0, month: 0, isOnline: false }} 
            isLoading={statsLoading} 
          />
        ) : (
          <StatsCards 
            stats={stats || { today: 0, week: 0, month: 0, isOnline: false }} 
            isLoading={statsLoading} 
          />
        )}

        {/* Enhanced Filter Bar - Simplified on mobile */}
        {!isMobile && (
          <FilterBar
            onWeatherFilter={setWeatherFilter}
            onDateFilter={setDateFilter}
            onObjectFilter={setObjectFilter}
            onSortChange={setSortBy}
            onClearFilters={handleClearFilters}
            activeFilters={activeFilters}
          />
        )}

        {/* Visitor Activity Section */}
        <section className="space-y-6">
          {/* Mobile Filter Header */}
          {isMobile ? (
            <MobileFilterSheet
              onWeatherFilter={setWeatherFilter}
              onDateFilter={setDateFilter}
              onObjectFilter={setObjectFilter}
              onSortChange={setSortBy}
              onClearFilters={handleClearFilters}
              activeFilters={activeFilters}
              sortBy={sortBy}
            />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Recent Activity</h3>
                {sortedVisitors.length > 0 && (
                  <div className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {sortedVisitors.length} visitor{sortedVisitors.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchVisitors()}
                disabled={visitorsRefetching}
                className="hover-lift glass-intense"
              >
                {visitorsRefetching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}

          {visitorsLoading ? (
            <div className="grid gap-6">
              {[...Array(isMobile ? 3 : 6)].map((_, i) => (
                <Card key={i} className="glass animate-pulse">
                  <CardContent className={isMobile ? "p-4" : "p-6"}>
                    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'space-x-4'}`}>
                      <Skeleton className={`${isMobile ? 'h-16 w-16' : 'h-20 w-20'} rounded-2xl ${isMobile ? 'mx-auto' : ''}`} />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedVisitors.length === 0 ? (
            <Card className="card-modern border-dashed border-2">
              <CardContent className={isMobile ? "p-8 text-center" : "p-12 text-center"}>
                <div className={`relative mx-auto mb-6 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}>
                  <div className="absolute inset-0 gradient-primary rounded-3xl opacity-20 animate-pulse" />
                  <div className="relative flex items-center justify-center w-full h-full">
                    <Users className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-muted-foreground`} />
                  </div>
                </div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-foreground mb-3`}>No Activity Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-sm">
                  {searchTerm || selectedLocation !== 'all' || weatherFilter || dateFilter
                    ? 'No visitors match your current filters. Try adjusting your search criteria.'
                    : 'Your smart doorbell is ready and waiting. Visitor activity will appear here when detected by your AI-powered system.'
                  }
                </p>
                {(searchTerm || activeFilters > 0) && (
                  <Button 
                    onClick={handleClearFilters} 
                    variant="outline" 
                    size={isMobile ? "sm" : "default"}
                    className="mt-4 hover-lift"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {sortedVisitors.map((visitor, index) => 
                isMobile ? (
                  <ResponsiveVisitorCard
                    key={`${visitor.id}-${visitor.timestamp}`}
                    visitor={visitor}
                    index={index}
                  />
                ) : (
                  <VisitorCard
                    key={`${visitor.id}-${visitor.timestamp}`}
                    visitor={visitor}
                    index={index}
                    visitors={sortedVisitors}
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* Mobile Navigation */}
      {isMobile && <BottomNavigation />}
      
    </div>
  );
};

export default Index;
