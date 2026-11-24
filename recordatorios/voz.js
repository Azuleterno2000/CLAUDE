"use strict";
/* =====================================================================
   Módulo de voz de "Listas y Recordatorios"
   - Interpreta frases en español: "presentar informe mañana a las 10"
   - Palabra de activación (escucha continua) y botón de dictado
   - Lectura en voz alta de los recordatorios: "Luis, tienes una tarea pendiente…"
   Usa la Web Speech API (SpeechRecognition + speechSynthesis).
   ===================================================================== */

/* ---------- 1. Intérprete de fechas y horas en español ---------- */
const VOZ_NUM = { un:1, una:1, uno:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9,
  diez:10, once:11, doce:12, trece:13, catorce:14, quince:15, veinte:20, treinta:30, cuarenta:40, cuarenta_y_cinco:45 };
const VOZ_NUMRX = "\\d{1,2}|una|uno|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta|cuarenta";
const VOZ_MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const VOZ_DIAS = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
const vozNum = s => /^\d+$/.test(s) ? +s : (VOZ_NUM[s] ?? NaN);

/* Normaliza conservando la longitud (un carácter por carácter) para poder recortar el original */
function vozNorm(s){
  return Array.from(s).map(c => c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")[0] || " ").join("");
}

/**
 * Extrae fecha/hora de una frase y devuelve la tarea limpia.
 * @returns {{texto:string, vence:number|null}}
 */
function parsearTarea(frase, ahora = Date.now()){
  const orig = Array.from(String(frase).trim());
  let n = vozNorm(orig.join(""));
  const quitar = []; // rangos [ini, fin) a eliminar del texto original
  const tomar = (rx, fn) => {
    const m = rx.exec(n); if(!m) return false;
    quitar.push([m.index, m.index + m[0].length]);
    n = n.slice(0, m.index) + " ".repeat(m[0].length) + n.slice(m.index + m[0].length); // enmascarar
    fn(m); return true;
  };

  let rel = null, hora = null, min = 0, mer = null, diaOff = null, diaSem = null, fecha = null;

  // a) Relativo: "en 2 horas", "dentro de 30 minutos", "en media hora"
  tomar(new RegExp(`\\b(?:en|dentro de)\\s+(media hora|(${VOZ_NUMRX})\\s+(horas?|minutos?))\\b`), m => {
    if(m[1] === "media hora") rel = 30;
    else rel = vozNum(m[2]) * (m[3].startsWith("hora") ? 60 : 1);
  });

  // b) Hora: "a las 10", "a las 3 y media de la tarde", "a las 9:30 am", "a la una"
  const MER = "(de la manana|de la tarde|de la noche|de la madrugada|a\\.?\\s?m\\.?|p\\.?\\s?m\\.?|am|pm|hrs|horas)";
  tomar(new RegExp(`\\b(?:para |como |tipo )?(?:a las|a la|las)\\s+(${VOZ_NUMRX})(?:(?::|\\s+y\\s+)(\\d{2}|media|cuarto|quince|treinta|cuarenta|veinte|cinco|diez))?(?:\\s+${MER})?`), m => {
    hora = vozNum(m[1]);
    min = m[2] ? (m[2] === "media" ? 30 : m[2] === "cuarto" ? 15 : vozNum(m[2])) : 0;
    mer = m[3] || null;
  }) ||
  tomar(new RegExp(`\\b(\\d{1,2}):(\\d{2})(?:\\s*${MER})?`), m => { hora = +m[1]; min = +m[2]; mer = m[3] || null; }) ||
  tomar(/\b(?:al |a )?medio ?dia\b/, () => { hora = 12; mer = "x"; }) ||
  tomar(/\b(?:a )?media ?noche\b/, () => { hora = 23; min = 59; mer = "x"; });

  // c) Día: "pasado mañana", "mañana", "hoy", "esta tarde/noche"
  tomar(/\bpasado manana\b/, () => diaOff = 2) ||
  tomar(/\bmanana\b/, () => diaOff = 1) ||
  tomar(/\bhoy\b/, () => diaOff = 0) ||
  tomar(/\besta (tarde|noche)\b/, m => { diaOff = 0; if(hora === null){ hora = m[1] === "tarde" ? 16 : 20; mer = "x"; } else if(!mer) mer = "pm"; });

  // d) Fecha: "el 28 de noviembre (de 2026)", "el día 28"
  tomar(new RegExp(`\\b(?:el\\s+)?(?:dia\\s+)?(\\d{1,2}|primero)\\s+de\\s+(${VOZ_MESES.join("|")})(?:\\s+(?:de\\s+|del\\s+)?(\\d{4}))?\\b`), m => {
    fecha = { d: m[1] === "primero" ? 1 : +m[1], m: VOZ_MESES.indexOf(m[2]), y: m[3] ? +m[3] : null };
  }) ||
  tomar(/\bel dia (\d{1,2})\b/, m => fecha = { d: +m[1], m: null, y: null });

  // e) Día de la semana: "el lunes", "este viernes", "el próximo martes"
  tomar(new RegExp(`\\b(?:el\\s+|este\\s+|el proximo\\s+|proximo\\s+)?(${VOZ_DIAS.join("|")})\\b`), m => diaSem = VOZ_DIAS.indexOf(m[1]));

  // --- Construir la fecha resultante ---
  let vence = null;
  const base = new Date(ahora);
  if(rel !== null){
    vence = ahora + rel * 60000;
  } else if(hora !== null || diaOff !== null || fecha || diaSem !== null){
    if(hora !== null && mer !== "x"){
      if(mer && /tarde|noche|p/.test(mer) && hora < 12) hora += 12;
      else if(mer && /manana|madrugada|a/.test(mer) && hora === 12) hora = 0;
      else if(!mer && hora >= 1 && hora <= 7) hora += 12; // "a las 3" en horario laboral = 15:00
    }
    const h = hora ?? 9, mi = hora !== null ? min : 0;
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, mi);
    if(fecha){
      d.setDate(1);
      if(fecha.y) d.setFullYear(fecha.y);
      if(fecha.m !== null) d.setMonth(fecha.m);
      d.setDate(fecha.d);
      if(d.getTime() <= ahora){ if(fecha.m === null) d.setMonth(d.getMonth() + 1); else if(!fecha.y) d.setFullYear(d.getFullYear() + 1); }
    } else if(diaSem !== null){
      d.setDate(d.getDate() + (((diaSem - base.getDay()) + 7) % 7 || 7));
    } else if(diaOff !== null){
      d.setDate(d.getDate() + diaOff);
    } else if(d.getTime() <= ahora){
      d.setDate(d.getDate() + 1); // solo hora y ya pasó → mañana
    }
    vence = d.getTime();
  }

  // --- Limpiar el texto de la tarea ---
  quitar.sort((a, b) => b[0] - a[0]).forEach(([i, f]) => orig.splice(i, f - i, " "));
  const RELLENO = new Set(["para","el","la","los","las","de","del","a","al","y","en","que","este","esta","como","tipo",",",".","-","hasta"]);
  let pal = orig.join("").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  while(pal.length && RELLENO.has(vozNorm(pal[pal.length - 1]).replace(/[,.]/g, "") || ",")) pal.pop();
  while(pal.length && RELLENO.has(vozNorm(pal[0]))) pal.shift();
  let texto = pal.join(" ").replace(/\s+([,.])/g, "$1").replace(/[,.]+$/, "");
  texto = texto.charAt(0).toUpperCase() + texto.slice(1);
  return { texto, vence };
}

