import { useState, useEffect } from "react";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Menu, X, ArrowRight, ChevronDown, Brain, Users, Shield, CheckCircle,
  Calculator, Info, FileText, Zap, UserCheck, Banknote, Fingerprint,
  Lock, Eye, CreditCard, RefreshCw, Calendar, BarChart3, Bot,
  MessageSquare, Lightbulb, HelpCircle, FileX, ShieldCheck, Scale,
  LogIn, Facebook, Linkedin, Instagram, FileCheck, Star, Award,
  Target, Clock, Mail, Phone, Sparkles,
} from "lucide-react";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-amber-400 text-neutral-950 hover:bg-amber-300",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800 hover:text-white",
        secondary: "bg-neutral-800 text-neutral-200 hover:bg-neutral-700",
        ghost: "text-neutral-400 hover:text-white hover:bg-neutral-800",
        link: "text-amber-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Index = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [flowType, setFlowType] = useState<"customer" | "admin">("customer");
  const [income, setIncome] = useState(50000);
  const [existingEMI, setExistingEMI] = useState(5000);
  const [creditUtilization, setCreditUtilization] = useState(30);
  const [paymentHistory, setPaymentHistory] = useState(95);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const calculateScore = () => {
    let score = 650;
    score += Math.min((income / 10000) * 10, 100);
    score -= (existingEMI / income) * 100;
    score -= creditUtilization > 50 ? 50 : creditUtilization > 30 ? 25 : 0;
    return Math.min(Math.max(Math.round(score), 300), 850);
  };
  const score = calculateScore();
  const getScoreColor = (s: number) => s >= 750 ? "text-emerald-400" : s >= 650 ? "text-amber-400" : "text-red-400";
  const getScoreLabel = (s: number) => s >= 750 ? "Excellent" : s >= 700 ? "Good" : s >= 650 ? "Fair" : "Needs Improvement";

  const navLinks = [
    { href: "#how-it-works", label: "How It Works" },
    { href: "#calculator", label: "Credit Calculator" },
    { href: "#why-choose-us", label: "Why Choose Us" },
  ];

  const steps = [
    { icon: FileText,  title: "Submit Basic Details",   description: "Simple financial info, no documents needed upfront. Get instant tracking ID." },
    { icon: Brain,     title: "AI Analysis",            description: "Income, credit behaviour, and liabilities reviewed instantly by smart algorithms." },
    { icon: Zap,       title: "Instant Decision",       description: "Clear explanation of eligibility — approved or rejected with reasons." },
    { icon: UserCheck, title: "Smart KYC Process",      description: "Upload just 2 documents. Reuse Aadhaar/PAN for future loans automatically." },
    { icon: ShieldCheck,title:"Admin Verification",     description: "Expert review of documents. Admins verify identity and financial documents." },
    { icon: Banknote,  title: "Instant Disbursement",   description: "Funds released immediately after admin approval. Track with your ID." },
  ];

  const adminSteps = [
    { icon: Eye,       title: "Monitor Applications",  description: "View all loan applications in real-time dashboard with filters." },
    { icon: FileText,  title: "Track by ID",           description: "Search any application instantly using 8-digit tracking ID." },
    { icon: FileCheck, title: "Verify Documents",      description: "Review uploaded documents. View cross-application history for repeat customers." },
    { icon: CheckCircle,title:"Approve or Reject",     description: "One-click document verification. Mark as verified or request reupload." },
    { icon: Banknote,  title: "Process Disbursement",  description: "Release funds directly to verified bank accounts with full audit trail." },
    { icon: BarChart3, title: "Analytics & Reports",   description: "Track approval rates, processing times, and document verification metrics." },
  ];

  const improvements = [
    "Pay bills on time to build positive history",
    "Keep credit utilization below 30%",
    "Avoid multiple loan applications at once",
    "Maintain a diverse credit mix",
  ];

  const kycFeatures = [
    { icon: Sparkles,   title: "Smart Document Reuse",        description: "Upload identity documents once — reuse for all future loan applications." },
    { icon: Fingerprint,title: "2-Document Quick KYC",        description: "Complete KYC with just 2 documents, reduced from 4 for faster processing." },
    { icon: FileCheck,  title: "AI-Assisted Document Checks", description: "Quick, accurate document verification with smart AI." },
    { icon: RefreshCw,  title: "Delete & Reupload Anytime",   description: "Made a mistake? Delete and reupload documents instantly before verification." },
    { icon: Lock,       title: "End-to-End Encryption",       description: "Your data is encrypted at rest and in transit." },
    { icon: ShieldCheck,title: "Fresh Bank Statements",       description: "Latest 3-6 months bank statements required per application." },
    { icon: UserCheck,  title: "Manual Review When Needed",   description: "Human experts step in for complex cases." },
    { icon: Eye,        title: "Privacy by Design",           description: "We collect only what is necessary, nothing more." },
  ];

  const repaymentFeatures = [
    { icon: FileText,   title: "Instant Tracking ID",         description: "Unique 8-digit tracking ID — track your loan anywhere, anytime." },
    { icon: CreditCard, title: "Debit Card Repayment",        description: "No complex bank mandates. Simply use your debit card." },
    { icon: RefreshCw,  title: "Automated EMI Deductions",    description: "Set it and forget it. EMIs deducted automatically on schedule." },
    { icon: Calendar,   title: "Flexible Schedules",          description: "Choose payment dates that work best for your cash flow." },
    { icon: BarChart3,  title: "Transparent EMI Breakdown",   description: "See exactly how much goes to principal vs interest." },
    { icon: Zap,        title: "Admin Tracking Search",       description: "Admins can instantly find any application by tracking ID." },
  ];

  const benefits = [
    { icon: Brain,      title: "AI-First Decisioning",    description: "Advanced algorithms analyse your profile instantly for accurate eligibility." },
    { icon: Eye,        title: "Transparent Explanations",description: "Every decision comes with a clear, understandable explanation." },
    { icon: Zap,        title: "Faster Approvals",        description: "Get decisions in minutes, not days. Our AI works around the clock." },
    { icon: FileX,      title: "Reduced Paperwork",       description: "Documents only after approval. No upfront hassle or unnecessary uploads." },
    { icon: ShieldCheck,title: "Secure by Design",        description: "Bank-grade encryption and privacy-first architecture protect your data." },
    { icon: Sparkles,   title: "No Hidden Processes",     description: "Full visibility into how your application is processed and decisions are made." },
  ];

  const quickLinks = [
    { label: "How It Works",      href: "#how-it-works" },
    { label: "Credit Calculator", href: "#calculator" },
    { label: "Why Choose Us",     href: "#why-choose-us" },
    { label: "About Us",          href: "#" },
    { label: "Contact",           href: "#" },
  ];
  const legalLinks = [
    { label: "Privacy Policy",   href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "AI Disclosure",    href: "#" },
    { label: "Cookie Policy",    href: "#" },
  ];
  const socialLinks = [
    { icon: Facebook,  href: "#", label: "Facebook" },
    { icon: Linkedin,  href: "#", label: "LinkedIn" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-neutral-100">

      {/* -- Header -- */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#0C0C0C]/95 border-b border-neutral-800" : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" className="font-bold text-xl text-neutral-50 tracking-tight">
            Loan<span className="text-amber-400">Advisor</span>
          </a>
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <a key={link.href} href={link.href}
                className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-5">
            <a href="/login" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors flex items-center gap-1.5">
              <LogIn size={15} /> Login
            </a>
            <Button size="sm" asChild><a href="/signup">Get Started</a></Button>
          </div>
          <button className="lg:hidden p-2 text-neutral-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0C0C0C] border-t border-neutral-800 px-6 py-4">
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <a key={link.href} href={link.href}
                  className="py-2.5 text-sm text-neutral-400 hover:text-white border-b border-neutral-900"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                <a href="/login" className="py-2.5 text-sm text-neutral-400 hover:text-white">Login</a>
                <Button asChild><a href="/signup">Get Started</a></Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* -- Hero -- */}
        <section className="pt-32 pb-20 max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-400 font-medium mb-6">
                AI-Powered Financial Decisions
              </p>
              <h1 className="text-5xl sm:text-6xl font-bold text-neutral-50 leading-[1.05] tracking-tight mb-6">
                AI-Powered<br />Loan Eligibility<br />
                <span className="text-amber-400">Advisor</span>
              </h1>
              <p className="text-lg text-neutral-400 max-w-md mb-10 leading-relaxed">
                Get instant eligibility decisions powered by AI. No documents upfront.
                Know where you stand in 2 minutes.
              </p>
              <div className="flex items-center gap-6 mb-12">
                <Button size="lg" asChild>
                  <a href="/signup" className="flex items-center gap-2">
                    Check Eligibility <ArrowRight size={18} />
                  </a>
                </Button>
                <a href="#how-it-works"
                  className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5">
                  See how it works <ChevronDown size={16} />
                </a>
              </div>
              <div className="flex items-center gap-8 pt-8 border-t border-neutral-800">
                <div>
                  <div className="text-2xl font-bold text-neutral-50 tabular-nums">2 min</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Decision time</div>
                </div>
                <div className="w-px h-10 bg-neutral-800" />
                <div>
                  <div className="text-2xl font-bold text-neutral-50 tabular-nums">0</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Documents upfront</div>
                </div>
                <div className="w-px h-10 bg-neutral-800" />
                <div>
                  <div className="text-2xl font-bold text-neutral-50 tabular-nums">100%</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Transparent</div>
                </div>
              </div>
            </div>

            {/* Hero right — editorial data panel */}
            <div className="hidden lg:block">
              <div className="border border-neutral-800 overflow-hidden">
                <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">AI Analysis Report</span>
                  <span className="text-xs text-emerald-400 font-medium">&#9679; Live</span>
                </div>
                <div className="divide-y divide-neutral-800">
                  {[
                    ["Credit Score",    <span className="text-emerald-400 font-semibold">Excellent (752)</span>],
                    ["Income Verified", <span className="flex items-center gap-1.5 font-semibold"><CheckCircle size={14} className="text-emerald-400"/>Confirmed</span>],
                    ["Loan Eligible",   <span className="text-amber-400 font-semibold">&#8377;5,00,000</span>],
                    ["Interest Rate",   <span className="font-semibold">From 8.99% p.a.</span>],
                    ["Decision Time",   <span className="font-semibold">1m 47s</span>],
                    ["Security",        <span className="flex items-center gap-1.5 font-semibold"><Shield size={14} className="text-amber-400"/>Bank-grade</span>],
                  ].map(([label, val], i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-neutral-900/40 transition-colors">
                      <span className="text-sm text-neutral-400">{label}</span>
                      <span className="text-sm text-neutral-100">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-amber-400/8 border-t border-amber-400/20">
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="text-amber-400" />
                    <span className="text-xs text-amber-300/80">Instant decision. No documents needed upfront.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -- Trust strip -- */}
        <section className="border-y border-neutral-800 py-4 bg-neutral-900/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-neutral-400">
              {[
                [Brain,       "Explainable AI Decisions"],
                [Users,       "Human Review for Edge Cases"],
                [Shield,      "Secure & Privacy-First"],
                [CheckCircle, "Regulatory Compliant"],
              ].map(([Icon, label], i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="hidden sm:block w-px h-4 bg-neutral-700" />}
                  <span className="flex items-center gap-2">
                    <Icon size={14} className="text-amber-400/70" /> {label}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* -- Statistics -- */}
        <section className="py-16 max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 border border-neutral-800 divide-x divide-y md:divide-y-0 divide-neutral-800">
            {[
              ["50K+",   "Loans Processed"],
              ["?500Cr", "Disbursed"],
              ["4.8",    "User Rating"],
              ["2 min",  "Avg. Decision"],
            ].map(([num, label]) => (
              <div key={label} className="px-8 py-10">
                <div className="text-4xl font-bold text-neutral-50 tabular-nums">{num}</div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 mt-2">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* -- Comparison table -- */}
        <section className="py-16 bg-neutral-900/20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-10">
              <p className="text-xs uppercase tracking-widest text-amber-400 font-medium mb-3">The Difference</p>
              <h2 className="text-3xl font-bold text-neutral-50">Why Us Over Traditional Banks</h2>
            </div>
            <div className="border border-neutral-800 overflow-hidden">
              <div className="grid grid-cols-3 bg-neutral-900 border-b border-neutral-800">
                <div className="px-6 py-3 text-xs uppercase tracking-wider text-neutral-500">Feature</div>
                <div className="px-6 py-3 text-xs uppercase tracking-wider text-amber-400 border-x border-neutral-800">LoanAdvisor</div>
                <div className="px-6 py-3 text-xs uppercase tracking-wider text-neutral-500">Traditional Banks</div>
              </div>
              {[
                ["Decision Time",       "2 minutes",        "5-7 days"],
                ["Documents Required",  "Only 2 documents", "10-15 documents"],
                ["Interest Rate",       "From 8.99%",       "11-14%"],
                ["Process",             "100% online",      "Branch visits required"],
                ["Disbursement",        "Within 24 hours",  "7-14 days"],
                ["Workflow",            "AI-powered",       "Manual process"],
              ].map(([feature, us, them], i) => (
                <div key={i} className="grid grid-cols-3 border-b border-neutral-800 last:border-b-0 hover:bg-neutral-900/40 transition-colors">
                  <div className="px-6 py-4 text-sm text-neutral-400">{feature}</div>
                  <div className="px-6 py-4 text-sm text-emerald-400 font-medium border-x border-neutral-800 flex items-center gap-2">
                    <CheckCircle size={13} className="flex-shrink-0" />{us}
                  </div>
                  <div className="px-6 py-4 text-sm text-neutral-500 flex items-center gap-2">
                    <X size={13} className="flex-shrink-0 text-red-500/50" />{them}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- How it works -- */}
        <section id="how-it-works" className="py-16 max-w-6xl mx-auto px-6">
          <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-400 font-medium mb-3">The Process</p>
              <h2 className="text-3xl font-bold text-neutral-50">How It Works</h2>
            </div>
            <div className="flex border border-neutral-800 overflow-hidden">
              <button onClick={() => setFlowType("customer")}
                className={`px-5 py-2 text-xs font-medium transition-colors ${flowType === "customer" ? "bg-amber-400 text-neutral-950" : "text-neutral-400 hover:text-white"}`}>
                Customer
              </button>
              <button onClick={() => setFlowType("admin")}
                className={`px-5 py-2 text-xs font-medium transition-colors border-l border-neutral-800 ${flowType === "admin" ? "bg-amber-400 text-neutral-950" : "text-neutral-400 hover:text-white"}`}>
                Admin
              </button>
            </div>
          </div>
          <div className="border-l-2 border-neutral-800 ml-4 space-y-0">
            {(flowType === "customer" ? steps : adminSteps).map((step, i) => (
              <div key={i} className="relative pl-8 pb-10 last:pb-0">
                <div className="absolute -left-[13px] top-0 w-6 h-6 bg-[#0C0C0C] border-2 border-neutral-800 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-5xl font-bold text-neutral-800 leading-none tabular-nums select-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-semibold text-neutral-100 mb-1">{step.title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed max-w-sm">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* -- Calculator -- */}
        <section id="calculator" className="py-16 bg-neutral-900/20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-10">
              <p className="text-xs uppercase tracking-widest text-amber-400 font-medium mb-3">Tool</p>
              <h2 className="text-3xl font-bold text-neutral-50">Credit Score Estimator</h2>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {[
                  { label: "Monthly Income",     val: `?${income.toLocaleString()}`,   min: 10000,  max: 500000, step: 5000, setter: setIncome,            value: income },
                  { label: "Existing EMIs",       val: `?${existingEMI.toLocaleString()}`, min: 0, max: 100000, step: 1000, setter: setExistingEMI,       value: existingEMI },
                  { label: "Credit Utilization",  val: `${creditUtilization}%`,         min: 0,     max: 100,    step: 5,    setter: setCreditUtilization, value: creditUtilization },
                  { label: "Payment History",     val: `${paymentHistory}%`,            min: 0,     max: 100,    step: 5,    setter: setPaymentHistory,    value: paymentHistory },
                ].map(({ label, val, min, max, step, setter, value }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-neutral-400">{label}</label>
                      <span className="text-sm font-semibold text-neutral-100 tabular-nums">{val}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={value}
                      onChange={e => setter(Number(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-400" />
                  </div>
                ))}
                <div className="pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Improve Your Score</p>
                  {improvements.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-neutral-400 mb-2">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">&#8212;</span>{tip}
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-neutral-800 bg-neutral-900 flex flex-col items-center justify-center px-8 py-10 text-center">
                <p className="text-xs uppercase tracking-widest text-neutral-500 mb-6">Estimated Score</p>
                <div className={`text-8xl font-bold tabular-nums leading-none mb-3 ${getScoreColor(score)}`}>{score}</div>
                <div className="text-sm font-medium text-neutral-300 mb-6">{getScoreLabel(score)}</div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" style={{ width: "100%" }} />
                </div>
                <div className="w-full relative h-4 mb-1">
                  <div className="absolute -top-1 w-3 h-3 rounded-full bg-white border-2 border-neutral-900 transition-all duration-500"
                    style={{ left: `calc(${((score - 300) / 550) * 100}% - 6px)` }} />
                </div>
                <div className="flex justify-between w-full text-[10px] text-neutral-600 mb-6">
                  <span>300</span><span>850</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-6">
                  <Info size={12} /><span>Estimate based on your inputs</span>
                </div>
                <Button size="sm" className="w-full" asChild>
                  <a href="/signup" className="flex items-center gap-2 justify-center">
                    Check Real Eligibility <ArrowRight size={14} />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* -- KYC & Security -- */}
        <section className="py-16 max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <p className="text-xs uppercase tracking-widest text-amber-400 font-medium mb-3">Security</p>
              <h2 className="text-3xl font-bold text-neutral-50 mb-4">KYC & Data Protection</h2>
              <p className="text-neutral-400 leading-relaxed">
                Bank-grade encryption and privacy-first architecture protect every piece of data you share with us.
              </p>
            </div>
            <div className="lg:col-span-3">
              <div className="grid sm:grid-cols-2 gap-px border border-neutral-800 bg-neutral-800">
                {kycFeatures.map((f, i) => (
                  <div key={i} className="bg-[#0C0C0C] px-5 py-4 hover:bg-neutral-900/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <f.icon size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-neutral-200 mb-0.5">{f.title}</div>
                        <div className="text-xs text-neutral-500 leading-relaxed">{f.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -- Loan products -- */}
        <section className="py-16 bg-neutral-900/20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-10">
              <p className="text-xs uppercase tracking-widest text-amber-400 font-medium mb-3">Products</p>
              <h2 className="text-3xl font-bold text-neutral-50">Loans For Every Need</h2>
            </div>
            <div className="border border-neutral-800 overflow-hidden mb-6">
              <div className="grid grid-cols-3 bg-neutral-900 border-b border-neutral-800">
                {["Product", "Amount Range", "Terms"].map((h, i) => (
                  <div key={h} className={`px-6 py-3 text-xs uppercase tracking-wider text-neutral-500 ${i > 0 ? "border-l border-neutral-800" : ""}`}>{h}</div>
                ))}
              </div>
              {[
                { label: "Personal Loans", badge: "",        amount: "?50K — ?2L",  terms: "From 8.99%  •  6-24 months" },
                { label: "Medium Loans",   badge: "POPULAR", amount: "?2L — ?5L",   terms: "From 9.49%  •  12-36 months" },
                { label: "Premium Loans",  badge: "",        amount: "?5L — ?10L",  terms: "From 9.99%  •  12-48 months" },
              ].map((p, i) => (
                <div key={i} className="grid grid-cols-3 border-b border-neutral-800 last:border-b-0 hover:bg-neutral-900/40 transition-colors">
                  <div className="px-6 py-4 flex items-center gap-2">
                    <span className="text-sm text-neutral-200 font-medium">{p.label}</span>
                    {p.badge && <span className="text-[10px] font-bold bg-amber-400 text-neutral-950 px-1.5 py-0.5">{p.badge}</span>}
                  </div>
                  <div className="px-6 py-4 border-l border-neutral-800">
                    <span className="text-sm font-semibold text-neutral-100 tabular-nums">{p.amount}</span>
                  </div>
                  <div className="px-6 py-4 border-l border-neutral-800">
                    <span className="text-sm text-neutral-400">{p.terms}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-8 text-sm text-neutral-400">
              <div>
                <span className="text-neutral-600 uppercase tracking-wider text-xs mr-3">Use it for</span>
                {["Wedding", "Medical", "Home Renovation", "Education", "Travel", "Business"].map((item, i, arr) => (
                  <span key={i} className="mr-2">{item}{i < arr.length - 1 ? " /" : ""}</span>
                ))}
              </div>
              <div className="flex gap-6">
                <span>2% Processing Fee</span>
                <span className="text-emerald-400">?0 Prepayment</span>
                <span className="text-emerald-400">Part Payment OK</span>
              </div>
            </div>
          </div>
        </section>

        {/* -- Repayment -- */}
        <section className="py-16 max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest text-amber-400 font-medium mb-3">Repayment</p>
            <h2 className="text-3xl font-bold text-neutral-50">Repayment Made Simple</h2>
          </div>
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 border border-neutral-800">
              {repaymentFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-4 px-6 py-4 border-b border-neutral-800 last:border-b-0 hover:bg-neutral-900/40 transition-colors">
                  <f.icon size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-neutral-200">{f.title}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{f.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 border border-neutral-800 bg-neutral-900">
              <div className="px-6 py-4 border-b border-neutral-800">
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Sample EMI</p>
                <p className="text-xs text-neutral-600">?1L @ 12% for 12 months</p>
              </div>
              <div className="px-6 py-8 text-center border-b border-neutral-800">
                <div className="text-5xl font-bold text-neutral-50 tabular-nums">?8,884</div>
                <div className="text-xs text-neutral-500 mt-2">Monthly EMI</div>
              </div>
              <div className="divide-y divide-neutral-800">
                {[
                  ["Total Interest",      "?6,608"],
                  ["Total Amount",        "?1,06,608"],
                  ["First EMI Principal", "?7,884"],
                  ["Last EMI Principal",  "?8,796"],
                ].map(([label, value], i) => (
                  <div key={i} className="px-6 py-3 flex justify-between">
                    <span className="text-xs text-neutral-500">{label}</span>
                    <span className="text-xs font-semibold text-neutral-200 tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -- AI Advisor -- */}
        <section className="py-16 bg-neutral-900/20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-400 font-medium mb-3">AI Advisor</p>
                <h2 className="text-3xl font-bold text-neutral-50 mb-4">Personal Credit Guide</h2>
                <p className="text-neutral-400 leading-relaxed mb-8">
                  Get explanations in plain language and actionable tips to improve your eligibility.
                  Available 24/7 with human oversight for complex cases.
                </p>
                <div className="space-y-3">
                  {[
                    [MessageSquare, "Plain language explanations of your result"],
                    [Lightbulb,     "Tips to improve your credit score"],
                    [HelpCircle,    "Available 24/7, any device"],
                    [Shield,        "Human expert oversight for edge cases"],
                  ].map(([Icon, text], i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-neutral-400">
                      <Icon size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />{text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-neutral-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot size={14} className="text-amber-400" />
                    <span className="text-sm font-medium text-neutral-200">AI Advisor</span>
                  </div>
                  <span className="text-xs text-emerald-400">Online</span>
                </div>
                <div className="px-4 py-4 space-y-4 bg-[#0C0C0C] min-h-[200px]">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 border border-neutral-700 rounded flex items-center justify-center flex-shrink-0 bg-neutral-900">
                      <Bot size={12} className="text-amber-400" />
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 px-3 py-2 rounded text-sm text-neutral-300 max-w-[85%]">
                      You're eligible for up to ?2,00,000 based on your profile.
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-amber-400 text-neutral-950 px-3 py-2 rounded text-sm max-w-[85%] font-medium">
                      Can I get more?
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 border border-neutral-700 rounded flex items-center justify-center flex-shrink-0 bg-neutral-900">
                      <Bot size={12} className="text-amber-400" />
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 px-3 py-2 rounded text-sm text-neutral-300 max-w-[85%]">
                      Lower credit utilization to 30% — that could unlock ?3.5L eligibility.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -- Footer -- */}
        <footer className="py-12 border-t border-neutral-800 bg-neutral-900/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-4 gap-10 mb-12">
              <div className="lg:col-span-2">
                <a href="#" className="font-bold text-xl text-neutral-50 tracking-tight mb-4 inline-block">
                  Loan<span className="text-amber-400">Advisor</span>
                </a>
                <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
                  AI-powered loan eligibility advisor. Transparent, fast, and secure. We combine intelligent algorithms with human oversight for decisions you can trust.
                </p>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-200 mb-4">Quick Links</div>
                <ul className="space-y-2">
                  {quickLinks.map(link => (
                    <li key={link.label}><a href={link.href} className="text-sm text-neutral-500 hover:text-amber-400 transition-colors">{link.label}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-200 mb-4">Legal</div>
                <ul className="space-y-2">
                  {legalLinks.map(link => (
                    <li key={link.label}><a href={link.href} className="text-sm text-neutral-500 hover:text-amber-400 transition-colors">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-neutral-600">© {currentYear} LoanAdvisor. All rights reserved.</p>
              <div className="flex items-center gap-5">
                {socialLinks.map(link => (
                  <a key={link.label} href={link.href} className="text-neutral-600 hover:text-amber-400 transition-colors">
                    <link.icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default Index;
