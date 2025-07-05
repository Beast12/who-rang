
import { useParams, useNavigate } from 'react-router-dom';
import { useVisitor } from '@/hooks/useVisitors';
import { DashboardHeader } from '@/components/VisitorDashboard/DashboardHeader';
import { AIAnalysisCard } from '@/components/VisitorDashboard/AIAnalysisCard';
import { EventDetailsPanel } from '@/components/VisitorDashboard/EventDetailsPanel';

const VisitorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: visitor, isLoading, error } = useVisitor(Number(id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-64 bg-muted rounded"></div>
              </div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !visitor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Visitor Not Found</h1>
          <p className="text-muted-foreground">The visitor you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader visitorId={visitor.visitor_id} onBack={() => navigate('/')} />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Area - AI Analysis */}
          <div className="lg:col-span-2">
            <AIAnalysisCard visitor={visitor} />
          </div>

          {/* Event Details Panel - Right Sidebar */}
          <div className="lg:col-span-1">
            <EventDetailsPanel visitor={visitor} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorDetail;
