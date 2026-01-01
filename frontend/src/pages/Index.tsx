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

  // Calculator state
  const [income, setIncome] = useState(50000);
  const [existingEMI, setExistingEMI] = useState(5000);
  const [creditUtilization, setCreditUtilization] = useState(30);

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
      description: "Simple financial info, no documents needed upfront",
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Income, credit behavior, and liabilities reviewed instantly",
    },
    {
      icon: Zap,
      title: "Instant Decision",
      description: "Clear explanation of your eligibility status",
    },
    {
      icon: UserCheck,
      title: "KYC After Approval",
      description: "Document verification only if you're approved",
    },
    {
      icon: Banknote,
      title: "Loan Disbursement",
      description: "Funds released after quick verification",
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
      icon: Fingerprint,
      title: "Secure Identity Verification",
      description: "Bank-grade identity checks protect your information",
    },
    {
      icon: FileCheck,
      title: "AI-Assisted Document Checks",
      description: "Quick, accurate document verification with smart AI",
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "Your data is encrypted at rest and in transit",
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
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "glass py-3" : "bg-transparent py-5"
          }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-primary-foreground text-lg">LA</span>
            </div>
            <span className="font-display font-semibold text-xl text-foreground hidden sm:inline">
              LoanAdvisor
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <a href="/login">Login</a>
            </Button>
            <Button className="glow-sm" asChild>
              <a href="/signup">Sign Up</a>
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden glass mt-2 mx-4 rounded-lg p-4 animate-fade-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" className="justify-start text-muted-foreground" asChild>
                  <a href="/login">Login</a>
                </Button>
                <Button className="glow-sm" asChild>
                  <a href="/signup">Sign Up</a>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
          <div className="absolute inset-0 gradient-bg" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-glow-secondary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-fade-in-up">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">AI-Powered Financial Decisions</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up stagger-1">
                <span className="text-foreground">AI-Powered</span>
                <br />
                <span className="gradient-text">Loan Eligibility Advisor</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-2">
                Get instant, explainable eligibility decisions powered by AI. No documents needed upfront.
                Know where you stand in minutes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-3">
                <Button size="lg" className="glow text-base px-8 py-6 group">
                  Check Eligibility
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
                <Button variant="outline" size="lg" className="text-base px-8 py-6" asChild>
                  <a href="#how-it-works">
                    See How It Works
                    <ChevronDown className="ml-2" size={20} />
                  </a>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 animate-fade-in-up stagger-4">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">2 min</div>
                  <div className="text-sm text-muted-foreground">Decision Time</div>
                </div>
                <div className="text-center border-x border-border">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">0</div>
                  <div className="text-sm text-muted-foreground">Documents Upfront</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">100%</div>
                  <div className="text-sm text-muted-foreground">Transparent</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
            <ChevronDown className="text-muted-foreground" size={32} />
          </div>
        </section>

        {/* Trust Strip */}
        <section className="py-12 border-y border-border bg-card/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {trustItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="text-primary" size={24} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                How the <span className="gradient-text">AI Loan Advisor</span> Works
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A simple, transparent process from application to approval
              </p>
            </div>

            <div className="hidden lg:flex items-start justify-between relative">
              <div className="absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center text-center relative z-10 max-w-[180px]">
                  <div className="w-24 h-24 rounded-2xl glass-card flex items-center justify-center mb-6 glow-sm">
                    <step.icon className="text-primary" size={36} />
                  </div>

                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>

                  <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>

                  {index < steps.length - 1 && (
                    <ArrowRight className="absolute -right-8 top-12 text-primary/50 hidden xl:block" size={24} />
                  )}
                </div>
              ))}
            </div>

            <div className="lg:hidden space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 glass-card p-6 rounded-xl"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
                    <step.icon className="text-primary" size={28} />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Credit Calculator */}
        <section id="calculator" className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                <Calculator className="text-primary" size={18} />
                <span className="text-sm text-muted-foreground">Educational Tool</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Credit Score <span className="gradient-text">Calculator</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Get an estimate of your credit health based on key financial factors
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="glass-card p-8 rounded-2xl">
                  <h3 className="font-display font-semibold text-xl mb-6">Enter Your Details</h3>

                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Monthly Income</label>
                        <span className="text-primary font-semibold">₹{income.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="10000"
                        max="500000"
                        step="5000"
                        value={income}
                        onChange={(e) => setIncome(Number(e.target.value))}
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>₹10K</span>
                        <span>₹5L+</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Existing EMIs (Monthly)</label>
                        <span className="text-primary font-semibold">₹{existingEMI.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100000"
                        step="1000"
                        value={existingEMI}
                        onChange={(e) => setExistingEMI(Number(e.target.value))}
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>₹0</span>
                        <span>₹1L</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Credit Card Utilization</label>
                        <span className="text-primary font-semibold">{creditUtilization}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={creditUtilization}
                        onChange={(e) => setCreditUtilization(Number(e.target.value))}
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-2xl flex flex-col">
                  <h3 className="font-display font-semibold text-xl mb-6">Estimated Score</h3>

                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="hsl(var(--secondary))"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="8"
                          strokeDasharray={`${((score - 300) / 550) * 283} 283`}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                        <span className="text-sm text-muted-foreground">{getScoreLabel(score)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full border-2 border-background transition-all duration-500"
                        style={{ left: `${((score - 300) / 550) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>300</span>
                      <span>550</span>
                      <span>700</span>
                      <span>850</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-primary" size={20} />
                  <h4 className="font-display font-semibold">Tips to Improve Your Score</h4>
                </div>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {improvements.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                  <Info size={16} />
                  <span>This is an estimate based on the information you provide. Actual scores may vary.</span>
                </div>
                <Button size="lg" className="glow group">
                  Check Your Real Eligibility
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* KYC & Security */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 to-transparent" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center lg:justify-start">
                <div className="relative">
                  <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl glass-card flex items-center justify-center glow">
                    <Shield className="text-primary w-32 h-32 sm:w-40 sm:h-40" strokeWidth={1} />
                  </div>

                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-xl glass-card flex items-center justify-center animate-float">
                    <Lock className="text-primary" size={28} />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl glass-card flex items-center justify-center animate-float" style={{ animationDelay: "2s" }}>
                    <Fingerprint className="text-primary" size={28} />
                  </div>
                  <div className="absolute top-1/2 -right-8 w-12 h-12 rounded-lg glass-card flex items-center justify-center animate-float" style={{ animationDelay: "4s" }}>
                    <Eye className="text-primary" size={20} />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  KYC & <span className="gradient-text">Security</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-10 max-w-lg">
                  Your security is our priority. We use advanced technology and rigorous processes to keep your data safe.
                </p>

                <div className="space-y-6">
                  {kycFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 group">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="text-primary" size={22} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Repayment Section */}
        <section className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Repayment <span className="gradient-text">Made Simple</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Flexible, transparent, and hassle-free repayment options
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {repaymentFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="glass-card p-6 rounded-2xl hover:bg-secondary/50 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:glow-sm transition-shadow">
                    <feature.icon className="text-primary" size={28} />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="font-display font-semibold text-lg">Sample EMI Breakdown</h3>
                  <p className="text-sm text-muted-foreground">For a ₹1,00,000 loan at 12% p.a. for 12 months</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-secondary/50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Month</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">EMI</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Principal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Interest</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        { month: 1, emi: 8884, principal: 7884, interest: 1000, balance: 92116 },
                        { month: 2, emi: 8884, principal: 7963, interest: 921, balance: 84153 },
                        { month: 3, emi: 8884, principal: 8042, interest: 842, balance: 76111 },
                        { month: "...", emi: "...", principal: "...", interest: "...", balance: "..." },
                        { month: 12, emi: 8884, principal: 8796, interest: 88, balance: 0 },
                      ].map((row, index) => (
                        <tr key={index} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4 text-sm">{row.month}</td>
                          <td className="px-6 py-4 text-sm font-medium text-primary">
                            {typeof row.emi === "number" ? `₹${row.emi.toLocaleString()}` : row.emi}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {typeof row.principal === "number" ? `₹${row.principal.toLocaleString()}` : row.principal}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {typeof row.interest === "number" ? `₹${row.interest.toLocaleString()}` : row.interest}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {typeof row.balance === "number" ? `₹${row.balance.toLocaleString()}` : row.balance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Advisor */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/30 to-transparent" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                  <Bot className="text-primary" size={18} />
                  <span className="text-sm text-muted-foreground">AI-Powered Guidance</span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  Your Personal <span className="gradient-text">Credit Guide</span>
                </h2>

                <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                  Our AI doesn't just make decisions—it explains them in plain language and helps you understand how to improve.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="text-primary" size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Plain Language Explanations</h3>
                      <p className="text-sm text-muted-foreground">
                        Understand why you were approved or what needs improvement—no jargon.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="text-primary" size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Actionable Improvement Tips</h3>
                      <p className="text-sm text-muted-foreground">
                        Get personalized suggestions to boost your eligibility and credit health.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="text-primary" size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Always Ready to Help</h3>
                      <p className="text-sm text-muted-foreground">
                        Questions about EMI, interest rates, or credit scores? Our AI has answers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-4 glass-card rounded-lg inline-block">
                  <p className="text-sm text-muted-foreground italic">
                    "AI-guided decisions. Human-governed oversight."
                  </p>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-sm glass-card rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Bot className="text-primary" size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">AI Credit Advisor</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Online
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4 h-80 overflow-y-auto">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="text-primary" size={14} />
                      </div>
                      <div className="glass-card p-3 rounded-lg rounded-tl-none max-w-[80%]">
                        <p className="text-sm">
                          Hi! I've analyzed your application. You're eligible for a loan up to ₹2,00,000.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-tr-none max-w-[80%]">
                        <p className="text-sm">Why only ₹2L? Can I get more?</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="text-primary" size={14} />
                      </div>
                      <div className="glass-card p-3 rounded-lg rounded-tl-none max-w-[80%]">
                        <p className="text-sm">
                          Your current credit utilization is at 45%. If you bring it below 30%, you could qualify for up to ₹3,50,000.
                          <br /><br />
                          <span className="text-primary">Tip:</span> Pay down ₹15,000 on your credit card to improve your ratio.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-tr-none max-w-[80%]">
                        <p className="text-sm">That's helpful! What's my interest rate?</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="text-primary" size={14} />
                      </div>
                      <div className="glass-card p-3 rounded-lg rounded-tl-none max-w-[80%]">
                        <p className="text-sm">
                          Based on your profile, you qualify for 12.5% p.a. For a ₹2L loan over 24 months, your EMI would be ₹9,445.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-secondary/50 rounded-lg px-4 py-2 text-sm text-muted-foreground">
                        Ask about your eligibility...
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                        <MessageSquare className="text-primary-foreground" size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section id="why-choose-us" className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Why Choose <span className="gradient-text">Our Platform</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Built for transparency, speed, and trust
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="glass-card p-8 rounded-2xl hover:glow-sm transition-shadow group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="text-primary" size={28} />
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-secondary/30" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-8">
                <Scale className="text-primary" size={28} />
                <h2 className="font-display text-2xl sm:text-3xl font-bold">
                  Compliance & AI Disclosure
                </h2>
              </div>

              <div className="glass-card p-8 rounded-2xl">
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    We believe in full transparency about how we use AI in our lending decisions. Our AI-powered
                    eligibility assessment system is designed to provide fair, consistent, and explainable decisions
                    while maintaining human oversight for complex cases.
                  </p>

                  <div className="grid sm:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="text-primary" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Data Protection</h4>
                        <p className="text-xs text-muted-foreground">
                          Your data is handled in compliance with applicable data protection regulations.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="text-primary" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Fair Lending</h4>
                        <p className="text-xs text-muted-foreground">
                          Our AI is regularly audited to ensure fair and unbiased decision-making.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Scale className="text-primary" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Human Oversight</h4>
                        <p className="text-xs text-muted-foreground">
                          All edge cases and appeals are reviewed by qualified human experts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    <span className="text-border">|</span>
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>
                    <span className="text-border">|</span>
                    <a href="#" className="text-primary hover:underline">AI Disclosure Statement</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-glow-secondary/10 to-primary/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-glow-secondary/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Ready to Know <span className="gradient-text">Where You Stand?</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
                Check your eligibility in minutes. No documents needed upfront, no impact on your credit score.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="glow text-base px-8 py-6 group">
                  Check Your Eligibility
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
                <Button variant="outline" size="lg" className="text-base px-8 py-6" asChild>
                  <a href="/login">
                    <LogIn className="mr-2" size={20} />
                    Track Your Application
                  </a>
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  256-bit Encryption
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  No Credit Impact
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  2-Minute Process
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="lg:col-span-1">
              <a href="#" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="font-display font-bold text-primary-foreground text-lg">LA</span>
                </div>
                <span className="font-display font-semibold text-xl text-foreground">
                  LoanAdvisor
                </span>
              </a>
              <p className="text-sm text-muted-foreground mb-6">
                AI-powered loan eligibility decisions with full transparency and human oversight.
              </p>
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <social.icon size={18} className="text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-display font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                {legalLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>support@loanadvisor.ai</li>
                <li>1800-XXX-XXXX</li>
                <li>Mon - Sat: 9AM - 8PM</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} LoanAdvisor. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by AI with human oversight for fair lending decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