/* Coincidencia aproximada de una tarea por las palabras dichas */
function vozBuscarTarea(consulta, candidatos){
  const q = vozNorm(consulta).split(/\W+/).filter(w => w.length > 3);
  let mejor = null, pts = 0;
  candidatos.forEach(c => {
    const t = vozNorm(c.it.texto);
    const p = q.filter(w => t.includes(w)).length;
    if(p > pts){ pts = p; mejor = c; }
  });
  return mejor;
}

if(typeof module !== "undefined") module.exports = { parsearTarea, vozBuscarTarea, vozNorm };

/* ---------- 2. Integración con la app (solo en navegador) ---------- */
if(typeof window !== "undefined") (function(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const $ = id => document.getElementById(id);
  const cfg = () => (datos.cfg.voz ||= { nombre: "", activacion: "hola agenda", hablar: true, escucha: false });

  /* --- Hablar --- */
  let hablando = false;
  function voz(){
    const vs = speechSynthesis.getVoices();
    return vs.find(v => /es[-_](PE|419|MX|US|CO)/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang));
  }
  function decir(texto, luego){
    if(!("speechSynthesis" in window)){ luego && luego(); return; }
    mostrarEstado("🔊 " + texto);
    const u = new SpeechSynthesisUtterance(texto.replace(/\.\./g, "."));
    u.lang = "es-PE"; const v = voz(); if(v) u.voice = v; u.rate = 1;
    hablando = true; pausarEscucha();
    u.onend = u.onerror = () => { hablando = false; luego ? luego() : reanudarEscucha(); };
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  const trato = () => cfg().nombre ? cfg().nombre + ", " : "";
  const horaHablada = ts => new Date(ts).toLocaleString("es-PE", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });

  /* Lo llama revisar() cada vez que toca un recordatorio */
  window.avisarPorVoz = function(toca){
    if(!cfg().hablar || !toca.length) return;
    const partes = toca.map(({ it }) => {
      const mins = Math.round((it.vence - Date.now()) / 60000);
      return mins >= 0 ? `${it.texto}, en ${mins} minutos` : `${it.texto}, que está pendiente desde ${horaHablada(it.vence)}`;
    });
    const n = toca.length;
    decir(`${trato()}${n === 1 ? "tienes una tarea por atender" : `tienes ${n} tareas por atender`}: ${partes.join("; ")}. ` +
          `Cuando la concluyas, dime: ya hice, y el nombre de la tarea.`);
  };

  /* --- Escuchar --- */
  let rec = null, modo = "espera", listaDictado = null, timerModo = null, escuchando = false, pausado = false;

  function mostrarEstado(t){ const e = $("vozEstado"); if(e) e.textContent = t; }
  function pintarBoton(){
    const b = $("btnMic"); if(!b) return;
    b.classList.toggle("escuchando", escuchando && !pausado);
    b.textContent = modo === "dictado" ? "🎤 Dictando… (di «terminar»)" : escuchando ? "🎤 Escuchando…" : "🎤 Hablar";
  }

  function crearRec(){
    const r = new SR();
    r.lang = "es-PE"; r.interimResults = false; r.maxAlternatives = 1;
    r.continuous = cfg().escucha || modo === "dictado";
    r.onresult = e => {
      for(let i = e.resultIndex; i < e.results.length; i++) if(e.results[i].isFinal) procesar(e.results[i][0].transcript.trim());
    };
    r.onerror = e => {
      if(e.error === "not-allowed" || e.error === "service-not-allowed"){
        cfg().escucha = false; guardar(); $("cfgEscucha") && ($("cfgEscucha").checked = false);
        mostrarEstado("⚠️ Micrófono bloqueado. Permite el acceso al micrófono en el navegador.");
      } else if(e.error !== "no-speech" && e.error !== "aborted") mostrarEstado("⚠️ Error de reconocimiento: " + e.error);
    };
    r.onend = () => {
      escuchando = false;
      if(!pausado && !hablando && (cfg().escucha || modo !== "espera")) setTimeout(iniciar, 250);
      else pintarBoton();
    };
    return r;
  }
  function iniciar(){
    if(!SR || escuchando || hablando) return;
    try{ rec = crearRec(); rec.start(); escuchando = true; pausado = false; pintarBoton(); }catch(e){}
  }
  function pausarEscucha(){ pausado = true; if(rec && escuchando) try{ rec.abort(); }catch(e){} }
  function reanudarEscucha(){ pausado = false; if(cfg().escucha || modo !== "espera") iniciar(); else pintarBoton(); }
  function detener(){ modo = "espera"; listaDictado = null; pausado = true; if(rec) try{ rec.abort(); }catch(e){} escuchando = false; pintarBoton(); }

  function ponerModo(m){
    modo = m; clearTimeout(timerModo);
    if(m === "comando") timerModo = setTimeout(() => { if(modo === "comando"){ modo = "espera"; mostrarEstado("Esperando la palabra de activación…"); if(!cfg().escucha) detener(); } }, 12000);
    pintarBoton();
  }

  /* --- Interpretación de órdenes --- */
  function listaPorNombre(nombre, crear){
    const nn = vozNorm(nombre).trim();
    let l = datos.listas.find(x => vozNorm(x.nombre) === nn) || datos.listas.find(x => vozNorm(x.nombre).includes(nn) || nn.includes(vozNorm(x.nombre)));
    if(!l && crear){ l = { id: uid(), nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1), items: [] }; datos.listas.push(l); }
    return l;
  }
  function agregar(l, frase){
    const { texto, vence } = parsearTarea(frase);
    if(!texto) return decir("No entendí la tarea. Repítela, por favor.");
    const it = { id: uid(), texto, vence, hecho: false, creado: Date.now(), ultimoAviso: 0, reprogramaciones: 0, historial: [] };
    hist(it, "Tarea registrada por voz" + (vence ? ` para ${fmt(vence)}` : ""));
    l.items.push(it); guardar(); render();
    decir(`Anotado en ${l.nombre}: ${texto}${vence ? ", para el " + horaHablada(vence) : ", sin fecha"}.` + (modo === "dictado" ? " Siguiente." : ""),
          () => { revisar(); if(!hablando) reanudarEscucha(); }); // si ya toca recordarla, el aviso hablado va después
  }
  function leerPendientes(){
    const p = todas().filter(x => !x.it.hecho && x.it.vence).sort((a, b) => a.it.vence - b.it.vence);
    const venc = p.filter(x => x.it.vence <= Date.now()), prox = p.filter(x => x.it.vence > Date.now()).slice(0, 5);
    if(!p.length) return decir(`${trato()}no tienes tareas pendientes.`);
    let t = trato();
    t += venc.length ? `tienes ${venc.length} tarea${venc.length > 1 ? "s" : ""} pendiente${venc.length > 1 ? "s" : ""}: ${venc.map(x => x.it.texto).join("; ")}. `
                     : "no tienes tareas vencidas. ";
    if(prox.length) t += `Tus próximas tareas son: ${prox.map(x => `${x.it.texto}, el ${horaHablada(x.it.vence)}`).join("; ")}.`;
    decir(t);
  }

  function procesar(dicho){
    if(!dicho) return;
    let n = vozNorm(dicho).replace(/[.,¿?¡!]/g, " ").replace(/\s+/g, " ").trim();
    const act = vozNorm(cfg().activacion || "hola agenda").trim();
    mostrarEstado("🗣️ «" + dicho + "»");

    // Palabra de activación
    const pos = act ? n.indexOf(act) : -1;
    if(modo === "espera"){
      if(pos < 0) return; // se ignora todo lo que no empiece con la palabra de activación
      dicho = Array.from(dicho).slice(pos + act.length).join("").replace(/^[\s,.]+/, "");
      n = vozNorm(dicho).replace(/[.,¿?¡!]/g, " ").replace(/\s+/g, " ").trim();
      if(!n){ ponerModo("comando"); return decir(`Dime, ${cfg().nombre || "te escucho"}.`); }
    } else if(pos === 0){
      dicho = Array.from(dicho).slice(act.length).join("").trim(); n = vozNorm(dicho).trim();
      if(!n) return decir("Te escucho.");
    }
    const resto = re => { const m = re.exec(n); return m ? Array.from(dicho).slice(m.index + m[0].length).join("").replace(/^[\s,.:]+/, "").trim() : null; };
    let m, r;

    // Fin de dictado
    if(/^(terminar|termina|termine|listo|fin|eso es todo|ya esta|salir|cancelar)\b/.test(n)){
      const l = listaDictado; detener(); if(cfg().escucha) iniciar();
      const k = l ? l.items.filter(i => !i.hecho).length : 0;
      return decir(l ? `Listo. La lista ${l.nombre} tiene ${k} tarea${k === 1 ? "" : "s"} por hacer.` : "De acuerdo.");
    }
    // Nombres de las listas
    if(/^(que|cuales) listas|^mis listas|^listas$/.test(n)){
      if(modo !== "dictado") detener(); if(cfg().escucha) modo = "espera";
      return decir(datos.listas.length ? `Tus listas son: ${datos.listas.map(l => l.nombre).join(", ")}.` : "Aún no tienes listas.");
    }
    // Consultar pendientes
    if(/^(que|cuales)\b.*\b(pendientes?|tengo)\b|^(mis )?pendientes|^que hay/.test(n)){
      if(modo !== "dictado") detener(); if(cfg().escucha) modo = "espera";
      return leerPendientes();
    }
    // Crear lista y entrar en dictado
    if((r = resto(/^(crear|crea|nueva|abrir|abre|agregar a|agrega a|anadir a|anotar en|anota en|dictar|dictar en)( la)? lista( de| llamada)?\s*/)) !== null){
      if(!r) return decir("¿Cómo se llama la lista?");
      const partes = r.split(/\s*(?:,|:|\s)\s*(?:primero|primera tarea|tareas)\s*/);
      const l = listaPorNombre(partes[0], true); guardar(); render();
      listaDictado = l; ponerModo("dictado"); pausarEscucha();
      decir(`Lista ${l.nombre} lista para dictar. Dime cada tarea con su fecha y hora, una por una. Cuando acabes, di terminar.`, () => { pausado = false; iniciar(); });
      return;
    }
    // Marcar realizada
    if((r = resto(/^(ya )?(hice|realice|termine|complete|conclui|cumpli|marca(r)? como realizad[ao]|realizad[ao])\s*(la tarea\s*)?(de\s*)?/)) !== null){
      const c = vozBuscarTarea(r, todas().filter(x => !x.it.hecho));
      if(modo !== "dictado" && !cfg().escucha) detener();
      if(!c) return decir("No encontré esa tarea entre las pendientes. Repite el nombre, por favor.");
      c.it.hecho = true; c.it.hechoEn = Date.now(); hist(c.it, "Marcada como REALIZADA (por voz)");
      guardar(); render(); if($("dlgAlerta").open) $("dlgAlerta").close();
      return decir(`Muy bien${cfg().nombre ? " " + cfg().nombre : ""}. Marqué como realizada: ${c.it.texto}.`);
    }
    // Reprogramar: "reprogramar informe para el viernes a las 10 porque falta la firma"
    if((r = resto(/^(reprogramar|reprograma|posponer|pospon|mover|mueve)\s*(la tarea\s*)?(de\s*)?/)) !== null){
      if(modo !== "dictado" && !cfg().escucha) detener();
      const partes = r.split(/\s+(?:porque|por que|motivo|debido a(?: que)?|ya que)\s+/i);
      const cuerpo = partes[0], motivo = partes.slice(1).join(" ").trim();
      if(!motivo) return decir("Necesito el motivo. Por ejemplo: reprogramar informe para el viernes a las 10 porque falta la firma.");
      const { vence } = parsearTarea(cuerpo);
      const c = vozBuscarTarea(cuerpo, todas().filter(x => !x.it.hecho));
      if(!c) return decir("No encontré esa tarea entre las pendientes.");
      if(!vence) return decir("No entendí la nueva fecha. Dímela con día y hora.");
      hist(c.it, `Reprogramada (por voz) de ${fmt(c.it.vence)} a ${fmt(vence)} — Motivo: ${motivo}`);
      c.it.vence = vence; c.it.ultimoAviso = 0; c.it.marcadaPendiente = false; c.it.reprogramaciones = (c.it.reprogramaciones || 0) + 1;
      guardar(); render(); if($("dlgAlerta").open) $("dlgAlerta").close();
      return decir(`Reprogramé ${c.it.texto} para el ${horaHablada(vence)}. Te recordaré una hora antes.`);
    }
    // Tarea suelta: "recuérdame / anota pagar el agua mañana a las 10"
    if((r = resto(/^(recuerdame|recordarme|recordar|anota|anotar|agrega|agregar|anade|anadir|apunta)( que)?\s*/)) !== null || modo === "dictado"){
      const l = listaDictado || listaPorNombre("General", true);
      if(modo !== "dictado" && !cfg().escucha) detener();
      return agregar(l, r ?? dicho);
    }
    if(!cfg().escucha) detener();
    decir("No entendí. Puedes decir: nueva lista y su nombre; recuérdame, y la tarea con su hora; qué tengo pendiente; ya hice, y la tarea; o reprogramar, la tarea, la nueva fecha y el motivo.");
  }

  /* --- Interfaz --- */
  window.addEventListener("load", () => {
    const c = cfg();
    $("cfgNombre").value = c.nombre; $("cfgActivacion").value = c.activacion;
    $("cfgHablar").checked = c.hablar; $("cfgEscucha").checked = c.escucha;
    const la = $("lblActivacion"); if(la) la.textContent = c.activacion;
    if(!SR){
      $("btnMic").disabled = true; $("cfgEscucha").disabled = true;
      mostrarEstado("Este navegador no admite reconocimiento de voz. Use Google Chrome o Microsoft Edge.");
    } else if(c.escucha){
      mostrarEstado(`Escucha activa: di «${c.activacion}» para empezar.`); iniciar();
    }
    $("btnMic").onclick = () => {
      if(escuchando && !pausado){ detener(); speechSynthesis.cancel(); mostrarEstado("Micrófono detenido."); if(cfg().escucha) { cfg().escucha = false; $("cfgEscucha").checked = false; guardar(); } return; }
      ponerModo("comando"); decir("Te escucho.", () => { pausado = false; iniciar(); });
    };
    $("btnGuardarVoz").onclick = () => {
      c.nombre = $("cfgNombre").value.trim(); c.activacion = vozNorm($("cfgActivacion").value.trim() || "hola agenda").trim();
      c.hablar = $("cfgHablar").checked; c.escucha = $("cfgEscucha").checked && !!SR;
      const la = $("lblActivacion"); if(la) la.textContent = c.activacion; guardar();
      if(c.escucha){ modo = "espera"; pausado = false; iniciar(); mostrarEstado(`Escucha activa: di «${c.activacion}» para empezar.`); } else detener();
      decir(`Configuración guardada${c.nombre ? ", " + c.nombre : ""}.`);
    };
    $("btnProbarVoz").onclick = () => decir(`${trato()}la lista Trámites tiene una tarea pendiente: presentar el informe técnico.`);
    if("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => {};
  });
})();
