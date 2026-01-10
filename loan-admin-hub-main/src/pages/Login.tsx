import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff, Shield, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/api';

import { SmokeyBackground } from '@/components/ui/SmokeyBackground';

export default function Login() {
  const [adminId, setAdminId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await adminApi.login({
        admin_id: adminId.trim(),
        email: email.trim(),
        password,
        pin: pin.trim()
      });

      // Store auth data
      localStorage.setItem('admin_token', response.access_token);
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('admin_user', JSON.stringify({
        name: response.first_name,
        role: response.role,
        id: response.customer_id // Using admin_id from response
      }));

      toast({
        title: 'Welcome back, ' + response.first_name,
        description: 'You have successfully logged in to the admin dashboard.',
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark relative overflow-hidden flex items-center justify-center p-4 bg-background">
      <SmokeyBackground />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-primary/30 ring-4 ring-primary/10">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">LoanAdmin</h1>
          <p className="text-muted-foreground mt-2">AI Loan Advisor Dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="glass-card backdrop-blur-xl border-white/10 shadow-2xl shadow-black/40 animate-fade-in-up stagger-1 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-primary opacity-50" />
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Secure Login
            </CardTitle>
            <CardDescription className="text-gray-400">Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="adminId" className="text-gray-300 ml-1">Admin ID</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="adminId"
                    type="text"
                    placeholder="Enter Admin ID"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value.toUpperCase())}
                    className="pl-10 bg-secondary/30 border-white/10 text-white placeholder:text-gray-600 focus:bg-secondary/50 focus:border-primary/50 transition-all h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 ml-1">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@bank.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary/30 border-white/10 text-white placeholder:text-gray-600 focus:bg-secondary/50 focus:border-primary/50 transition-all h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 ml-1">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary/30 border-white/10 text-white placeholder:text-gray-600 focus:bg-secondary/50 focus:border-primary/50 transition-all h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-gray-300 ml-1">Security PIN</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="pin"
                    type="password"
                    placeholder="123456"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 bg-secondary/30 border-white/10 text-white placeholder:text-gray-600 focus:bg-secondary/50 focus:border-primary/50 transition-all h-11 tracking-widest"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white h-11 font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : 'Sign in to Dashboard'}
              </Button>
            </form>

            <div className="mt-8 flex items-center gap-4 text-xs text-gray-500">
              <div className="h-px bg-white/10 flex-1" />
              <div className="flex items-center gap-1.5 opacity-70">
                <Lock className="h-3 w-3" />
                <span>256-bit SSL Encrypted</span>
              </div>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            {/* Credentials display removed for security */}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center animate-fade-in-up stagger-2">
          <p className="text-xs text-muted-foreground opacity-60">
            Powered by AI Loan Advisor • v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
