
import { useState } from 'react';
import { Copy, Check, ExternalLink, Code, Database, Webhook, Settings, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

const ApiDocs = () => {
  const [copiedText, setCopiedText] = useState<string>('');
  const isMobile = useIsMobile();

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const CodeBlock = ({ code, language = 'json', id }: { code: string; language?: string; id: string }) => (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedText === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );

  const containerClass = isMobile 
    ? "min-h-screen bg-background pb-20" 
    : "min-h-screen bg-background";

  return (
    <div className={containerClass}>
      {isMobile ? (
        <MobileHeader title="API Docs" />
      ) : (
        <div className={`container mx-auto px-4 max-w-5xl ${isMobile ? 'py-4' : 'py-8'}`}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-4xl font-bold mb-4">Smart Doorbell API Documentation</h1>
            <p className="text-lg text-muted-foreground">
              Complete API reference for integrating with the Smart Doorbell system
            </p>
          </div>
        </div>
      )}

      <div className={`container mx-auto px-4 max-w-5xl ${isMobile ? 'py-4' : 'py-8'}`}>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4 lg:grid-cols-7'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            {!isMobile && (
              <>
                <TabsTrigger value="visitors">Visitors</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="database">Database</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
                <TabsTrigger value="websocket">WebSocket</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    API Overview
                  </CardTitle>
                  <CardDescription>
                    The Smart Doorbell API provides endpoints for webhook integration, visitor management, and system configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Base URL</h3>
                    <CodeBlock code="https://your-domain.com/api" language="text" id="base-url" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Webhook endpoints require a token for authentication. Include it in the request body or configure it in settings.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Content Type</h3>
                    <p className="text-sm text-muted-foreground">
                      All API endpoints accept and return JSON data with <code>Content-Type: application/json</code>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Start with Home Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Here's a complete Home Assistant automation example:
                  </p>
                  <CodeBlock 
                    code={`# In configuration.yaml
rest_command:
  doorbell_webhook:
    url: "https://your-domain.com/api/webhook/doorbell"
    method: POST
    content_type: "application/json"
    payload: >
      {
        "ai_message": "{{ ai_message }}",
        "ai_title": "{{ ai_title }}",
        "location": "Front Door",
        "image_url": "{{ image_url }}",
        "confidence_score": 95,
        "objects_detected": "visitor",
        "device_name": "Reolink Video Doorbell",
        "weather_temperature": {{ weather_temp | default(20) }},
        "weather_humidity": {{ weather_humidity | default(50) }},
        "weather_condition": "{{ weather_condition | default('unknown') }}",
        "weather_wind_speed": {{ wind_speed | default(0) }},
        "weather_pressure": {{ pressure | default(1013) }}
      }`}
                    language="yaml"
                    id="ha-config"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Webhook */}
          <TabsContent value="webhook">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="w-5 h-5" />
                    Webhook Endpoint
                  </CardTitle>
                  <CardDescription>
                    Receive doorbell events from external systems like Home Assistant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">POST</Badge>
                      <code className="text-sm">/api/webhook/doorbell</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Main webhook endpoint for receiving doorbell events with visitor data and AI analysis.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Request Body</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Required Fields</h4>
                        <ul className="text-sm space-y-1 ml-4">
                          <li><code>ai_message</code> <Badge variant="outline">string</Badge> - AI-generated description of the visitor</li>
                          <li><code>location</code> <Badge variant="outline">string</Badge> - Location of the doorbell (e.g., "Front Door")</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Optional Fields</h4>
                        <ul className="text-sm space-y-1 ml-4">
                          <li><code>ai_title</code> <Badge variant="outline">string</Badge> - Short title for the event</li>
                          <li><code>image_url</code> <Badge variant="outline">string</Badge> - URL to visitor image</li>
                          <li><code>confidence_score</code> <Badge variant="outline">number</Badge> - AI confidence (0-100)</li>
                          <li><code>objects_detected</code> <Badge variant="outline">string</Badge> - Detected objects</li>
                          <li><code>device_name</code> <Badge variant="outline">string</Badge> - Name of the doorbell device</li>
                          <li><code>weather_temperature</code> <Badge variant="outline">number</Badge> - Temperature in °C</li>
                          <li><code>weather_humidity</code> <Badge variant="outline">number</Badge> - Humidity percentage</li>
                          <li><code>weather_condition</code> <Badge variant="outline">string</Badge> - Weather condition</li>
                          <li><code>weather_wind_speed</code> <Badge variant="outline">number</Badge> - Wind speed</li>
                          <li><code>weather_pressure</code> <Badge variant="outline">number</Badge> - Atmospheric pressure</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Example Request</h3>
                    <CodeBlock
                      code={`{
  "ai_message": "A delivery person is at the front door holding a package",
  "ai_title": "Package Delivery",
  "location": "Front Door",
  "image_url": "https://example.com/snapshot.jpg",
  "confidence_score": 95,
  "objects_detected": "person, package",
  "device_name": "Reolink Video Doorbell",
  "weather_temperature": 22.5,
  "weather_humidity": 65,
  "weather_condition": "partly_cloudy",
  "weather_wind_speed": 5.2,
  "weather_pressure": 1013.25
}`}
                      id="webhook-request"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Example Response</h3>
                    <CodeBlock
                      code={`{
  "id": 123,
  "visitor_id": "uuid-here",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ai_message": "A delivery person is at the front door holding a package",
  "ai_title": "Package Delivery",
  "image_url": "/uploads/filename.jpg",
  "location": "Front Door",
  "weather": "partly_cloudy",
  "confidence_score": 95,
  "objects_detected": "person, package",
  "device_name": "Reolink Video Doorbell",
  "weather_temperature": 22.5,
  "weather_humidity": 65,
  "weather_condition": "partly_cloudy",
  "weather_wind_speed": 5.2,
  "weather_pressure": 1013.25
}`}
                      id="webhook-response"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Visitors */}
          <TabsContent value="visitors">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Visitors API
                  </CardTitle>
                  <CardDescription>
                    Retrieve and manage visitor event data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/api/visitors</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Get paginated list of visitors with optional search</p>
                    
                    <h4 className="font-medium text-sm mb-2">Query Parameters</h4>
                    <ul className="text-sm space-y-1 ml-4 mb-3">
                      <li><code>page</code> <Badge variant="outline">number</Badge> - Page number (default: 1)</li>
                      <li><code>limit</code> <Badge variant="outline">number</Badge> - Items per page (default: 20)</li>
                      <li><code>search</code> <Badge variant="outline">string</Badge> - Search in messages, titles, or locations</li>
                    </ul>

                    <CodeBlock
                      code={`{
  "visitors": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "hasMore": true
}`}
                      id="visitors-response"
                    />
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/api/visitors/:id</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Get specific visitor by ID</p>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive">DELETE</Badge>
                      <code className="text-sm">/api/visitors/:id</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Delete specific visitor by ID</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stats */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Statistics API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm">/api/stats</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Get dashboard statistics</p>
                  
                  <CodeBlock
                    code={`{
  "today": 5,
  "week": 23,
  "month": 87,
  "total": 342,
  "peakHour": 14,
  "isOnline": true,
  "connectedClients": 3
}`}
                    id="stats-response"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm">/api/database/stats</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Get database statistics</p>
                  
                  <CodeBlock
                    code={`{
  "totalEvents": 342,
  "databaseSize": "2.5 MB"
}`}
                    id="db-stats-response"
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">DELETE</Badge>
                    <code className="text-sm">/api/database/clear</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Clear all visitor events from database</p>
                  
                  <CodeBlock
                    code={`{
  "message": "Database cleared successfully",
  "deletedCount": 342
}`}
                    id="db-clear-response"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Config */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuration API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">GET</Badge>
                    <code className="text-sm">/api/config/webhook</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Get webhook configuration</p>
                  
                  <CodeBlock
                    code={`{
  "webhook_url": "https://your-domain.com/api/webhook/doorbell",
  "webhook_path": "/api/webhook/doorbell",
  "has_token": true,
  "webhook_token": "***",
  "public_url": "https://your-domain.com"
}`}
                    id="webhook-config-response"
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">PUT</Badge>
                    <code className="text-sm">/api/config/webhook</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Update webhook configuration</p>
                  
                  <CodeBlock
                    code={`{
  "webhook_token": "your-secret-token",
  "webhook_path": "/api/webhook/custom-path"
}`}
                    id="webhook-config-request"
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">POST</Badge>
                    <code className="text-sm">/api/config/webhook/test</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Send test webhook event</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WebSocket */}
          <TabsContent value="websocket">
            <Card>
              <CardHeader>
                <CardTitle>WebSocket Events</CardTitle>
                <CardDescription>Real-time updates via WebSocket connection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Connection</h3>
                  <CodeBlock code="ws://your-domain.com" language="text" id="ws-url" />
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Event Types</h3>
                  <ul className="space-y-2 text-sm">
                    <li><code>new_visitor</code> - New visitor event received</li>
                    <li><code>stats_update</code> - Dashboard statistics updated</li>
                    <li><code>connection_status</code> - Connection status change</li>
                    <li><code>database_cleared</code> - Database was cleared</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Example Event</h3>
                  <CodeBlock
                    code={`{
  "type": "new_visitor",
  "data": {
    "id": 123,
    "visitor_id": "uuid-here",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "ai_message": "A delivery person is at the front door",
    "location": "Front Door",
    ...
  }
}`}
                    id="ws-event"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            For more information, visit the{' '}
            <a href="/settings" className="text-primary hover:underline inline-flex items-center gap-1">
              Settings page <ExternalLink className="w-3 h-3" />
            </a>{' '}
            to configure your webhook endpoints.
          </p>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default ApiDocs;
