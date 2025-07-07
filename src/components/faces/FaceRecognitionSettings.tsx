import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Shield,
  Eye,
  Settings,
  AlertCircle,
  Server,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useFaceConfig, useUpdateFaceConfig } from '@/hooks/useFaces';
import {
  useOllamaModels,
  useTestOllamaConnection,
  useRefreshOllamaModels,
} from '@/hooks/useOllama';
import {
  useOpenAIModels,
  useTestOpenAIConnection,
  useRefreshOpenAIModels,
} from '@/hooks/useOpenAI';
import { FaceRecognitionConfig } from '@/types/faces';

interface FaceRecognitionSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FaceRecognitionSettings = ({
  open,
  onOpenChange,
}: FaceRecognitionSettingsProps) => {
  const { data: config, isLoading, error: configError } = useFaceConfig();
  const updateConfigMutation = useUpdateFaceConfig();
  const {
    data: ollamaData,
    isLoading: modelsLoading,
    error: modelsError,
  } = useOllamaModels();
  const testConnectionMutation = useTestOllamaConnection();
  const refreshModelsMutation = useRefreshOllamaModels();

  // OpenAI hooks
  const {
    data: openaiData,
    isLoading: openaiModelsLoading,
    error: openaiModelsError,
  } = useOpenAIModels();
  const testOpenAIConnectionMutation = useTestOpenAIConnection();
  const refreshOpenAIModelsMutation = useRefreshOpenAIModels();

  const [settings, setSettings] = useState<Partial<FaceRecognitionConfig>>({
    enabled: false,
    ai_provider: 'local',
    confidence_threshold: 0.6,
    training_images_per_person: 3,
    auto_delete_after_days: 0,
    background_processing: true,
    ollama_url: 'http://localhost:11434',
    ollama_model: 'llava',
  });
  const [apiKey, setApiKey] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (config) {
      setSettings(config);
    }
  }, [config]);

  const validateSettings = () => {
    if (
      settings.confidence_threshold &&
      (settings.confidence_threshold < 0.4 ||
        settings.confidence_threshold > 0.9)
    ) {
      setValidationError('Confidence threshold must be between 40% and 90%');
      return false;
    }

    if (
      settings.training_images_per_person &&
      settings.training_images_per_person < 1
    ) {
      setValidationError('Training images per person must be at least 1');
      return false;
    }

    if (
      settings.auto_delete_after_days &&
      settings.auto_delete_after_days < 0
    ) {
      setValidationError('Auto delete days cannot be negative');
      return false;
    }

    if (needsApiKey && !apiKey.trim() && !config?.has_api_key) {
      setValidationError('API key is required for the selected provider');
      return false;
    }

    // Validate Ollama URL if local provider is selected
    if (settings.ai_provider === 'local' && settings.ollama_url) {
      try {
        new URL(settings.ollama_url);
      } catch (error) {
        setValidationError('Invalid Ollama URL format');
        return false;
      }
    }

    setValidationError('');
    return true;
  };

  const handleSave = () => {
    if (!validateSettings()) {
      return;
    }

    const configToSave = {
      ...settings,
      // Ensure boolean values are properly typed
      enabled: Boolean(settings.enabled),
      background_processing: Boolean(settings.background_processing),
    };

    if (apiKey.trim()) {
      (configToSave as any).api_key = apiKey.trim();
    }

    console.log('Saving face config:', configToSave);

    updateConfigMutation.mutate(configToSave, {
      onSuccess: () => {
        setValidationError('');
        setApiKey(''); // Clear API key input after successful save
        onOpenChange(false);
      },
      onError: (error: any) => {
        console.error('Failed to save config:', error);
        const errorMessage =
          error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          'Failed to save settings';
        setValidationError(errorMessage);
      },
    });
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  const handleRefreshModels = () => {
    refreshModelsMutation.mutate();
  };

  const aiProviders = [
    {
      value: 'local',
      label: 'Local (Ollama)',
      description: 'Process on your own server',
    },
    {
      value: 'openai',
      label: 'OpenAI Vision',
      description: 'GPT-4 Vision API',
    },
    {
      value: 'claude',
      label: 'Anthropic Claude',
      description: 'Claude Vision API',
    },
    {
      value: 'gemini',
      label: 'Google Gemini',
      description: 'Gemini Vision API',
    },
    {
      value: 'google-cloud-vision',
      label: 'Google Cloud Vision',
      description: 'Google Cloud API',
    },
  ];

  // Use dynamic models from Ollama or fallback to static list
  const availableModels = ollamaData?.models || [
    { value: 'llava', label: 'LLaVA (Default)' },
    { value: 'llava:7b', label: 'LLaVA 7B' },
    { value: 'llava:13b', label: 'LLaVA 13B' },
    { value: 'llava:34b', label: 'LLaVA 34B' },
    { value: 'bakllava', label: 'BakLLaVA' },
  ];

  const selectedProvider = aiProviders.find(
    (p) => p.value === settings.ai_provider
  );
  const needsApiKey = settings.ai_provider !== 'local';
  const isLocalProvider = settings.ai_provider === 'local';

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            Loading settings...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Face Recognition Settings</span>
          </DialogTitle>
          <DialogDescription>
            Configure face recognition to automatically identify recurring
            visitors
          </DialogDescription>
        </DialogHeader>

        {(configError || validationError || updateConfigMutation.error) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationError ||
                updateConfigMutation.error?.response?.data?.details ||
                updateConfigMutation.error?.response?.data?.error ||
                updateConfigMutation.error?.message ||
                configError?.message ||
                'An error occurred'}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Enable/Disable */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Face Recognition</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Enable Face Recognition
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect and identify faces in visitor images
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) =>
                    setSettings((prev) => ({ ...prev, enabled }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {settings.enabled && (
            <>
              {/* AI Provider */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Provider</CardTitle>
                  <CardDescription>
                    Choose the AI service for face detection and recognition
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={settings.ai_provider}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          ai_provider: value as any,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {aiProviders.map((provider) => (
                          <SelectItem
                            key={provider.value}
                            value={provider.value}
                          >
                            <div>
                              <div className="font-medium">
                                {provider.label}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {provider.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProvider && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge
                          variant={
                            settings.ai_provider === 'local'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {selectedProvider.label}
                        </Badge>
                        {settings.ai_provider === 'local' && (
                          <Badge variant="outline" className="text-green-600">
                            <Shield className="w-3 h-3 mr-1" />
                            Privacy-first
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedProvider.description}
                      </p>
                    </div>
                  )}

                  {/* Ollama Configuration */}
                  {isLocalProvider && (
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center space-x-2">
                          <Server className="w-4 h-4" />
                          <span>Ollama Configuration</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Configure your local Ollama instance
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="ollamaUrl">Ollama Server URL</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="ollamaUrl"
                              value={settings.ollama_url || ''}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  ollama_url: e.target.value,
                                }))
                              }
                              placeholder="http://localhost:11434"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleTestConnection}
                              disabled={testConnectionMutation.isPending}
                            >
                              {testConnectionMutation.isPending ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Zap className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            URL where your Ollama instance is running
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Ollama Model</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRefreshModels}
                              disabled={refreshModelsMutation.isPending}
                              className="h-6 px-2 text-xs"
                            >
                              {refreshModelsMutation.isPending ? (
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <RefreshCw className="w-3 h-3 mr-1" />
                              )}
                              Refresh
                            </Button>
                          </div>
                          <Select
                            value={settings.ollama_model || 'llava'}
                            onValueChange={(value) =>
                              setSettings((prev) => ({
                                ...prev,
                                ollama_model: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableModels.map((model) => (
                                <SelectItem
                                  key={model.value}
                                  value={model.value}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{model.label}</span>
                                    {model.size && model.size > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-xs"
                                      >
                                        {(
                                          model.size /
                                          1024 /
                                          1024 /
                                          1024
                                        ).toFixed(1)}
                                        GB
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {modelsLoading && 'Loading available models...'}
                            {ollamaData?.fallback &&
                              'Could not connect to Ollama - showing default models'}
                            {ollamaData?.error && (
                              <span className="text-destructive">
                                {ollamaData.error}
                              </span>
                            )}
                            {!modelsLoading &&
                              !ollamaData?.fallback &&
                              !ollamaData?.error &&
                              `${ollamaData?.total || 0} models available from ${ollamaData?.ollama_url}`}
                          </p>
                        </div>

                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Make sure Ollama is installed and the selected model
                            is downloaded. Run{' '}
                            <code className="bg-muted px-1 rounded">
                              ollama pull {settings.ollama_model || 'llava'}
                            </code>{' '}
                            to download the model.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  )}

                  {/* OpenAI Configuration */}
                  {settings.ai_provider === 'openai' && (
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center space-x-2">
                          <Zap className="w-4 h-4" />
                          <span>OpenAI Configuration</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Configure your OpenAI API settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="openaiApiKey"
                              type="password"
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              placeholder="Enter your OpenAI API key"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                testOpenAIConnectionMutation.mutate()
                              }
                              disabled={testOpenAIConnectionMutation.isPending}
                            >
                              {testOpenAIConnectionMutation.isPending ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Zap className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          {config?.has_api_key && !apiKey && (
                            <p className="text-xs text-muted-foreground">
                              API key is already configured. Leave blank to keep
                              current key.
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>OpenAI Model</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                refreshOpenAIModelsMutation.mutate()
                              }
                              disabled={refreshOpenAIModelsMutation.isPending}
                              className="h-6 px-2 text-xs"
                            >
                              {refreshOpenAIModelsMutation.isPending ? (
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <RefreshCw className="w-3 h-3 mr-1" />
                              )}
                              Refresh
                            </Button>
                          </div>
                          <Select
                            value={settings.openai_model || 'gpt-4o'}
                            onValueChange={(value) =>
                              setSettings((prev) => ({
                                ...prev,
                                openai_model: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {openaiData?.models?.map((model) => (
                                <SelectItem
                                  key={model.value}
                                  value={model.value}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{model.label}</span>
                                    {model.created && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-xs"
                                      >
                                        {new Date(
                                          model.created * 1000
                                        ).getFullYear()}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              )) || [
                                <SelectItem key="gpt-4o" value="gpt-4o">
                                  GPT-4o (Recommended)
                                </SelectItem>,
                                <SelectItem
                                  key="gpt-4o-mini"
                                  value="gpt-4o-mini"
                                >
                                  GPT-4o Mini (Cost-effective)
                                </SelectItem>,
                                <SelectItem
                                  key="gpt-4-vision-preview"
                                  value="gpt-4-vision-preview"
                                >
                                  GPT-4 Vision Preview
                                </SelectItem>,
                              ]}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {openaiModelsLoading &&
                              'Loading available models...'}
                            {openaiData?.fallback &&
                              'Could not connect to OpenAI - showing default models'}
                            {openaiData?.error && (
                              <span className="text-destructive">
                                {openaiData.error}
                              </span>
                            )}
                            {!openaiModelsLoading &&
                              !openaiData?.fallback &&
                              !openaiData?.error &&
                              `${openaiData?.total || 0} models available from OpenAI`}
                          </p>
                        </div>

                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            OpenAI API usage will incur costs. Monitor your
                            usage in the OpenAI dashboard. GPT-4o is recommended
                            for best accuracy, while GPT-4o Mini offers cost
                            savings.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  )}

                  {needsApiKey && settings.ai_provider !== 'openai' && (
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={`Enter your ${selectedProvider?.label} API key`}
                      />
                      {config?.has_api_key && !apiKey && (
                        <p className="text-sm text-muted-foreground">
                          API key is already configured. Leave blank to keep
                          current key.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Performance Settings
                  </CardTitle>
                  <CardDescription>
                    Adjust recognition accuracy and processing behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Confidence Threshold</Label>
                      <span className="text-sm font-mono">
                        {(settings.confidence_threshold * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={[settings.confidence_threshold]}
                      onValueChange={([value]) =>
                        setSettings((prev) => ({
                          ...prev,
                          confidence_threshold: value,
                        }))
                      }
                      min={0.4}
                      max={0.9}
                      step={0.05}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values = more accurate but fewer matches
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Training Images per Person</Label>
                    <Select
                      value={settings.training_images_per_person?.toString()}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          training_images_per_person: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          1 image (fast, less accurate)
                        </SelectItem>
                        <SelectItem value="3">
                          3 images (recommended)
                        </SelectItem>
                        <SelectItem value="5">
                          5 images (slower, more accurate)
                        </SelectItem>
                        <SelectItem value="10">
                          10 images (best accuracy)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        Background Processing
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Process faces in the background to avoid blocking UI
                      </p>
                    </div>
                    <Switch
                      checked={settings.background_processing}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          background_processing: checked,
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Privacy Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Privacy & Data Retention</span>
                  </CardTitle>
                  <CardDescription>
                    Control how long face data is stored
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Auto-delete face data after</Label>
                    <Select
                      value={settings.auto_delete_after_days?.toString()}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          auto_delete_after_days: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">
                          Never (manual cleanup only)
                        </SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="730">2 years</SelectItem>
                        <SelectItem value="1825">5 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          Privacy Notice
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 mt-1">
                          Face recognition data is processed and stored locally.
                          When using cloud providers, images may be sent to
                          external services for processing.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateConfigMutation.isPending}
          >
            {updateConfigMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
