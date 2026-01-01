import { ConsentRecord } from '@/types/profile';
import { formatDateTime } from '@/data/mockProfileData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileCheck, 
  ExternalLink,
  FileText,
  Shield,
  Megaphone,
  Building2
} from 'lucide-react';

interface ConsentPermissionsProps {
  consents: ConsentRecord[];
}

const consentIcons = {
  terms: FileText,
  privacy: Shield,
  marketing: Megaphone,
  credit_bureau: Building2,
};

const consentLabels = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  marketing: 'Marketing',
  credit_bureau: 'Credit Bureau',
};

export function ConsentPermissions({ consents }: ConsentPermissionsProps) {
  return (
    <Card className="glass-strong animate-slide-up" style={{ animationDelay: '0.15s' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileCheck className="h-5 w-5 text-primary" />
            Consent & Permissions
          </CardTitle>
          <Badge variant="secondary" className="text-xs">RBI Compliant</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Consent Info */}
        <p className="text-sm text-muted-foreground">
          Your consents are recorded for regulatory compliance. These cannot be modified through this interface.
        </p>

        {/* Consent Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground">
            <div className="col-span-5">Purpose</div>
            <div className="col-span-2 text-center">Version</div>
            <div className="col-span-5 text-right">Accepted On</div>
          </div>
          <div className="divide-y divide-border">
            {consents.map((consent) => {
              const Icon = consentIcons[consent.consentType];
              return (
                <div 
                  key={consent.id} 
                  className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-5 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground truncate">
                      {consent.purpose}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <Badge variant="outline" className="text-xs">
                      {consent.version}
                    </Badge>
                  </div>
                  <div className="col-span-5 text-right text-xs text-muted-foreground">
                    {formatDateTime(consent.acceptedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Policy Link */}
        <Button variant="outline" className="w-full gap-2" asChild>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <FileText className="h-4 w-4" />
            View Current Privacy Policy
            <ExternalLink className="h-3 w-3 ml-auto" />
          </a>
        </Button>

        {/* Compliance Notice */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">Regulatory Compliance:</span> Consent records are maintained as per RBI guidelines and cannot be deleted or modified by users.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}