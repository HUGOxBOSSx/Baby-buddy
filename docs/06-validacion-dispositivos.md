# Validación en dispositivos

Estas pruebas requieren una persona con un dispositivo físico o un emulador. No deben marcarse como aprobadas únicamente por compilar.

## Preparación

```bash
npm run start --workspace=@baby-buddy/mobile
```

Abrir el código QR con Expo Go en Android o con la cámara en iPhone.

Para la versión web:

```bash
npm run build:web
npm run start --workspace=@baby-buddy/web
```

## Android

- [ ] La aplicación abre sin pantalla en blanco.
- [ ] El aviso inicial aparece antes de las pestañas.
- [ ] El botón del 911 está visible y abre el marcador.
- [ ] Aceptar el aviso permite entrar.
- [ ] Cambiar al Modo 3:00 AM conserva contraste y no muestra fondos blancos.
- [ ] Cambiar la etapa activa actualiza Hoy y Ropa y Clima.
- [ ] Cerrar por completo la aplicación y reabrir conserva tema, etapa y aceptación.
- [ ] Cargar el perfil demostrativo lo muestra en Hoy y Salud.
- [ ] Eliminar los datos locales reinicia el onboarding.
- [ ] Una segunda eliminación no produce error.
- [ ] No se muestran anuncios ni solicitudes de datos innecesarios.

## iPhone

- [ ] La aplicación abre sin pantalla en blanco.
- [ ] El aviso inicial aparece antes de las pestañas.
- [ ] El botón del 911 está visible y abre el marcador.
- [ ] Aceptar el aviso permite entrar.
- [ ] Cambiar al Modo 3:00 AM conserva contraste y no muestra fondos blancos.
- [ ] Cambiar la etapa activa actualiza Hoy y Ropa y Clima.
- [ ] Cerrar por completo la aplicación y reabrir conserva tema, etapa y aceptación.
- [ ] Cargar el perfil demostrativo lo muestra en Hoy y Salud.
- [ ] Eliminar los datos locales reinicia el onboarding.
- [ ] Una segunda eliminación no produce error.
- [ ] No se muestran anuncios ni solicitudes de datos innecesarios.

## Navegador

- [ ] Las cuatro rutas responden correctamente.
- [ ] El idioma del documento es `es-MX`.
- [ ] La navegación funciona con teclado.
- [ ] El enlace para saltar al contenido recibe foco.
- [ ] El diálogo de borrado se cancela con Escape sin perder datos.
- [ ] Confirmar el borrado elimina solo claves de Baby Buddy MX.
- [ ] La recarga conserva tema, etapa y aceptación.

## Registro de resultados

Anotar:

- Fecha.
- Dispositivo y versión del sistema.
- Versión de Expo Go.
- Resultado por comprobación.
- Captura o descripción de cualquier fallo.
- Commit exacto utilizado.
