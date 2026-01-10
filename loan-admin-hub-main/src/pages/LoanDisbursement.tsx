import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Send, CheckCircle, Clock, Upload, Loader2, Sparkles, IndianRupee } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

interface ApprovedLoan {
  id: string;
  customer_name: string;
  customer_id: string;
  mobile_number: string;
  email: string;
  loan_amount: number;
  loan_purpose: string;
  decision: string;
  created_at: string;
  bank_details?: BankDetails;
}

interface BankDetails {
  id: string;
  account_holder_name: string;
  bank_name: string;
  account_number_masked: string;
  ifsc_code: string;
  account_type: string;
  is_verified: boolean;
}

interface DisbursementRecord {
  id: string;
  application_id: string;
  amount: number;
  transaction_ref: string;
  status: string;
  customer_name: string;
  processed_at: string;
}

export default function LoanDisbursement() {
  const [approvedLoans, setApprovedLoans] = useState<ApprovedLoan[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<ApprovedLoan | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsData, disbData] = await Promise.all([
        adminApi.getApplications('APPROVED'),
        adminApi.getDisbursements()
      ]);
      setApprovedLoans(appsData);
      setDisbursements(disbData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const handleDisburse = async () => {
    if (!selectedLoan || !transactionRef) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a transaction reference number.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      await adminApi.processDisbursement(selectedLoan.id, transactionRef, remarks);

      toast({
        title: 'Disbursement Successful!',
        description: `${formatCurrency(selectedLoan.loan_amount)} has been transferred to ${selectedLoan.customer_name}'s account.`,
      });

      // Refresh data
      await fetchData();

      setSelectedLoan(null);
      setTransactionRef('');
      setRemarks('');
    } catch (error: any) {
      toast({
        title: 'Disbursement Failed',
        description: error.message || 'Failed to process disbursement. Please try again.',
        variant: 'destructive',
      });
    }

    setIsProcessing(false);
  };

  const totalDisbursed = disbursements.reduce((sum, d) => sum + d.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header - Enhanced */}
        <div className="p-6 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl border border-green-500/30 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
                <CreditCard className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Loan Disbursement</h1>
                <p className="text-gray-400">Transfer approved loan amounts to customer accounts</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
              <IndianRupee className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">{formatCurrency(totalDisbursed)} Disbursed</span>
            </div>
          </div>
        </div>

        {/* Stats - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-2xl animate-fade-in-up stagger-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pending Disbursements</p>
                  <p className="text-2xl font-bold text-white">{approvedLoans.length}</p>
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
                  <p className="text-sm text-gray-400">Total Disbursements</p>
                  <p className="text-2xl font-bold text-white">{disbursements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-teal-500/10 border-teal-500/30 rounded-2xl animate-fade-in-up stagger-3">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-500/30">
                  <CreditCard className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Disbursed</p>
                  <p className="text-2xl font-bold text-teal-400">{formatCurrency(totalDisbursed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Enhanced */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger value="pending" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">Pending Disbursements</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">Disbursement History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="bg-gray-800/50 border-gray-700/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Clock className="h-4 w-4 text-yellow-400" />
                  </div>
                  Approved Loans Awaiting Disbursement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-400" />
                  </div>
                ) : approvedLoans.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                    <p>No pending disbursements</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700/50">
                          <TableHead className="text-gray-400">Loan ID</TableHead>
                          <TableHead className="text-gray-400">Customer</TableHead>
                          <TableHead className="text-gray-400">Amount</TableHead>
                          <TableHead className="text-gray-400">Purpose</TableHead>
                          <TableHead className="text-gray-400">Contact</TableHead>
                          <TableHead className="text-gray-400 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedLoans.map((loan) => (
                          <TableRow key={loan.id} className="border-gray-700/50 hover:bg-gray-900/30">
                            <TableCell className="font-medium font-mono text-xs text-white">{loan.id.slice(0, 8)}...</TableCell>
                            <TableCell className="text-white">{loan.customer_name}</TableCell>
                            <TableCell className="font-medium text-green-400">{formatCurrency(loan.loan_amount)}</TableCell>
                            <TableCell className="text-white">{loan.loan_purpose}</TableCell>
                            <TableCell className="text-sm text-gray-400">{loan.mobile_number}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() => setSelectedLoan(loan)}
                                className="bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/30"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Disburse
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-gray-800/50 border-gray-700/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  Disbursement History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {disbursements.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No disbursements yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700/50">
                          <TableHead className="text-gray-400">Application ID</TableHead>
                          <TableHead className="text-gray-400">Customer</TableHead>
                          <TableHead className="text-gray-400">Amount</TableHead>
                          <TableHead className="text-gray-400">Transaction Ref</TableHead>
                          <TableHead className="text-gray-400">Disbursed On</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disbursements.map((disbursement) => (
                          <TableRow key={disbursement.id} className="border-gray-700/50 hover:bg-gray-900/30">
                            <TableCell className="font-medium font-mono text-xs text-white">{disbursement.application_id.slice(0, 8)}...</TableCell>
                            <TableCell className="text-white">{disbursement.customer_name}</TableCell>
                            <TableCell className="font-medium text-green-400">{formatCurrency(disbursement.amount)}</TableCell>
                            <TableCell className="font-mono text-sm text-white">{disbursement.transaction_ref || 'N/A'}</TableCell>
                            <TableCell className="text-gray-400">{disbursement.processed_at ? new Date(disbursement.processed_at).toLocaleDateString() : 'Pending'}</TableCell>
                            <TableCell>
                              <Badge className={`${disbursement.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                } border`}>
                                {disbursement.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Disbursement Dialog - Enhanced */}
        <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
          <DialogContent className="max-w-lg bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-teal-400" />
                Disburse Loan
              </DialogTitle>
            </DialogHeader>
            {selectedLoan && (
              <div className="space-y-6">
                {/* Loan Summary */}
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Loan ID</span>
                    <span className="font-medium font-mono text-sm text-white">{selectedLoan.id.slice(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer</span>
                    <span className="font-medium text-white">{selectedLoan.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Purpose</span>
                    <span className="font-medium text-white">{selectedLoan.loan_purpose}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount to Transfer</span>
                    <span className="font-bold text-lg text-green-400">{formatCurrency(selectedLoan.loan_amount)}</span>
                  </div>
                </div>

                {/* Customer Contact */}
                <div className="space-y-2">
                  <Label className="text-gray-400">Customer Contact</Label>
                  <div className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                    <p className="font-medium text-white">{selectedLoan.customer_name}</p>
                    <p className="text-sm text-gray-400">
                      Mobile: {selectedLoan.mobile_number}
                    </p>
                    {selectedLoan.email && (
                      <p className="text-sm text-gray-400">
                        Email: {selectedLoan.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="space-y-2">
                  <Label className="text-gray-400">Bank Account Details (Verified)</Label>
                  {selectedLoan.bank_details ? (
                    <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Account Holder</span>
                        <span className="font-medium text-white">{selectedLoan.bank_details.account_holder_name}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Bank Name</span>
                        <span className="font-medium text-white">{selectedLoan.bank_details.bank_name}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Account Number</span>
                        <span className="font-mono text-white">{selectedLoan.bank_details.account_number_masked}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">IFSC Code</span>
                        <span className="font-mono text-white">{selectedLoan.bank_details.ifsc_code}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-center">
                      <p className="text-red-400 font-medium">Bank Details Not Found</p>
                      <p className="text-xs text-gray-400 mt-1">Please verify customer has completed KYC Step 2</p>
                    </div>
                  )}
                </div>

                {/* Transaction Details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transactionRef" className="text-gray-400">Transaction Reference *</Label>
                    <Input
                      id="transactionRef"
                      placeholder="Enter transaction reference number"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks" className="text-gray-400">Remarks (Optional)</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Add any notes or remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400">Upload Receipt (Optional)</Label>
                    <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-800/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                      <p className="text-sm text-gray-400">Click to upload disbursement receipt</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLoan(null)} className="border-gray-700 text-white">Cancel</Button>
              <Button
                onClick={handleDisburse}
                disabled={!transactionRef || isProcessing}
                className="bg-teal-500 hover:bg-teal-600 text-white"
              >
                {isProcessing ? 'Processing...' : 'Confirm Disbursement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
