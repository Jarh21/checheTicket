import { Badge } from '@/components/ui/badge';
import type { LicenseStatus } from '@workspace/api-client-react';

interface StatusBadgeProps {
  status: LicenseStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<LicenseStatus, { label: string; className: string }> = {
    active: {
      label: 'Activa',
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    },
    expired: {
      label: 'Vencida',
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    },
    suspended: {
      label: 'Suspendida',
      className: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800',
    },
  };

  const variant = variants[status];

  return (
    <Badge variant="outline" className={variant.className} data-testid={`badge-status-${status}`}>
      {variant.label}
    </Badge>
  );
}
