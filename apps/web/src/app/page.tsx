import { STAGE_ORDER } from '@baby-buddy/core';
import { STAGE_OVERVIEWS } from '@baby-buddy/content';
import { HoyView } from '@/components/HoyView';

export default function HomePage() {
  return (
    <>
      <noscript>
        <section
          aria-label="Cobertura de Baby Buddy MX por etapas"
          className="mx-auto max-w-4xl space-y-2 p-4"
        >
          <h1 className="text-2xl font-bold">Baby Buddy MX — De 0 a 6 años</h1>
          <p>
            Orientación educativa en español de México. Activa JavaScript para
            usar la experiencia interactiva.
          </p>
          <ul className="list-disc pl-5">
            {STAGE_ORDER.map((stageId) => (
              <li key={stageId}>{STAGE_OVERVIEWS[stageId].headlineMx}</li>
            ))}
          </ul>
        </section>
      </noscript>
      <HoyView />
    </>
  );
}
