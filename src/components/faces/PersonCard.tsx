
import { useState } from 'react';
import { User, Trash2, Edit, Eye, Calendar } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Person } from '@/types/faces';

interface PersonCardProps {
  person: Person;
  onDelete: (id: number, name: string) => void;
}

export const PersonCard = ({ person, onDelete }: PersonCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{person.name}</CardTitle>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Added {formatDate(person.created_at)}</span>
              </div>
            </div>
          </div>
          {isHovered && (
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(person.id, person.name);
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-3">
        {person.notes && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {person.notes}
          </p>
        )}
        
        <div className="flex space-x-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-foreground">{person.encoding_count || 0}</div>
            <div className="text-muted-foreground">Training Images</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-foreground">{person.detection_count || 0}</div>
            <div className="text-muted-foreground">Detections</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex space-x-2">
            {(person.detection_count || 0) > 0 ? (
              <Badge variant="default" className="text-xs">Active</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
            {(person.encoding_count || 0) > 0 && (
              <Badge variant="outline" className="text-xs">Trained</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
