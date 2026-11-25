# Pruebas y validación

## Comandos

Desde la raíz del repositorio:

```bash
npm run typecheck
npm run lint
npm run test
npm run build:web
npm run export:mobile
```

Aceptación completa:

```bash
node e2e/run.mjs --tier=1
node e2e/run.mjs --tier=2
node e2e/run.mjs --tier=3
node e2e/run.mjs --tier=4
node e2e/run.mjs --tier=all
```

## Niveles de la suite

| Tier | Propósito |
|---|---|
| 1 | Funcionalidades y garantías del Hito 1 |
| 2 | Límites, secretos, unidades, contraste y contención de alcance |
| 3 | Combinaciones entre dominio, web, móvil y persistencia |
| 4 | Escenarios completos y auditoría final |

## Qué se comprueba

- Estructura del monorepo y scripts.
- TypeScript, ESLint y pruebas unitarias.
- Colores y contraste WCAG.
- Avisos y acceso al 911.
- Ausencia de anuncios y rastreadores.
- Borrado local idempotente.
- Unidades métricas y vocabulario de México.
- Ausencia de secretos.
- Build web y exportación Expo.
- Servido correcto de las cuatro rutas web.

## Reglas para cambios futuros

- No modificar pruebas para ocultar una regresión.
- No reducir comprobaciones de seguridad o privacidad.
- Las pruebas de ausencia de un módulo futuro deberán versionarse cuando ese módulo se implemente.
- Cada hito debe añadir pruebas antes de relajar una frontera de alcance.
- Toda dependencia nueva requiere justificación y revisión del lockfile.

## Estado esperado de la suite

La suite se considera aprobada únicamente cuando los cuatro niveles terminan sin fallos ni pruebas omitidas en modo completo.
