export type MascotVariant = 'home' | 'clima' | 'salud' | 'es_normal';

const MASCOT_SRC: Record<MascotVariant, string> = {
  home: '/mascot/mascot-home.png',
  clima: '/mascot/mascot-clima.jpg',
  salud: '/mascot/mascot-salud.jpg',
  es_normal: '/mascot/mascot-es-normal.jpg',
};

const MASCOT_ALT: Record<MascotVariant, string> = {
  home: 'Personaje Baby Buddy MX saludando',
  clima: 'Personaje Baby Buddy MX con bufanda y clima',
  salud: 'Personaje Baby Buddy MX con estetoscopio de salud',
  es_normal: 'Personaje Baby Buddy MX explorando con lupa',
};

const SIZE_CLASSES = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
} as const;

export interface MascotAvatarProps {
  readonly variant: MascotVariant;
  readonly size?: 'sm' | 'md' | 'lg';
}

export function MascotAvatar({ variant, size = 'md' }: MascotAvatarProps) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated p-1 ${SIZE_CLASSES[size]}`}
    >
      <img
        src={MASCOT_SRC[variant]}
        alt={MASCOT_ALT[variant]}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
