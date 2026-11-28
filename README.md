# Baby Buddy MX — Tu compañero de 0 a 6 años

Orientación educativa de crianza y bienestar infantil para México, en español de México y con unidades métricas (°C, kg, cm, ml).

> **Estado actual: Hito 5 en validación.** La aplicación funciona de forma local y sin cuentas en la nube. El contenido clínico es un borrador editorial y **no ha sido validado por un profesional de pediatría**. No sustituye la atención de tu pediatra ni los servicios de emergencia.

## Funciones disponibles en esta base

- **Registro diario (Hito 4):** tomas (pecho izq/der con cronómetro, biberón en ml), pañales con guía visual de popó y alertas, sueño/siestas con ventana de vigilia, hora retroactiva, notas y resúmenes con promedios diarios, de 7 días, mensuales (30 días y mes en curso) y personalizados.
- **Ropa y Clima (Hito 2):** motor dinámico de −5 °C a 50 °C con curva TOG continua, detección automática de clima exterior vía Open-Meteo (día/noche + fallback IP) y guías visuales de prendas.
- **Biblioteca ¿Es normal? y Primeros Auxilios (Hito 3):** buscador, 20 guías *"¿Es normal?"*, 37 guías de problemas/primeros auxilios, guía visual de popó y semáforo de cuatro niveles.
- **Salud MX (Hito 5):** registro de fiebre (°C) con alerta inmediata a 911 en menores de 3 meses (`>= 38.0 °C`), bitácora de medicamentos, Cartilla Nacional de Vacunación MX (14 dosis), gráficas de crecimiento OMS 2006 (kg/cm) y reporte pediátrico (copiar/compartir e imprimir/PDF en web).
- **Accesibilidad y privacidad (Hito 1):** Modo Día Calma y Modo nocturno con contraste WCAG 2.2 AA, acceso permanente al 911 sin pago, onboarding con registro o código familiar local, y borrado completo e idempotente de datos locales.
- Aplicación web con Next.js y aplicación Expo para Android, iOS y web.

## Funciones simuladas o pendientes

- **Hito 6 (pendiente):** Asistente conversacional restringido al corpus editorial aprobado, con filtros previos de urgencia y citas.
- **Hito 7 (pendiente):** Plan Pro (Guías avanzadas y Familia con sincronización multi-cuidador y respaldo en la nube), banner discreto en plan gratuito (fuera de urgencias 911/triaje y horario nocturno fijo 22:00–06:00 h), despliegue y lanzamiento.
- Supabase, Gemini y el despliegue siguen como adaptadores locales simulados en esta fase.

Consulta [docs/01-alcance-y-roadmap.md](docs/01-alcance-y-roadmap.md) para ver las fronteras entre hitos.

## Stack

| Capa | Tecnología |
|---|---|
| Monorepo | npm workspaces |
| Web | Next.js 16.4.6 + React 19.2.0 |
| Android / iOS / Web móvil | Expo SDK 55 + React Native 0.83 + Expo Router |
| Estilos | Tailwind CSS 3.4.17 + NativeWind 4.2 |
| Dominio compartido | TypeScript estricto en `packages/core` |
| Contenido | `packages/content` con metadatos editoriales |
| Persistencia Hito 1 | localStorage en web; AsyncStorage 2.2.0 en móvil |
| Pruebas | Vitest + suite E2E propia con `node:test` |

## Estructura

```text
apps/
├── web/          Next.js App Router
└── mobile/       Expo + Expo Router
packages/
├── core/         dominio, tema, privacidad y puertos
└── content/      contenido editorial y validaciones
e2e/              aceptación por tiers
docs/             alcance, arquitectura y operación
```

## Requisitos

- Node.js 24 o superior.
- npm 11 o superior.
- Git.

## Instalación

```bash
npm ci
```

## Desarrollo

```bash
npm run dev --workspace=@baby-buddy/web
npm run start --workspace=@baby-buddy/mobile
```

La aplicación móvil puede abrirse en Expo Go en un dispositivo Android o iPhone sin generar una compilación en la nube.

## Validación

```bash
npm run typecheck
npm run lint
npm run test
npm run build:web
npm run export:mobile
node e2e/run.mjs --tier=all
```

## Privacidad y alcance

- Sin anuncios, telemetría ni venta de datos.
- Sin cuenta remota en esta versión.
- El borrado elimina únicamente las claves propias de Baby Buddy MX.
- El 911 nunca se bloquea por registro, aceptación o pago.
- La ruta del workspace contiene un espacio; cita siempre las rutas en la terminal.

## Limitaciones conocidas del Hito 1

- La validación física en Android e iPhone sigue pendiente; el checklist está en [docs/06-validacion-dispositivos.md](docs/06-validacion-dispositivos.md).
- El contenido clínico no ha sido firmado por un profesional de pediatría.
- `npm audit --omit=dev` reporta avisos transitivos en la cadena de herramientas de Expo. Las correcciones disponibles exigen cambios mayores incompatibles, por lo que no se aplicó `npm audit fix --force`; el stack permanece fijado a las versiones aprobadas.
- El motor de ropa dinámico, el registro diario y los servicios remotos pertenecen a hitos posteriores.

## Documentación

- [Alcance y roadmap](docs/01-alcance-y-roadmap.md)
- [Arquitectura](docs/02-arquitectura.md)
- [Gobierno del contenido clínico](docs/03-gobierno-contenido-clinico.md)
- [Privacidad y seguridad](docs/04-privacidad-y-seguridad.md)
- [Pruebas y validación](docs/05-pruebas-y-validacion.md)
- [Validación en dispositivos](docs/06-validacion-dispositivos.md)
- [Guía de lanzamiento (Play Store / App Store / Web)](docs/07-lanzamiento-playstore.md)

