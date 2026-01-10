import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    MessageSquare,
    Search,
    Send,
    CheckCircle,
    User,
    RefreshCw
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Ticket {
    id: string;
    ticket_id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    user_id: string;
}

interface Message {
    id: string;
    sender_type: string;
    message: string;
    created_at: string;
}

interface TicketDetail extends Ticket {
    messages: Message[];
    user?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

export default function Tickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchTickets();
    }, [filterStatus]);

    useEffect(() => {
        if (selectedTicket) {
            scrollToBottom();
        }
    }, [selectedTicket?.messages]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getTickets(filterStatus);
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            toast({
                title: 'Error',
                description: 'Failed to load tickets',
                variant: 'destructive',
            });
        }
        setLoading(false);
    };

    const handleTicketSelect = async (ticketId: string) => {
        setLoadingDetails(true);
        try {
            const details = await adminApi.getTicketDetails(ticketId);
            setSelectedTicket(details);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load ticket details',
                variant: 'destructive',
            });
        }
        setLoadingDetails(false);
    };

    const handleSendReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;

        setSending(true);
        try {
            await adminApi.replyTicket(selectedTicket.id, replyText);
            setReplyText('');

            const updated = await adminApi.getTicketDetails(selectedTicket.id);
            setSelectedTicket(updated);
            fetchTickets();

        } catch (error) {
            toast({
                title: 'Failed to send',
                description: 'Could not send reply. Please try again.',
                variant: 'destructive',
            });
        }
        setSending(false);
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedTicket) return;
        try {
            await adminApi.updateTicketStatus(selectedTicket.id, status);
            toast({ title: 'Status Updated', description: `Ticket marked as ${status}` });

            const updated = await adminApi.getTicketDetails(selectedTicket.id);
            setSelectedTicket(updated);
            fetchTickets();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update status',
                variant: 'destructive',
            });
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const filteredTickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'IN_PROGRESS': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'RESOLVED': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'CLOSED': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default: return 'bg-gray-500/10 text-gray-400';
        }
    };

    return (
        <AdminLayout>
            <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">

                {/* Left Panel: Ticket List */}
                <Card className="w-full md:w-1/3 flex flex-col bg-gray-900/50 border-gray-800 glass-card">
                    <CardHeader className="pb-4 border-b border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-teal-400" />
                                Support Tickets
                            </CardTitle>
                            <Button size="icon" variant="ghost" onClick={fetchTickets} className="h-8 w-8 hover:bg-gray-800">
                                <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search tickets..."
                                    className="pl-9 bg-gray-900/95 border-gray-700 h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((status) => (
                                    <Button
                                        key={status}
                                        variant={filterStatus === status ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setFilterStatus(status)}
                                        className={`text-xs h-7 rounded-full ${filterStatus === status ? 'bg-teal-500 hover:bg-teal-600' : 'bg-transparent border-gray-700 text-gray-400'}`}
                                    >
                                        {status.replace('_', ' ')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <RefreshCw className="h-6 w-6 animate-spin text-teal-400" />
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center p-8 text-gray-500">
                                <p>No tickets found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {filteredTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => handleTicketSelect(ticket.id)}
                                        className={`p-4 cursor-pointer hover:bg-gray-900/95 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-teal-500/5 border-l-2 border-teal-500' : 'border-l-2 border-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-mono text-xs text-gray-500">{ticket.ticket_id}</span>
                                            <span className="text-xs text-gray-500">{format(new Date(ticket.created_at), 'MMM d, HH:mm')}</span>
                                        </div>
                                        <h4 className="font-medium text-white mb-2 line-clamp-1">{ticket.subject}</h4>
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-[10px] px-1.5 py-0 ${getStatusColor(ticket.status)} border`}>
                                                {ticket.status.replace('_', ' ')}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-700 text-gray-400">
                                                {ticket.category}
                                            </Badge>
                                            {ticket.priority === 'High' && (
                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">High</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Panel: Chat Interface */}
                <Card className="flex-1 flex flex-col bg-gray-900/50 border-gray-800 glass-card">
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <CardHeader className="py-4 border-b border-gray-800 flex-shrink-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-lg font-bold text-white">{selectedTicket.subject}</h2>
                                            <Badge className={getStatusColor(selectedTicket.status)}>{selectedTicket.status.replace('_', ' ')}</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {selectedTicket.user ? `${selectedTicket.user.first_name || ''} ${selectedTicket.user.last_name || ''}` : 'Unknown User'}
                                            </div>
                                            <span className="font-mono text-xs opacity-50">{selectedTicket.ticket_id}</span>
                                            <span className="text-xs opacity-50">{selectedTicket.user?.email}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {selectedTicket.status !== 'RESOLVED' && (
                                            <Button size="sm" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10" onClick={() => handleUpdateStatus('RESOLVED')}>
                                                <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                                            </Button>
                                        )}
                                        {selectedTicket.status === 'RESOLVED' && (
                                            <Button size="sm" variant="outline" className="border-gray-700 text-gray-400 hover:bg-gray-800" onClick={() => handleUpdateStatus('IN_PROGRESS')}>
                                                Re-open
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Messages Area */}
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                                {loadingDetails ? (
                                    <div className="flex justify-center py-8">
                                        <RefreshCw className="h-8 w-8 animate-spin text-teal-400" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-center my-4">
                                            <span className="text-xs text-gray-600 bg-gray-900/50 px-3 py-1 rounded-full">
                                                Ticket Created: {format(new Date(selectedTicket.created_at), 'MMM d, yyyy h:mm a')}
                                            </span>
                                        </div>

                                        {selectedTicket.messages.map((msg) => {
                                            const isAdmin = msg.sender_type === 'ADMIN';
                                            return (
                                                <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`flex gap-3 max-w-[80%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        <Avatar className="h-8 w-8 mt-1">
                                                            <AvatarFallback className={isAdmin ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300'}>
                                                                {isAdmin ? 'AD' : 'CU'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className={`p-3 rounded-2xl ${isAdmin
                                                            ? 'bg-teal-500/20 border border-teal-500/30 text-white rounded-tr-sm'
                                                            : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-sm'
                                                            }`}>
                                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                                            <p className={`text-[10px] mt-1 ${isAdmin ? 'text-teal-400/70' : 'text-gray-500'} text-right`}>
                                                                {format(new Date(msg.created_at), 'h:mm a')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </CardContent>

                            {/* Input Area */}
                            <div className="p-4 bg-gray-900/50 border-t border-gray-800 mt-auto">
                                <div className="flex gap-3">
                                    <Textarea
                                        placeholder="Type your reply..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="min-h-[50px] max-h-[150px] bg-gray-800 border-gray-700 focus:border-teal-500/50 resize-none text-white"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendReply();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim() || sending}
                                        className="h-auto bg-teal-500 hover:bg-teal-600 text-white px-4"
                                    >
                                        {sending ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-900/95 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="h-8 w-8 opacity-50" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">Select a Ticket</h3>
                            <p>Choose a ticket from the list to view details and reply.</p>
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
