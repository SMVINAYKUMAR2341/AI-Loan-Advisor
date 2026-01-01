import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface Message {
    id: string;
    role: 'bot' | 'user';
    content: string;
    timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
    id: '1',
    role: 'bot',
    content: "Hi! I'm your AI Credit Advisor. I can help you with loan eligibility, credit score tips, and financial guidance. How can I assist you today?",
    timestamp: new Date(),
};

export function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentInput = input.trim();
        setInput('');
        setIsTyping(true);

        try {
            // Call backend AI chatbot API
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: currentInput,
                    conversation_history: messages.slice(-4).map(m => ({
                        role: m.role === 'bot' ? 'assistant' : 'user',
                        content: m.content
                    }))
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'bot',
                    content: data.response,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMessage]);
            } else {
                // Fallback on API error
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'bot',
                    content: getFallbackResponse(currentInput),
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMessage]);
            }
        } catch (error) {
            console.error('Chat API error:', error);
            // Fallback on network error
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                content: getFallbackResponse(currentInput),
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    // Fallback responses when API is unavailable
    const getFallbackResponse = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('loan')) return "I can help with loan queries. Please try again in a moment, or visit the Apply for Loan section.";
        if (lowerQuery.includes('credit')) return "For credit score tips, keep utilization below 30% and pay bills on time!";
        if (lowerQuery.includes('hi') || lowerQuery.includes('hello')) return "Hello! I'm your AI Credit Advisor. How can I help you today?";
        return "I'm here to help with loan and credit queries. Please try again or use our AI Loan Advisor for detailed analysis!";
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                >
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium">AI Advisor</span>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50 flex flex-col bg-[#0f1419] animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1a2332] to-[#0f1419] border-b border-gray-700/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center border border-cyan-500/30">
                                <Bot className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">AI Credit Advisor</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <span className="text-xs text-gray-400">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.role === 'bot' && (
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                                        <Bot className="w-4 h-4 text-cyan-400" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${message.role === 'user'
                                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-br-sm'
                                        : 'bg-[#1a2332] text-gray-200 rounded-bl-sm border border-gray-700/50'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                                </div>
                                {message.role === 'user' && (
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-cyan-300" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                                    <Bot className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div className="bg-[#1a2332] rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-700/50">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-700/50 bg-[#0a0e14]">
                        <div className="flex items-center gap-2 bg-[#1a2332] rounded-xl px-4 py-2 border border-gray-700/50 focus-within:border-cyan-500/50 transition-colors">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about your eligibility..."
                                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AIChatbot;
