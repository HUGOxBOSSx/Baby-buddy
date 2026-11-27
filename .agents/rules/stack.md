---
trigger: always_on
description: "Stack canónico de Baby Buddy MX: monorepo npm workspaces, Next.js 16.4 + React 19, Expo SDK 55 + RN 0.83 + expo-router, Tailwind 3.4 (nunca v4), estado con React Context y useSyncExternalStore, fechas con Date nativo en ISO-8601, estructura de carpetas y reglas de compliance es-MX."
---

# Baby Buddy MX — Stack y reglas del proyecto

> Lee esto ANTES de explorar el repo. Es la fuente de verdad del stack. Si el código
> contradice este archivo, gana el código y hay que actualizar este archivo en el mismo cambio.

## 0. Producto y restricciones no negociables
- Orientación de crianza y bienestar infantil, 0 a 6 años (0–72 meses), México, copy en es-MX.
- Offline-first: sin backend en vivo, sin cuentas en la nube, sin telemetría.
- Gratis siempre: Registro diario, ¿Es normal?, Ropa y clima, Salud y Urgencias 911 (el 911 NUNCA se bloquea).
- Monetización aprobada (Hito 7 / lanzamiento):
  - Plan Pro (de pago): Guías avanzadas y Familia (sincronización multi-cuidador en tiempo real y respaldo en la nube).
  - Anuncios en plan gratuito (Hito 7): banner discreto encima de la barra de navegación inferior; NUNCA en urgencias 911/triaje, NUNCA en modo nocturno, NUNCA dirigidos a menores y cero venta de datos.
- Solo unidades métricas en todo el producto: °C, kg, cm, ml.
- Nada de lenguaje diagnóstico ni prescriptivo, y nada que reemplace al pediatra.

## 1. Monorepo (npm workspaces)
| Ruta | Paquete | Rol |
|---|---|---|
| apps/web | @baby-buddy/web | Next.js App Router (web) |
| apps/mobile | @baby-buddy/mobile | Expo + expo-router (iOS, Android, web) |
| packages/core | @baby-buddy/core | Dominio, tema, compliance, puertos. TS puro, SIN React |
| packages/content | @baby-buddy/content | Contenido clínico scaffold. Depende de core |
| e2e | — | Harness node:test por tiers. No modificar salvo pedido explícito |

