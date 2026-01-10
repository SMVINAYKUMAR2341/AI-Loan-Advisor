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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FolderOpen,
  FileText,
  Search,
  File,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const documentTypeLabels: Record<string, string> = {
  PAN: 'PAN Card',
  AADHAAR: 'Aadhaar Card',
  ADDRESS_PROOF: 'Address Proof',
  INCOME_PROOF: 'Income Proof',
  BANK_STATEMENT: 'Bank Statement',
  disbursement_receipt: 'Disbursement Receipt',
  loan_agreement: 'Loan Agreement',
};

const documentTypeIcons: Record<string, React.ReactNode> = {
  PAN: <FileText className="h-5 w-5 text-teal-400" />,
  AADHAAR: <FileText className="h-5 w-5 text-blue-400" />,
  ADDRESS_PROOF: <FileText className="h-5 w-5 text-yellow-400" />,
  INCOME_PROOF: <FileText className="h-5 w-5 text-green-400" />,
  BANK_STATEMENT: <FileText className="h-5 w-5 text-purple-400" />,
  disbursement_receipt: <FileText className="h-5 w-5 text-gray-400" />,
  loan_agreement: <FileText className="h-5 w-5 text-pink-400" />,
};

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_size: number | null;
  verification_status: string;
  uploaded_at: string | null;
  customer_name: string;
  customer_id: string;
  application_id: string;
  tracking_id?: string;
  loan_amount: number;
}

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDocuments();
      setDocs(data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleVerify = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    setProcessingId(docId);
    try {
      await adminApi.verifyDocument(docId, status, status === 'REJECTED' ? 'Rejected by admin' : 'Verified by admin');

      toast({
        title: status === 'VERIFIED' ? 'Document Verified' : 'Document Rejected',
        description: `The document has been ${status.toLowerCase()}.`,
        variant: status === 'VERIFIED' ? 'default' : 'destructive',
      });

      // Optimistic update
      setDocs(docs.map(d => d.id === docId ? { ...d, verification_status: status } : d));
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: 'Failed to update document status.',
        variant: 'destructive',
      });
    }
    setProcessingId(null);
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch =
      doc.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.customer_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.tracking_id && doc.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const pendingCount = docs.filter(d => d.verification_status === 'PENDING').length;
  const verifiedCount = docs.filter(d => d.verification_status === 'VERIFIED').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header - Enhanced */}
        <div className="p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                <FolderOpen className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Documents & Verification</h1>
                <p className="text-gray-400">Verify customer KYC documents and manage records</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">{pendingCount} Pending</span>
              </div>
              <Button
                onClick={fetchDocuments}
                variant="outline"
                size="sm"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
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
                  placeholder="Search by customer name, ID, or Reference ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px] bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(documentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table - Enhanced */}
        <Card className="bg-gray-800/50 border-gray-700/50 rounded-2xl animate-fade-in-up stagger-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FolderOpen className="h-4 w-4 text-purple-400" />
              </div>
              Document Library
              <Badge className="ml-2 bg-gray-700 text-gray-300">{filteredDocs.length} docs</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700/50">
                    <TableHead className="text-gray-400">Document</TableHead>
                    <TableHead className="text-gray-400">Reference ID</TableHead>
                    <TableHead className="text-gray-400">Customer</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Uploaded</TableHead>
                    <TableHead className="text-gray-400 text-right">Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-400" />
                      </TableCell>
                    </TableRow>
                  ) : filteredDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        No documents found
                      </TableCell>
                    </TableRow>
                  ) : filteredDocs.map((doc) => (
                    <TableRow key={doc.id} className="border-gray-700/50 hover:bg-gray-900/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-700/50 rounded-lg">
                            {documentTypeIcons[doc.document_type] || <File className="h-5 w-5 text-gray-500" />}
                          </div>
                          <div>
                            <p className="font-medium text-white">{documentTypeLabels[doc.document_type] || doc.document_type}</p>
                            <p className="text-xs text-gray-500">{doc.file_name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-white">{doc.tracking_id || doc.application_id.slice(0, 8)}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-white">{doc.customer_name}</p>
                          <p className="text-xs text-gray-500">{doc.customer_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`border ${doc.verification_status === 'VERIFIED' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            doc.verification_status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }`}>
                          {doc.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {doc.verification_status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                              onClick={() => handleVerify(doc.id, 'VERIFIED')}
                              disabled={processingId === doc.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                              onClick={() => handleVerify(doc.id, 'REJECTED')}
                              disabled={processingId === doc.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">
                            Processed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
