import { STATUS_SPECS, type StatusSeverity } from '@baby-buddy/core';
import { StatusIcon } from '@/components/Icons';

interface StatusBadgeProps {
  readonly severity: StatusSeverity;
  readonly className?: string;
}

const SEVERITY_STYLE_MAP: Record<StatusSeverity, string> = {
  normal: 'bg-brand-surface text-brand-text border-brand-primary',
  caution: 'bg-warm-surface text-warm-text border-warm',
  urgent_red: 'bg-alert-surface text-alert-text border-alert-red',
};

export function StatusBadge({ severity, className = '' }: StatusBadgeProps) {
  const spec = STATUS_SPECS[severity];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${SEVERITY_STYLE_MAP[severity]} ${className}`.trim()}
    >
      <StatusIcon name={spec.iconName} className="h-4 w-4 shrink-0" />
      <span>{spec.labelMx}</span>
    </span>
  );
}
