# 📋 Listas y Recordatorios

Aplicación web (funciona en PC y celular, sin servidor ni cuenta) para registrar listas de tareas
con fecha y hora, que **recuerda con 1 hora de anticipación** y **sigue recordando** hasta que la
tarea se marque como realizada o se reprograme con su motivo.

## Funcionamiento

| Momento | Qué hace la app |
|---|---|
| Registro | Guarda la tarea con fecha/hora en su lista. |
| 1 h antes | Primer aviso: notificación del sistema + sonido + ventana emergente. |
| Cada 10 min | Repite el aviso mientras la tarea no esté concluida. |
| Hora cumplida sin concluir | La registra automáticamente como **PENDIENTE** (queda en el historial) y sigue avisando. |
| ✔ Realizado | Deja de recordar y registra fecha/hora de conclusión. |
| 📅 Reprogramar | Exige nueva fecha, hora y **motivo detallado**; se vuelve a avisar 1 h antes de la nueva hora. |

La anticipación (60 min) y la frecuencia de repetición (10 min) se cambian en **⚙️ Configuración**.

## Uso

1. Abrir `index.html` en el navegador (Chrome, Edge o Firefox).
2. Pulsar **Activar notificaciones** y aceptar el permiso.
3. En **📂 Mis listas**: crear una lista → **+ Tarea** → descripción, fecha y hora.
4. Revisar la pestaña **⏰ Pendientes**: allí se concentra todo lo que requiere atención.

## 🎙️ Uso por voz

**Configuración (⚙️ → Voz):** escriba su nombre (ej.: *Luis*), la palabra de activación
(por defecto **«hola agenda»**) y marque *Leer los recordatorios en voz alta* y, si lo desea,
*Escucha continua*.

| Diga… | Resultado |
|---|---|
| «Hola agenda» | Responde «Dime, Luis» y espera la orden. |
| «Hola agenda, nueva lista Trámites» | Abre el dictado: diga cada tarea con su fecha y hora, una por una; al final, «terminar». |
| «Presentar informe mañana a las 10» (durante el dictado) | «Anotado en Trámites: Presentar informe, para el miércoles 25 de noviembre, 10:00». |
| «Hola agenda, recuérdame pagar el agua el 28 de noviembre a las 9» | Tarea suelta en la lista *General*. |
| «Hola agenda, ¿qué tengo pendiente?» | Lee las vencidas y las próximas. |
| «Hola agenda, ya hice el informe» | La marca como realizada. |
| «Hola agenda, reprogramar informe para el viernes a las 11 porque falta la firma del jefe» | Reprograma y guarda el motivo en el historial. |

**Aviso hablado:** junto con la notificación, la app dice, por ejemplo:
*«Luis, tienes una tarea por atender: Firmar oficio, que está pendiente desde el martes 24 de noviembre, 11:22 p. m. Cuando la concluyas, dime: ya hice, y el nombre de la tarea.»*
Lo repite cada 10 minutos hasta que se marque como realizada o se reprograme.

**Fechas que entiende:** hoy, mañana, pasado mañana, el lunes…domingo, el 28 de noviembre, en 2 horas,
en media hora, a las 10 y media, 9:30, de la mañana/tarde/noche, a. m./p. m., mediodía, esta tarde.
Si dice «a las 1» a «a las 7» sin indicar mañana o tarde, se asume la **tarde** (horario de oficina).

**Requisitos de la voz:** Google Chrome o Microsoft Edge, permiso de micrófono e internet (el
reconocimiento lo hace el servicio de voz del navegador). Debe abrirse desde una dirección `https://`
(p. ej. GitHub Pages) o `localhost`; abierta como archivo local, el navegador puede pedir el permiso
del micrófono cada vez.

## Importante: límite de los avisos

Un navegador solo puede avisar y escuchar **mientras la app esté abierta** (puede estar minimizada o en otra pestaña).
En el celular, la escucha continua se detiene al bloquear la pantalla; no reemplaza a «Hola Google», que es
exclusivo del sistema operativo.
Para tener el aviso aun con el celular bloqueado o el navegador cerrado:

- Use **📅 Exportar pendientes a calendario (.ics)** (o **➕ Calendario** en cada tarea) e impórtelo en
  Google Calendar / Outlook / calendario del teléfono: cada evento lleva alarma 1 hora antes y a la hora exacta.
- Opcional: publicar la carpeta con GitHub Pages (Settings → Pages) y en el celular usar
  “Agregar a pantalla de inicio” para instalarla como app.

## Datos

Se guardan en el propio navegador (localStorage). Use **💾 Exportar respaldo** periódicamente y
**📥 Importar respaldo** para trasladarlos a otro equipo.
