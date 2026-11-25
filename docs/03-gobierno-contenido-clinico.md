# Gobierno del contenido clínico

## Estado del corpus

El contenido incluido en el Hito 1 es un **borrador editorial**. Las fuentes están citadas, pero no existe todavía una revisión firmada por un profesional de pediatría. La interfaz muestra esta condición y no debe presentarse como material clínicamente validado.

## Campos obligatorios

Cada elemento editorial requiere:

- `version`: identificador del contenido.
- `sources`: al menos una fuente con título, organización y año.
- `reviewed_at`: fecha de corte editorial.
- `reviewed_by`: estado y responsable de revisión.

`assertValidClinicalMetadata` rechaza versiones vacías, listas de fuentes vacías, fechas imposibles y estados de revisión en blanco.

## Proceso antes de publicar contenido

1. Redactar con lenguaje cotidiano y sin juicios clínicos.
2. Identificar población, edad y límites de aplicación.
3. Citar fuentes primarias o guías reconocidas.
4. Validar que no existan instrucciones de prescripción ni dosis.
5. Revisar señales de alarma y acceso a emergencias.
6. Obtener revisión documentada de un profesional.
7. Registrar versión, fecha y responsable.
8. Programar revisión periódica y retirar contenido vencido.

## Semáforo futuro

La biblioteca del Hito 3 utilizará cuatro niveles: verde, amarillo, naranja y rojo. Las reglas críticas dependientes de la edad se evaluarán antes de cualquier recomendación general. El nivel rojo siempre ofrecerá el 911 sin barreras.

## Reglas de copy

- No afirmar que la aplicación diagnostica.
- No indicar medicamentos ni dosis.
- No desalentar la consulta profesional.
- No usar unidades no métricas.
- No emplear culpa, alarmismo ni comparaciones entre menores.
- Diferenciar con claridad entre orientación educativa y atención de urgencia.
