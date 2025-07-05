import { Brain, Eye, Zap, CheckCircle, AlertCircle, Package, Car, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DetectedObject, SceneAnalysis } from '@/types/visitor';

interface AIAnalysisCardProps {
  aiConfidenceScore?: number;
  aiObjectsDetected?: string;
  aiSceneAnalysis?: string;
  aiProcessingComplete?: boolean;
  facesDetected?: number;
  className?: string;
}

const getObjectIcon = (objectType: string) => {
  const type = objectType.toLowerCase();
  if (type.includes('person') || type.includes('human')) return User;
  if (type.includes('car') || type.includes('vehicle')) return Car;
  if (type.includes('package') || type.includes('box')) return Package;
  return Eye;
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const getQualityColor = (quality: string) => {
  if (quality === 'high' || quality === 'good') return 'text-green-600';
  if (quality === 'medium' || quality === 'fair') return 'text-yellow-600';
  return 'text-red-600';
};

export const AIAnalysisCard = ({
  aiConfidenceScore,
  aiObjectsDetected,
  aiSceneAnalysis,
  aiProcessingComplete,
  facesDetected,
  className = ''
}: AIAnalysisCardProps) => {
  // Parse JSON data
  let detectedObjects: DetectedObject[] = [];
  let sceneAnalysis: SceneAnalysis | null = null;

  try {
    if (aiObjectsDetected) {
      detectedObjects = JSON.parse(aiObjectsDetected);
    }
  } catch (error) {
    console.error('Error parsing detected objects:', error);
  }

  try {
    if (aiSceneAnalysis) {
      sceneAnalysis = JSON.parse(aiSceneAnalysis);
    }
  } catch (error) {
    console.error('Error parsing scene analysis:', error);
  }

  // Don't render if no AI data is available
  if (!aiProcessingComplete && !aiConfidenceScore && !detectedObjects.length && !sceneAnalysis) {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Brain className="w-4 h-4 text-primary" />
          <span>AI Analysis</span>
          {aiProcessingComplete ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-600" />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Confidence */}
        {aiConfidenceScore !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Confidence</span>
              <Badge variant="outline" className={getConfidenceColor(aiConfidenceScore)}>
                {Math.round(aiConfidenceScore)}%
              </Badge>
            </div>
            <Progress value={aiConfidenceScore} className="h-2" />
          </div>
        )}

        {/* Scene Analysis */}
        {sceneAnalysis && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>Scene Analysis</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {sceneAnalysis.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                {sceneAnalysis.lighting} lighting
              </Badge>
              <Badge variant="outline" className={`text-xs ${getQualityColor(sceneAnalysis.image_quality)}`}>
                {sceneAnalysis.image_quality} quality
              </Badge>
            </div>
          </div>
        )}

        {/* Detected Objects */}
        {detectedObjects.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center space-x-1">
              <Package className="w-3 h-3" />
              <span>Detected Objects ({detectedObjects.length})</span>
            </h4>
            <div className="space-y-1">
              {detectedObjects.slice(0, 5).map((obj, index) => {
                const IconComponent = getObjectIcon(obj.object);
                return (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-3 h-3 text-muted-foreground" />
                      <span className="capitalize">{obj.object}</span>
                      <span className="text-muted-foreground">- {obj.description}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getConfidenceColor(obj.confidence)}`}>
                      {Math.round(obj.confidence)}%
                    </Badge>
                  </div>
                );
              })}
              {detectedObjects.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{detectedObjects.length - 5} more objects
                </p>
              )}
            </div>
          </div>
        )}

        {/* Face Detection Summary */}
        {facesDetected !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>Faces Detected</span>
            </span>
            <Badge variant="outline" className={facesDetected > 0 ? 'text-blue-600 bg-blue-50 border-blue-200' : ''}>
              {facesDetected}
            </Badge>
          </div>
        )}

        {/* Processing Status */}
        {!aiProcessingComplete && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            <span>AI analysis in progress...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
