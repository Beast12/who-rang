import { useState } from 'react';
import { Search, Menu, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
  title?: string;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  rightButton?: React.ReactNode;
}

export const MobileHeader = ({
  title,
  searchTerm = '',
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  rightButton,
}: MobileHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navigationItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Face Recognition', path: '/faces' },
    { label: 'Settings', path: '/settings' },
    { label: 'API Documentation', path: '/api-docs' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo/Title */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-primary-foreground rounded-full" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            {title || 'WhoRang'}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Right Button */}
          {rightButton}

          {/* Search Toggle */}
          {onSearchChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="focus-modern"
            >
              <Search className="w-5 h-5" />
            </Button>
          )}

          {/* Refresh */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="focus-modern"
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          )}

          {/* Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="focus-modern">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {navigationItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      navigate(item.path);
                      setIsMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Expandable Search */}
      {isSearchOpen && onSearchChange && (
        <div className="border-t bg-background/95 backdrop-blur p-4 animate-slide-up">
          <Input
            placeholder="Search visitors..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full focus-modern"
            autoFocus
          />
        </div>
      )}
    </header>
  );
};
