import { useState } from 'react';
import { Filter, X, CalendarDays, MapPin, Cloud, Eye, Package, User, Car, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDetectedObjects } from '@/hooks/useDetectedObjects';

interface MobileFilterSheetProps {
  onWeatherFilter: (weather: string | null) => void;
  onDateFilter: (filter: { from: Date; to: Date } | null) => void;
  onObjectFilter: (object: string | null) => void;
  onSortChange: (sort: 'newest' | 'oldest') => void;
  onClearFilters: () => void;
  activeFilters: number;
  sortBy: 'newest' | 'oldest';
}

export const MobileFilterSheet = ({
  onWeatherFilter,
  onDateFilter,
  onObjectFilter,
  onSortChange,
  onClearFilters,
  activeFilters,
  sortBy,
}: MobileFilterSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWeather, setSelectedWeather] = useState<string>('');
  const [selectedObject, setSelectedObject] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<'newest' | 'oldest'>(sortBy);

  // Fetch detected objects
  const { data: detectedObjectsData, isLoading: objectsLoading } = useDetectedObjects();

  const weatherOptions = [
    'Clear',
    'Cloudy',
    'Rainy',
    'Sunny',
    'Overcast',
    'Partly Cloudy',
  ];

  // Helper function to get icon for object type
  const getObjectIcon = (objectName: string) => {
    const name = objectName.toLowerCase();
    if (name.includes('person') || name.includes('human') || name.includes('man') || name.includes('woman')) {
      return <User className="w-4 h-4" />;
    }
    if (name.includes('car') || name.includes('vehicle')) {
      return <Car className="w-4 h-4" />;
    }
    if (name.includes('truck') || name.includes('van')) {
      return <Truck className="w-4 h-4" />;
    }
    if (name.includes('package') || name.includes('box') || name.includes('delivery')) {
      return <Package className="w-4 h-4" />;
    }
    return <Eye className="w-4 h-4" />;
  };

  const handleApplyFilters = () => {
    if (selectedWeather) {
      onWeatherFilter(selectedWeather);
    } else {
      onWeatherFilter(null);
    }
    
    if (selectedObject) {
      onObjectFilter(selectedObject);
    } else {
      onObjectFilter(null);
    }
    
    onSortChange(selectedSort);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setSelectedWeather('');
    setSelectedObject('');
    setSelectedSort('newest');
    onClearFilters();
    setIsOpen(false);
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        {activeFilters > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFilters} filter{activeFilters !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="w-4 h-4" />
            {activeFilters > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[400px]">
          <SheetHeader>
            <SheetTitle>Filter Options</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Sort Options */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Sort By</label>
              <Select value={selectedSort} onValueChange={(value: 'newest' | 'oldest') => setSelectedSort(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weather Filter */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Weather Condition</label>
              <Select value={selectedWeather} onValueChange={setSelectedWeather}>
                <SelectTrigger>
                  <SelectValue placeholder="All weather conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All conditions</SelectItem>
                  {weatherOptions.map((weather) => (
                    <SelectItem key={weather} value={weather}>
                      <div className="flex items-center space-x-2">
                        <Cloud className="w-4 h-4" />
                        <span>{weather}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Objects Filter */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Detected Objects</label>
              <Select value={selectedObject} onValueChange={setSelectedObject} disabled={objectsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={objectsLoading ? "Loading..." : "All objects"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All objects</SelectItem>
                  {detectedObjectsData?.objects.map((obj) => (
                    <SelectItem key={obj.object} value={obj.object}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          {getObjectIcon(obj.object)}
                          <span className="capitalize">{obj.object}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {obj.count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearAll}
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button
                className="flex-1"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
