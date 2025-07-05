
import { Bot, Eye, Package, User, Brain, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { VisitorEvent, DetectedObject, SceneAnalysis } from '@/types/visitor';
import { getImageUrl } from '@/utils/imageUtils';

interface AIAnalysisCardProps {
  visitor: VisitorEvent;
}

export const AIAnalysisCard = ({ visitor }: AIAnalysisCardProps) => {
  const imageUrl = getImageUrl(visitor.image_url);
  
  // Parse AI analysis data
  let detectedObjects: DetectedObject[] = [];
  let sceneAnalysis: SceneAnalysis | null = null;

  try {
    if (visitor.ai_objects_detected) {
      detectedObjects = JSON.parse(visitor.ai_objects_detected);
    }
  } catch (error) {
    console.error('Error parsing detected objects:', error);
  }

  try {
    if (visitor.ai_scene_analysis) {
      sceneAnalysis = JSON.parse(visitor.ai_scene_analysis);
    }
  } catch (error) {
    console.error('Error parsing scene analysis:', error);
  }

  const getAnalysisIcon = (message: string) => {
    const messageLower = message.toLowerCase();
    if (messageLower.includes('package') || messageLower.includes('delivery')) return Package;
    if (messageLower.includes('person') || messageLower.includes('visitor')) return User;
    return Eye;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getQualityColor = (quality: string) => {
    if (quality === 'high' || quality === 'good') return 'text-green-600';
    if (quality === 'medium' || quality === 'fair') return 'text-yellow-600';
    return 'text-red-600';
  };

  const AnalysisIcon = getAnalysisIcon(visitor.ai_message);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-primary" />
            <span>AI Analysis Results</span>
            {visitor.ai_processing_complete ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            )}
          </CardTitle>
          {visitor.ai_confidence_score && (
            <Badge variant="secondary" className={getConfidenceColor(visitor.ai_confidence_score)}>
              {Math.round(visitor.ai_confidence_score)}% Confidence
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={`Visitor ${visitor.visitor_id}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="text-white text-sm font-medium">
                AI Analysis Feed
              </div>
              {visitor.faces_detected !== undefined && (
                <div className="text-white/80 text-xs">
                  {visitor.faces_detected} faces detected
                </div>
              )}
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <AnalysisIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {visitor.ai_title || 'Detection Result'}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {visitor.ai_message}
                </p>
              </div>
            </div>

            {/* Overall Confidence */}
            {visitor.ai_confidence_score !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Confidence</span>
                  <span className="font-medium">{Math.round(visitor.ai_confidence_score)}%</span>
                </div>
                <Progress value={visitor.ai_confidence_score} className="h-2" />
              </div>
            )}

            {/* Scene Analysis */}
            {sceneAnalysis && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Scene Analysis</h4>
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
          </div>
        </div>

        {/* Detected Objects */}
        {detectedObjects.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center space-x-1">
              <Package className="w-4 h-4" />
              <span>Detected Objects ({detectedObjects.length})</span>
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {detectedObjects.map((obj, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium capitalize">{obj.object}</div>
                      <div className="text-xs text-muted-foreground">{obj.description}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getConfidenceColor(obj.confidence)}`}>
                    {Math.round(obj.confidence)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Status */}
        {!visitor.ai_processing_complete && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-yellow-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>AI analysis in progress...</span>
          </div>
        )}

        {/* Legacy fallback for old data */}
        {!visitor.ai_processing_complete && visitor.objects_detected && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Legacy Objects:</span>
              <span className="text-foreground font-medium">{visitor.objects_detected}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
