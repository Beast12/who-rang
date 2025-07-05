import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  UserPlus, 
  Trash2, 
  Eye,
  AlertCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useUnassignedFaces, usePersons, useAssignFaceToPerson, useBulkAssignFaces, useDeleteFace } from '@/hooks/useFaces';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { FaceThumbnail } from './FaceThumbnail';
import { CreatePersonDialog } from './CreatePersonDialog';
import { FaceAssignmentDialog } from './FaceAssignmentDialog';

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

export const UnknownFacesDashboard = () => {
  const [selectedFaces, setSelectedFaces] = useState<Set<number>>(new Set());
  const [qualityFilter, setQualityFilter] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreatePerson, setShowCreatePerson] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedFaceForAssignment, setSelectedFaceForAssignment] = useState<DetectedFace | null>(null);

  const isMobile = useIsMobile();
  const { data: facesData, isLoading, error, refetch } = useUnassignedFaces(50, 0, qualityFilter);
  const { data: persons = [] } = usePersons();
  const assignFaceMutation = useAssignFaceToPerson();
  const bulkAssignMutation = useBulkAssignFaces();
  const deleteFaceMutation = useDeleteFace();

  const faces = facesData?.faces || [];
  const pagination = facesData?.pagination;

  // Filter faces by search term
  const filteredFaces = faces.filter(face => 
    face.ai_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(face.timestamp).toLocaleDateString().includes(searchTerm)
  );

  const handleSelectFace = (faceId: number, selected: boolean) => {
    const newSelected = new Set(selectedFaces);
    if (selected) {
      newSelected.add(faceId);
    } else {
      newSelected.delete(faceId);
    }
    setSelectedFaces(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFaces.size === filteredFaces.length) {
      setSelectedFaces(new Set());
    } else {
      setSelectedFaces(new Set(filteredFaces.map(f => f.id)));
    }
  };

  const handleAssignToExistingPerson = (personId: number) => {
    if (selectedFaces.size === 0) return;

    const faceIds = Array.from(selectedFaces);
    bulkAssignMutation.mutate({ faceIds, personId }, {
      onSuccess: () => {
        setSelectedFaces(new Set());
        refetch();
      }
    });
  };

  const handleAssignSingleFace = (face: DetectedFace) => {
    setSelectedFaceForAssignment(face);
    setShowAssignDialog(true);
  };

  const handleDeleteSelected = () => {
    if (selectedFaces.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedFaces.size} selected faces?`)) {
      selectedFaces.forEach(faceId => {
        deleteFaceMutation.mutate(faceId);
      });
      setSelectedFaces(new Set());
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load unknown faces. Please try again.
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => refetch()}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}>
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Unknown Faces</span>
                {pagination && (
                  <Badge variant="secondary">
                    {pagination.total} total
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Review and assign unidentified faces to persons
              </CardDescription>
            </div>
            <div className={`flex items-center ${isMobile ? 'justify-between' : 'space-x-2'}`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isMobile ? '' : 'mr-1'} ${isLoading ? 'animate-spin' : ''}`} />
                {!isMobile && 'Refresh'}
              </Button>
              <Button
                onClick={() => setShowCreatePerson(true)}
                size="sm"
              >
                <UserPlus className={`w-4 h-4 ${isMobile ? '' : 'mr-1'}`} />
                {isMobile ? 'New' : 'New Person'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by event title or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Quality Filter */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="quality-filter" className="text-sm whitespace-nowrap">
                Min Quality:
              </Label>
              <Select
                value={qualityFilter.toString()}
                onValueChange={(value) => setQualityFilter(parseFloat(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All</SelectItem>
                  <SelectItem value="0.6">Medium+</SelectItem>
                  <SelectItem value="0.8">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedFaces.size > 0 && (
              <div className="flex items-center space-x-2 border-l pl-4">
                <Badge variant="outline">
                  {selectedFaces.size} selected
                </Badge>
                <Select onValueChange={(value) => handleAssignToExistingPerson(parseInt(value))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map((person) => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteFaceMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Faces Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 w-8 p-0"
              >
                {selectedFaces.size === filteredFaces.length && filteredFaces.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                {filteredFaces.length} faces
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredFaces.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'No matching faces found' : 'No unknown faces'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters'
                  : 'All detected faces have been assigned to persons'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFaces.map((face) => (
                <div key={face.id} className="relative group">
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedFaces.has(face.id)}
                      onCheckedChange={(checked) => 
                        handleSelectFace(face.id, checked as boolean)
                      }
                      className="bg-white/90 border-2"
                    />
                  </div>

                  {/* Quality Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <Badge 
                      variant="secondary" 
                      className={`text-white text-xs ${getQualityColor(face.quality_score)}`}
                    >
                      {getQualityLabel(face.quality_score)}
                    </Badge>
                  </div>

                  {/* Face Thumbnail */}
                  <div className="aspect-square relative overflow-hidden rounded-lg border-2 border-transparent group-hover:border-primary transition-colors">
                    <FaceThumbnail
                      imageUrl={face.thumbnail_path || face.face_crop_path}
                      size="lg"
                      isUnknown={true}
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAssignSingleFace(face)}
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          // Open original image in modal
                          window.open(face.original_image, '_blank');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Face Info */}
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-muted-foreground truncate">
                      {face.ai_title}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {new Date(face.timestamp).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(face.confidence)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreatePersonDialog
        open={showCreatePerson}
        onOpenChange={setShowCreatePerson}
      />

      {selectedFaceForAssignment && (
        <FaceAssignmentDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          face={selectedFaceForAssignment}
          persons={persons}
          onAssign={(personId) => {
            if (selectedFaceForAssignment) {
              assignFaceMutation.mutate({
                faceId: selectedFaceForAssignment.id,
                personId
              }, {
                onSuccess: () => {
                  setShowAssignDialog(false);
                  setSelectedFaceForAssignment(null);
                  refetch();
                }
              });
            }
          }}
        />
      )}
    </div>
  );
};
