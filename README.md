# Baby Buddy MX — Tu compañero de 0 a 6 años

Orientación educativa de crianza y bienestar infantil para México, en español de México y con unidades métricas (°C, kg, cm, ml).

> **Estado actual: Hito 1 en validación.** La aplicación funciona de forma local y sin servicios externos. El contenido clínico es un borrador editorial y **no ha sido validado por un profesional de pediatría**. No sustituye la atención de tu pediatra ni los servicios de emergencia.

## Funciones disponibles en esta base

- Navegación de cuatro secciones: **Hoy**, **Guías**, **Ropa y Clima** y **Salud**.
- Modo Día Calma y Modo 3:00 AM con contraste WCAG 2.2 AA.
- Aviso educativo de tres niveles y acceso permanente al 911 sin pago.
- Preferencias, etapa activa y perfil demostrativo persistidos en el dispositivo.
- Eliminación completa de los datos locales de Baby Buddy MX.
- Catálogo editorial mínimo de guías y orientación de vestimenta por temperatura en °C.
- Aplicación web con Next.js y aplicación Expo para Android, iOS y web.

## Funciones simuladas o pendientes

- El motor dinámico de ropa y clima pertenece al Hito 2.
- Supabase, Gemini y el despliegue son adaptadores locales simulados.
- No existen todavía cuentas remotas, registros diarios, recordatorios, inmunizaciones, crecimiento ni asistente conversacional.
- La calculadora de capas y la biblioteca clínica completa no forman parte de este hito.

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

