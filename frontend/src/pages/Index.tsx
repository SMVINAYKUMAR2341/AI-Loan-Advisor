import { useState, useEffect } from "react";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  Brain,
  Users,
  Shield,
  CheckCircle,
  Calculator,
  TrendingUp,
  Info,
  FileText,
  Zap,
  UserCheck,
  Banknote,
  Fingerprint,
  Lock,
  Eye,
  CreditCard,
  RefreshCw,
  Calendar,
  BarChart3,
  Bot,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  FileX,
  ShieldCheck,
  Sparkles,
  Scale,
  LogIn,
  Facebook,
  Linkedin,
  Instagram,
  FileCheck,
  Star,
  Award,
  Target,
  Clock,
  DollarSign,
  Percent,
  Mail,
  Phone,
} from "lucide-react";

// Utility function
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Button component
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

const Index = () => {
  // Header state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [flowType, setFlowType] = useState<'customer' | 'admin'>('customer');

  // Calculator state
  const [income, setIncome] = useState(50000);
  const [existingEMI, setExistingEMI] = useState(5000);
  const [creditUtilization, setCreditUtilization] = useState(30);
  const [paymentHistory, setPaymentHistory] = useState(95);

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation links
  const navLinks = [
    { href: "#how-it-works", label: "How It Works" },
    { href: "#calculator", label: "Credit Calculator" },
    { href: "#why-choose-us", label: "Why Choose Us" },
  ];

  // Calculator functions
  const calculateScore = () => {
    let score = 650;
    score += Math.min((income / 10000) * 10, 100);
    score -= (existingEMI / income) * 100;
    score -= creditUtilization > 50 ? 50 : creditUtilization > 30 ? 25 : 0;
    return Math.min(Math.max(Math.round(score), 300), 850);
  };

  const score = calculateScore();

  const getScoreColor = (s: number) => {
    if (s >= 750) return "text-green-400";
    if (s >= 650) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 750) return "Excellent";
    if (s >= 700) return "Good";
    if (s >= 650) return "Fair";
    return "Needs Improvement";
  };

  // Data arrays
  const trustItems = [
    { icon: Brain, label: "Explainable AI Decisions" },
    { icon: Users, label: "Human Review for Edge Cases" },
    { icon: Shield, label: "Secure & Privacy-First" },
    { icon: CheckCircle, label: "Regulatory Compliant" },
  ];

  const steps = [
    {
      icon: FileText,
      title: "Submit Basic Details",
      description: "Simple financial info, no documents needed upfront. Get instant tracking ID.",
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Income, credit behavior, and liabilities reviewed instantly by smart algorithms",
    },
    {
      icon: Zap,
      title: "Instant Decision",
      description: "Clear explanation of eligibility - approved or rejected with reasons",
    },
    {
      icon: UserCheck,
      title: "Smart KYC Process",
      description: "Upload just 2 documents. Reuse Aadhaar/PAN for future loans automatically",
    },
    {
      icon: ShieldCheck,
      title: "Admin Verification",
      description: "Expert review of documents. Admins verify identity and financial documents",
    },
    {
      icon: Banknote,
      title: "Instant Disbursement",
      description: "Funds released immediately after admin approval. Track with your ID",
    },
  ];

  const adminSteps = [
    {
      icon: Eye,
      title: "Monitor Applications",
      description: "View all loan applications in real-time dashboard with filters",
    },
    {
      icon: FileText,
      title: "Track by ID",
      description: "Search any application instantly using 8-digit tracking ID",
    },
    {
      icon: FileCheck,
      title: "Verify Documents",
      description: "Review uploaded documents. View cross-application history for repeat customers",
    },
    {
      icon: CheckCircle,
      title: "Approve or Reject",
      description: "One-click document verification. Mark as verified or request reupload",
    },
    {
      icon: Banknote,
      title: "Process Disbursement",
      description: "Release funds directly to verified bank accounts with full audit trail",
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Track approval rates, processing times, and document verification metrics",
    },
  ];

  const improvements = [
    "Pay bills on time to build positive history",
    "Keep credit utilization below 30%",
    "Avoid multiple loan applications at once",
    "Maintain a diverse credit mix",
  ];

  const kycFeatures = [
    {
      icon: Sparkles,
      title: "Smart Document Reuse",
      description: "Upload identity documents once - reuse for all future loan applications automatically",
    },
    {
      icon: Fingerprint,
      title: "2-Document Quick KYC",
      description: "Complete KYC with just 2 documents - reduced from 4 for faster processing",
    },
    {
      icon: FileCheck,
      title: "AI-Assisted Document Checks",
      description: "Quick, accurate document verification with smart AI",
    },
    {
      icon: RefreshCw,
      title: "Delete & Reupload Anytime",
      description: "Made a mistake? Delete and reupload documents instantly before verification",
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "Your data is encrypted at rest and in transit",
    },
    {
      icon: ShieldCheck,
      title: "Fresh Bank Statements",
      description: "Latest 3-6 months bank statements required per application for accurate assessment",
    },
    {
      icon: UserCheck,
      title: "Manual Review When Needed",
      description: "Human experts step in for complex cases",
    },
    {
      icon: Eye,
      title: "Privacy by Design",
      description: "We collect only what's necessary, nothing more",
    },
  ];

  const repaymentFeatures = [
    {
      icon: FileText,
      title: "Instant Tracking ID",
      description: "Get a unique 8-digit tracking ID instantly - track your loan application anywhere, anytime.",
    },
    {
      icon: CreditCard,
      title: "Debit Card Repayment",
      description: "No need for complex bank mandates. Simply use your debit card.",
    },
    {
      icon: RefreshCw,
      title: "Automated EMI Deductions",
      description: "Set it and forget it. EMIs deducted automatically on schedule.",
    },
    {
      icon: Calendar,
      title: "Flexible Schedules",
      description: "Choose payment dates that work best for your cash flow.",
    },
    {
      icon: BarChart3,
      title: "Transparent EMI Breakdown",
      description: "See exactly how much goes to principal vs interest.",
    },
    {
      icon: Zap,
      title: "Admin Tracking Search",
      description: "Admins can instantly find any application by tracking ID for faster support.",
    },
  ];

  const benefits = [
    {
      icon: Brain,
      title: "AI-First Decisioning",
      description: "Advanced algorithms analyze your profile instantly for accurate eligibility assessment.",
    },
    {
      icon: Eye,
      title: "Transparent Explanations",
      description: "Every decision comes with a clear, understandable explanation—no black boxes.",
    },
    {
      icon: Zap,
      title: "Faster Approvals",
      description: "Get decisions in minutes, not days. Our AI works around the clock.",
    },
    {
      icon: FileX,
      title: "Reduced Paperwork",
      description: "Documents only after approval. No upfront hassle or unnecessary uploads.",
    },
    {
      icon: ShieldCheck,
      title: "Secure by Design",
      description: "Bank-grade encryption and privacy-first architecture protect your data.",
    },
    {
      icon: Sparkles,
      title: "No Hidden Processes",
      description: "Full visibility into how your application is processed and decisions are made.",
    },
  ];

  const quickLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Credit Calculator", href: "#calculator" },
    { label: "Why Choose Us", href: "#why-choose-us" },
    { label: "About Us", href: "#" },
    { label: "Contact", href: "#" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "AI Disclosure", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#0A2540] relative">
      {/* Global Background - Flowing Waves Like Reference Image */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Base gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A2540] via-[#0d2d4d] to-[#0A2540]" />
        
        {/* Flowing Wave 1 - Top Right */}
        <div 
          className="absolute -top-[20%] -right-[10%] w-[80%] h-[60%] animate-wave"
          style={{
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.6) 0%, rgba(219, 39, 119, 0.4) 50%, rgba(147, 51, 234, 0.3) 100%)',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            filter: 'blur(60px)',
            transform: 'rotate(-15deg)',
          }}
        />
        
        {/* Flowing Wave 2 - Bottom Left */}
        <div 
          className="absolute -bottom-[30%] -left-[20%] w-[90%] h-[70%] animate-wave"
          style={{
            background: 'linear-gradient(45deg, rgba(236, 72, 153, 0.7) 0%, rgba(244, 114, 182, 0.5) 40%, rgba(168, 85, 247, 0.4) 100%)',
            borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
            filter: 'blur(80px)',
            transform: 'rotate(10deg)',
            animationDelay: '2s',
          }}
        />
        
        {/* Flowing Wave 3 - Center Right */}
        <div 
          className="absolute top-[30%] -right-[15%] w-[60%] h-[50%] animate-morph"
          style={{
            background: 'linear-gradient(180deg, rgba(236, 72, 153, 0.5) 0%, rgba(219, 39, 119, 0.6) 50%, rgba(190, 24, 93, 0.4) 100%)',
            borderRadius: '40% 60% 60% 40% / 70% 30% 70% 30%',
            filter: 'blur(70px)',
            animationDelay: '1s',
          }}
        />
        
        {/* Flowing Wave 4 - Top Left accent */}
        <div 
          className="absolute -top-[10%] -left-[15%] w-[50%] h-[40%] animate-wave"
          style={{
            background: 'linear-gradient(225deg, rgba(244, 114, 182, 0.5) 0%, rgba(236, 72, 153, 0.4) 100%)',
            borderRadius: '70% 30% 50% 50% / 30% 60% 40% 70%',
            filter: 'blur(50px)',
            animationDelay: '3s',
          }}
        />
        
        {/* Subtle blue wave accent */}
        <div 
          className="absolute bottom-[20%] right-[10%] w-[40%] h-[35%] animate-morph"
          style={{
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.3) 100%)',
            borderRadius: '50% 50% 30% 70% / 40% 60% 40% 60%',
            filter: 'blur(60px)',
            animationDelay: '4s',
          }}
        />
        
        {/* Floating particles */}
        <div className="absolute top-[20%] left-[20%] w-3 h-3 rounded-full bg-pink-400/40 animate-float" />
        <div className="absolute top-[60%] right-[30%] w-2 h-2 rounded-full bg-pink-300/50 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[30%] left-[40%] w-4 h-4 rounded-full bg-purple-400/30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[20%] w-2 h-2 rounded-full bg-pink-500/40 animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-[50%] left-[60%] w-3 h-3 rounded-full bg-pink-300/30 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header - Premium Glassmorphism Navbar */}
      <header
        className={`fixed top-4 left-4 right-4 z-50 transition-all duration-500 rounded-2xl ${
          isScrolled 
            ? "backdrop-blur-2xl bg-[#0A2540]/80 border border-pink-500/20 shadow-lg shadow-pink-500/5" 
            : "backdrop-blur-xl bg-[#0A2540]/40 border border-white/10"
        }`}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="font-display font-bold text-white text-lg">LA</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-bold text-xl text-white">Loan</span>
              <span className="font-display font-bold text-xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Advisor</span>
            </div>
          </a>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center gap-1 bg-white/5 rounded-full p-1.5 border border-white/10">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-5 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          {/* Right Side - Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full px-5" 
              asChild
            >
              <a href="/login" className="flex items-center gap-2">
                <LogIn size={16} />
                Login
              </a>
            </Button>
            <Button 
              className="relative overflow-hidden rounded-full px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-300" 
              asChild
            >
              <a href="/signup" className="flex items-center gap-2">
                <Sparkles size={16} />
                Get Started
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mx-4 mb-4 rounded-xl bg-[#0A2540]/95 backdrop-blur-xl border border-pink-500/20 p-5 animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-white/10">
                <Button variant="ghost" className="justify-start text-gray-300 hover:text-white hover:bg-white/10 rounded-lg" asChild>
                  <a href="/login" className="flex items-center gap-2">
                    <LogIn size={16} />
                    Login
                  </a>
                </Button>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg justify-center" asChild>
                  <a href="/signup" className="flex items-center gap-2">
                    <Sparkles size={16} />
                    Get Started
                  </a>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* Hero Section - Compact & Beautiful */}
        <section className="min-h-[90vh] flex items-center justify-center relative overflow-hidden pt-20">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 animate-fade-in-up bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/30 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                  <span className="text-sm text-gray-100 font-medium">AI-Powered Financial Decisions</span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-5 animate-fade-in-up stagger-1">
                  <span className="text-white">AI-Powered</span>
                  <br />
                  <span className="bg-gradient-to-r from-pink-400 via-pink-300 to-purple-400 bg-clip-text text-transparent">Loan Eligibility</span>
                  <br />
                  <span className="text-white">Advisor</span>
                </h1>

                <p className="text-lg text-gray-300 max-w-lg mx-auto lg:mx-0 mb-8 animate-fade-in-up stagger-2">
                  Get instant eligibility decisions powered by AI. No documents upfront. Know where you stand in 2 minutes.
                </p>

                <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 animate-fade-in-up stagger-3">
                  <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-base px-8 py-6 rounded-xl shadow-lg shadow-pink-500/25 group">
                    Check Eligibility
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                  </Button>
                  <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl border-white/20 hover:bg-white/10" asChild>
                    <a href="#how-it-works">
                      See How It Works
                      <ChevronDown className="ml-2" size={20} />
                    </a>
                  </Button>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-center lg:justify-start gap-8 mt-10 animate-fade-in-up stagger-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">2 min</div>
                    <div className="text-xs text-gray-400">Decision</div>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">0</div>
                    <div className="text-xs text-gray-400">Docs Upfront</div>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">100%</div>
                    <div className="text-xs text-gray-400">Transparent</div>
                  </div>
                </div>
              </div>

              {/* Right Side - Feature Cards */}
              <div className="hidden lg:block relative">
                <div className="relative">
                  {/* Main Card */}
                  <div className="glass-card p-6 rounded-2xl max-w-sm ml-auto">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <Brain className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">AI Analysis</h3>
                        <p className="text-xs text-gray-400">100+ factors analyzed</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-gray-300">Credit Score</span>
                        <span className="text-sm font-semibold text-green-400">Excellent</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-gray-300">Income Verified</span>
                        <CheckCircle className="text-green-400" size={18} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-gray-300">Loan Eligible</span>
                        <span className="text-sm font-semibold text-pink-400">₹5,00,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Cards */}
                  <div className="absolute -top-4 -left-4 glass-card p-4 rounded-xl animate-float">
                    <div className="flex items-center gap-2">
                      <Zap className="text-yellow-400" size={20} />
                      <span className="text-sm font-medium text-white">Instant Decision</span>
                    </div>
                  </div>

                  <div className="absolute -bottom-4 -left-8 glass-card p-4 rounded-xl animate-float" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-2">
                      <Shield className="text-green-400" size={20} />
                      <span className="text-sm font-medium text-white">Bank-grade Security</span>
                    </div>
                  </div>

                  <div className="absolute top-1/2 -right-4 glass-card p-4 rounded-xl animate-float" style={{ animationDelay: '2s' }}>
                    <div className="flex items-center gap-2">
                      <Star className="text-pink-400 fill-pink-400" size={20} />
                      <span className="text-sm font-medium text-white">4.8 Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Strip - Compact */}
        <section className="py-6 border-y border-pink-500/20 bg-[#0A2540]/80 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {trustItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="text-pink-400" size={24} />
                  </div>
                  <span className="text-sm font-medium text-gray-200">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics - Compact Inline */}
        <section className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="glass-card rounded-2xl p-8 max-w-5xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">50K+</div>
                  <div className="text-sm text-gray-400 mt-1">Loans Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">₹500Cr</div>
                  <div className="text-sm text-gray-400 mt-1">Disbursed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">4.8★</div>
                  <div className="text-sm text-gray-400 mt-1">User Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">2 min</div>
                  <div className="text-sm text-gray-400 mt-1">Avg. Decision</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why We're Different - Comparison */}
        <section className="py-12 relative bg-transparent">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                  Why Choose <span className="gradient-text">Us Over Banks</span>
                </h2>
                <p className="text-gray-400">Experience the future of lending</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Us */}
                <div className="glass-card p-6 rounded-2xl border-pink-500/30">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-2">
                      <Zap className="text-white" size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-white">LoanAdvisor</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="text-green-400 flex-shrink-0" size={16} /><span className="text-gray-300">2 min decision</span></li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="text-green-400 flex-shrink-0" size={16} /><span className="text-gray-300">Only 2 documents</span></li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="text-green-400 flex-shrink-0" size={16} /><span className="text-gray-300">From 8.99% interest</span></li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="text-green-400 flex-shrink-0" size={16} /><span className="text-gray-300">100% online</span></li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="text-green-400 flex-shrink-0" size={16} /><span className="text-gray-300">24hr disbursement</span></li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="text-green-400 flex-shrink-0" size={16} /><span className="text-gray-300">AI-powered</span></li>
                  </ul>
                </div>

                {/* VS */}
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="font-bold text-xl text-gray-400">VS</span>
                  </div>
                </div>

                {/* Banks */}
                <div className="glass-card p-6 rounded-2xl opacity-60">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-2">
                      <Banknote className="text-gray-400" size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-400">Traditional Banks</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm"><X className="text-red-400 flex-shrink-0" size={16} /><span className="text-gray-500">5-7 days wait</span></li>
                    <li className="flex items-center gap-2 text-sm"><X className="text-red-400 flex-shrink-0" size={16} /><span className="text-gray-500">10-15 documents</span></li>
                    <li className="flex items-center gap-2 text-sm"><X className="text-red-400 flex-shrink-0" size={16} /><span className="text-gray-500">11-14% interest</span></li>
                    <li className="flex items-center gap-2 text-sm"><X className="text-red-400 flex-shrink-0" size={16} /><span className="text-gray-500">Branch visits</span></li>
                    <li className="flex items-center gap-2 text-sm"><X className="text-red-400 flex-shrink-0" size={16} /><span className="text-gray-500">7-14 days disburse</span></li>
                    <li className="flex items-center gap-2 text-sm"><X className="text-red-400 flex-shrink-0" size={16} /><span className="text-gray-500">Manual process</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Compact Horizontal Flow */}
        <section id="how-it-works" className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                How It <span className="gradient-text">Works</span>
              </h2>
              <div className="inline-flex items-center glass-card rounded-full p-0.5 mt-3">
                <button
                  onClick={() => setFlowType('customer')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    flowType === 'customer'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Customer
                </button>
                <button
                  onClick={() => setFlowType('admin')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    flowType === 'admin'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Horizontal Steps */}
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex flex-wrap justify-center gap-2 lg:gap-4">
                {(flowType === 'customer' ? steps : adminSteps).map((step, index) => (
                  <div key={index} className="flex items-center gap-2 lg:gap-3">
                    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <step.icon className="text-primary" size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{step.title}</div>
                        <div className="text-[10px] text-muted-foreground hidden sm:block">{step.description}</div>
                      </div>
                    </div>
                    {index < (flowType === 'customer' ? steps : adminSteps).length - 1 && (
                      <ArrowRight className="text-primary/40 hidden sm:block" size={16} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Credit Calculator - Compact Version */}
        <section id="calculator" className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card mb-3">
                <Calculator className="text-primary" size={14} />
                <span className="text-xs text-muted-foreground">Credit Score Calculator</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Check Your <span className="gradient-text">Credit Health</span>
              </h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-6 rounded-2xl">
                <div className="grid lg:grid-cols-3 gap-6 items-center">
                  {/* Sliders */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium">Monthly Income</label>
                          <span className="text-xs text-primary font-semibold">₹{income.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="10000"
                          max="500000"
                          step="5000"
                          value={income}
                          onChange={(e) => setIncome(Number(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium">Existing EMIs</label>
                          <span className="text-xs text-primary font-semibold">₹{existingEMI.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100000"
                          step="1000"
                          value={existingEMI}
                          onChange={(e) => setExistingEMI(Number(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium">Credit Utilization</label>
                          <span className="text-xs text-primary font-semibold">{creditUtilization}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={creditUtilization}
                          onChange={(e) => setCreditUtilization(Number(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium">Payment History</label>
                          <span className="text-xs text-primary font-semibold">{paymentHistory}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={paymentHistory}
                          onChange={(e) => setPaymentHistory(Number(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                          strokeDasharray={`${((score - 300) / 550) * 264} 264`} strokeLinecap="round" className="transition-all duration-500" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
                        <span className="text-[10px] text-muted-foreground">{getScoreLabel(score)}</span>
                      </div>
                    </div>
                    <div className="w-full mt-3">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
                        <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-foreground rounded-full border border-background transition-all duration-500"
                          style={{ left: `${((score - 300) / 550) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info size={12} />
                    <span>Estimate based on your inputs</span>
                  </div>
                  <Button size="sm" className="glow group text-xs h-8">
                    Check Real Eligibility
                    <ArrowRight className="ml-1 group-hover:translate-x-0.5 transition-transform" size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KYC & Security - Compact */}
        <section className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="glass-card p-6 rounded-2xl">
              <div className="grid lg:grid-cols-5 gap-6 items-center">
                {/* Icon */}
                <div className="lg:col-span-1 flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                    <Shield className="text-primary" size={40} strokeWidth={1.5} />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Lock className="text-primary" size={12} />
                    </div>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="lg:col-span-1 text-center lg:text-left">
                  <h2 className="font-display text-xl font-bold mb-1">
                    KYC & <span className="gradient-text">Security</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">Bank-grade protection for your data</p>
                </div>

                {/* Features Grid */}
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {kycFeatures.map((feature, index) => (
                    <div key={index} className="bg-secondary/30 rounded-xl p-3 text-center">
                      <feature.icon className="text-primary mx-auto mb-1.5" size={18} />
                      <div className="text-xs font-medium">{feature.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Loan Amounts - Compact Cards */}
        <section className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Loans For <span className="gradient-text">Every Need</span>
              </h2>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="glass-card p-5 rounded-xl hover:glow-sm transition-all group text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Target className="text-green-400" size={20} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">₹50K - ₹2L</h3>
                  <p className="text-xs text-muted-foreground mb-2">Personal Loans</p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>From 8.99% • 6-24 months</div>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-xl hover:glow-sm transition-all group text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold rounded-bl">
                    POPULAR
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Banknote className="text-blue-400" size={20} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">₹2L - ₹5L</h3>
                  <p className="text-xs text-muted-foreground mb-2">Medium Loans</p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>From 9.49% • 12-36 months</div>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-xl hover:glow-sm transition-all group text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Award className="text-pink-400" size={20} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">₹5L - ₹10L</h3>
                  <p className="text-xs text-muted-foreground mb-2">Premium Loans</p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>From 9.99% • 12-48 months</div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Sparkles className="text-primary" size={14} />
                      Use It For
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {['Wedding', 'Medical', 'Home Renovation', 'Education', 'Travel', 'Business'].map((item, i) => (
                        <span key={i} className="px-2 py-0.5 bg-secondary/50 rounded text-xs">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Shield className="text-primary" size={14} />
                      No Hidden Charges
                    </h4>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>2% Processing</span>
                      <span className="text-green-400">₹0 Prepayment</span>
                      <span className="text-green-400">Part Payment OK</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Repayment - Compact */}
        <section className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Repayment <span className="gradient-text">Made Simple</span>
              </h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {repaymentFeatures.map((feature, index) => (
                  <div key={index} className="glass-card p-4 rounded-xl text-center group hover:glow-sm transition-all">
                    <feature.icon className="text-primary mx-auto mb-2" size={20} />
                    <h3 className="font-semibold text-sm mb-0.5">{feature.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>

              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">Sample EMI</h3>
                    <p className="text-xs text-muted-foreground">₹1L @ 12% for 12 months</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">₹8,884</div>
                    <div className="text-[10px] text-muted-foreground">Monthly EMI</div>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-secondary/30 rounded p-2">
                    <div className="text-muted-foreground">Total Interest</div>
                    <div className="font-semibold">₹6,608</div>
                  </div>
                  <div className="bg-secondary/30 rounded p-2">
                    <div className="text-muted-foreground">Total Amount</div>
                    <div className="font-semibold">₹1,06,608</div>
                  </div>
                  <div className="bg-secondary/30 rounded p-2">
                    <div className="text-muted-foreground">First EMI</div>
                    <div className="font-semibold text-green-400">₹7,884 P</div>
                  </div>
                  <div className="bg-secondary/30 rounded p-2">
                    <div className="text-muted-foreground">Last EMI</div>
                    <div className="font-semibold text-green-400">₹8,796 P</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Advisor - Compact Chat Preview */}
        <section className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="glass-card p-6 rounded-2xl">
                <div className="grid lg:grid-cols-2 gap-6 items-center">
                  {/* Left Side - Info */}
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-3">
                      <Bot className="text-primary" size={14} />
                      <span className="text-xs text-primary font-medium">AI-Powered</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2">
                      Personal <span className="gradient-text">Credit Guide</span>
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get explanations in plain language and tips to improve your eligibility.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <MessageSquare className="text-primary" size={14} />
                        <span>Plain explanations</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Lightbulb className="text-primary" size={14} />
                        <span>Improvement tips</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <HelpCircle className="text-primary" size={14} />
                        <span>24/7 available</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Shield className="text-primary" size={14} />
                        <span>Human oversight</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Chat Preview */}
                  <div className="bg-secondary/30 rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-border flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <Bot className="text-primary" size={14} />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">AI Advisor</div>
                        <div className="text-[10px] text-green-400">Online</div>
                      </div>
                    </div>
                    <div className="p-3 space-y-2 h-40 overflow-hidden">
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="text-primary" size={10} />
                        </div>
                        <div className="bg-secondary/50 p-2 rounded-lg rounded-tl-none text-xs max-w-[85%]">
                          You're eligible for up to ₹2,00,000! 🎉
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <div className="bg-primary text-primary-foreground p-2 rounded-lg rounded-tr-none text-xs">
                          Can I get more?
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="text-primary" size={10} />
                        </div>
                        <div className="bg-secondary/50 p-2 rounded-lg rounded-tl-none text-xs max-w-[85%]">
                          Lower credit utilization to 30% for ₹3.5L eligibility 💡
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - Compact Grid */}
        <section id="why-choose-us" className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Why <span className="gradient-text">Choose Us</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="glass-card p-4 rounded-xl text-center group hover:glow-sm transition-all">
                  <benefit.icon className="text-primary mx-auto mb-2" size={20} />
                  <h3 className="font-semibold text-xs">{benefit.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance - Compact Banner */}
        <section className="py-8 relative">
          <div className="container mx-auto px-4">
            <div className="glass-card p-4 rounded-xl max-w-4xl mx-auto">
              <div className="flex flex-wrap items-center justify-center gap-6 text-center">
                <div className="flex items-center gap-2">
                  <Scale className="text-primary" size={16} />
                  <span className="text-sm font-semibold">AI Transparency</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="text-primary/60" size={14} />
                  <span>Data Protected</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="text-primary/60" size={14} />
                  <span>Fair Lending Audited</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="text-primary/60" size={14} />
                  <span>Human Oversight</span>
                </div>
                <a href="#" className="text-xs text-primary hover:underline">Learn More →</a>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials - Compact */}
        <section className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Customer <span className="gradient-text">Stories</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-6">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="text-yellow-400 fill-yellow-400" size={12} />)}
                </div>
                <p className="text-xs text-muted-foreground mb-3 italic line-clamp-2">
                  "Got approved in 2 minutes! Best loan experience ever."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-[10px] font-bold">RP</div>
                  <div>
                    <div className="font-semibold text-xs">Rahul P.</div>
                    <div className="text-[10px] text-muted-foreground">Mumbai</div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="text-yellow-400 fill-yellow-400" size={12} />)}
                </div>
                <p className="text-xs text-muted-foreground mb-3 italic line-clamp-2">
                  "No paperwork upfront? Smart KYC made it so easy!"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-[10px] font-bold">SM</div>
                  <div>
                    <div className="font-semibold text-xs">Sneha M.</div>
                    <div className="text-[10px] text-muted-foreground">Bangalore</div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="text-yellow-400 fill-yellow-400" size={12} />)}
                </div>
                <p className="text-xs text-muted-foreground mb-3 italic line-clamp-2">
                  "Second loan was even easier! Documents reused. Amazing!"
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-[10px] font-bold">AK</div>
                  <div>
                    <div className="font-semibold text-xs">Amit K.</div>
                    <div className="text-[10px] text-muted-foreground">Delhi</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="inline-flex items-center gap-6 glass-card px-6 py-3 rounded-xl text-center">
                <div>
                  <div className="text-xl font-bold gradient-text">12K+</div>
                  <div className="text-[10px] text-muted-foreground">5-Star Reviews</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <div className="text-xl font-bold gradient-text">98%</div>
                  <div className="text-[10px] text-muted-foreground">Satisfied</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <div className="text-xl font-bold gradient-text">4.8★</div>
                  <div className="text-[10px] text-muted-foreground">Avg Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - Compact Accordion Style */}
        <section className="py-10 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl sm:text-3xl font-bold">
                  Common <span className="gradient-text">Questions</span>
                </h2>
              </div>

              <div className="space-y-2">
                {[
                  { q: "How long does approval take?", a: "Instant eligibility in under 2 minutes. Funds within 24 hours after KYC." },
                  { q: "Do I need documents to check eligibility?", a: "No! Check first with zero documents. Only 2 docs needed after approval." },
                  { q: "Will this affect my credit score?", a: "No. We use soft inquiry. Zero impact until you proceed with the loan." },
                  { q: "What interest rates do you offer?", a: "Personalized rates starting from 8.99% p.a. based on your profile." },
                  { q: "Can I reuse documents for a second loan?", a: "Yes! Aadhaar & PAN are reusable. Only fresh bank statement needed." },
                  { q: "Is my data secure?", a: "Bank-grade 256-bit encryption. Fully compliant with data protection laws." }
                ].map((faq, index) => (
                  <div key={index} className="glass-card rounded-xl overflow-hidden">
                    <div className="p-4 hover:bg-secondary/30 transition-colors">
                      <h3 className="font-semibold text-sm mb-1">{faq.q}</h3>
                      <p className="text-xs text-muted-foreground">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button variant="outline" size="sm" className="group text-xs h-8">
                  <HelpCircle className="mr-1" size={14} />
                  More Questions? Contact Us
                  <ArrowRight className="ml-1 group-hover:translate-x-0.5 transition-transform" size={14} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA - Premium Design */}
        <section className="py-20 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A2540] via-[#0d2d4d] to-[#0A2540]" />
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Glass Card Container */}
              <div className="glass-card p-10 md:p-14 rounded-3xl text-center relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-transparent rounded-full blur-2xl" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-2xl" />
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Sparkles className="text-primary" size={16} />
                  <span className="text-sm font-medium text-primary">Start Your Journey Today</span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  Ready to Get Your
                  <br />
                  <span className="gradient-text">Dream Loan?</span>
                </h2>
                
                <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                  Join 50,000+ happy customers who got instant loan approvals with zero hassle
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                  <Button size="lg" className="glow group px-8 py-6 text-lg rounded-xl">
                    <Zap className="mr-2" size={20} />
                    Check Eligibility Free
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                  </Button>
                  <Button variant="outline" size="lg" className="px-8 py-6 text-lg rounded-xl border-white/20 hover:bg-white/5" asChild>
                    <a href="/login">
                      <LogIn className="mr-2" size={20} />
                      Track Application
                    </a>
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>256-bit SSL Encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Zero Credit Impact</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>2-Minute Approval</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="relative bg-[#060d17] border-t border-white/5">
        {/* Top Wave Decoration */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container mx-auto px-4">
          {/* Main Footer Content */}
          <div className="py-16">
            <div className="grid lg:grid-cols-5 gap-12">
              {/* Brand Column */}
              <div className="lg:col-span-2">
                <a href="#" className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                    <span className="font-display font-bold text-white text-xl">LA</span>
                  </div>
                  <div>
                    <span className="font-display font-bold text-xl block">LoanAdvisor</span>
                    <span className="text-xs text-muted-foreground">AI-Powered Lending</span>
                  </div>
                </a>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Making loans accessible, transparent, and instant with the power of AI. Trusted by thousands across India.
                </p>
                
                {/* Social Links */}
                <div className="flex gap-3">
                  {socialLinks.map((social, index) => (
                    <a key={index} href={social.href} aria-label={social.label}
                      className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:bg-primary/20 hover:border-primary/30 transition-all group">
                      <social.icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Links Columns */}
              <div>
                <h4 className="font-display font-semibold mb-5 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full" />
                  Quick Links
                </h4>
                <ul className="space-y-3">
                  {quickLinks.map((link, index) => (
                    <li key={index}>
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1 group">
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-display font-semibold mb-5 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full" />
                  Legal
                </h4>
                <ul className="space-y-3">
                  {legalLinks.map((link, index) => (
                    <li key={index}>
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-1 group">
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-display font-semibold mb-5 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full" />
                  Contact Us
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail size={14} className="text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">support@loanadvisor.ai</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone size={14} className="text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">1800-XXX-XXXX</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock size={14} className="text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Mon - Sat: 9AM - 8PM</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="py-6 border-t border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {currentYear} LoanAdvisor. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Shield size={14} className="text-primary" />
                  Bank-Grade Security
                </span>
                <span className="flex items-center gap-2">
                  <Bot size={14} className="text-primary" />
                  AI with Human Oversight
                </span>
                <span className="flex items-center gap-2">
                  <Award size={14} className="text-primary" />
                  RBI Compliant
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
