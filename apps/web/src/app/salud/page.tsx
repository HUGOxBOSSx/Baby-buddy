import { TriageDisclaimerBanner } from '@/components/TriageDisclaimerBanner';
import { SaludView } from '@/components/SaludView';

export default function SaludPage() {
  return (
    <div
      className="space-y-6"
      aria-label="Salud, emergencias 911 y privacidad"
      data-emergency-level="urgent_red"
    >
      <TriageDisclaimerBanner />
      <SaludView />
    </div>
  );
}
