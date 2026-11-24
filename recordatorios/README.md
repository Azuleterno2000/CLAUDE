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

## Importante: límite de los avisos

Un navegador solo puede avisar **mientras la app esté abierta** (puede estar minimizada o en otra pestaña).
Para tener el aviso aun con el celular bloqueado o el navegador cerrado:

- Use **📅 Exportar pendientes a calendario (.ics)** (o **➕ Calendario** en cada tarea) e impórtelo en
  Google Calendar / Outlook / calendario del teléfono: cada evento lleva alarma 1 hora antes y a la hora exacta.
- Opcional: publicar la carpeta con GitHub Pages (Settings → Pages) y en el celular usar
  “Agregar a pantalla de inicio” para instalarla como app.

## Datos

Se guardan en el propio navegador (localStorage). Use **💾 Exportar respaldo** periódicamente y
**📥 Importar respaldo** para trasladarlos a otro equipo.
