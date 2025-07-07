import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDatabaseStats, useClearDatabase } from '@/hooks/useDatabaseStats';

export const DatabaseSettings = () => {
  const { data: dbStats, isLoading: isLoadingStats } = useDatabaseStats();
  const clearDatabaseMutation = useClearDatabase();

  const handleClearData = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all visitor data? This action cannot be undone.'
      )
    ) {
      clearDatabaseMutation.mutate();
    }
  };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    console.log('Export data functionality not implemented yet');
  };

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-card-foreground">
          Database Management
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Manage your visitor data and database settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Total Events</Label>
            <div className="text-2xl font-bold text-primary">
              {isLoadingStats ? (
                <div className="w-16 h-8 bg-muted rounded animate-pulse" />
              ) : (
                dbStats?.totalEvents?.toLocaleString() || '0'
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Database Size</Label>
            <div className="text-2xl font-bold text-primary">
              {isLoadingStats ? (
                <div className="w-20 h-8 bg-muted rounded animate-pulse" />
              ) : (
                dbStats?.databaseSize || '0 MB'
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={handleExportData}>Export All Data</Button>
            <Button variant="outline">Import Data</Button>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={clearDatabaseMutation.isPending}
              className="w-full"
            >
              {clearDatabaseMutation.isPending
                ? 'Clearing...'
                : 'Clear All Data'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. All visitor data will be permanently
              deleted.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
