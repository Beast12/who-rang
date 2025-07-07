import { Search, Settings, BookOpen, Users, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const Header = ({ searchTerm, onSearchChange }: HeaderProps) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-intense border-b border-border/50 transition-all duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Brand Section */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 gradient-primary rounded-2xl flex items-center justify-center shadow-medium hover:shadow-glow transition-all duration-300 hover:scale-105">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-neon rounded-full animate-pulse-glow" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                WhoRang
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                AI-Powered Doorbell Intelligence
              </p>
            </div>
          </div>

          {/* Enhanced Search Section */}
          <div className="flex items-center space-x-4 flex-1 max-w-md mx-8">
            <div
              className={`
              relative flex-1 transition-all duration-300
              ${isSearchFocused ? 'scale-105' : ''}
            `}
            >
              <Search
                className={`
                absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300
                ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}
              `}
              />
              <Input
                placeholder="Search visitors, analyze patterns..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`
                  pl-12 pr-4 h-12 rounded-2xl glass border-0 
                  bg-background/50 hover:bg-background/70
                  focus:bg-background focus:shadow-glow focus:scale-[1.02]
                  transition-all duration-300 placeholder:text-muted-foreground/70
                  ${isSearchFocused ? 'ring-2 ring-primary/20' : ''}
                `}
              />
              {searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            <Link to="/faces">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 rounded-xl glass-intense hover:shadow-medium transition-all duration-300 hover:scale-105 group"
              >
                <Users className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                <span className="font-medium">Faces</span>
              </Button>
            </Link>

            <Link to="/api-docs">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 rounded-xl glass-intense hover:shadow-medium transition-all duration-300 hover:scale-105 group"
              >
                <BookOpen className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                <span className="font-medium">API</span>
              </Button>
            </Link>

            <Link to="/settings">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 rounded-xl glass-intense hover:shadow-medium transition-all duration-300 hover:scale-105 group"
              >
                <Settings className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                <span className="font-medium">Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
