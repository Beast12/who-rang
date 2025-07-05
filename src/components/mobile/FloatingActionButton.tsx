import { useState } from 'react';
import { Plus, RefreshCw, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FloatingActionButtonProps {
  onRefresh?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
}

export const FloatingActionButton = ({
  onRefresh,
  onSearch,
  onSettings,
}: FloatingActionButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      icon: RefreshCw,
      label: 'Refresh',
      onClick: onRefresh,
    },
    {
      icon: Search,
      label: 'Search',
      onClick: onSearch,
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: onSettings || (() => navigate('/settings')),
    },
  ].filter(action => action.onClick);

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col-reverse items-end space-y-reverse space-y-3">
      {/* Action buttons */}
      {isExpanded && actions.map((action, index) => (
        <Button
          key={action.label}
          size="sm"
          variant="secondary"
          className={`
            w-12 h-12 rounded-full shadow-large animate-scale-bounce glass-intense
            hover:scale-110 transition-all duration-200
          `}
          style={{ animationDelay: `${index * 50}ms` }}
          onClick={() => {
            action.onClick?.();
            setIsExpanded(false);
          }}
        >
          <action.icon className="w-5 h-5" />
        </Button>
      ))}

      {/* Main FAB */}
      <Button
        className={`
          w-14 h-14 rounded-full shadow-large gradient-primary
          hover:scale-110 transition-all duration-200
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </Button>
    </div>
  );
};