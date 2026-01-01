import { FinancialProfile as Profile } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Briefcase,
  IndianRupee,
  BarChart3,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialProfileProps {
  financial: Profile;
}

const employmentLabels = {
  salaried: 'Salaried',
  self_employed: 'Self Employed',
  business_owner: 'Business Owner',
  retired: 'Retired',
  student: 'Student',
};

const incomeLabels = {
  below_3l: 'Below ₹3 Lakhs',
  '3l_5l': '₹3 - 5 Lakhs',
  '5l_10l': '₹5 - 10 Lakhs',
  '10l_25l': '₹10 - 25 Lakhs',
  above_25l: 'Above ₹25 Lakhs',
};

const creditHealthConfig = {
  low: { label: 'Needs Improvement', color: 'text-destructive', bgColor: 'bg-destructive/10', barWidth: 'w-1/4' },
  medium: { label: 'Fair', color: 'text-warning', bgColor: 'bg-warning/10', barWidth: 'w-1/2' },
  high: { label: 'Good', color: 'text-success', bgColor: 'bg-success/10', barWidth: 'w-3/4' },
  excellent: { label: 'Excellent', color: 'text-primary', bgColor: 'bg-primary/10', barWidth: 'w-full' },
};

export function FinancialProfileSection({ financial }: FinancialProfileProps) {
  const creditHealth = creditHealthConfig[financial.creditHealth];

  return (
    <Card className="glass-strong animate-slide-up" style={{ animationDelay: '0.25s' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" />
            Financial Profile
          </CardTitle>
          <Badge variant="secondary" className="text-xs">Limited View</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employment & Income */}
        <div className="grid grid-cols-2 gap-4">
          {/* Employment Type */}
          {financial.employmentType && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Employment Type</p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {employmentLabels[financial.employmentType]}
              </p>
            </div>
          )}

          {/* Income Range */}
          {financial.incomeRange && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Annual Income</p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {incomeLabels[financial.incomeRange]}
              </p>
            </div>
          )}
        </div>

        {/* Credit Health Indicator */}
        <div className="p-4 rounded-lg border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Credit Health</p>
            </div>
            <Badge className={cn(creditHealth.bgColor, creditHealth.color)}>
              {creditHealth.label}
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  creditHealth.barWidth,
                  financial.creditHealth === 'low' && 'bg-destructive',
                  financial.creditHealth === 'medium' && 'bg-warning',
                  financial.creditHealth === 'high' && 'bg-success',
                  financial.creditHealth === 'excellent' && 'gradient-primary'
                )}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
              <span>Excellent</span>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            For your privacy, exact credit scores and bureau data are not displayed. 
            This indicator is derived from your overall credit profile.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}