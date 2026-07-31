import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'muted';
}

export function StatCard({ title, value, icon: Icon, variant = 'default' }: StatCardProps) {
  const variantClasses: Record<typeof variant, string> = {
    default: 'text-foreground',
    success: 'text-green-700 dark:text-green-400',
    warning: 'text-amber-700 dark:text-amber-400',
    danger: 'text-red-700 dark:text-red-400',
    muted: 'text-muted-foreground',
  };

  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className={`text-3xl font-bold tabular-nums font-mono ${variantClasses[variant]}`}>
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-lg bg-muted ${variantClasses[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
