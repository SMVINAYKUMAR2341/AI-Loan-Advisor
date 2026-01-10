import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const triggerLabels: Record<string, string> = {
  emi_reminder: 'EMI Reminder (3 days before)',
  emi_due: 'EMI Due Today',
  emi_overdue: 'EMI Overdue',
  disbursement_confirmation: 'Disbursement Confirmation',
};

const notificationTemplates = {
  emi_reminder: {
    sms: 'Dear {name}, your EMI of ₹{amount} is due on {date}. Please ensure timely payment.',
    email: 'Dear {name},\n\nThis is a reminder that your EMI of ₹{amount} for loan {loanId} is due on {date}.\n\nPlease ensure timely payment to avoid any late fees.\n\nThank you,\nBank Admin',
  },
  emi_due: {
    sms: 'Dear {name}, your EMI of ₹{amount} is due today. Please make the payment to avoid late fees.',
    email: 'Dear {name},\n\nYour EMI of ₹{amount} for loan {loanId} is due today.\n\nPlease make the payment at your earliest convenience.\n\nThank you,\nBank Admin',
  },
  emi_overdue: {
    sms: 'URGENT: Dear {name}, your EMI of ₹{amount} is overdue. Please pay immediately to avoid penalties.',
    email: 'Dear {name},\n\nYour EMI of ₹{amount} for loan {loanId} is overdue.\n\nPlease make the payment immediately to avoid additional penalties.\n\nThank you,\nBank Admin',
  },
  disbursement_confirmation: {
    sms: 'Dear {name}, ₹{amount} has been disbursed to your account. Transaction Ref: {txnRef}',
    email: 'Dear {name},\n\nWe are pleased to inform you that your loan amount of ₹{amount} has been disbursed to your bank account.\n\nTransaction Reference: {txnRef}\n\nThank you for choosing us.\n\nBest regards,\nBank Admin',
  },
};

interface NotificationData {
  id: string;
  user_id: string;
  customer_name: string;
  type: string;
  trigger: string;
  message: string;
  status: string;
  sent_at: string;
}

