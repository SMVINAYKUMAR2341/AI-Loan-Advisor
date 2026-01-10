import {
  LayoutDashboard,
  FileText,
  CreditCard,
  CalendarCheck,
  FolderOpen,
  Bell,
  Users,
  BarChart3,
  LogOut,
  Building2,
  ChevronRight,
  MessageSquare,
  UserCog,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, description: 'Overview & stats' },
  { title: 'Loan Applications', url: '/loans', icon: FileText, description: 'Manage applications' },
  { title: 'Loan Disbursement', url: '/disbursement', icon: CreditCard, description: 'Process payments' },
  { title: 'EMI Tracking', url: '/emi', icon: CalendarCheck, description: 'Monitor repayments' },
  { title: 'Documents', url: '/documents', icon: FolderOpen, description: 'KYC & verification' },
  { title: 'Notifications', url: '/notifications', icon: Bell, description: 'Alerts & messages' },
  { title: 'Customers', url: '/customers', icon: Users, description: 'Customer database' },
  { title: 'Reports', url: '/reports', icon: BarChart3, description: 'Analytics & insights' },
  { title: 'Support Tickets', url: '/tickets', icon: MessageSquare, description: 'Customer support' },
];

interface AppSidebarProps {
  onLogout: () => void;
}

export function AppSidebar({ onLogout }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-gray-900/95 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0 border border-teal-500/30">
            <Building2 className="h-5 w-5 text-teal-400" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white">LoanAdmin</span>
              <span className="text-xs text-gray-400">AI Loan Advisor</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-auto p-0"
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${active
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                          }`}
                      >
                        <div className={`p-2 rounded-lg transition-colors ${active
                          ? 'bg-teal-500/20'
                          : 'bg-gray-900/95 group-hover:bg-teal-500/10'
                          }`}>
                          <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-teal-400' : 'text-gray-500 group-hover:text-teal-400'
                            }`} />
                        </div>
                        {!collapsed && (
                          <>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-xs text-gray-500">{item.description}</p>
                            </div>
                            {active && <ChevronRight className="w-4 h-4 text-teal-400" />}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4 bg-white/10" />

        {/* Admin Profile Section - Clickable to navigate to profile */}
        {!collapsed && (
          <NavLink
            to="/profile"
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-3 border border-white/10 hover:bg-teal-500/10 hover:border-teal-500/30 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center border border-teal-500/30">
              <span className="text-teal-400 font-semibold text-sm">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Bank Admin</p>
              <p className="text-gray-500 text-xs truncate">Account & Security →</p>
            </div>
          </NavLink>
        )}

        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-xl transition-all ${collapsed ? 'px-3' : ''
            }`}
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
