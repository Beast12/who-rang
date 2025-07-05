
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface WebhookConfig {
  webhook_url: string;
  webhook_path: string;
  has_token: boolean;
  webhook_token: string | null;
  public_url: string;
}

export const WebhookSettings = () => {
  const [webhookToken, setWebhookToken] = useState('');
  const [webhookPath, setWebhookPath] = useState('');
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Load webhook configuration on component mount
  useEffect(() => {
    loadWebhookConfig();
  }, []);

  const loadWebhookConfig = async () => {
    try {
      const response = await apiService.getWebhookConfig();
      setConfig(response);
      setWebhookPath(response.webhook_path);
      setWebhookToken(''); // Don't pre-fill token for security
    } catch (error) {
      console.error('Failed to load webhook config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load webhook configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!webhookToken.trim() && !webhookPath.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a webhook token or path to update',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updateData: { webhook_token?: string; webhook_path?: string } = {};
      
      if (webhookToken.trim()) {
        updateData.webhook_token = webhookToken;
      }
      
      if (webhookPath.trim() && webhookPath !== config?.webhook_path) {
        updateData.webhook_path = webhookPath;
      }

      const response = await apiService.updateWebhookConfig(updateData);
      
      toast({
        title: 'Settings saved',
        description: 'Webhook configuration has been updated.',
      });
      
      await loadWebhookConfig(); // Reload to show updated status
      setWebhookToken(''); // Clear input for security
    } catch (error) {
      console.error('Failed to save webhook config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save webhook configuration',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsTesting(true);
    try {
      await apiService.testWebhook();
      toast({
        title: 'Test successful',
        description: 'Test webhook sent successfully. Check your dashboard for the test notification.',
      });
    } catch (error) {
      console.error('Failed to test webhook:', error);
      toast({
        title: 'Test failed',
        description: 'Failed to send test webhook',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Webhook Configuration</CardTitle>
          <CardDescription className="text-muted-foreground">Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Webhook Configuration</CardTitle>
        <CardDescription className="text-muted-foreground">
          Configure your Home Assistant webhook integration with custom endpoint and authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="webhook-url" className="text-foreground font-medium">Current Webhook URL</Label>
          <Input
            id="webhook-url"
            value={config?.webhook_url || 'Loading...'}
            readOnly
            className="bg-muted text-foreground font-mono text-sm"
          />
          <p className="text-sm text-muted-foreground">
            Use this URL in your Home Assistant automation
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook-path" className="text-foreground font-medium">
            Webhook Path
          </Label>
          <Input
            id="webhook-path"
            value={webhookPath}
            onChange={(e) => setWebhookPath(e.target.value)}
            placeholder="/api/webhook/doorbell"
            className="text-foreground font-mono text-sm"
          />
          <p className="text-sm text-muted-foreground">
            Custom endpoint path for your webhook (e.g., /api/webhook/custom)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook-token" className="text-foreground font-medium">
            Authentication Token 
            {config?.has_token && (
              <span className="text-green-600 text-xs ml-2">✓ Token configured</span>
            )}
          </Label>
          <Input
            id="webhook-token"
            type="password"
            value={webhookToken}
            onChange={(e) => setWebhookToken(e.target.value)}
            placeholder={config?.has_token ? "Enter new token to update" : "Enter webhook token for security"}
            className="text-foreground"
          />
          <p className="text-sm text-muted-foreground">
            {config?.has_token 
              ? "A token is currently configured. Enter a new token to update it."
              : "Optional: Set a token to secure your webhook endpoint"
            }
          </p>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleSaveWebhook} 
            disabled={isSaving || (!webhookToken.trim() && webhookPath === config?.webhook_path)}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTestWebhook}
            disabled={isTesting}
          >
            {isTesting ? 'Testing...' : 'Test Webhook'}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Configuration Details:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>Base URL:</strong> {config?.public_url}</p>
            <p>• <strong>Current Path:</strong> {config?.webhook_path}</p>
            <p>• <strong>Token Status:</strong> {config?.has_token ? 'Configured' : 'Not set'}</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Webhook Usage Instructions:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Include <code>ai_message</code> and <code>location</code> in your POST request</p>
            <p>• Optional fields: <code>ai_title</code>, <code>weather</code>, <code>image</code></p>
            {config?.has_token && (
              <p>• Include token in header: <code>X-Webhook-Token: YOUR_TOKEN</code></p>
            )}
            <p>• Content-Type: <code>application/json</code> or <code>multipart/form-data</code> (for images)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
