import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Zap,
  Target,
  Calendar,
  BarChart3,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import { useOpenAIUsageStats, useOpenAIUsageLogs } from '@/hooks/useOpenAI';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';

export const AIAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const { toast } = useToast();
  const {
    data: usageStats,
    isLoading: statsLoading,
    error: statsError,
  } = useOpenAIUsageStats(selectedPeriod);
  const {
    data: usageLogs,
    isLoading: logsLoading,
    error: logsError,
  } = useOpenAIUsageLogs(50, 0, selectedProvider);

  // Calculate overview metrics
  const overallStats = usageStats?.overall_stats?.[0] || {
    total_requests: 0,
    total_tokens: 0,
    total_cost: 0,
    avg_processing_time: 0,
    successful_requests: 0,
    failed_requests: 0,
  };

  const budget = usageStats?.budget || {
    monthly_limit: 0,
    monthly_spent: 0,
    remaining: 0,
  };

  const budgetUsagePercent =
    budget.monthly_limit > 0
      ? (budget.monthly_spent / budget.monthly_limit) * 100
      : 0;

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Format currency
  const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`;

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Export handlers
  const handleExportCSV = async () => {
    if (!usageStats || !usageLogs) {
      toast({
        title: 'Export Failed',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData = {
        overallStats,
        dailyStats: usageStats.daily_stats || [],
        modelStats: usageStats.model_stats || [],
        usageLogs: usageLogs.logs || [],
        budget: usageStats.budget,
        period: selectedPeriod,
      };

      exportToCSV(exportData);

      toast({
        title: 'Export Successful',
        description: 'CSV file has been downloaded',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV file',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!usageStats || !usageLogs) {
      toast({
        title: 'Export Failed',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData = {
        overallStats,
        dailyStats: usageStats.daily_stats || [],
        modelStats: usageStats.model_stats || [],
        usageLogs: usageLogs.logs || [],
        budget: usageStats.budget,
        period: selectedPeriod,
      };

      await exportToPDF(exportData);

      toast({
        title: 'Export Successful',
        description: 'PDF report has been downloaded',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export PDF file',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (statsError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load AI analytics. Please check your API configuration.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            AI Cost Analytics
          </h2>
          <p className="text-muted-foreground">
            Monitor your external AI service usage and costs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleExportCSV}
                disabled={isExporting}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overallStats.total_cost)}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === '30d'
                ? 'This month'
                : `Last ${selectedPeriod}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(overallStats.total_requests)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overallStats.successful_requests} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(overallStats.total_tokens)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg{' '}
              {Math.round(
                overallStats.total_tokens /
                  Math.max(overallStats.total_requests, 1)
              )}{' '}
              per request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(overallStats.avg_processing_time)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (overallStats.successful_requests /
                  Math.max(overallStats.total_requests, 1)) *
                100
              ).toFixed(1)}
              % success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Management */}
      {budget.monthly_limit > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Monthly Budget</span>
            </CardTitle>
            <CardDescription>
              Track your spending against your monthly budget limit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {formatCurrency(budget.monthly_spent)} of{' '}
                {formatCurrency(budget.monthly_limit)}
              </span>
              <Badge
                variant={
                  budgetUsagePercent > 90
                    ? 'destructive'
                    : budgetUsagePercent > 75
                      ? 'secondary'
                      : 'default'
                }
              >
                {budgetUsagePercent.toFixed(1)}% used
              </Badge>
            </div>
            <Progress value={budgetUsagePercent} className="w-full" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Remaining: {formatCurrency(budget.remaining)}</span>
              <span>
                {budgetUsagePercent > 90 && (
                  <span className="text-destructive flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Budget Alert
                  </span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Daily Spending Trend</span>
            </CardTitle>
            <CardDescription>Cost breakdown over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={usageStats?.daily_stats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString()
                  }
                />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString()
                  }
                  formatter={(value: number) => [formatCurrency(value), 'Cost']}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model Usage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Usage by Model</span>
            </CardTitle>
            <CardDescription>
              Cost and request distribution across models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={usageStats?.model_stats || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ model, cost }) =>
                    `${model}: ${formatCurrency(cost)}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {(usageStats?.model_stats || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Model Performance Comparison</span>
          </CardTitle>
          <CardDescription>
            Compare cost efficiency and performance across different models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart
              data={usageStats?.model_stats || []}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={formatCurrency}
                label={{
                  value: 'Total Cost ($)',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value}ms`}
                label={{
                  value: 'Response Time (ms)',
                  angle: 90,
                  position: 'insideRight',
                }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'Total Cost' ? formatCurrency(value) : `${value}ms`,
                  name,
                ]}
                labelFormatter={(label) => `Model: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="rect"
                formatter={(value) =>
                  value === 'Total Cost'
                    ? '💰 Total Cost'
                    : '⚡ Avg Response Time'
                }
              />
              <Bar
                yAxisId="left"
                dataKey="cost"
                fill="#3b82f6"
                name="Total Cost"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="avg_time"
                fill="#f59e0b"
                name="Avg Response Time"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-muted-foreground">
                <strong>Blue bars:</strong> Total cost spent on this model
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span className="text-muted-foreground">
                <strong>Orange bars:</strong> Average response time in
                milliseconds
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Usage Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Recent API Calls</span>
            </span>
            <Select
              value={selectedProvider || 'all'}
              onValueChange={(value) =>
                setSelectedProvider(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
          <CardDescription>
            Detailed log of recent AI API requests and costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center p-4">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Loading logs...
            </div>
          ) : (
            <div className="space-y-2">
              {usageLogs?.logs?.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant={log.success ? 'default' : 'destructive'}>
                      {log.provider}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{log.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(log.cost_usd)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(log.total_tokens)} tokens •{' '}
                      {log.processing_time_ms}ms
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-center text-muted-foreground py-4">
                  No usage logs available
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
