// ============================================================
//  BRAINNOVATION FORMS · Google Apps Script v2
//  
//  Qué hace:
//  1. Recibe respuestas del formulario web
//  2. Las guarda en Google Sheets (una pestaña por formulario)
//  3. Genera un Google Doc legible con preguntas + respuestas
//  4. Te manda un email con el Doc adjunto
//
//  SETUP:
//  1. Abre Google Sheets → Extensiones → Apps Script
//  2. Pega este código completo (reemplaza todo lo anterior)
//  3. Implementar → Nueva implementación → Aplicación web
//     · Ejecutar como: Yo
//     · Quién tiene acceso: Cualquier usuario
//  4. Copia la URL y pégala en cada index.html como SHEETS_URL
// ============================================================

// ── Carpeta de Google Drive donde se guardan los Docs ──────
// Deja en "" para guardar en la raíz de Drive,
// o pon el ID de una carpeta específica:
// (Drive → carpeta → URL → el ID es el string largo en la URL)
const DRIVE_FOLDER_ID = "1Y0aUP5gr5wdOAqRXo-PGy7HjWWeJ-6PK";

// ── Email de notificación ───────────────────────────────────
// Por defecto usa el email del dueño del script.
// Puedes cambiar por: "jc@brainnovation.ai"
const NOTIFY_EMAIL = "jherrerae16@gmail.com";


