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
  const [stage, setStage] = useState<'idle' | 'processing' | 'success'>('idle');
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

    setStage('processing');

    // Simulate bank transfer delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 4000));

    try {
      await adminApi.processDisbursement(selectedLoan.id, transactionRef, remarks);
      setStage('success');

      toast({
        title: 'Disbursement Successful!',
        description: `Funds transferred to ${selectedLoan.customer_name}.`,
      });

      // Refresh data
      await fetchData();
    } catch (error: any) {
      setStage('idle');
      toast({
        title: 'Disbursement Failed',
        description: error.message || 'Failed to process disbursement.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedLoan(null);
      setStage('idle');
      setTransactionRef('');
      setRemarks('');
    }
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
        <Dialog open={!!selectedLoan} onOpenChange={handleClose}>
          <DialogContent className="max-w-lg bg-gray-900 border-gray-700 max-h-[85vh] overflow-y-auto transition-all duration-500">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-teal-400" />
                {stage === 'success' ? 'Disbursement Complete' : 'Disburse Loan'}
              </DialogTitle>
            </DialogHeader>

            {stage === 'processing' ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="relative w-full max-w-[300px] h-20 flex items-center justify-between">
                  {/* Bank */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)]">
                      <div className="text-3xl">🏦</div>
                    </div>
                    <span className="text-xs text-teal-400 mt-2 font-mono">BANK</span>
                  </div>

                  {/* Connection Line */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-800 overflow-hidden rounded-full z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-green-500 w-1/2 animate-pulse"></div>
                  </div>

                  {/* Sending Money */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[50%] animate-bounce z-20">
                    <span className="text-3xl drop-shadow-lg">💸</span>
                  </div>

                  {/* Customer */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                      <div className="text-3xl">👤</div>
                    </div>
                    <span className="text-xs text-green-400 mt-2 font-mono">CUSTOMER</span>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white animate-pulse">Processing Transfer...</h3>
                  <p className="text-gray-400 max-w-xs mx-auto">Verifying account & initiating secure NEFT transaction.</p>
                </div>
              </div>
            ) : stage === 'success' ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 rounded-full bg-green-500/10 border-4 border-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-white">Transfer Successful!</h3>
                  <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mt-4 mx-4">
                    <div className="flex justify-between gap-8 text-sm mb-2">
                      <span className="text-gray-400">Amount Sent:</span>
                      <span className="text-green-400 font-bold font-mono">{selectedLoan ? formatCurrency(selectedLoan.loan_amount) : ''}</span>
                    </div>
                    <div className="flex justify-between gap-8 text-sm">
                      <span className="text-gray-400">Transaction Ref:</span>
                      <span className="text-white font-mono">{transactionRef}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mt-4">Funds have been credited to the customer account.</p>
                </div>
                <Button onClick={() => handleClose(false)} className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]">
                  Close
                </Button>
              </div>
            ) : (
              <>
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
                    {/* Bank Transfer Form - Realistic Interface */}
                    <div className="space-y-6 border-t border-gray-700/50 pt-6 mt-6">

                      {/* Source & Mode */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-xs uppercase tracking-wider">From Account</Label>
                          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                                <span className="text-lg">🏦</span>
                              </div>
                              <div>
                                <div className="text-white text-sm font-medium">SafeGears Reserve</div>
                                <div className="text-gray-400 text-xs font-mono">xxxx-xxxx-8888</div>
                              </div>
                            </div>
                            <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20">Active</Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-400 text-xs uppercase tracking-wider">Payment Mode</Label>
                          <div className="relative">
                            <select className="w-full h-[58px] bg-gray-800 border border-gray-700 rounded-lg px-3 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none appearance-none">
                              <option>NEFT (National Electronic Funds Transfer)</option>
                              <option>RTGS (Real Time Gross Settlement)</option>
                              <option>IMPS (Immediate Payment Service)</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                              ▼
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Beneficiary Details */}
                      <div className="space-y-2">
                        <Label className="text-gray-400 text-xs uppercase tracking-wider">Beneficiary Details (To)</Label>
                        {selectedLoan.bank_details ? (
                          <div className="bg-gray-800/50 border border-teal-500/30 rounded-lg p-4 space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-teal-500/10 rounded-bl-lg border-b border-l border-teal-500/20">
                              <span className="flex items-center gap-1 text-teal-400 text-xs font-semibold">
                                <CheckCircle className="w-3 h-3" /> VERIFIED
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-gray-500 text-xs">Account Name</p>
                                <p className="text-white font-medium">{selectedLoan.bank_details.account_holder_name}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Bank Name</p>
                                <p className="text-white font-medium">{selectedLoan.bank_details.bank_name}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Account Number</p>
                                <p className="text-white font-mono tracking-wider">{selectedLoan.bank_details.account_number_masked}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">IFSC Code</p>
                                <p className="text-white font-mono tracking-wider">{selectedLoan.bank_details.ifsc_code}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 space-y-4">
                            <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 p-2 rounded border border-yellow-400/20">
                              <Sparkles className="w-4 h-4" />
                              <span>Manual Entry Required (KYC Missing)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2 space-y-1">
                                <Label className="text-xs text-gray-500">Beneficiary Name</Label>
                                <Input placeholder="Enter Account Holder Name" className="bg-gray-900/50 border-gray-700 text-white" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Account Number</Label>
                                <Input placeholder="Enter Account Number" className="bg-gray-900/50 border-gray-700 font-mono text-white" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">IFSC Code</Label>
                                <Input placeholder="SBIN000xxxx" className="bg-gray-900/50 border-gray-700 font-mono uppercase text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Transaction Meta */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="transactionRef" className="text-gray-400 text-xs uppercase tracking-wider">Transaction Ref ID *</Label>
                          <Input
                            id="transactionRef"
                            placeholder="e.g. UTR12345678"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            className="bg-gray-900 border-gray-700 text-white font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-400 text-xs uppercase tracking-wider">Remarks</Label>
                          <Input
                            placeholder="e.g. Loan Disbursement for Housing"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => handleClose(false)} className="border-gray-700 text-white">Cancel</Button>
                  <Button
                    onClick={handleDisburse}
                    disabled={!transactionRef || stage === 'processing'}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    {stage === 'processing' ? 'Processing...' : 'Confirm Disbursement'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
