import { ActivityLogEntry } from '@/types/profile';
import { getRelativeTime, formatDateTime } from '@/data/mockProfileData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  LogIn,
  UserCog,
  Shield,
  FileCheck,
  Bell,
  Monitor,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityLogProps {
  activities: ActivityLogEntry[];
}

const activityConfig = {
  login: { icon: LogIn, color: 'text-primary', bgColor: 'bg-primary/10' },
  profile_update: { icon: UserCog, color: 'text-success', bgColor: 'bg-success/10' },
  security_change: { icon: Shield, color: 'text-warning', bgColor: 'bg-warning/10' },
  consent_update: { icon: FileCheck, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  preference_change: { icon: Bell, color: 'text-accent', bgColor: 'bg-accent/10' },
};

export function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <Card className="glass-strong animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-5 w-5 text-primary" />
            Activity & Access Log
          </CardTitle>
          <Badge variant="secondary" className="text-xs">View Only</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-1">
            {activities.map((activity, index) => {
              const config = activityConfig[activity.type];
              const Icon = config.icon;
              const isLast = index === activities.length - 1;

              return (
                <div key={activity.id} className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                      config.bgColor
                    )}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    {!isLast && (
                      <div className="w-px h-full bg-border my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.description}
                        </p>
                        {activity.metadata && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {activity.metadata.device && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Monitor className="h-3 w-3" />
                                {activity.metadata.device}
                              </Badge>
                            )}
                            {activity.metadata.location && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <MapPin className="h-3 w-3" />
                                {activity.metadata.location}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {getRelativeTime(activity.timestamp)}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {formatDateTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Transparency Notice */}
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">Transparency:</span> This log shows your recent account activity for security and trust. All entries are view-only.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}