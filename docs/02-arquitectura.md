# Arquitectura

## Monorepo

```text
apps/web      Next.js App Router
apps/mobile   Expo Router para Android, iOS y web
packages/core dominio puro, tema, privacidad y puertos
packages/content contenido y validaciones editoriales
e2e           aceptación de funcionalidades, límites, combinaciones y escenarios
```

Dependencias permitidas:

- `apps/*` consume `core` y `content`.
- `content` consume `core`.
- `core` no importa React, Next.js ni Expo.

## Estado actual

La interfaz web utiliza un store externo mínimo con `useSyncExternalStore`. La interfaz móvil utiliza React Context y `useMemo`. No se añaden bibliotecas de estado.

Las preferencias y el perfil demostrativo se guardan mediante `KeyValueStoragePort`:

- Web: `localStorage`.
- Android, iOS y web móvil: `@react-native-async-storage/async-storage` 2.2.0.

Toda escritura conserva el prefijo `baby_buddy_mx:`. El borrado recorre únicamente ese namespace y es idempotente.

## Servicios

`OfflineSupabasePortStub`, `OfflineGeminiAssistantStub` y `OfflineDeploymentInfoStub` documentan los puntos de integración futuros. No realizan solicitudes de red ni contienen credenciales.

## Temas y accesibilidad

`packages/core/src/theme` contiene las paletas canónicas y el cálculo de contraste. Los componentes web usan variables CSS; los móviles usan NativeWind y valores de paleta.

Requisitos:

- Texto normal con contraste mínimo 4.5:1.
- Controles y foco con contraste mínimo 3:1.
- Modo 3:00 AM sin fondos blancos y con textos de al menos 6.1:1.
- Área táctil mínima de 48 píxeles.
- El semáforo combina icono, texto y color.

## Persistencia futura

Los registros estructurados del Hito 4 requerirán almacenamiento local consultable, cola de sincronización e identificadores de cliente idempotentes. La base remota y las políticas de acceso se diseñarán junto con las cuentas, no antes.

## Decisiones que no deben romperse

- Una única fuente de reglas clínicas y de dominio en `packages/core`.
- Contenido versionado y separado de la interfaz.
- Los adaptadores de servicios no exponen claves en el cliente.
- Las pruebas no se debilitan para ocultar regresiones.
