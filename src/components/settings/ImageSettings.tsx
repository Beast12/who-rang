import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ImageSettings = () => {
  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Image Settings</CardTitle>
        <CardDescription className="text-muted-foreground">
          Configure image display and storage preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Image Quality</Label>
          <Select defaultValue="high">
            <SelectTrigger className="text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border">
              <SelectItem value="low">Low (Faster loading)</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High (Best quality)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-foreground font-medium">
              Auto-download Images
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically cache images locally
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
};
