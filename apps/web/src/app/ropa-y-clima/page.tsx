import type { Metadata } from 'next';
import { RopaClimaView } from '@/components/RopaClimaView';

export const metadata: Metadata = {
  title: '¿Cuánta ropa ponerle a mi bebé? (-5 °C a 50 °C) | Baby Buddy MX',
  description:
    'Calculadora gratuita de ropa para bebé según la temperatura del cuarto o exterior (-5 °C a 50 °C) en México, con guía TOG, alternativas cotidianas sin saco y alertas de seguridad.',
};

export default function RopaClimaPage() {
  return <RopaClimaView />;
}