// ============================================================
//  MAPA DE PREGUNTAS
//  Define el texto completo de cada campo para que el Doc
//  generado muestre la pregunta real, no el código interno.
//
//  Formato:
//  "form_id": {
//    "campo_interno": { label: "Pregunta visible", block: "Bloque X" }
//  }
//
//  Para agregar un formulario nuevo: añade su sección aquí.
// ============================================================
const QUESTION_MAP = {

  // ── FORMULARIO BARIÁTRICO ─────────────────────────────────
  "bariatrico-v1": {
    nombre:         { block: "Datos",    label: "Nombre" },
    practica:       { block: "Datos",    label: "Consultorio / Práctica clínica" },
    email:          { block: "Datos",    label: "Email de contacto" },
    b1_areas:       { block: "Bloque 1 · La Práctica y su Centro de Gravedad",
                      label: "¿Qué áreas o personas sostienen hoy la operación del consultorio?" },
    b1_refl:        { block: "Bloque 1",
                      label: "Si alguna de esas áreas se desordena — ¿qué efecto en cadena genera?" },
    b2_energia:     { block: "Bloque 2 · Energía Operativa vs. Valor Clínico",
                      label: "¿Qué actividades consumen hoy más energía operativa?" },
    b2_refl:        { block: "Bloque 2",
                      label: "De todo lo que marcaste — ¿cuál tiene más costo real hoy?" },
    b3_funnel:      { block: "Bloque 3 · Ruta del Paciente y Funnel Pre-quirúrgico",
                      label: "¿En qué puntos de la ruta del paciente se pierde el flujo?" },
    b3_refl:        { block: "Bloque 3",
                      label: "¿Cuántos pacientes se pierden entre la primera consulta y la cirugía?" },
    b4_fricciones:  { block: "Bloque 4 · Fricciones Normalizadas",
                      label: "¿Qué fricciones ya se volvieron 'normales' en tu consultorio?" },
    b4_refl:        { block: "Bloque 4",
                      label: "¿Cuál lleva más tiempo sin resolverse?" },
    b5_visibilidad: { block: "Bloque 5 · Visibilidad Clínica",
                      label: "¿Qué información NO tienes visible hoy en tiempo real?" },
    b6_postop:      { block: "Bloque 6 · Seguimiento Post-operatorio",
                      label: "¿Qué fricciones existen en el seguimiento después de la cirugía?" },
    b7_prioridad:   { block: "Bloque 7 · Priorización",
                      label: "Si pudieras priorizar UN frente para los próximos 6 meses — ¿cuál sería?" },
  },

  // ── FORMULARIO UNIVERSAL MÉDICO (Next AI Tech) ───────────
  "universal-medico-v1": {
    nombre:          { block: "Identificación", label: "Nombre del médico / titular" },
    especialidad:    { block: "Identificación", label: "Especialidad / subespecialidad" },
    practica:        { block: "Identificación", label: "Nombre del consultorio o clínica" },
    ciudad:          { block: "Identificación", label: "Ciudad y país" },
    experiencia:     { block: "Identificación", label: "Años de experiencia en la especialidad" },
    equipo:          { block: "Identificación", label: "Cantidad aproximada de personas en el equipo" },
    email:           { block: "Identificación", label: "Correo electrónico de contacto" },
    telefono:        { block: "Identificación", label: "Teléfono / WhatsApp de contacto" },
    b1_areas:        { block: "Bloque 1 · La Práctica y su Centro de Gravedad",
                       label: "¿Qué sostiene la práctica — y qué la sostiene demasiado?" },
    b1_refl:         { block: "Bloque 1",
                       label: "Si alguna de esas áreas se desordena — ¿qué efecto en cadena genera sobre el resto?" },
    b2_energia:      { block: "Bloque 2 · Energía Operativa vs. Valor Clínico",
                       label: "¿Qué consume más energía operativa — y qué valor real genera?" },
    b2_refl:         { block: "Bloque 2",
                       label: "De todo lo que marcaste — ¿cuál tiene más costo real hoy?" },
    b3_ruta:         { block: "Bloque 3 · Ruta del Paciente",
                       label: "¿En qué puntos de la ruta del paciente se pierde el flujo?" },
    b3_refl:         { block: "Bloque 3",
                       label: "Si una persona clave no estuviera dos semanas — ¿qué parte de la ruta sentiría más el impacto?" },
    b4_fricciones:   { block: "Bloque 4 · Fricciones Normalizadas",
                       label: "¿Qué fricciones ya se volvieron 'normales' — aunque no deberían?" },
    b4_refl:         { block: "Bloque 4",
                       label: "¿Cuál está frenando más la práctica — y cuánto tiempo lleva sin resolverse?" },
    b5_visibilidad:  { block: "Bloque 5 · Visibilidad Clínica y Decisiones",
                       label: "¿Qué no pueden ver — y qué decisiones pagan el costo de esa opacidad?" },
    b5_refl:         { block: "Bloque 5",
                       label: "Cuando esa visibilidad falta — ¿cómo termina afectando tus decisiones?" },
    b6_continuidad:  { block: "Bloque 6 · Continuidad y Seguimiento del Paciente",
                       label: "¿Cómo se sostiene el seguimiento del paciente — y dónde se rompe?" },
    b6_refl:         { block: "Bloque 6",
                       label: "Si pudieras saber en tiempo real cuáles pacientes están en riesgo — ¿qué cambiaría?" },
    b7_vision:       { block: "Bloque 7 · Visión, Crecimiento y Evolución",
                       label: "¿Qué necesita evolucionar — antes de que el crecimiento lo exija?" },
    b7_refl:         { block: "Bloque 7",
                       label: "Si esa evolución ocurriera en 12 meses — ¿cómo cambiaría tu día a día?" },
    prioridad:       { block: "Priorización",
                       label: "Si tuvieras que priorizar UN frente para los próximos 6 meses — ¿cuál sería?" },
  },

  // ── FORMULARIO GENÉRICO (fallback para formularios nuevos) ─
  // Si un formulario no tiene su sección aquí, usa este.
  "_default": {
    nombre:       { block: "Datos",    label: "Nombre" },
    practica:     { block: "Datos",    label: "Organización / Práctica" },
    email:        { block: "Datos",    label: "Email" },
  }
};

