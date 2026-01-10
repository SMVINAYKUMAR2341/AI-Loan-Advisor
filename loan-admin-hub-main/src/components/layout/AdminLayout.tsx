import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
}

// Smokey Background Component - matching customer dashboard
const SmokeyBackground = ({ className, color = "#14b8a6" }: { className?: string; color?: string }) => {
  return (
    <div className={className}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800" />

      {/* Animated smokey effects */}
      <div
        className="absolute inset-0 opacity-30 animate-pulse"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${color}20 0%, transparent 50%)`,
          animationDuration: '4s'
        }}
      />
      <div
        className="absolute inset-0 opacity-20 animate-pulse"
        style={{
          background: `radial-gradient(ellipse at 70% 80%, ${color}15 0%, transparent 50%)`,
          animationDuration: '6s',
          animationDelay: '2s'
        }}
      />
      <div
        className="absolute inset-0 opacity-15 animate-pulse"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${color}10 0%, transparent 60%)`,
          animationDuration: '8s',
          animationDelay: '1s'
        }}
      />

      {/* Additional ambient glow */}
      <div
        className="absolute top-0 right-0 w-1/2 h-1/2 opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${color}30 0%, transparent 70%)`
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-1/2 h-1/2 opacity-10"
        style={{
          background: `radial-gradient(circle at bottom left, ${color}20 0%, transparent 70%)`
        }}
      />
    </div>
  );
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  // Handle responsive
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full dark relative overflow-hidden">
        {/* Smokey Background - matching customer dashboard */}
        <SmokeyBackground className="fixed inset-0" color="#14b8a6" />

        <div className="relative z-10 flex w-full">
          <AppSidebar onLogout={handleLogout} />

          <div className="flex-1 flex flex-col min-h-screen">
            {/* Header - Glass effect matching customer dashboard */}
            <header className="sticky top-0 z-10 h-16 border-b border-white/10 bg-gray-900/80 backdrop-blur-xl flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-gray-400 hover:text-white transition-colors" />
                <div>
                  <h1 className="text-lg font-bold text-white">Bank Admin Dashboard</h1>
                  <p className="text-xs text-gray-400 hidden sm:block">AI-Powered Loan Management</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <User className="h-5 w-5" />
                </Button>
                {/* Admin badge */}
                <span className="hidden sm:flex items-center px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-teal-400 text-xs font-medium">
                  ✓ Admin
                </span>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
              <div className="max-w-7xl mx-auto animate-fade-in">
                {children}
              </div>
            </main>

            {/* Footer - matching customer dashboard */}
            <footer className="border-t border-white/10 px-6 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500">
                <p>© 2025 LoanAdmin. All rights reserved.</p>
                <p>Protected by RBI-compliant security protocols</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