Dependencias permitidas entre paquetes: apps/* consumen core y content; content consume core.
Nunca al revés, y core no importa React ni Next.

## 2. Versiones exactas (no cambiar sin pedido explícito)
- Next 16.4.6 · React 19.2.0 · react-dom 19.2.0 · TypeScript ~5.9.3
- Expo ~55.0.32 · React Native 0.83.10 · expo-router ~55.0.18 · expo-status-bar ~55.0.6
- NativeWind ~4.2.5 · react-native-css-interop ~0.2.5 · reanimated 4.2.1 · worklets 0.7.4
- react-native-safe-area-context ~5.6.2 · react-native-screens ~4.23.0 · react-native-web ~0.21.0
- @react-native-async-storage/async-storage 2.2.0 (persistencia móvil del Hito 1)
- Tailwind CSS 3.4.17 en AMBAS apps (v4 prohibido) · Vitest en packages · Node 24

## 3. Estructura de carpetas
apps/web/src/
  app/            rutas App Router: layout.tsx, page.tsx, guias/, ropa-y-clima/, salud/
  components/     vistas y UI ('use client' cuando usa estado, efectos o APIs del navegador)
  lib/            localAdapter.ts (store + persistencia web)
apps/mobile/
  app/            rutas expo-router: _layout.tsx, (tabs)/{index,guias,ropa-y-clima,salud}.tsx
  components/     ThemeProvider, OnboardingGate, StageSelector, StatusBadge, ...
  lib/            localAdapter.ts (storage móvil)
packages/core/src/
  domain/         stages.ts, metrics.ts, profile.ts
  theme/          tokens.ts, status.ts, contrast.ts
  compliance/     disclaimers.ts, guardrails.ts, accountDeletion.ts
  adapters/       env.ts, storage.ts, services.ts
  __tests__/      *.test.ts (Vitest, co-locados)
packages/content/src/
  schema.ts, disclaimers.ts, scaffold/{stages,guides,clothing}.ts, __tests__/

## 4. Gestión de estado (NO instalar librerías)
- Sin Redux, Zustand, Jotai, Recoil, TanStack Query ni SWR. El estado ya está resuelto con React.
- Web: store externo mínimo en apps/web/src/lib/localAdapter.ts, consumido con
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot). Todo componente que lo
  use lleva 'use client' en la primera línea. En app/ los Server Components son el default.
- Móvil: apps/mobile/components/ThemeProvider.tsx expone useThemeContext() con
  useState + useMemo + callbacks estables, e hidrata desde el adapter en useEffect.
- Estado compartido nuevo: extender ese Context o store existente, no crear uno paralelo.

## 5. Fechas y tiempo (NO instalar librerías)
- Sin date-fns, dayjs, luxon ni moment. Usar Date nativo.
- Persistir y transportar SIEMPRE ISO-8601 UTC: new Date().toISOString().
- Validar calendario real con new Date(Date.UTC(y, m - 1, d)) y comparar componentes.
- La edad del bebé se modela en MESES (ageMonths, rango 0–72) vía getStageForAgeMonths();
  las etapas son '0-3m', '3-12m', '1-3a' y '3-6a'.
- No formatear fechas con Intl dentro de la lógica de dominio; el locale canónico es 'es-MX'.

## 6. Persistencia
- Toda escritura pasa por KeyValueStoragePort (getItem, setItem, removeItem, keys).
- Web: apps/web/src/lib/localAdapter.ts usa localStorage del navegador.
- Móvil: apps/mobile/lib/localAdapter.ts usa @react-native-async-storage/async-storage 2.2.0,
  que persiste en Android, iOS y web móvil. No sustituirlo por memoria para preferencias.
- Claves SIEMPRE con el prefijo LOCAL_STORAGE_PREFIX; el borrado usa LocalAccountLifecycleAdapter
  y debe ser idempotente y preservar las claves externas al namespace.
- Nunca guardar secretos ni datos sensibles, y nunca hacer red: los puertos de servicios
  remotos son stubs offline (OfflineSupabasePortStub, OfflineGeminiAssistantStub, ...).

## 7. Tema, accesibilidad y estilos
- Paletas canónicas en packages/core/src/theme/tokens.ts: DAY_PALETTE y NIGHT_3AM_PALETTE.
  No inventar colores: agregarlos ahí y validarlos con assertWcagAaPalette.
- WCAG 2.2 AA obligatorio: texto >= 4.5:1, UI y focus >= 3:1, modo 3:00 AM texto >= 6.1:1.
- Web: clases Tailwind mapeadas a CSS variables (bg-bg-primary, text-ink-primary,
  text-brand-text, border-border-interactive, ring-focus-ring). Nada de hex sueltos.
- Móvil: className (NativeWind) y style solo para valores de paleta o medidas dinámicas.
- Área táctil mínima MIN_TOUCH_TARGET_PX = 48. Flujo 3:00 AM hacia Salud hacia 911 en <= 3 toques.
- Nunca ocultar el 911 y nunca usar blanco puro como fondo en modo noche.

## 8. Contenido clínico
- Todo ítem de packages/content exige ClinicalMetadata completa: version, sources[] no vacío,
  reviewed_at con fecha válida y reviewed_by no vacío.
- Campos de copy en español con sufijo Mx (titleMx, summaryMx, guidanceMx, headlineMx, ...).
- Al añadir contenido, validar con assertValidClinicalMetadata y validateSpanishClinicalCopy.
- Fuera de alcance actual: cartilla de vacunación con z-scores, y RAG en vivo.

## 9. Convenciones de código
- TypeScript strict; sin any; props e interfaces readonly; importar tipos con `import type`.
- Componentes en PascalCase; funciones y hooks en camelCase; constantes en SCREAMING_SNAKE_CASE.
- Carpetas de rutas en kebab-case (ropa-y-clima). Un componente por archivo.
- Copy de UI en es-MX; identificadores de código en inglés salvo los campos *Mx.
- Tests de packages co-locados en src/__tests__/*.test.ts con Vitest (describe, it, expect).

## 10. Comandos
La ruta del workspace contiene espacios ("Baby buddy"): citar siempre las rutas.
Desde la raíz del repo:
  npm run typecheck
  npm run lint
  npm run test
  npm run build:web
  npm run export:mobile
Validación focalizada por workspace:
  npm run typecheck --workspace=@baby-buddy/core
  npm run test --workspace=@baby-buddy/core
  npm run typecheck --workspace=@baby-buddy/content
  npm run test --workspace=@baby-buddy/content
  npm run typecheck --workspace=@baby-buddy/web
  npm run export --workspace=@baby-buddy/mobile
Alternativa con los binarios ya instalados en la raíz:
  ./node_modules/.bin/tsc --noEmit -p packages/core/tsconfig.json
  ./node_modules/.bin/vitest run --root packages/core
  ./node_modules/.bin/eslint packages/core/src
El CI invoca typecheck, lint, test, build:web y export:mobile; los cinco scripts existen
en el package.json raíz y no deben renombrarse.
E2E: node e2e/run.mjs --tier=1|2|3|4|all (con E2E_CORE_ONLY=1 cubre solo packages).

## 11. Prohibido (el E2E lo verifica)
- Tailwind v4, React 18, newArchEnabled en app.json, eas build, eas-cli y builds en la nube.
- En hitos actuales (antes de Hito 7): SDKs de anuncios, analítica, atribución o crash reporting de pago. En Hito 7 solo se permite banner discreto en plan gratuito fuera de urgencias 911, modo nocturno y pantallas infantiles.
- Unidades imperiales en copy, código o HTML renderizado.
- Frases diagnósticas o de prescripción; bloquear el 911 por login o paywall.
- Modificar e2e/, .github/workflows/ci.yml o los manifiestos raíz para "hacer pasar" tests.

## 12. Mapa rápido para no explorar
| Necesitas | Archivo exacto |
|---|---|
| Versiones y scripts | apps/web/package.json, apps/mobile/package.json, packages/*/package.json |
| Etapas y edades | packages/core/src/domain/stages.ts |
| Métricas y unidades | packages/core/src/domain/metrics.ts |
| Perfil del bebé | packages/core/src/domain/profile.ts |
| Motor de ropa y clima | packages/core/src/domain/clothingEngine.ts |
| Semáforo y triaje | packages/core/src/domain/triage.ts |
| Biblioteca Hito 3 | packages/content/src/library/{isNormal,problems,poopChart,search}.ts |
| Colores y modo noche | packages/core/src/theme/tokens.ts |
| Contraste WCAG | packages/core/src/theme/contrast.ts |
| Copy y guardrails | packages/core/src/compliance/guardrails.ts, disclaimers.ts |
| Borrado de cuenta | packages/core/src/compliance/accountDeletion.ts |
| Storage y puertos | packages/core/src/adapters/storage.ts, services.ts, env.ts |
| Estado web | apps/web/src/lib/localAdapter.ts, src/components/ThemeProvider.tsx |
| Estado móvil | apps/mobile/lib/localAdapter.ts, components/ThemeProvider.tsx |
| Persistencia móvil | apps/mobile/lib/localAdapter.ts (`@react-native-async-storage/async-storage`) |
| Contenido M1 | packages/content/src/scaffold/guides.ts, stages.ts, clothing.ts |
| Reglas de aceptación | e2e/tier1-features.test.mjs, tier2-boundaries.test.mjs |

