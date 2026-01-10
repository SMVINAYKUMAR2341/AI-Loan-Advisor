import { useState, useEffect } from 'react';
import {
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  IndianRupee,
  Clock,
  Sparkles,
  ArrowUpRight,
  Wallet,
  Users,
  Calendar,
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  monthlyTrends,
  loanStatusDistribution,
} from '@/data/sampleData';
import { adminApi } from '@/lib/api';
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
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_loans: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
    total_disbursed: 0,
    approval_rate: 0
  });
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, appsData, notifsData, repaymentsData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getApplications(),
          adminApi.getNotifications(),
          adminApi.getRepayments()
        ]);
        setStats(statsData);
        setApplications(appsData.slice(0, 5)); // Top 5
        setNotifications(notifsData.slice(0, 5)); // Top 5
        setRepayments(repaymentsData.slice(0, 5)); // Top 5
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Banner - Matching Customer Dashboard */}
        <div className="p-6 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-2xl border border-teal-500/30 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome to Admin Dashboard</h2>
              <p className="text-gray-300 mt-1">Here's an overview of your loan operations</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 rounded-full border border-teal-500/30">
                <CheckCircle className="w-4 h-4 text-teal-400" />
                <span className="text-teal-400 text-sm font-medium">System Active</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">AI Powered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - With stagger animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-fade-in-up stagger-1">
            <StatCard
              title="Total Loans"
              value={stats.total_loans}
              icon={<FileText className="h-6 w-6" />}
              variant="primary"
            />
          </div>
          <div className="animate-fade-in-up stagger-2">
            <StatCard
              title="Total Disbursed"
              value={formatCurrency(stats.total_disbursed)}
              icon={<CreditCard className="h-6 w-6" />}
              variant="success"
            />
          </div>
          <div className="animate-fade-in-up stagger-3">
            <StatCard
              title="Pending Review"
              value={stats.pending_review}
              icon={<Clock className="h-6 w-6" />}
              variant="warning"
            />
          </div>
          <div className="animate-fade-in-up stagger-4">
            <StatCard
              title="Approval Rate"
              value={`${stats.approval_rate}%`}
              icon={<TrendingUp className="h-6 w-6" />}
              variant="primary"
              trend={stats.approval_rate > 50 ? { value: 5.2, isPositive: true } : undefined}
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loan Status Distribution - Pie Chart */}
          <Card className="lg:col-span-1 bg-gray-900/95 border-gray-700/50 rounded-2xl animate-fade-in-up stagger-5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <Wallet className="h-4 w-4 text-teal-400" />
                </div>
                Loan Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={loanStatusDistribution.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {loanStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        padding: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {loanStatusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-400">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends - Line Chart */}
          <Card className="lg:col-span-2 bg-gray-900/95 border-gray-700/50 rounded-2xl animate-fade-in-up stagger-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </div>
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        padding: '12px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      stroke="#14b8a6"
                      strokeWidth={3}
                      dot={{ fill: '#14b8a6', strokeWidth: 2 }}
                      name="Applications"
                    />
                    <Line
                      type="monotone"
                      dataKey="disbursements"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                      name="Disbursements"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* EMI Collection Chart */}
        <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <IndianRupee className="h-4 w-4 text-blue-400" />
              </div>
              EMI Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar
                    dataKey="emiCollected"
                    fill="#14b8a6"
                    radius={[8, 8, 0, 0]}
                    name="EMI Collected"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - 3 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Loan Applications */}
          <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <FileText className="h-4 w-4 text-teal-400" />
                </div>
                Recent Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applications.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No applications yet</p>
                ) : applications.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-900/50 border border-gray-700/50 hover:border-gray-600/50 transition-all">
                    <div>
                      <p className="font-medium text-white">{loan.customer_name}</p>
                      <p className="text-sm text-gray-400">{formatCurrency(loan.loan_amount)} • {loan.loan_purpose}</p>
                    </div>
                    <Badge className={`${loan.decision === 'APPROVED' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        loan.decision === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      } border`}>
                      {loan.decision}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-400" />
                </div>
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No notifications yet</p>
                ) : notifications.map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 p-4 rounded-xl bg-gray-900/50 border border-gray-700/50 hover:border-gray-600/50 transition-all">
                    <div className={`p-2 rounded-lg ${notif.status === 'delivered' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                      {notif.status === 'delivered' ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{notif.customer_name || 'Customer'}</p>
                      <p className="text-sm text-gray-400 line-clamp-1">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                          {notif.type?.toUpperCase() || 'N/A'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {notif.sent_at ? new Date(notif.sent_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* EMI Payments Received */}
          <Card className="bg-gradient-to-br from-green-900/30 to-teal-900/30 border-green-500/30 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <IndianRupee className="h-4 w-4 text-green-400" />
                </div>
                EMI Payments Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {repayments.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No payments received yet</p>
                ) : repayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-900/50 border border-green-500/20 hover:border-green-500/40 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{payment.customer_name}</p>
                        <p className="text-sm text-gray-400">
                          EMI #{payment.emi_number} • {payment.payment_method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">+{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">
                        {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
