import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ALL_CLINICAL_GUIDES,
  getClinicalGuideBySlug,
  getRelatedGuideLinks,
  type ClinicalGuideLinkTone,
} from '@baby-buddy/content';
import { ClinicalMetadataBlock } from '@/components/ClinicalMetadataBlock';
import { GuideDisclaimerHeader } from '@/components/GuideDisclaimerHeader';
import { PhoneCallIcon } from '@/components/Icons';
import { TriageBadge } from '@/components/TriageBadge';

export function generateStaticParams() {
  return ALL_CLINICAL_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getClinicalGuideBySlug(slug);
  if (!guide) {
    return { title: 'Guía no encontrada | Baby Buddy MX' };
  }
  return {
    title: `${guide.titleMx} | Baby Buddy MX`,
    description: guide.quickAnswerMx,
  };
}

export default async function GuideDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  const { slug } = await params;
  const guide = getClinicalGuideBySlug(slug);
  if (!guide) {
    notFound();
  }

  const relatedLinks = getRelatedGuideLinks(guide.slug);

  const linkToneClass = (tone: ClinicalGuideLinkTone): string => {
    switch (tone) {
      case 'normal_green':
        return 'border-brand-primary bg-brand-surface text-brand-text';
      case 'not_normal_yellow':
        return 'border-warm bg-warm-surface text-warm-text';
      case 'urgent_red':
        return 'border-alert-red bg-alert-surface text-alert-text';
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/guias"
        className="inline-flex min-h-12 items-center rounded-xl border border-border-interactive bg-bg-elevated px-4 py-2 text-xs font-bold text-brand-text"
      >
        ← Volver a ¿Es normal?
      </Link>

      <article className="rounded-3xl border border-border-interactive bg-bg-card p-6 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TriageBadge level={guide.triageLevel} />
          <span className="rounded-full border border-border-interactive bg-bg-elevated px-3 py-1 text-xs font-semibold text-ink-secondary">
            {guide.categoryMx}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-ink-primary">
            {guide.titleMx}
          </h1>
          <p className="text-base font-semibold text-brand-text">
            {guide.quickAnswerMx}
          </p>
          <p className="text-sm text-ink-secondary">{guide.summaryMx}</p>
        </div>

        <div className="rounded-2xl border border-brand-primary bg-brand-surface p-4 space-y-1.5">
          <h2 className="text-sm font-bold uppercase text-brand-text">
            Qué SÍ hacer
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink-primary">
            {guide.doStepsMx.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-alert-red bg-alert-surface p-4 space-y-1.5">
          <h2 className="text-sm font-bold uppercase text-alert-text">
            Qué NO hacer
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink-primary">
            {guide.doNotDoMx.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-warm bg-warm-surface p-4 space-y-1.5">
          <h2 className="text-sm font-bold uppercase text-warm-text">
            Cuándo llamar al pediatra o acudir a urgencias
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink-primary">
            {guide.redFlagsMx.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </div>

        {relatedLinks.length > 0 ? (
          <div className="space-y-2 pt-1">
            <h2 className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
              Guías relacionadas
            </h2>
            <div className="flex flex-col gap-2">
              {relatedLinks.map((link) => (
                <Link
                  key={link.slug}
                  href={`/guias/${link.slug}`}
                  className={`inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs font-bold hover:opacity-90 ${linkToneClass(link.tone)}`}
                >
                  <span>
                    {link.prefixMx} {link.titleMx}
                  </span>
                  <span aria-hidden="true" className="text-xl leading-none">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {guide.triageLevel === 'red_911' ? (
          <a
            href="tel:911"
            className="flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-2xl bg-alert-red px-5 py-3 text-sm font-bold text-alert-on hover:opacity-95"
          >
            <PhoneCallIcon className="h-5 w-5 shrink-0" />
            <span>Llamar al 911 de inmediato (Gratis)</span>
          </a>
        ) : null}
      </article>

      <GuideDisclaimerHeader />
      <ClinicalMetadataBlock metadata={guide.metadata} />
    </div>
  );
}
