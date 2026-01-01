import { useState } from 'react';
import { CommunicationPreferences as Preferences } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/core';
import { Switch } from '@/components/ui/layout';
import {
  Bell,
  MessageSquare,
  Mail,
  CreditCard,
  Megaphone,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CommunicationPreferencesProps {
  preferences: Preferences;
}

const preferenceItems = [
  {
    key: 'smsNotifications' as const,
    label: 'SMS Notifications',
    description: 'Receive updates via SMS',
    icon: MessageSquare,
  },
  {
    key: 'emailNotifications' as const,
    label: 'Email Notifications',
    description: 'Receive updates via email',
    icon: Mail,
  },
  {
    key: 'paymentReminders' as const,
    label: 'Payment Reminders',
    description: 'Get notified before payment due dates',
    icon: CreditCard,
  },
  {
    key: 'promotionalOffers' as const,
    label: 'Promotional Offers',
    description: 'Receive offers and promotions',
    icon: Megaphone,
  },
];

export function CommunicationPreferences({ preferences }: CommunicationPreferencesProps) {
  const [prefs, setPrefs] = useState(preferences);
  const { toast } = useToast();

  const handleToggle = (key: keyof Preferences, checked: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: checked }));
    toast({
      title: 'Preference Updated',
      description: `${preferenceItems.find(p => p.key === key)?.label} has been ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  return (
    <Card className="glass-strong animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Bell className="h-5 w-5 text-primary" />
          Communication Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preference Toggles */}
        <div className="space-y-3">
          {preferenceItems.map((item) => {
            const Icon = item.icon;
            const isEnabled = prefs[item.key];

            return (
              <div
                key={item.key}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-all',
                  isEnabled ? 'border-primary/20 bg-primary/5' : 'border-border bg-muted/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center',
                    isEnabled ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      isEnabled ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggle(item.key, checked)}
                />
              </div>
            );
          })}
        </div>

        {/* Critical Alerts - Always On */}
        <div className="p-3 rounded-lg border border-warning/20 bg-warning/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">Critical Alerts</p>
                  <Badge className="bg-warning/10 text-warning text-xs gap-1">
                    <Lock className="h-3 w-3" />
                    Always On
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Security & payment failure alerts</p>
              </div>
            </div>
            <Switch checked disabled className="opacity-50" />
          </div>
        </div>

        {/* Update Notice */}
        <p className="text-xs text-muted-foreground text-center">
          Preference changes take effect immediately across all channels.
        </p>
      </CardContent>
    </Card>
  );
}