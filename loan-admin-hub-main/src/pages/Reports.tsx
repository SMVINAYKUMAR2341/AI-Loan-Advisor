import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Download,
  IndianRupee,
  FileText,
  PieChart as PieChartIcon,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import {
  dashboardStats,
  monthlyTrends,
  loanStatusDistribution,
  loanApplications,
  emiSchedules
} from '@/data/sampleData';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const creditScoreDistribution = [
  { range: '300-500', count: 0, color: 'hsl(0, 72%, 51%)' },
  { range: '500-650', count: 0, color: 'hsl(38, 92%, 50%)' },
  { range: '650-750', count: 1, color: 'hsl(174, 72%, 50%)' },
  { range: '750-900', count: 1, color: 'hsl(142, 72%, 45%)' },
];

const revenueData = [
  { month: 'Oct', disbursed: 450000, collected: 45000 },
  { month: 'Nov', disbursed: 680000, collected: 68000 },
  { month: 'Dec', disbursed: 520000, collected: 52000 },
  { month: 'Jan', disbursed: 500000, collected: 70608 },
];

export default function Reports() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await adminApi.getReportsData();
      setData(res);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (reportType: string) => {
    toast({
      title: 'Export Started',
      description: `Generating ${reportType} report as PDF...`,
    });
  };

  if (loading || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-white">Loading reports...</p>
        </div>
      </AdminLayout>
    );
  }

  const { stats, monthlyTrends, statusDistribution } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header - Enhanced */}
        <div className="p-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl border border-purple-500/30 animate-fade-in-up">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                <BarChart3 className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
                <p className="text-gray-400">Comprehensive insights into loan operations</p>
              </div>
            </div>
            <Button onClick={() => handleExport('Full')} className="bg-teal-500 hover:bg-teal-600 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Full Report
            </Button>
          </div>
        </div>

        {/* Quick Stats - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-teal-500/10 border-teal-500/30 rounded-2xl animate-fade-in-up stagger-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Applications</p>
                  <p className="text-2xl font-bold text-white">{stats.totalLoans}</p>
                </div>
                <FileText className="h-8 w-8 text-teal-400/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30 rounded-2xl animate-fade-in-up stagger-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Approval Rate</p>
                  <p className="text-2xl font-bold text-green-400">{stats.approvalRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/30 rounded-2xl animate-fade-in-up stagger-3">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Disbursed</p>
                  <p className="text-2xl font-bold text-blue-400">{formatCurrency(stats.totalDisbursed)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-blue-400/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-cyan-500/10 border-cyan-500/30 rounded-2xl animate-fade-in-up stagger-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Customers</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.activeUsers}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-cyan-400/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="loans" className="space-y-4">
          <TabsList className="bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger value="loans" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">Loan Performance</TabsTrigger>
            <TabsTrigger value="emi" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">EMI Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="loans" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loan Status Distribution */}
              <Card className="bg-gray-800/50 border-gray-700/50 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <PieChartIcon className="h-4 w-4 text-purple-400" />
                    </div>
                    Loan Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Applications Trend */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Application Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrends}>
                        <defs>
                          <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="applications"
                          stroke="hsl(var(--chart-1))"
                          fillOpacity={1}
                          fill="url(#colorApps)"
                          strokeWidth={2}
                          name="Applications"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Applications vs Disbursements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="applications"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                        name="Applications"
                      />
                      <Bar
                        dataKey="disbursements"
                        fill="hsl(var(--chart-2))"
                        radius={[4, 4, 0, 0]}
                        name="Disbursements"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">EMI Collection Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Line
                        type="monotone"
                        dataKey="emiCollected"
                        stroke="hsl(var(--success))"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--success))' }}
                        name="EMI Collected"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
