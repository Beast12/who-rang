
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'dark') {
      return <Moon className="w-4 h-4" />;
    }
    return <Sun className="w-4 h-4" />;
  };

  const getTooltipText = () => {
    if (theme === 'light') {
      return 'Switch to dark mode';
    } else if (theme === 'dark') {
      return 'Switch to system mode';
    }
    return 'Switch to light mode';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title={getTooltipText()}
    >
      {getIcon()}
    </Button>
  );
};
