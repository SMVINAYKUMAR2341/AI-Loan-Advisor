import { UserProfile } from '@/types/profile';
import { maskEmail, maskPhone, formatDate } from '@/data/mockProfileData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Phone, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ProfileOverviewProps {
  user: UserProfile;
}

const statusConfig = {
  active: { label: 'Active', variant: 'default' as const, icon: CheckCircle2, className: 'bg-success/10 text-success border-success/20' },
  kyc_pending: { label: 'KYC Pending', variant: 'secondary' as const, icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
  kyc_verified: { label: 'Verified', variant: 'default' as const, icon: CheckCircle2, className: 'bg-success/10 text-success border-success/20' },
  suspended: { label: 'Suspended', variant: 'destructive' as const, icon: AlertCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function ProfileOverview({ user }: ProfileOverviewProps) {
  const status = statusConfig[user.accountStatus];
  const StatusIcon = status.icon;
  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <Card className="glass-strong animate-slide-up">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <User className="h-5 w-5 text-primary" />
          Profile Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Badge className={`${status.className} gap-1.5`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="flex-1 grid gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Full Name (as per records)</p>
              <p className="text-lg font-semibold text-foreground">{user.fullName}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Masked Email */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="text-sm font-medium text-foreground">{maskEmail(user.email)}</p>
                </div>
              </div>

              {/* Masked Phone */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Mobile Number</p>
                  <p className="text-sm font-medium text-foreground">{maskPhone(user.phone)}</p>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Member since {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">Note:</span> Sensitive information is masked for security. 
            Contact support to update regulated profile details.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}