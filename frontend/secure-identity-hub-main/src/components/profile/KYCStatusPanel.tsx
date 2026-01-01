import { KYCStatus } from '@/types/profile';
import { formatDate } from '@/data/mockProfileData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText,
  CreditCard,
  Camera,
  Building2,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KYCStatusPanelProps {
  kyc: KYCStatus;
}

const statusConfig = {
  not_started: { label: 'Not Started', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-warning', bgColor: 'bg-warning/10', icon: Clock },
  verified: { label: 'Verified', color: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: XCircle },
};

const verificationIcons = {
  aadhaar: FileText,
  pan: CreditCard,
  selfie: Camera,
  bank_statement: Building2,
};

const verificationLabels = {
  aadhaar: 'Aadhaar',
  pan: 'PAN Card',
  selfie: 'Selfie Verification',
  bank_statement: 'Bank Statement',
};

export function KYCStatusPanel({ kyc }: KYCStatusPanelProps) {
  const status = statusConfig[kyc.status];
  const StatusIcon = status.icon;
  const isVerified = kyc.status === 'verified';
  const canComplete = kyc.status === 'not_started' || kyc.status === 'failed';

  const steps = ['not_started', 'in_progress', 'verified'] as const;
  const currentStepIndex = kyc.status === 'failed' ? 0 : steps.indexOf(kyc.status as typeof steps[number]);

  return (
    <Card className="glass-strong animate-slide-up" style={{ animationDelay: '0.05s' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Shield className="h-5 w-5 text-primary" />
            Identity & KYC Status
          </CardTitle>
          <Badge className={cn(status.bgColor, status.color, 'gap-1.5')}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex-1 flex items-center">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
                <div
                  className={cn(
                    'flex-1 h-0.5',
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              </div>
            </div>
          ))}
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              isVerified ? 'bg-primary' : 'bg-muted'
            )}
          />
        </div>

        {/* Completion Date */}
        {kyc.completionDate && (
          <div className="p-3 rounded-lg bg-success/5 border border-success/10">
            <p className="text-sm text-success font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              KYC completed on {formatDate(kyc.completionDate)}
            </p>
          </div>
        )}

        {/* Verification Types */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Verification Documents</p>
          <div className="grid grid-cols-2 gap-3">
            {kyc.verificationsCompleted.map((verification) => {
              const Icon = verificationIcons[verification.type];
              const isDocVerified = verification.status === 'verified';
              const isPending = verification.status === 'pending';
              
              return (
                <div
                  key={verification.type}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                    isDocVerified 
                      ? 'bg-success/5 border-success/20' 
                      : isPending 
                        ? 'bg-warning/5 border-warning/20'
                        : 'bg-destructive/5 border-destructive/20'
                  )}
                >
                  <div className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center',
                    isDocVerified ? 'bg-success/10' : isPending ? 'bg-warning/10' : 'bg-destructive/10'
                  )}>
                    <Icon className={cn(
                      'h-4 w-4',
                      isDocVerified ? 'text-success' : isPending ? 'text-warning' : 'text-destructive'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {verificationLabels[verification.type]}
                    </p>
                    <p className={cn(
                      'text-xs',
                      isDocVerified ? 'text-success' : isPending ? 'text-warning' : 'text-destructive'
                    )}>
                      {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        {canComplete && (
          <Button className="w-full gap-2 gradient-primary text-primary-foreground">
            Complete KYC
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        
        {isVerified && (
          <p className="text-xs text-muted-foreground text-center">
            Your identity has been verified. No further action required.
          </p>
        )}
      </CardContent>
    </Card>
  );
}