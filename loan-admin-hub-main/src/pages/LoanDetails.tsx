import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ArrowLeft, FileText, User, Mail, Phone, Calendar, CreditCard,
    CheckCircle, XCircle, FileWarning, Loader2, Download, Eye,
    Building2, TrendingUp, AlertTriangle, Clock, ShieldCheck
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

const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'APPROVED': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'DOCUMENTS_REQUIRED': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'PENDING_REVIEW': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

export default function LoanDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [justification, setJustification] = useState('');
    const [processing, setProcessing] = useState(false);

    // Request Documents state
    const [showDocRequest, setShowDocRequest] = useState(false);
    const [docTypes, setDocTypes] = useState('');
    const [docMessage, setDocMessage] = useState('');
    const [requireOfficeVisit, setRequireOfficeVisit] = useState(false);

    useEffect(() => {
        if (id) fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const result = await adminApi.getApplicationFullDetails(id!);
            setData(result);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load application details.',
                variant: 'destructive',
            });
        }
        setLoading(false);
    };

    const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
        if (!justification || justification.length < 10) {
            toast({
                title: 'Justification Required',
                description: 'Please provide a justification (at least 10 characters).',
                variant: 'destructive',
            });
            return;
        }

        setProcessing(true);
        try {
            await adminApi.updateApplicationDecision(id!, decision, justification);
            toast({
                title: 'Success',
                description: `Application ${decision.toLowerCase()} successfully.`,
            });
            fetchDetails();
            setJustification('');
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update decision.',
                variant: 'destructive',
            });
        }
        setProcessing(false);
    };

    const handleRequestDocuments = async () => {
        if (!docTypes.trim()) {
            toast({
                title: 'Documents Required',
                description: 'Please specify which documents are required.',
                variant: 'destructive',
            });
            return;
        }

        setProcessing(true);
        try {
            await adminApi.requestDocuments(id!, docTypes, docMessage, requireOfficeVisit);
            toast({
                title: 'Success',
                description: 'Document request sent to customer.',
            });
            fetchDetails();
            setShowDocRequest(false);
            setDocTypes('');
            setDocMessage('');
            setRequireOfficeVisit(false);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to send document request.',
                variant: 'destructive',
            });
        }
        setProcessing(false);
    };

    const handleDownloadAgreement = async () => {
        try {
            toast({
                title: 'Downloading...',
                description: 'Preparing official loan agreement PDF.',
            });
            await adminApi.downloadAgreement(id!);
            toast({
                title: 'Success',
                description: 'Loan agreement downloaded successfully.',
            });
        } catch (error: any) {
            toast({
                title: 'Download Failed',
                description: error.message || 'Could not download the agreement.',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                </div>
            </AdminLayout>
        );
    }

    if (!data) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <p className="text-gray-400">Application not found.</p>
                    <Button onClick={() => navigate('/loans')} className="mt-4">Back to Applications</Button>
                </div>
            </AdminLayout>
        );
    }

    const { application, customer, prediction, documents, officer_review, agreement } = data;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate('/loans')}
                            className="border-gray-700 text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Loan Application Details</h1>
                            <p className="text-gray-400 text-sm">ID: {application?.tracking_id || application?.id}</p>
                        </div>
                    </div>
                    <Badge className={`text-sm px-4 py-2 ${getStatusColor(prediction?.decision)}`}>
                        {prediction?.decision || 'PENDING'}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Customer & Loan Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer Information */}
                        <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <User className="h-5 w-5 text-teal-400" />
                                    Customer Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Customer Name</p>
                                    <p className="text-white font-medium">{customer?.first_name} {customer?.last_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Customer ID</p>
                                    <p className="text-white font-mono">{customer?.customer_id}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                                    <p className="text-white">{customer?.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" /> Mobile</p>
                                    <p className="text-white">{customer?.mobile_number}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Account Created</p>
                                    <p className="text-white">{customer?.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Loan Details */}
                        <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-teal-400" />
                                    Loan Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Loan Amount</p>
                                    <p className="text-2xl font-bold text-green-400">{formatCurrency(application?.loan_amount || 0)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Purpose</p>
                                    <p className="text-white">{application?.loan_purpose}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Tenure</p>
                                    <p className="text-white">{application?.loan_duration} months</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Interest Rate</p>
                                    <p className="text-white">{prediction?.interest_rate?.toFixed(2)}% p.a.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Monthly EMI</p>
                                    <p className="text-yellow-400 font-medium">{formatCurrency(prediction?.emi || 0)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500">Applied On</p>
                                    <p className="text-white">{application?.created_at ? new Date(application.created_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Analysis */}
                        <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-purple-400" />
                                    AI Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Approval Probability</span>
                                    <span className={`text-2xl font-bold ${(prediction?.approval_probability || 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                        {prediction?.approval_probability?.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full ${(prediction?.approval_probability || 0) >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                                        style={{ width: `${prediction?.approval_probability || 0}%` }}
                                    />
                                </div>
                                {prediction?.decision_reason && (
                                    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                        <p className="text-xs text-gray-500 mb-1">Decision Reason</p>
                                        <p className="text-gray-300 text-sm">{prediction.decision_reason}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500">Credit Rating</p>
                                        <p className="text-white">{prediction?.credit_rating || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500">Total Repayment</p>
                                        <p className="text-white">{formatCurrency(prediction?.total_repayment || 0)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* KYC Documents */}
                        <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                    KYC Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {documents && documents.length > 0 ? (
                                    <div className="space-y-3">
                                        {documents.map((doc: any) => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-white font-medium">{doc.document_type}</p>
                                                        <p className="text-xs text-gray-500">{doc.file_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {doc.verified ? (
                                                        <Badge className="bg-green-500/20 text-green-400">Verified</Badge>
                                                    ) : (
                                                        <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
                                                    )}
                                                    <Button size="sm" variant="outline" className="border-gray-700">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <FileWarning className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No documents uploaded yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-6">
                        {/* Previous Review */}
                        {officer_review && (
                            <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-gray-400" />
                                        Previous Review
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Badge className={getStatusColor(officer_review.final_decision)}>
                                        {officer_review.final_decision}
                                    </Badge>
                                    <p className="text-sm text-gray-300">{officer_review.justification}</p>
                                    <p className="text-xs text-gray-500">
                                        Reviewed: {officer_review.reviewed_at ? new Date(officer_review.reviewed_at).toLocaleString() : 'N/A'}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Admin Actions */}
                        <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white">Take Action</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    placeholder="Enter justification for your decision (required, min 10 chars)..."
                                    value={justification}
                                    onChange={(e) => setJustification(e.target.value)}
                                    className="bg-gray-800/50 border-gray-700 text-white min-h-[100px]"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={() => handleDecision('APPROVED')}
                                        disabled={processing}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={() => handleDecision('REJECTED')}
                                        disabled={processing}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                                        Reject
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => setShowDocRequest(!showDocRequest)}
                                    variant="outline"
                                    className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
                                >
                                    <FileWarning className="h-4 w-4 mr-2" />
                                    Request Documents
                                </Button>

                                {/* Request Documents Form */}
                                {showDocRequest && (
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg space-y-3">
                                        <Input
                                            placeholder="Document types (comma-separated): e.g., PAN Card, Salary Slip"
                                            value={docTypes}
                                            onChange={(e) => setDocTypes(e.target.value)}
                                            className="bg-gray-800/50 border-gray-700 text-white"
                                        />
                                        <Textarea
                                            placeholder="Additional message to customer..."
                                            value={docMessage}
                                            onChange={(e) => setDocMessage(e.target.value)}
                                            className="bg-gray-800/50 border-gray-700 text-white"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="officeVisit"
                                                checked={requireOfficeVisit}
                                                onCheckedChange={(checked) => setRequireOfficeVisit(checked as boolean)}
                                            />
                                            <label htmlFor="officeVisit" className="text-sm text-yellow-400">
                                                Require customer to visit branch with hard copies
                                            </label>
                                        </div>
                                        <Button
                                            onClick={handleRequestDocuments}
                                            disabled={processing}
                                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                                        >
                                            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Building2 className="h-4 w-4 mr-2" />}
                                            Send Request
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Professional Agreement Panel */}
                        {agreement && (
                            <Card className="bg-gray-900 border-teal-500/30 rounded-2xl overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                    <ShieldCheck className="h-24 w-24 text-teal-400" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-teal-400" />
                                            Professional Loan Agreement
                                        </div>
                                        <Badge className={agreement.consent_given ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}>
                                            {agreement.status}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700">
                                            <p className="text-xs text-gray-500 mb-1">Loan Amount</p>
                                            <p className="text-white font-bold">{formatCurrency(agreement.loan_amount)}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700">
                                            <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
                                            <p className="text-teal-400 font-bold">{agreement.interest_rate}% p.a.</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700">
                                            <p className="text-xs text-gray-500 mb-1">Monthly EMI</p>
                                            <p className="text-yellow-400 font-bold">{formatCurrency(agreement.emi_amount)}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700">
                                            <p className="text-xs text-gray-500 mb-1">Total Payable</p>
                                            <p className="text-white font-bold">{formatCurrency(agreement.total_payable)}</p>
                                        </div>
                                    </div>

                                    {agreement.signed_at && (
                                        <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-teal-400 font-bold flex items-center gap-2 text-sm">
                                                    <ShieldCheck className="h-4 w-4" />
                                                    DIGITALLY AUTHENTICATED
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Consent secured via RBI compliant digital signature process.
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Signed On</p>
                                                <p className="text-xs text-white font-medium">{new Date(agreement.signed_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleDownloadAgreement}
                                        className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-xl shadow-lg shadow-teal-900/20 transition-all active:scale-95"
                                    >
                                        <Download className="h-5 w-5 mr-3" />
                                        Download Official PDF Agreement
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions */}
                        <Card className="bg-gray-900/95 border-gray-700/50 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full border-gray-700 text-white hover:bg-gray-800"
                                    onClick={() => adminApi.downloadReport(id!, application?.tracking_id)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Report
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