interface CustomerData {
  id: string;
  customer_id: string;
  name: string;
  mobile: string;
  email: string;
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<NotificationData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newNotif, setNewNotif] = useState({
    customerId: '',
    type: 'sms' as 'sms' | 'email',
    trigger: 'emi_reminder',
    message: '',
  });
  const [triggers, setTriggers] = useState({
    emi_reminder: true,
    emi_due: true,
    emi_overdue: true,
    disbursement_confirmation: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifsData, customersData] = await Promise.all([
        adminApi.getNotifications(),
        adminApi.getCustomers()
      ]);
      setNotifs(notifsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  };

  const sentCount = notifs.filter(n => n.status === 'sent' || n.status === 'delivered').length;
  const deliveredCount = notifs.filter(n => n.status === 'delivered').length;
  const failedCount = notifs.filter(n => n.status === 'failed').length;

  const handleSendNotification = async () => {
    if (!newNotif.customerId || !newNotif.message) {
      toast({
        title: 'Missing Information',
        description: 'Please select a customer and enter a message.',
        variant: 'destructive',
      });
      return;
    }

    const customer = customers.find(c => c.id === newNotif.customerId);
    if (!customer) return;

    setIsSending(true);
    try {
      await adminApi.sendNotification(
        newNotif.customerId,
        newNotif.type,
        newNotif.trigger,
        newNotif.message
      );

      toast({
        title: 'Notification Sent',
        description: `${newNotif.type.toUpperCase()} sent to ${customer.name}`,
      });

      // Refresh notifications list
      await fetchData();

      setIsSendOpen(false);
      setNewNotif({ customerId: '', type: 'sms', trigger: 'emi_reminder', message: '' });
    } catch (error: any) {
      toast({
        title: 'Failed to Send',
        description: error.message || 'Could not send notification. Please try again.',
        variant: 'destructive',
      });
    }
    setIsSending(false);
  };

  const handleBulkReminder = () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Bulk reminder functionality will be available in a future update.',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header - Enhanced */}
        <div className="p-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-500/30 animate-fade-in-up">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <Bell className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                <p className="text-gray-400">Manage SMS and Email notifications for customers</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBulkReminder} className="border-gray-700 text-white hover:bg-gray-800">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Send Bulk Reminders
              </Button>
              <Button onClick={() => setIsSendOpen(true)} className="bg-teal-500 hover:bg-teal-600 text-white">
                <Send className="h-4 w-4 mr-2" />
                Send Custom Notification
              </Button>
            </div>
          </div>
        </div>

        {/* Stats - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-teal-500/10 border-teal-500/30 rounded-2xl animate-fade-in-up stagger-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-500/30">
                  <Bell className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Sent</p>
                  <p className="text-2xl font-bold text-white">{sentCount}</p>
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
                  <p className="text-sm text-gray-400">Delivered</p>
                  <p className="text-2xl font-bold text-green-400">{deliveredCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30 rounded-2xl animate-fade-in-up stagger-3">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-red-400">{failedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-2xl animate-fade-in-up stagger-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="log" className="space-y-4">
          <TabsList className="bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger value="log" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">Notification Log</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">Templates</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="log">
            <Card className="bg-gray-800/50 border-gray-700/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Bell className="h-4 w-4 text-blue-400" />
                  </div>
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : notifs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No notifications sent yet
                        </TableCell>
                      </TableRow>
                    ) : notifs.map((notif) => (
                      <TableRow key={notif.id}>
                        <TableCell className="font-medium">{notif.customer_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {notif.type === 'sms' ? (
                              <MessageSquare className="h-3 w-3" />
                            ) : (
                              <Mail className="h-3 w-3" />
                            )}
                            {notif.type?.toUpperCase() || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{triggerLabels[notif.trigger] || notif.trigger}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{notif.message}</TableCell>
                        <TableCell>
                          <Badge className={
                            notif.status === 'delivered' ? 'status-paid' :
                              notif.status === 'failed' ? 'status-rejected' :
                                'status-pending'
                          }>
                            {notif.status.charAt(0).toUpperCase() + notif.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{notif.sent_at ? new Date(notif.sent_at).toLocaleString() : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid gap-4">
              {Object.entries(notificationTemplates).map(([trigger, templates]) => (
                <Card key={trigger}>
                  <CardHeader>
                    <CardTitle className="text-lg">{triggerLabels[trigger]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          SMS Template
                        </Label>
                        <Textarea
                          value={templates.sms}
                          readOnly
                          className="min-h-[100px] bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Template
                        </Label>
                        <Textarea
                          value={templates.email}
                          readOnly
                          className="min-h-[100px] bg-muted/50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Triggers
                </CardTitle>
                <CardDescription>Enable or disable automatic notification triggers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(triggerLabels).map(([trigger, label]) => (
                  <div key={trigger} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        {trigger === 'emi_reminder' && 'Send reminders 3 days before EMI due date'}
                        {trigger === 'emi_due' && 'Send notification on EMI due date'}
                        {trigger === 'emi_overdue' && 'Send urgent notification when EMI is overdue'}
                        {trigger === 'disbursement_confirmation' && 'Send confirmation when loan is disbursed'}
                      </p>
                    </div>
                    <Switch
                      checked={triggers[trigger as keyof typeof triggers]}
                      onCheckedChange={(checked) => setTriggers({ ...triggers, [trigger]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Send Custom Notification Dialog */}
        <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Custom Notification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={newNotif.customerId} onValueChange={(v) => setNewNotif({ ...newNotif, customerId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.mobile})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notification Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={newNotif.type === 'sms' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setNewNotif({ ...newNotif, type: 'sms' })}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    SMS
                  </Button>
                  <Button
                    variant={newNotif.type === 'email' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setNewNotif({ ...newNotif, type: 'email' })}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select value={newNotif.trigger} onValueChange={(v) => setNewNotif({ ...newNotif, trigger: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  placeholder="Enter your message..."
                  value={newNotif.message}
                  onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendOpen(false)} disabled={isSending}>Cancel</Button>
              <Button onClick={handleSendNotification} className="gradient-primary" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
