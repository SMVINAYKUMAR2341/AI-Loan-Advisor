import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Download,
  IndianRupee,
  FileText,
  PieChart as PieChartIcon,
  AlertTriangle
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

  const handleExport = (reportType: string) => {
    toast({
      title: 'Export Started',
      description: `Generating ${reportType} report as PDF...`,
    });
  };

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
                  <p className="text-2xl font-bold text-white">{dashboardStats.totalLoans}</p>
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
                  <p className="text-2xl font-bold text-green-400">{dashboardStats.approvalRate}%</p>
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
                  <p className="text-2xl font-bold text-blue-400">{formatCurrency(dashboardStats.totalDisbursed)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-blue-400/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-cyan-500/10 border-cyan-500/30 rounded-2xl animate-fade-in-up stagger-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">EMI Collection Rate</p>
                  <p className="text-2xl font-bold text-cyan-400">100%</p>
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
            <TabsTrigger value="revenue" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">Revenue</TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">Risk Analysis</TabsTrigger>
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
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Loan Status')} className="text-gray-400 hover:text-white">
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={loanStatusDistribution.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {loanStatusDistribution.map((entry, index) => (
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
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Application Trends')}>
                    <Download className="h-4 w-4" />
                  </Button>
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
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Disbursement Trend */}
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
                <CardTitle className="text-lg">EMI Collection Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-success/10 text-center">
                    <p className="text-3xl font-bold text-success">{emiSchedules.filter(e => e.status === 'paid').length}</p>
                    <p className="text-sm text-muted-foreground">Paid EMIs</p>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/10 text-center">
                    <p className="text-3xl font-bold text-warning">{emiSchedules.filter(e => e.status === 'upcoming').length}</p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                  <div className="p-4 rounded-lg bg-destructive/10 text-center">
                    <p className="text-3xl font-bold text-destructive">{emiSchedules.filter(e => e.status === 'overdue').length}</p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </div>
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

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-6 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Total Disbursed</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(2150000)}</p>
                  </div>
                  <div className="p-6 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-sm text-muted-foreground">Total EMI Collected</p>
                    <p className="text-3xl font-bold text-success">{formatCurrency(235608)}</p>
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
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
                      <Legend />
                      <Bar
                        dataKey="disbursed"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                        name="Disbursed"
                      />
                      <Bar
                        dataKey="collected"
                        fill="hsl(var(--chart-2))"
                        radius={[4, 4, 0, 0]}
                        name="EMI Collected"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Credit Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-primary" />
                    Credit Score Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={creditScoreDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="range" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {creditScoreDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Risk Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Default Rate</p>
                      <p className="text-sm text-muted-foreground">Current month</p>
                    </div>
                    <Badge className="status-approved text-lg px-4 py-2">0%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Average Credit Score</p>
                      <p className="text-sm text-muted-foreground">All customers</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-lg px-4 py-2">750</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">High Risk Applications</p>
                      <p className="text-sm text-muted-foreground">Credit score &lt; 650</p>
                    </div>
                    <Badge className="status-approved text-lg px-4 py-2">0</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Overdue Amount</p>
                      <p className="text-sm text-muted-foreground">Total pending</p>
                    </div>
                    <Badge className="status-approved text-lg px-4 py-2">₹0</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
