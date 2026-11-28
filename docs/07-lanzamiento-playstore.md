# Baby Buddy MX — Guía de lanzamiento (Google Play, App Store y Web)

> Documento operativo para la preparación del lanzamiento (Hito 7). Complementa
> [Validación en dispositivos](06-validacion-dispositivos.md) y
> [Privacidad y seguridad](04-privacidad-y-seguridad.md).

## 1. Metadatos ASO (es-MX)

- **Nombre de la app:** Baby Buddy MX
- **Subtítulo (30 caracteres max.):** Crianza 0–6 años y registro
- **Categoría principal:** Salud y bienestar / Crianza
- **Unidades:** Exclusivamente métricas (`°C`, `kg`, `cm`, `ml`).
- **Descripción corta (80 caracteres max.):**
  `Registro diario, ropa según clima, hitos 0–6 años y salud infantil offline.`
- **Descripción larga (borrador para tienda):**
  Baby Buddy MX acompaña a madres, padres y cuidadores en México desde el
  nacimiento hasta los 6 años (0–72 meses), con funcionamiento 100 % offline,
  modo nocturno 3:00 AM de bajo deslumbramiento y medidas métricas (`°C`, `kg`,
  `cm`, `ml`).

  **Siempre gratis:**
  - Registro diario de tomas, pañales, sueño, extracción y sólidos, con promedios.
  - Guías rápidas (`¿Es normal?`), tabla orientativa de evacuaciones e hitos.
  - Recomendador de capas de ropa y cobija según temperatura en `°C`.
  - Bitácora de salud, peso, talla, perímetro cefálico, vacunas y acceso directo
    al 911 México en ≤ 3 toques.

  **Plan Pro (opcional):**
  - Guías avanzadas y respaldo/sincronización multi-cuidador en la nube cuando se
    habilite el backend familiar.

  **Aviso importante:** Baby Buddy MX es una herramienta informativa de crianza
  y no sustituye la valoración de tu pediatra ni constituye diagnóstico médico.

## 2. Seguridad de datos (Google Play) y Privacidad (App Store)

- **Estado actual (offline-first):**
  - Sin cuentas en la nube obligatorias, sin telemetría de terceros y sin venta
    de datos personales.
  - Los datos del bebé (perfil, bitácora diaria, bitácora de salud, cola de
    sincronización local) permanecen en el dispositivo (`localStorage` en web /
    `AsyncStorage` en móvil) y pueden exportarse o borrarse por completo de
    forma local e idempotente (`LocalAccountLifecycleAdapter`).
- **Política ética de monetización (implementada en `packages/core/src/compliance/monetization.ts`):**
  - El acceso a urgencias `emergency_911`, registro diario, guías básicas, ropa
    y bitácora de salud es **siempre gratuito** (`ALWAYS_FREE_SURFACES`).
  - Los banners discretos del plan gratuito (`isAdBannerAllowed`) **nunca** se
    muestran en `emergency_911`, en pantallas infantiles (`child_screen`), ni en
    horario nocturno fijo local (`22:00–06:00 h`, `AD_QUIET_HOURS_LOCAL`).
  - El Modo Nocturno manual permanece disponible sin restricciones a cualquier hora.

## 3. Lista de verificación previa al lanzamiento

- [ ] Revisión y visto bueno clínico pediátrico del contenido en `packages/content` (fuentes, `reviewed_at`, `reviewed_by`).
- [ ] Revisión legal en México (aviso de privacidad, términos de uso y textos no diagnósticos).
- [ ] Completar pruebas físicas en iOS y Android siguiendo [Validación en dispositivos](06-validacion-dispositivos.md) (incluyendo flujo 3:00 AM -> Salud -> 911 en ≤ 3 toques y contraste WCAG 2.2 AA).
- [ ] Despliegue web estático/producción (por ejemplo Vercel) validado con `npm run build:web`.
- [ ] Generación de iconos finales (`icon.png`, `adaptive-icon.png`, `splash-icon.png`) y capturas para ficha de tienda en `apps/mobile`.
- [ ] Al integrar sincronización multi-cuidador y facturación en Hito 7, respetar `CloudSyncPort` y `isAdBannerAllowed` / `canAccessSurface` sin bloquear el 911 ni vender datos.