// ── Orden de visualización en el Doc ───────────────────────
// Define en qué orden aparecen los campos en el Doc generado.
// Si un campo no está aquí, igual aparece al final.
const FIELD_ORDER = {
  "bariatrico-v1": [
    "nombre","practica","email",
    "b1_areas","b1_refl",
    "b2_energia","b2_refl",
    "b3_funnel","b3_refl",
    "b4_fricciones","b4_refl",
    "b5_visibilidad",
    "b6_postop",
    "b7_prioridad"
  ],
  "universal-medico-v1": [
    "nombre","especialidad","practica","ciudad","experiencia","equipo","email","telefono",
    "b1_areas","b1_refl",
    "b2_energia","b2_refl",
    "b3_ruta","b3_refl",
    "b4_fricciones","b4_refl",
    "b5_visibilidad","b5_refl",
    "b6_continuidad","b6_refl",
    "b7_vision","b7_refl",
    "prioridad"
  ]
};


// ============================================================
//  CORE: recibe POST del formulario
// ============================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const docUrl = processSubmission(data);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, doc: docUrl }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    console.error("doPost error:", err);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput("✓ Brainnovation Forms v2 · Script activo.")
    .setMimeType(ContentService.MimeType.TEXT);
}


// ============================================================
//  PROCESAMIENTO PRINCIPAL
// ============================================================
function processSubmission(data) {
  saveToSheet(data);
  const docUrl = generateDoc(data);
  sendNotification(data, docUrl);
  return docUrl;
}


// ============================================================
//  1. GUARDAR EN GOOGLE SHEETS
// ============================================================
function saveToSheet(data) {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const formId = data.form_id || "general";
  const qmap   = QUESTION_MAP[formId] || QUESTION_MAP["_default"];

  let sheet = ss.getSheetByName(formId);

  if (!sheet) {
    sheet = ss.insertSheet(formId);

    // Encabezados: timestamp + todos los campos del mapa
    const headers = ["timestamp", "doc_url", ...Object.keys(qmap)];
    sheet.appendRow(headers);

    // Estilo del encabezado
    const hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setBackground("#1a7fe8");
    hRange.setFontColor("#ffffff");
    hRange.setFontWeight("bold");
    hRange.setFontSize(10);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 170);
    sheet.setColumnWidth(2, 240);
    for (let i = 3; i <= headers.length; i++) {
      sheet.setColumnWidth(i, 280);
    }
    sheet.setRowHeight(1, 32);
  }

  // Fila de datos
  const qmap_keys = Object.keys(qmap);
  const row = [
    data.timestamp || new Date().toISOString(),
    "", // doc_url se actualiza después de generar el Doc
    ...qmap_keys.map(k => data[k] || "")
  ];
  sheet.appendRow(row);

  // Guardar referencia a la fila para actualizar doc_url después
  return { sheet, lastRow: sheet.getLastRow() };
}


