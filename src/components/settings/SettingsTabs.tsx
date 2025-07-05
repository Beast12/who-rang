
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Bell, Image, Webhook, Settings as SettingsIcon, BarChart3 } from 'lucide-react';
import { WebhookSettings } from './WebhookSettings';
import { DatabaseSettings } from './DatabaseSettings';
import { DisplaySettings } from './DisplaySettings';
import { NotificationSettings } from './NotificationSettings';
import { ImageSettings } from './ImageSettings';
import { AIAnalytics } from './AIAnalytics';

export const SettingsTabs = () => {
  return (
    <Tabs defaultValue="webhook" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-muted">
        <TabsTrigger value="webhook" className="h-10 flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground">
          <Webhook className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline text-xs sm:text-sm">Webhook</span>
        </TabsTrigger>
        <TabsTrigger value="database" className="h-10 flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground">
          <Database className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline text-xs sm:text-sm">Database</span>
        </TabsTrigger>
        <TabsTrigger value="display" className="h-10 flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground">
          <SettingsIcon className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline text-xs sm:text-sm">Display</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="h-10 flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground">
          <Bell className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline text-xs sm:text-sm">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="images" className="h-10 flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground">
          <Image className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline text-xs sm:text-sm">Images</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="h-10 flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground">
          <BarChart3 className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline text-xs sm:text-sm">AI Analytics</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="webhook" className="space-y-6">
        <WebhookSettings />
      </TabsContent>

      <TabsContent value="database" className="space-y-6">
        <DatabaseSettings />
      </TabsContent>

      <TabsContent value="display" className="space-y-6">
        <DisplaySettings />
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <NotificationSettings />
      </TabsContent>

      <TabsContent value="images" className="space-y-6">
        <ImageSettings />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <AIAnalytics />
      </TabsContent>
    </Tabs>
  );
};
