import { useState } from 'react';
import { SecuritySettings } from '@/types/profile';
import { formatDateTime, getRelativeTime } from '@/data/mockProfileData';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui/core';
import { Switch } from '@/components/ui/layout';
import {
  Lock,
  Smartphone,
  Monitor,
  Clock,
  MapPin,
  Key,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SecurityManagementProps {
  security: SecuritySettings;
}

export function SecurityManagement({ security }: SecurityManagementProps) {
  const [otpEnabled, setOtpEnabled] = useState(security.otpLoginEnabled);
  const { toast } = useToast();

  const handleOtpToggle = (checked: boolean) => {
    setOtpEnabled(checked);
    toast({
      title: checked ? 'OTP Login Enabled' : 'OTP Login Disabled',
      description: checked
        ? 'You will receive an OTP for each login attempt.'
        : 'OTP verification has been turned off.',
    });
  };

  const handlePasswordChange = () => {
    toast({
      title: 'Re-authentication Required',
      description: 'Please verify your identity to change password.',
    });
  };

  const handleSignOutAll = () => {
    toast({
      title: 'Sessions Terminated',
      description: 'All other sessions have been signed out.',
    });
  };

  return (
    <Card className="glass-strong animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Lock className="h-5 w-5 text-primary" />
          Security & Login Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Last Login Info */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Last Login</p>
            <p className="text-sm text-muted-foreground">{getRelativeTime(security.lastLogin)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Monitor className="h-3 w-3" />
              {security.lastLoginDevice.browser}
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Smartphone className="h-3 w-3" />
              {security.lastLoginDevice.os}
            </Badge>
            {security.lastLoginDevice.location && (
              <Badge variant="secondary" className="gap-1.5">
                <MapPin className="h-3 w-3" />
                {security.lastLoginDevice.location}
              </Badge>
            )}
          </div>
        </div>

        {/* Security Controls */}
        <div className="space-y-4">
          {/* Change Password */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Change Password</p>
                <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePasswordChange}>
              Update
            </Button>
          </div>

          {/* OTP Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">OTP Login</p>
                <p className="text-xs text-muted-foreground">Require OTP for each login</p>
              </div>
            </div>
            <Switch checked={otpEnabled} onCheckedChange={handleOtpToggle} />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Active Sessions</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOutAll}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign out all
            </Button>
          </div>
          <div className="space-y-2">
            {security.activeSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  session.isCurrent
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{session.device}</p>
                      {session.isCurrent && (
                        <Badge className="bg-primary/10 text-primary text-xs">Current</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getRelativeTime(session.lastActive)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-lg bg-warning/5 border border-warning/10">
          <p className="text-xs text-muted-foreground">
            <span className="text-warning font-medium">Security:</span> Password changes and critical security updates require re-authentication.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}