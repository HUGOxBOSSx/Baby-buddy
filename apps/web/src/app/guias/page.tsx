import { M1_GUIDE_SCAFFOLDS } from '@baby-buddy/content';
import { ClinicalMetadataBlock } from '@/components/ClinicalMetadataBlock';
import { GuiasView } from '@/components/GuiasView';
import { GuideDisclaimerHeader } from '@/components/GuideDisclaimerHeader';

export default function GuiasPage() {
  const guideMetadata = M1_GUIDE_SCAFFOLDS[0]?.metadata;
  if (!guideMetadata) {
    throw new Error('El catálogo de guías no contiene metadatos editoriales.');
  }

  return (
    <div className="space-y-6">
      <GuiasView />
      <div className="space-y-4 pt-2 border-t border-border-subtle">
        <GuideDisclaimerHeader />
        <section aria-label="Estado editorial del catálogo de guías">
          <ClinicalMetadataBlock
            metadata={{
              version: guideMetadata.version,
              reviewed_at: guideMetadata.reviewed_at,
              reviewed_by: guideMetadata.reviewed_by,
              sources: guideMetadata.sources,
            }}
          />
        </section>
      </div>
    </div>
  );
}
