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
import { Search, Eye, CheckCircle, XCircle, Filter, Loader2, Download, FileText, TrendingUp, Sparkles } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

interface LoanApp {
  id: string;
  tracking_id?: string;
  customer_name: string;
  customer_id: string;
  mobile_number: string;
  email: string;
  loan_amount: number;
  loan_purpose: string;
  decision: string;
  decision_reason: string | null;
  approval_probability: number;
  interest_rate: number;
  emi: number;
  created_at: string;
}

export default function LoanApplications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLoan, setSelectedLoan] = useState<LoanApp | null>(null);
  const [loans, setLoans] = useState<LoanApp[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getApplications();
      setLoans(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load loan applications. Make sure you are logged in as admin.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleDownloadReport = async (id: string, trackingId?: string) => {
    try {
      toast({
        title: 'Downloading...',
        description: 'Generating PDF report.'
      });
      await adminApi.downloadReport(id, trackingId);
      toast({
        title: 'Success',
        description: 'Report downloaded successfully.'
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Could not download the report.',
        variant: 'destructive',
      });
    }
  };

  const [agreement, setAgreement] = useState<{
    loan_amount: number;
    interest_rate: number;
    tenure_months: number;
    emi_amount: number;
    total_payable: number;
    consent_given: boolean;
    signed_at: string | null;
    status: string;
  } | null>(null);
  const [loadingAgreement, setLoadingAgreement] = useState(false);

  const handleViewAgreement = async (appId: string) => {
    setLoadingAgreement(true);
    try {
      const data = await adminApi.getAgreement(appId);
      setAgreement(data);
    } catch (error) {
      toast({
        title: 'Agreement Not Found',
        description: 'No signed agreement exists for this application.',
        variant: 'destructive',
      });
      setAgreement(null);
    }
    setLoadingAgreement(false);
  };

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loan.tracking_id && loan.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || loan.decision.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header - Enhanced */}
        <div className="p-6 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-2xl border border-teal-500/30 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-500/20 rounded-xl border border-teal-500/30">
                <FileText className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Loan Applications</h1>
                <p className="text-gray-400">Manage and process loan applications</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">AI Powered</span>
            </div>
          </div>
        </div>

        {/* Filters - Enhanced */}
        <Card className="bg-gray-800/50 border-gray-700/50 rounded-2xl animate-fade-in-up stagger-1">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or loan ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="disbursed">Disbursed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table - Enhanced */}
        <Card className="bg-gray-800/50 border-gray-700/50 rounded-2xl animate-fade-in-up stagger-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>
              All Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700/50 hover:bg-transparent">
                    <TableHead className="text-gray-400">Loan ID</TableHead>
                    <TableHead className="text-gray-400">Reference ID</TableHead>
                    <TableHead className="text-gray-400">Customer</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Purpose</TableHead>
                    <TableHead className="text-gray-400">AI Score</TableHead>
                    <TableHead className="text-gray-400">Decision</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-400" />
                      </TableCell>
                    </TableRow>
                  ) : filteredLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                        No loan applications found
                      </TableCell>
                    </TableRow>
                  ) : filteredLoans.map((loan) => (
                    <TableRow key={loan.id} className="border-gray-700/50 hover:bg-gray-900/30 transition-colors">
                      <TableCell className="font-medium font-mono text-xs text-white">{loan.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white">{loan.tracking_id || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{loan.tracking_id ? loan.id.slice(0, 8) : ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{loan.customer_name}</TableCell>
                      <TableCell className="text-white">{formatCurrency(loan.loan_amount)}</TableCell>
                      <TableCell className="text-white">{loan.loan_purpose}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${loan.approval_probability}%` }}
                            />
                          </div>
                          <span className="text-sm text-teal-400">{loan.approval_probability.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${loan.decision === 'APPROVED' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          loan.decision === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            loan.decision === 'DISBURSED' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          } border`}>
                          {loan.decision}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{new Date(loan.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLoan(loan)}
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

        {/* Loan Details Dialog - Enhanced */}
        <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-400" />
                Loan Application Details
              </DialogTitle>
            </DialogHeader>
            {selectedLoan && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Loan ID</p>
                    <p className="font-medium font-mono text-sm text-white">{selectedLoan.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Customer Name</p>
                    <p className="font-medium text-white">{selectedLoan.customer_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Loan Amount</p>
                    <p className="font-medium text-lg text-teal-400">{formatCurrency(selectedLoan.loan_amount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Purpose</p>
                    <p className="font-medium text-white">{selectedLoan.loan_purpose}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">EMI Amount</p>
                    <p className="font-medium text-white">{formatCurrency(selectedLoan.emi)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Interest Rate</p>
                    <p className="font-medium text-white">{selectedLoan.interest_rate}% p.a.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Contact</p>
                    <p className="font-medium text-white">{selectedLoan.mobile_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-medium text-white">{selectedLoan.email || 'N/A'}</p>
                  </div>
                </div>

                {/* AI Eligibility Score */}
                <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">AI Approval Probability</span>
                    <span className="text-2xl font-bold text-teal-400">{selectedLoan.approval_probability.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${selectedLoan.approval_probability}%` }}
                    />
                  </div>
                </div>

                {/* Decision & Reason */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Decision</p>
                      <Badge className={`${selectedLoan.decision === 'APPROVED' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        selectedLoan.decision === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        } border text-sm`}>
                        {selectedLoan.decision}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-gray-400">Applied On</p>
                      <p className="font-medium text-white">{new Date(selectedLoan.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {selectedLoan.decision_reason && (
                    <div className="mt-4 p-3 rounded-lg bg-gray-800/50">
                      <p className="text-sm text-gray-400 mb-1">Decision Reason:</p>
                      <p className="text-sm text-white">{selectedLoan.decision_reason}</p>
                    </div>
                  )}
                </div>

                {/* Download Agreement/Report */}
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-white hover:bg-gray-800"
                  onClick={() => handleDownloadReport(selectedLoan.id, selectedLoan.tracking_id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Loan Agreement & Report
                </Button>

                {/* View Agreement Details */}
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-white hover:bg-gray-800"
                  onClick={() => handleViewAgreement(selectedLoan.id)}
                  disabled={loadingAgreement}
                >
                  {loadingAgreement ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  View Signed Agreement
                </Button>

                {/* Agreement Details Panel */}
                {agreement && (
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                    <h4 className="font-medium text-purple-400">Signed Agreement Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Loan Amount</p>
                        <p className="text-white font-medium">{formatCurrency(agreement.loan_amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Interest Rate</p>
                        <p className="text-white font-medium">{agreement.interest_rate}% p.a.</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Tenure</p>
                        <p className="text-white font-medium">{agreement.tenure_months} months</p>
                      </div>
                      <div>
                        <p className="text-gray-400">EMI Amount</p>
                        <p className="text-white font-medium">{formatCurrency(agreement.emi_amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Payable</p>
                        <p className="text-white font-medium">{formatCurrency(agreement.total_payable)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <Badge className={agreement.consent_given ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                          {agreement.status}
                        </Badge>
                      </div>
                    </div>
                    {agreement.signed_at && (
                      <p className="text-xs text-gray-500">
                        Signed on: {new Date(agreement.signed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions for PENDING_REVIEW */}
                {selectedLoan.decision === 'PENDING_REVIEW' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-700">
                    <Button
                      className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                      onClick={() => {
                        toast({ title: 'Feature coming soon', description: 'Manual approval will be implemented.' });
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Loan
                    </Button>
                    <Button
                      className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                      onClick={() => {
                        toast({ title: 'Feature coming soon', description: 'Manual rejection will be implemented.', variant: 'destructive' });
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Loan
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
