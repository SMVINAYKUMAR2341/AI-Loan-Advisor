import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Eye,
  Users,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Loader2,
  UserCircle,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '@/lib/api';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

interface CustomerData {
  id: string;
  customer_id: string;
  name: string;
  mobile: string;
  email: string;
  kyc_verified: boolean;
  created_at: string;
}

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKyc = kycFilter === 'all' ||
      (kycFilter === 'verified' && customer.kyc_verified) ||
      (kycFilter === 'pending' && !customer.kyc_verified);
    return matchesSearch && matchesKyc;
  });

  const verifiedCount = customers.filter(c => c.kyc_verified).length;
  const pendingCount = customers.filter(c => !c.kyc_verified).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header - Enhanced */}
        <div className="p-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                <Users className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Customers</h1>
                <p className="text-gray-400">Manage customer profiles and loan history</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-cyan-500/20 rounded-full border border-cyan-500/30">
              <UserCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">{customers.length} Customers</span>
            </div>
          </div>
        </div>

        {/* Stats - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-teal-500/10 border-teal-500/30 rounded-2xl animate-fade-in-up stagger-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-500/30">
                  <Users className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Customers</p>
                  <p className="text-2xl font-bold text-white">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30 rounded-2xl animate-fade-in-up stagger-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">KYC Verified</p>
                  <p className="text-2xl font-bold text-green-400">{verifiedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-2xl animate-fade-in-up stagger-3">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">KYC Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Enhanced */}
        <Card className="bg-gray-800/50 border-gray-700/50 rounded-2xl animate-fade-in-up stagger-4">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <Select value={kycFilter} onValueChange={setKycFilter}>
                <SelectTrigger className="w-[150px] bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table - Enhanced */}
        <Card className="bg-gray-800/50 border-gray-700/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Users className="h-4 w-4 text-cyan-400" />
              </div>
              All Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700/50">
                    <TableHead className="text-gray-400">Customer ID</TableHead>
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Mobile</TableHead>
                    <TableHead className="text-gray-400">KYC Status</TableHead>
                    <TableHead className="text-gray-400">Since</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-400" />
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="border-gray-700/50 hover:bg-gray-900/30">
                      <TableCell className="font-medium font-mono text-xs text-white">{customer.customer_id || customer.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-white">{customer.name}</TableCell>
                      <TableCell className="text-gray-400">{customer.email || 'N/A'}</TableCell>
                      <TableCell className="text-white">{customer.mobile}</TableCell>
                      <TableCell>
                        <Badge className={`border ${customer.kyc_verified
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }`}>
                          {customer.kyc_verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Customer Profile Dialog - Enhanced */}
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-lg bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-cyan-400" />
                Customer Profile
              </DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Customer ID</p>
                    <p className="font-medium font-mono text-sm text-white">{selectedCustomer.customer_id || selectedCustomer.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">KYC Status</p>
                    <Badge className={`border ${selectedCustomer.kyc_verified
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                      {selectedCustomer.kyc_verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium text-white">{selectedCustomer.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Phone className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Mobile</p>
                      <p className="font-medium text-white">{selectedCustomer.mobile}</p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 text-center pt-4 border-t border-gray-700">
                  Customer since {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
