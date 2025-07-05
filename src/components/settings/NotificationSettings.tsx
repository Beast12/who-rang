
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export const NotificationSettings = () => {
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Notification Settings</CardTitle>
        <CardDescription className="text-muted-foreground">
          Configure alerts and notifications for new visitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-foreground font-medium">Desktop Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Show browser notifications for new visitors
            </p>
          </div>
          <Switch
            checked={desktopNotifications}
            onCheckedChange={setDesktopNotifications}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-foreground font-medium">Sound Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Play sound when new visitor detected
            </p>
          </div>
          <Switch
            checked={soundAlerts}
            onCheckedChange={setSoundAlerts}
          />
        </div>
      </CardContent>
    </Card>
  );
};
