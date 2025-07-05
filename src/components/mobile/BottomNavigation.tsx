import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Users, Settings, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: Activity,
      label: 'Dashboard',
      path: '/',
    },
    {
      icon: Users,
      label: 'Faces',
      path: '/faces',
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
    },
    {
      icon: Search,
      label: 'API',
      path: '/api-docs',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t supports-[backdrop-filter]:bg-background/60">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Button
              key={path}
              variant="ghost"
              className={`
                h-full rounded-none flex-col space-y-1 text-xs font-medium
                ${isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
              onClick={() => navigate(path)}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};