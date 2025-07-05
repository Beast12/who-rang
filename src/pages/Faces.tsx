
import { useState } from 'react';
import { ArrowLeft, Users, UserPlus, Search, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePersons, useDeletePerson, useFaceConfig } from '@/hooks/useFaces';
import { PersonCard } from '@/components/faces/PersonCard';
import { CreatePersonDialog } from '@/components/faces/CreatePersonDialog';
import { FaceRecognitionSettings } from '@/components/faces/FaceRecognitionSettings';
import { UnknownFacesDashboard } from '@/components/faces/UnknownFacesDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Faces = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const isMobile = useIsMobile();
  
  const { data: persons = [], isLoading, error: personsError, refetch: refetchPersons } = usePersons();
  const { data: config, error: configError } = useFaceConfig();
  const deletePersonMutation = useDeletePerson();

  // Ensure persons is always an array
  const safePersons = Array.isArray(persons) ? persons : [];

  const filteredPersons = safePersons.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeletePerson = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will remove all face data and associations.`)) {
      deletePersonMutation.mutate(id);
    }
  };

  const handleRetry = () => {
    refetchPersons();
  };

  // Show error state if there are API connection issues
  if (personsError || configError) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground">Face Recognition</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="mt-2">
              Unable to connect to the face recognition service. Please check that the backend server is running and accessible.
              <div className="mt-4">
                <Button onClick={handleRetry} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const containerClass = isMobile 
    ? "min-h-screen bg-background text-foreground pb-20" 
    : "min-h-screen bg-background text-foreground";

  return (
    <div className={containerClass}>
      {/* Mobile Header */}
      {isMobile ? (
        <MobileHeader 
          title="Face Recognition"
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm}
          rightButton={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              disabled={!config?.enabled}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add
            </Button>
          }
        />
      ) : (
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground">Face Recognition</h1>
                  {!config?.enabled && (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  disabled={!config?.enabled}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Person
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`container mx-auto px-4 max-w-6xl ${isMobile ? 'py-4' : 'py-8'}`}>
        {!config?.enabled ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Face Recognition Disabled</CardTitle>
              <CardDescription>
                Enable face recognition to start identifying and labeling recurring visitors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowSettings(true)}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Configure Face Recognition
              </Button>
            </CardContent>
          </Card>
        ) : (
        <Tabs defaultValue="persons" className="space-y-6">
            <TabsList className={`grid w-full bg-muted ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <TabsTrigger value="persons" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                {isMobile ? 'Persons' : 'Recognized Persons'}
              </TabsTrigger>
              <TabsTrigger value="unknown" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                {isMobile ? 'Unknown' : 'Unknown Faces'}
              </TabsTrigger>
              {!isMobile && (
                <TabsTrigger value="events" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                  Recent Events
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="persons" className="space-y-6">
              {/* Stats Cards */}
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Persons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safePersons.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Detections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {safePersons.reduce((sum, p) => sum + (p.detection_count || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Profiles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {safePersons.filter(p => (p.detection_count || 0) > 0).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search persons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Persons Grid */}
              {isLoading ? (
                <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-20 bg-muted rounded mb-4"></div>
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredPersons.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {searchTerm ? 'No matching persons found' : 'No persons yet'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? 'Try adjusting your search terms'
                        : 'Add people to start recognizing them in visitor events'
                      }
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add First Person
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {filteredPersons.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      onDelete={handleDeletePerson}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="unknown" className="space-y-6">
              <UnknownFacesDashboard />
            </TabsContent>

            {!isMobile && (
              <TabsContent value="events" className="space-y-6">
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-muted-foreground">
                      Recent events with face recognition will appear here
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>

      {/* Dialogs */}
      <CreatePersonDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      
      <FaceRecognitionSettings
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      {/* Mobile Navigation */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default Faces;
