
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useIsMobile } from '@/hooks/useBreakpoint';

const Settings = () => {
  const isMobile = useIsMobile();

  const containerClass = isMobile 
    ? "min-h-screen bg-background text-foreground pb-20" 
    : "min-h-screen bg-background text-foreground";

  return (
    <div className={containerClass}>
      {isMobile ? (
        <MobileHeader title="Settings" />
      ) : (
        <SettingsHeader />
      )}
      
      <div className={`container mx-auto px-4 max-w-6xl ${isMobile ? 'py-4' : 'py-8'}`}>
        <SettingsTabs />
      </div>

      {/* Mobile Navigation */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default Settings;
