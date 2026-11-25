# Privacidad y seguridad

## Datos que existen hoy

El Hito 1 guarda únicamente:

- Tema seleccionado.
- Etapa activa.
- Fecha de aceptación del aviso inicial.
- Perfil demostrativo local, si la persona lo carga.
- Nota demostrativa asociada al perfil de ejemplo.

No existen cuentas remotas, credenciales de usuario ni transmisión de datos a servidores.

## Dónde se guardan

- Web: almacenamiento local del navegador.
- Android, iOS y web móvil: AsyncStorage del dispositivo.

Las claves propias usan el prefijo `baby_buddy_mx:`.

## Borrado

La acción **Eliminar datos de este dispositivo**:

1. Enumera las claves almacenadas.
2. Filtra exclusivamente las que pertenecen a Baby Buddy MX.
3. Elimina cada clave propia.
4. Confirma cuántos registros fueron eliminados.
5. Repite la operación sin error si se solicita de nuevo.

No elimina datos de otras aplicaciones o sitios. Cuando exista una cuenta remota, se añadirá el borrado correspondiente en el servidor y se informará claramente en la interfaz.

## Emergencias

El acceso al 911 es independiente del registro, la aceptación, una suscripción o el estado de la conexión. Ninguna pantalla debe ocultar ni deshabilitar el acceso a emergencias.

## Principios

- Minimización de datos.
- Sin publicidad ni rastreadores de terceros.
- Sin vender ni ceder datos.
- Sin secretos ni claves privadas en el cliente.
- Sin perfiles públicos de menores.
- Sin telemetría en esta versión.

## Riesgos pendientes

- Definir consentimiento y tutela cuando se habiliten cuentas.
- Cifrado y retención antes de almacenar datos de salud.
- Borrado remoto y exportación antes de lanzar el respaldo en la nube.
- Revisión de textos legales por especialista antes de publicar.
