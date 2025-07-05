import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Users, Eye } from 'lucide-react';
import { FaceThumbnail } from './FaceThumbnail';
import { useFaceSimilarities } from '@/hooks/useFaces';

interface DetectedFace {
  id: number;
  visitor_event_id: number;
  face_crop_path: string;
  thumbnail_path: string;
  bounding_box: any;
  confidence: number;
  quality_score: number;
  created_at: string;
  timestamp: string;
  ai_title: string;
  original_image: string;
}

interface Person {
  id: number;
  name: string;
  notes?: string;
  face_count?: number;
  detection_count?: number;
}

interface FaceAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  face: DetectedFace;
  persons: Person[];
  onAssign: (personId: number) => void;
}

export const FaceAssignmentDialog = ({ 
  open, 
  onOpenChange, 
  face, 
  persons, 
  onAssign 
}: FaceAssignmentDialogProps) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const { data: similaritiesData } = useFaceSimilarities(face.id, 0.6, 5);

  const handleAssign = () => {
    if (selectedPersonId) {
      onAssign(parseInt(selectedPersonId));
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>Assign Face to Person</span>
          </DialogTitle>
          <DialogDescription>
            Choose which person this face belongs to, or create a new person profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Face Details */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-lg overflow-hidden border">
                    <FaceThumbnail
                      src={face.thumbnail_path || face.face_crop_path}
                      alt="Face to assign"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`absolute -top-2 -right-2 text-white text-xs ${getQualityColor(face.quality_score)}`}
                  >
                    {getQualityLabel(face.quality_score)}
                  </Badge>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-medium">{face.ai_title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(face.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <span className="text-muted-foreground">Confidence:</span>
                      <Badge variant="outline">{Math.round(face.confidence)}%</Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-muted-foreground">Quality:</span>
                      <Badge variant="outline">{Math.round(face.quality_score * 100)}%</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(face.original_image, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Original
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similar Faces */}
          {similaritiesData && similaritiesData.similarities.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Similar Faces Found</h3>
                <div className="grid grid-cols-5 gap-3">
                  {similaritiesData.similarities.map((similar) => (
                    <div key={similar.id} className="text-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border mx-auto">
                          <FaceThumbnail
                            src={similar.thumbnail_path}
                            alt="Similar face"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 text-xs"
                        >
                          {Math.round(similar.similarity * 100)}%
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground truncate">
                        {similar.person_name || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  These faces have similar features. Consider if they belong to the same person.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Person Selection */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Assign to Person</h3>
              <div className="space-y-4">
                <div>
                  <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person..." />
                    </SelectTrigger>
                    <SelectContent>
                      {persons.map((person) => (
                        <SelectItem key={person.id} value={person.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{person.name}</span>
                            <div className="flex items-center space-x-2 ml-4">
                              {person.face_count && (
                                <Badge variant="outline" className="text-xs">
                                  {person.face_count} faces
                                </Badge>
                              )}
                              {person.detection_count && (
                                <Badge variant="outline" className="text-xs">
                                  {person.detection_count} visits
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {persons.length === 0 && (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No persons created yet. Create a new person to assign this face.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedPersonId}
          >
            Assign Face
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
