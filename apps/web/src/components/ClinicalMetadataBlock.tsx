import type { ClinicalMetadata } from '@baby-buddy/content';

interface ClinicalMetadataBlockProps {
  readonly metadata: ClinicalMetadata;
}

export function ClinicalMetadataBlock({
  metadata,
}: ClinicalMetadataBlockProps) {
  return (
    <details className="rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-xs text-ink-secondary">
      <summary className="cursor-pointer font-semibold text-ink-muted hover:text-ink-primary">
        Fuentes y revisión editorial ({metadata.version})
      </summary>
      <div className="mt-2 space-y-2 border-t border-border-interactive pt-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <strong className="text-ink-primary">Versión:</strong>{' '}
            {metadata.version}
          </span>
          <span>
            <strong className="text-ink-primary">Corte editorial:</strong>{' '}
            {metadata.reviewed_at}
          </span>
          <span>
            <strong className="text-ink-primary">Estado de revisión:</strong>{' '}
            {metadata.reviewed_by}
          </span>
        </div>
        <div>
          <p className="font-semibold text-ink-primary">Fuentes de referencia:</p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {metadata.sources.map((source) => (
              <li key={`${source.organization}-${source.title}-${source.year}`}>
                {source.title} — {source.organization} ({source.year})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}
