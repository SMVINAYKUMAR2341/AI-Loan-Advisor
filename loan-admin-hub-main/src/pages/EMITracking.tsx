import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IndianRupee,
  CheckCircle,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  Calendar,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

interface RepaymentData {
  id: string;
  user_id: string;
  customer_name: string;
  mobile_number: string;
  emi_number: number;
  amount: number;
  payment_method: string;
  status: string;
  paid_at: string | null;
  due_date: string | null;
}

export default function EMITracking() {
  const [repayments, setRepayments] = useState<RepaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const { toast } = useToast();

  useEffect(() => {
    fetchRepayments();
  }, []);

  const fetchRepayments = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getRepayments();
      setRepayments(data);
    } catch (error) {
      console.error('Failed to fetch repayments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load repayment data',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Categorize Repayments
  const paidRepayments = repayments.filter(r =>
    ['COMPLETED', 'paid', 'SUCCESS'].includes(r.status)
  );

  const pendingRepayments = repayments.filter(r =>
    ['PENDING', 'pending', 'DUE'].includes(r.status) &&
    (!r.due_date || new Date(r.due_date) >= today)
  );

  const overdueRepayments = repayments.filter(r =>
    ['PENDING', 'pending', 'DUE'].includes(r.status) &&
    r.due_date && new Date(r.due_date) < today
  );

  // Stats
  const totalCollected = paidRepayments.reduce((sum, r) => sum + r.amount, 0);
  const totalOverdue = overdueRepayments.reduce((sum, r) => sum + r.amount, 0);

  const getFilteredData = (data: RepaymentData[]) => {
    return data.filter(r =>
      r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mobile_number?.includes(searchQuery)
    );
  };

  const renderTable = (data: RepaymentData[], type: 'upcoming' | 'overdue' | 'paid') => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700/50">
            <TableHead className="text-gray-400">Customer</TableHead>
            <TableHead className="text-gray-400">Mobile</TableHead>
            <TableHead className="text-gray-400">EMI #</TableHead>
            <TableHead className="text-gray-400">
              {type === 'paid' ? 'Amount Paid' : 'Amount Due'}
            </TableHead>
            <TableHead className="text-gray-400">Status</TableHead>
            <TableHead className="text-gray-400">
              {type === 'paid' ? 'Paid On' : 'Due Date'}
            </TableHead>
            {type === 'overdue' && <TableHead className="text-gray-400 text-right">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                No records found
              </TableCell>
            </TableRow>
          ) : (
            data.map((payment) => (
              <TableRow key={payment.id} className="border-gray-700/50 hover:bg-gray-900/30">
                <TableCell className="font-medium text-white">{payment.customer_name}</TableCell>
                <TableCell className="text-gray-400 text-xs">{payment.mobile_number || 'N/A'}</TableCell>
                <TableCell className="text-white">#{payment.emi_number}</TableCell>
                <TableCell className={`font-bold ${type === 'paid' ? 'text-green-400' : type === 'overdue' ? 'text-red-400' : 'text-white'}`}>
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell>
                  <Badge className={`border ${type === 'paid' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      type === 'overdue' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                    {type === 'paid' ? 'PAID' : type === 'overdue' ? 'OVERDUE' : 'UPCOMING'}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-400">
                  {type === 'paid'
                    ? (payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'N/A')
                    : (payment.due_date ? new Date(payment.due_date).toLocaleDateString() : 'N/A')
                  }
                </TableCell>
                {type === 'overdue' && (
                  <TableCell className="text-right">
                    <Badge variant="outline" className="cursor-pointer hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-400">Send Notice</Badge>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header - Enhanced */}
        <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <CalendarCheck className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">EMI Tracking</h1>
                <p className="text-gray-400">Track customer payments, overdue amounts, and upcoming schedules</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
              <IndianRupee className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">{formatCurrency(totalCollected)} Collected</span>
            </div>
          </div>
        </div>

        {/* Stats - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-green-500/10 border-green-500/30 rounded-2xl animate-fade-in-up stagger-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Collected</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(totalCollected)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/30 rounded-2xl animate-fade-in-up stagger-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Upcoming Payments</p>
                  <p className="text-2xl font-bold text-white">{pendingRepayments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/30 rounded-2xl animate-fade-in-up stagger-3">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Overdue EMIs</p>
                  <p className="text-2xl font-bold text-red-400">{overdueRepayments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-500/10 border-orange-500/30 rounded-2xl animate-fade-in-up stagger-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
                  <IndianRupee className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Overdue Amount</p>
                  <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalOverdue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search - Enhanced */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by customer name or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/95 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Tabs & Table - Enhanced */}
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-900/95 border border-gray-700/50">
            <TabsTrigger value="upcoming" className="gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              Upcoming <Badge className="ml-1 bg-blue-500/20 text-blue-400 border-blue-500/30">{pendingRepayments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              Overdue <Badge className="ml-1 bg-red-500/20 text-red-400 border-red-500/30">{overdueRepayments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              Paid History <Badge className="ml-1 bg-green-500/20 text-green-400 border-green-500/30">{paidRepayments.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                </div>
              ) : (
                <>
                  <TabsContent value="upcoming" className="mt-0">
                    {renderTable(getFilteredData(pendingRepayments), 'upcoming')}
                  </TabsContent>
                  <TabsContent value="overdue" className="mt-0">
                    {renderTable(getFilteredData(overdueRepayments), 'overdue')}
                  </TabsContent>
                  <TabsContent value="paid" className="mt-0">
                    {renderTable(getFilteredData(paidRepayments), 'paid')}
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
