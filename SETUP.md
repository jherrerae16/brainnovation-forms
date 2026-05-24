# Brainnovation Forms · Setup Guide
> Sistema de formularios web → Google Sheets + Google Doc automático  
> Sin servidores · Sin costos mensuales · Sin Tally · Sin Typeform

---

## Archivos del proyecto

```
brainnovation-forms/
├── index.html              Formulario bariátrico (Brainnovation)
├── universal-medico.html   Formulario universal médico (Next AI Tech)
├── Code.gs                 Script de Google Apps Script (único para todos)
└── SETUP.md                Este archivo
```

---

## PASO 1 — Crear el Google Sheet (2 min)

1. Ve a **sheets.google.com** → "Hoja en blanco"
2. Nómbrala: `Brainnovation Forms · Respuestas`
3. Deja la hoja vacía — el script crea las pestañas y encabezados automáticamente

---

## PASO 2 — Instalar el Apps Script (5 min)

1. Con el Sheet abierto → **Extensiones → Apps Script**
2. Borra todo el código por defecto (`function myFunction…`)
3. Pega el contenido completo de **Code.gs**
4. Guarda: **Ctrl+S**
5. Click **"Implementar" → "Nueva implementación"**
6. Configura:
   - **Tipo:** Aplicación web
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier usuario ← CRÍTICO
7. Click **"Implementar"** → autoriza los permisos que pide Google
8. **Copia la URL** que aparece:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## PASO 3 — Configuración opcional en Code.gs (2 min)

Ajusta estas dos líneas al inicio del script antes de implementar:

```javascript
// Email donde llegan las notificaciones
const NOTIFY_EMAIL = Session.getActiveUser().getEmail();
// Cámbialo por: "tu@email.com"

// Carpeta de Drive donde se guardan los Docs
const DRIVE_FOLDER_ID = "";
// Deja "" para raíz de Drive, o pon el ID de una carpeta
// (Drive → carpeta → URL → string largo después de /folders/)
```

Si cambias algo después de implementar:
**Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**

---

## PASO 4 — Conectar los formularios al Script (1 min)

En **index.html** y **universal-medico.html**, busca esta línea:

```javascript
const SHEETS_URL = "TU_GOOGLE_SCRIPT_URL_AQUI";
```

Reemplaza con la URL del Paso 2. La misma URL va en los dos archivos.

---

## PASO 5 — Publicar en GitHub Pages (10 min)

### Primera vez
1. **github.com** → "New repository" → nombre: `brainnovation-forms` → Public
2. Sube los 4 archivos
3. **Settings → Pages → Branch: main → Save**
4. URLs resultantes:
   ```
   https://TU_USUARIO.github.io/brainnovation-forms/
   https://TU_USUARIO.github.io/brainnovation-forms/universal-medico.html
   ```

### Actualizar después
```bash
git add .
git commit -m "descripción del cambio"
git push
```

### Alternativa rápida: Netlify Drop
1. **netlify.com/drop** → arrastra la carpeta
2. URL inmediata, sin cuenta de GitHub

---

## PASO 6 — Probar (3 min)

1. Abre el formulario → llena con datos de prueba → envía
2. Verifica en **Google Sheets** → nueva pestaña con la respuesta
3. Verifica en **Google Drive** → nuevo Doc con preguntas y respuestas legibles
4. Verifica que llegó **email** de notificación con link al Doc

---

## Qué genera el sistema por cada respuesta

**Google Sheets** — fila nueva en la pestaña del formulario:
- `bariatrico-v1` → respuestas de index.html
- `universal-medico-v1` → respuestas de universal-medico.html
- Columna `doc_url` = link directo al Doc

**Google Doc** — entregable legible con este formato:
```
NEXT AI TECH · DIAGNÓSTICO ESTRATÉGICO
Dra. Ana Martínez · Clínica Salud Integral · 24/05/2026

RESUMEN
Frente prioritario: Visibilidad clínica y datos en tiempo real

BLOQUE 1 · LA PRÁCTICA Y SU CENTRO DE GRAVEDAD
¿Qué sostiene la práctica — y qué la sostiene demasiado?
• Consulta médica (el médico titular)
• Coordinación de pacientes, agendamiento y front desk

Si alguna de esas áreas se desordena — ¿qué efecto genera?
  "Si la coordinadora falta, todo el agendamiento se cae..."
```

**Email** — notificación inmediata con nombre, práctica, prioridad y link al Doc.

---

## Agregar un formulario nuevo

1. Duplica `universal-medico.html` → renómbralo (ej: `estetica.html`)
2. Cambia el `FORM_ID` en el JavaScript:
   ```javascript
   const FORM_ID = "estetica-v1";
   ```
3. Edita las preguntas en el HTML (no toques CSS ni JS)
4. Agrega el mapa en `Code.gs` dentro de `QUESTION_MAP`:
   ```javascript
   "estetica-v1": {
     nombre:   { block: "Datos", label: "Nombre" },
     practica: { block: "Datos", label: "Clínica" },
     email:    { block: "Datos", label: "Email" },
     b1_areas: { block: "Bloque 1 · Operación",
                 label: "¿Qué áreas sostienen la operación?" },
   }
   ```
5. Agrega el orden en `FIELD_ORDER`:
   ```javascript
   "estetica-v1": ["nombre","practica","email","b1_areas",...]
   ```
6. Re-implementa el script (Paso 3)
7. Sube el nuevo HTML al repo → GitHub lo publica automáticamente

---

## Preguntas frecuentes

**¿Es gratis?** Sí. Google Sheets + Apps Script + GitHub Pages = $0/mes.

**¿Cuántas respuestas aguanta?** Ilimitadas en la práctica (Sheets soporta 10M celdas).

**¿Las respuestas parciales se guardan?** No — solo al hacer click en "Enviar".

**¿El cliente necesita cuenta?** No — solo abre el link y llena.

**¿Cómo cambio colores para otro cliente?** Edita el bloque `:root { }` al inicio del CSS de cada HTML.

**¿Por qué el script pide tantos permisos?** Necesita Sheets, Docs, Drive y Gmail. Son permisos del dueño del script, no del cliente.

---

Next AI Tech LLC · nextaitech.com · 2026  
Brainnovation LLC · brainnovation.ai · 2026