// ============================================================
//  2. GENERAR GOOGLE DOC
// ============================================================
function generateDoc(data) {
  const formId   = data.form_id || "general";
  const nombre   = data.nombre  || "Respuesta";
  const practica = data.practica || "";
  const fecha    = formatDate(data.timestamp || new Date().toISOString());
  const qmap     = QUESTION_MAP[formId] || QUESTION_MAP["_default"];
  const order    = FIELD_ORDER[formId]  || Object.keys(qmap);

  const docTitle = `Diagnóstico · ${nombre}${practica ? " · " + practica : ""} · ${fecha}`;

  // Crear el Doc y moverlo a la carpeta destino
  const doc = DocumentApp.create(docTitle);
  if (DRIVE_FOLDER_ID) {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    DriveApp.getFileById(doc.getId()).moveTo(folder);
  }

  const body = doc.getBody();
  body.clear();

  // ── Estilo base ────────────────────────────────────────────
  const styleNormal = {};
  styleNormal[DocumentApp.Attribute.FONT_FAMILY]  = "Arial";
  styleNormal[DocumentApp.Attribute.FONT_SIZE]    = 10;
  styleNormal[DocumentApp.Attribute.FOREGROUND_COLOR] = "#374151";

  // ── ENCABEZADO ─────────────────────────────────────────────
  const titlePara = body.appendParagraph("BRAINNOVATION · DIAGNÓSTICO ESTRATÉGICO");
  titlePara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  titlePara.editAsText()
    .setFontFamily("Arial")
    .setFontSize(13)
    .setBold(true)
    .setForegroundColor("#1a7fe8");
  titlePara.setSpacingAfter(4);

  const subtitlePara = body.appendParagraph(`${nombre}${practica ? "  ·  " + practica : ""}  ·  ${fecha}`);
  subtitlePara.editAsText()
    .setFontFamily("Arial")
    .setFontSize(10)
    .setBold(false)
    .setForegroundColor("#6b7280");
  subtitlePara.setSpacingAfter(2);

  // Línea separadora (tabla de 1 celda con fondo azul)
  const sepTable = body.appendTable([[""]]);
  sepTable.setBorderWidth(0);
  sepTable.getRow(0).getCell(0)
    .setBackgroundColor("#1a7fe8")
    .setPaddingTop(1).setPaddingBottom(1);
  body.appendParagraph("").setSpacingAfter(8);

  // ── RESUMEN EJECUTIVO (solo datos clave) ───────────────────
  const summaryPara = body.appendParagraph("RESUMEN");
  summaryPara.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  summaryPara.editAsText()
    .setFontFamily("Arial").setFontSize(9).setBold(true)
    .setForegroundColor("#1a7fe8");

  // Prioridad destacada
  if (data.b7_prioridad) {
    const prioPara = body.appendParagraph(`Frente prioritario: ${data.b7_prioridad}`);
    prioPara.editAsText()
      .setFontFamily("Arial").setFontSize(10).setBold(true)
      .setForegroundColor("#111827");
    prioPara.setSpacingAfter(4);
  }

  body.appendParagraph("").setSpacingAfter(4);

  // ── RESPUESTAS POR BLOQUE ──────────────────────────────────
  let currentBlock = "";

  // Filtrar campos de datos del encabezado para no repetirlos
  const skipInBody = ["nombre","practica","email","timestamp","form_id"];
  const fieldsToShow = order.filter(f => !skipInBody.includes(f));

  fieldsToShow.forEach(field => {
    const q   = qmap[field];
    if (!q) return;
    const val = (data[field] || "").trim();

    // ── Encabezado de bloque (cuando cambia) ──
    if (q.block !== currentBlock) {
      currentBlock = q.block;
      body.appendParagraph("").setSpacingAfter(2);

      const blockPara = body.appendParagraph(currentBlock.toUpperCase());
      blockPara.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      blockPara.editAsText()
        .setFontFamily("Arial").setFontSize(9).setBold(true)
        .setForegroundColor("#1a7fe8");
      blockPara.setSpacingAfter(6);

      // Línea bajo el bloque
      const blkSep = body.appendTable([[""]]);
      blkSep.setBorderWidth(0);
      blkSep.getRow(0).getCell(0)
        .setBackgroundColor("#e8f2fd")
        .setPaddingTop(1).setPaddingBottom(1);
      body.appendParagraph("").setSpacingAfter(2);
    }

    // ── Pregunta ──
    const questionPara = body.appendParagraph(q.label);
    questionPara.editAsText()
      .setFontFamily("Arial").setFontSize(9.5).setBold(true)
      .setForegroundColor("#374151");
    questionPara.setSpacingAfter(3);

    // ── Respuesta ──
    if (val) {
      // Si es selección múltiple (tiene " | "), renderiza como lista
      if (val.includes(" | ")) {
        val.split(" | ").forEach(item => {
          const itemPara = body.appendParagraph("• " + item.trim());
          itemPara.editAsText()
            .setFontFamily("Arial").setFontSize(10)
            .setForegroundColor("#111827");
          itemPara.setIndentStart(18);
          itemPara.setSpacingAfter(1);
        });
      } else {
        // Respuesta abierta — texto largo con fondo gris suave
        const ansPara = body.appendParagraph(val);
        ansPara.editAsText()
          .setFontFamily("Arial").setFontSize(10)
          .setForegroundColor("#111827")
          .setItalic(true);
        ansPara.setIndentStart(12);
        ansPara.setSpacingAfter(2);
      }
    } else {
      const emptyPara = body.appendParagraph("(Sin respuesta)");
      emptyPara.editAsText()
        .setFontFamily("Arial").setFontSize(10)
        .setForegroundColor("#9ca3af").setItalic(true);
      emptyPara.setSpacingAfter(2);
    }

    body.appendParagraph("").setSpacingAfter(4);
  });

  // ── PIE DE PÁGINA ──────────────────────────────────────────
  body.appendParagraph("").setSpacingAfter(8);
  const footSep = body.appendTable([[""]]);
  footSep.setBorderWidth(0);
  footSep.getRow(0).getCell(0)
    .setBackgroundColor("#1a7fe8")
    .setPaddingTop(1).setPaddingBottom(1);

  const footPara = body.appendParagraph(
    `Brainnovation LLC · brainnovation.ai · Documento confidencial · ${fecha}`
  );
  footPara.editAsText()
    .setFontFamily("Arial").setFontSize(8)
    .setForegroundColor("#9ca3af");
  footPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  doc.saveAndClose();

  // Actualizar doc_url en el Sheet
  updateDocUrl(formId, doc.getUrl());

  return doc.getUrl();
}


