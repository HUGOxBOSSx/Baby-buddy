import { ConfiguracionView } from '@/components/ConfiguracionView';

export default function ConfiguracionPage() {
  return (
    <div
      className="space-y-6"
      aria-label="Configuraciones: bebés, modo nocturno, familia y datos"
    >
      <ConfiguracionView />
    </div>
  );
}
