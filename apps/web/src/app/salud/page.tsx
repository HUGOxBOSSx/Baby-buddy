import { SaludView } from '@/components/SaludView';

export default function SaludPage() {
  return (
    <div
      className="space-y-6"
      aria-label="Salud: temperatura, medicamentos, vacunas, crecimiento, hitos y reporte"
    >
      <SaludView />
    </div>
  );
}
