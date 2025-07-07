import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CalendarIcon,
  Filter,
  X,
  Eye,
  Package,
  User,
  Car,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import { useDetectedObjects } from '@/hooks/useDetectedObjects';
import { Badge } from '@/components/ui/badge';

interface FilterBarProps {
  onWeatherFilter: (weather: string | null) => void;
  onDateFilter: (dateRange: { from: Date; to: Date } | null) => void;
  onObjectFilter: (object: string | null) => void;
  onSortChange: (sort: 'newest' | 'oldest') => void;
  onClearFilters: () => void;
  activeFilters: number;
}

export const FilterBar = ({
  onWeatherFilter,
  onDateFilter,
  onObjectFilter,
  onSortChange,
  onClearFilters,
  activeFilters,
}: FilterBarProps) => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
    null
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch detected objects
  const { data: detectedObjectsData, isLoading: objectsLoading } =
    useDetectedObjects();

  // Helper function to get icon for object type
  const getObjectIcon = (objectName: string) => {
    const name = objectName.toLowerCase();
    if (
      name.includes('person') ||
      name.includes('human') ||
      name.includes('man') ||
      name.includes('woman')
    ) {
      return <User className="w-4 h-4" />;
    }
    if (name.includes('car') || name.includes('vehicle')) {
      return <Car className="w-4 h-4" />;
    }
    if (name.includes('truck') || name.includes('van')) {
      return <Truck className="w-4 h-4" />;
    }
    if (
      name.includes('package') ||
      name.includes('box') ||
      name.includes('delivery')
    ) {
      return <Package className="w-4 h-4" />;
    }
    return <Eye className="w-4 h-4" />;
  };

  const handleDateSelect = (range: { from: Date; to: Date } | null) => {
    setDateRange(range);
    onDateFilter(range);
    setIsCalendarOpen(false);
  };

  const quickDateFilters = [
    {
      label: 'Today',
      onClick: () => {
        const today = new Date();
        handleDateSelect({ from: today, to: today });
      },
    },
    {
      label: 'This Week',
      onClick: () => {
        const today = new Date();
        const weekStart = new Date(
          today.setDate(today.getDate() - today.getDay())
        );
        handleDateSelect({ from: weekStart, to: new Date() });
      },
    },
    {
      label: 'This Month',
      onClick: () => {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        handleDateSelect({ from: monthStart, to: new Date() });
      },
    },
  ];

  return (
    <div className="flex items-center justify-between p-4 bg-surface/30 rounded-lg border border-border-subtle">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <span className="text-sm font-medium text-text-secondary">
            Filters:
          </span>
        </div>

        {/* Weather Filter */}
        <Select
          onValueChange={(value) =>
            onWeatherFilter(value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Weather" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Weather</SelectItem>
            <SelectItem value="sunny">Sunny</SelectItem>
            <SelectItem value="cloudy">Cloudy</SelectItem>
            <SelectItem value="rainy">Rainy</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-48 justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd')} -{' '}
                    {format(dateRange.to, 'LLL dd')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex space-x-1">
                {quickDateFilters.map((filter) => (
                  <Button
                    key={filter.label}
                    variant="ghost"
                    size="sm"
                    onClick={filter.onClick}
                    className="text-xs"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              selected={
                dateRange
                  ? { from: dateRange.from, to: dateRange.to }
                  : undefined
              }
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  handleDateSelect({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Objects Filter */}
        <Select
          onValueChange={(value) =>
            onObjectFilter(value === 'all' ? null : value)
          }
          disabled={objectsLoading}
        >
          <SelectTrigger className="w-40">
            <SelectValue
              placeholder={objectsLoading ? 'Loading...' : 'Objects'}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Objects</SelectItem>
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

        {/* Sort */}
        <Select
          onValueChange={(value) => onSortChange(value as 'newest' | 'oldest')}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {activeFilters > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-text-secondary hover:text-text-primary"
        >
          <X className="w-4 h-4 mr-1" />
          Clear ({activeFilters})
        </Button>
      )}
    </div>
  );
};
