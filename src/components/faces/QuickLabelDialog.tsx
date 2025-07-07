import { useState } from 'react';
import { User, UserPlus, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { usePersons, useLabelVisitor, useCreatePerson } from '@/hooks/useFaces';
import { getImageUrl } from '@/utils/imageUtils';

interface QuickLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitorEvent?: {
    id: number;
    image_url: string;
    visitor_id: string;
    ai_message: string;
    timestamp: string;
  };
}

export const QuickLabelDialog = ({
  open,
  onOpenChange,
  visitorEvent,
}: QuickLabelDialogProps) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [newPersonName, setNewPersonName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { data: persons = [] } = usePersons();
  const labelVisitorMutation = useLabelVisitor();
  const createPersonMutation = useCreatePerson();

  const handleLabelExisting = async () => {
    if (!visitorEvent || !selectedPersonId) return;

    try {
      await labelVisitorMutation.mutateAsync({
        visitorEventId: visitorEvent.id,
        personId: parseInt(selectedPersonId),
        confidence: 0.95, // Manual labeling gets high confidence
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Failed to label visitor:', error);
    }
  };

  const handleCreateAndLabel = async () => {
    if (!visitorEvent || !newPersonName.trim()) return;

    try {
      // First create the person
      const newPerson = await createPersonMutation.mutateAsync({
        name: newPersonName.trim(),
      });

      // Then label the visitor with the new person
      await labelVisitorMutation.mutateAsync({
        visitorEventId: visitorEvent.id,
        personId: newPerson.id,
        confidence: 0.95,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create person and label visitor:', error);
    }
  };

  const resetForm = () => {
    setSelectedPersonId('');
    setNewPersonName('');
    setIsCreatingNew(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  if (!visitorEvent) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Who is this person?</span>
          </DialogTitle>
          <DialogDescription>
            Help improve face recognition by identifying this visitor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Visitor Image */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <img
                  src={getImageUrl(visitorEvent.image_url)}
                  alt="Unknown visitor"
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    "{visitorEvent.ai_message}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(visitorEvent.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Labeling Options */}
          <div className="space-y-4">
            {!isCreatingNew ? (
              <div className="space-y-2">
                <Label htmlFor="person-select">Select existing person</Label>
                <Select
                  value={selectedPersonId}
                  onValueChange={setSelectedPersonId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a person..." />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map((person) => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{person.name}</span>
                          {person.detection_count && (
                            <span className="text-xs text-muted-foreground">
                              ({person.detection_count} detections)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="new-person-name">New person name</Label>
                <Input
                  id="new-person-name"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Enter person's name..."
                  autoFocus
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {!isCreatingNew ? (
                <>
                  <Button
                    onClick={handleLabelExisting}
                    disabled={
                      !selectedPersonId || labelVisitorMutation.isPending
                    }
                    className="flex-1"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Label as Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingNew(true)}
                    className="flex-1"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add New Person
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleCreateAndLabel}
                    disabled={
                      !newPersonName.trim() || createPersonMutation.isPending
                    }
                    className="flex-1"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create & Label
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingNew(false)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </>
              )}
            </div>
          </div>

          <Button variant="ghost" onClick={handleClose} className="w-full">
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