// ============================================================
//  3. ACTUALIZAR DOC_URL EN SHEETS
// ============================================================
function updateDocUrl(formId, docUrl) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(formId);
    if (!sheet) return;
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 2).setValue(docUrl); // columna 2 = doc_url
  } catch(e) {
    console.log("updateDocUrl error:", e);
  }
}


// ============================================================
//  4. NOTIFICACIÓN POR EMAIL
// ============================================================
function sendNotification(data, docUrl) {
  const nombre   = data.nombre   || "Anónimo";
  const practica = data.practica || "";
  const formId   = data.form_id  || "";
  const prioridad = data.b7_prioridad || "—";

  const subject = `🧠 Nuevo diagnóstico: ${nombre}${practica ? " · " + practica : ""}`;

  const body = `
Nuevo assessment completado en Brainnovation Forms.

Nombre:       ${nombre}
Práctica:     ${practica}
Email:        ${data.email || "—"}
Formulario:   ${formId}
Prioridad:    ${prioridad}
Fecha:        ${formatDate(data.timestamp)}

📄 Ver diagnóstico completo (Google Doc):
${docUrl}

📊 Ver todas las respuestas (Google Sheets):
https://docs.google.com/spreadsheets/d/${SpreadsheetApp.getActiveSpreadsheet().getId()}
  `.trim();

  try {
    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
    console.log("✓ Email enviado a:", NOTIFY_EMAIL);
  } catch(e) {
    console.error("✗ Email error:", e, "— destino:", NOTIFY_EMAIL,
                  "— cuota restante:", MailApp.getRemainingDailyQuota());
  }
}


// ============================================================
//  TESTING · Ejecuta estas funciones desde el editor de
//  Apps Script (selecciona la función arriba y dale ▶️ Ejecutar)
//  para verificar que todo funciona SIN tener que llenar el form.
//
//  La PRIMERA vez te va a pedir autorizar permisos de Drive,
//  Documents, Sheets y Gmail — acepta todos.
// ============================================================

