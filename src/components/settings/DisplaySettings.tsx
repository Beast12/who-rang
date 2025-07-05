
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const DisplaySettings = () => {
  const [itemsPerPage, setItemsPerPage] = useState('20');
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Display Preferences</CardTitle>
        <CardDescription className="text-muted-foreground">
          Customize how the dashboard displays information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Items per page</Label>
          <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
            <SelectTrigger className="text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border">
              <SelectItem value="10">10 items</SelectItem>
              <SelectItem value="20">20 items</SelectItem>
              <SelectItem value="50">50 items</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-foreground font-medium">Auto-refresh</Label>
            <p className="text-sm text-muted-foreground">
              Automatically refresh visitor data
            </p>
          </div>
          <Switch
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
        </div>
      </CardContent>
    </Card>
  );
};