// ── Test 1: pipeline completo (Sheet + Doc + Email) ─────────
function testFullPipeline() {
  const dummy = {
    timestamp: new Date().toISOString(),
    form_id: "universal-medico-v1",
    nombre: "TEST · Dr. Prueba",
    especialidad: "Cardiología",
    practica: "Clínica de Prueba",
    ciudad: "Ciudad de México, México",
    experiencia: "10 años",
    equipo: "5 personas",
    email: "test@brainnovation.ai",
    telefono: "+52 555 000 0000",
    b1_areas: "Recepción | Agenda médica | Facturación",
    b1_refl: "Si la agenda se cae, todo el flujo de pacientes se detiene.",
    b2_energia: "Llamadas de seguimiento | Coordinación con laboratorio",
    b2_refl: "El seguimiento manual es lo más costoso.",
    b3_ruta: "Entre primera consulta y estudios complementarios.",
    b3_refl: "La recepcionista — sin ella se rompe la agenda.",
    b4_fricciones: "Re-agendamientos | Pacientes que no contestan",
    b4_refl: "Los re-agendamientos llevan 8 meses sin resolverse.",
    b5_visibilidad: "Tasa real de no-show | Tiempo de espera por paciente",
    b5_refl: "Sin esa data, decido por intuición.",
    b6_continuidad: "Por WhatsApp manual de la asistente.",
    b6_refl: "Podría priorizar a los pacientes en riesgo real.",
    b7_vision: "Sistema de recordatorios automatizados.",
    b7_refl: "Liberaría 2 horas diarias del equipo.",
    prioridad: "Automatizar el seguimiento post-consulta"
  };

  console.log("▶ Iniciando test pipeline completo...");
  console.log("  Email destino:", NOTIFY_EMAIL);
  console.log("  Folder ID:", DRIVE_FOLDER_ID);

  try {
    const docUrl = processSubmission(dummy);
    console.log("✓ Pipeline OK");
    console.log("  Doc generado:", docUrl);
    return docUrl;
  } catch(e) {
    console.error("✗ Pipeline falló:", e);
    console.error("  Stack:", e.stack);
    throw e;
  }
}

// ── Test 2: solo el Doc (aísla si el problema es Drive) ─────
function testDocOnly() {
  console.log("▶ Probando solo generación de Doc...");
  console.log("  Folder ID:", DRIVE_FOLDER_ID);

  // Verifica que la carpeta exista y sea accesible
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    console.log("✓ Carpeta accesible:", folder.getName());
  } catch(e) {
    console.error("✗ No se puede acceder a la carpeta:", e);
    console.error("  Verifica que el ID sea correcto y que tu cuenta tenga acceso.");
    throw e;
  }

  const dummy = {
    timestamp: new Date().toISOString(),
    form_id: "universal-medico-v1",
    nombre: "TEST · Solo Doc",
    practica: "Test",
    prioridad: "Test de generación de documento"
  };
  const url = generateDoc(dummy);
  console.log("✓ Doc creado:", url);
  return url;
}

// ── Test 3: solo el email ───────────────────────────────────
function testEmailOnly() {
  console.log("▶ Probando solo envío de email...");
  console.log("  Destino:", NOTIFY_EMAIL);
  console.log("  Cuota restante hoy:", MailApp.getRemainingDailyQuota());

  sendNotification({
    nombre: "TEST",
    practica: "Email Test",
    email: "test@test.com",
    form_id: "test",
    b7_prioridad: "Verificar email",
    timestamp: new Date().toISOString()
  }, "https://docs.google.com/document/d/test");

  console.log("✓ Email enviado (revisa la bandeja de", NOTIFY_EMAIL, ")");
}


// ============================================================
//  UTILIDADES
// ============================================================
function formatDate(isoString) {
  try {
    const d = new Date(isoString);
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
  } catch(e) {
    return isoString || "—";
  }
}


// ============================================================
//  AGREGAR FORMULARIO NUEVO
//  
//  Cuando tengas un nuevo formulario (ej: fertilidad-v1),
//  solo agrega su sección en QUESTION_MAP arriba:
//
//  "fertilidad-v1": {
//    nombre:   { block: "Datos", label: "Nombre" },
//    practica: { block: "Datos", label: "Clínica" },
//    email:    { block: "Datos", label: "Email" },
//    b1_areas: { block: "Bloque 1 · Operación de la Clínica",
//                label: "¿Qué áreas sostienen la operación diaria?" },
//    ...
//  }
//
//  Y agrega el orden en FIELD_ORDER:
//
//  "fertilidad-v1": ["nombre","practica","email","b1_areas",...]
//
//  El resto es automático.
// ============================================================
