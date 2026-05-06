# ObraLicit 🏗️
### Red social de contratación transparente para obra civil

---

## ¿Qué es esto?
Una plataforma pública donde constructoras publican licitaciones con mediciones y precios de salida, y las subcontratas pujan en tiempo real. Todo público y transparente.

---

## DESPLIEGUE PASO A PASO

### PASO 1 — Crear cuenta en Supabase (base de datos)

1. Ve a **https://supabase.com** y haz clic en **"Start for free"**
2. Regístrate con tu email o con GitHub
3. Haz clic en **"New project"**
4. Ponle nombre: `obralicit`
5. Elige región: **West EU (Ireland)**
6. Guarda la contraseña que aparece
7. Espera 2 minutos a que el proyecto arranque

### PASO 2 — Crear las tablas en Supabase

1. En tu proyecto de Supabase, haz clic en **"SQL Editor"** (panel izquierdo)
2. Haz clic en **"New query"**
3. Copia todo el contenido del archivo `supabase-schema.sql` de este proyecto
4. Pégalo en el editor
5. Haz clic en **"Run"** (botón verde)
6. Deberías ver "Success. No rows returned"

### PASO 3 — Copiar tus claves de Supabase

1. En Supabase, ve a **Settings** (icono engranaje, panel izquierdo)
2. Haz clic en **"API"**
3. Copia estos dos valores:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** → clave larga que empieza por `eyJ...`

### PASO 4 — Subir el código a GitHub

1. Ve a **https://github.com** y crea una cuenta si no tienes
2. Haz clic en **"New repository"**
3. Nombre: `obralicit`
4. Visibility: **Public**
5. Haz clic en **"Create repository"**

Luego sube los archivos. La forma más fácil:

**Opción A — Con GitHub Desktop (recomendado si no sabes git):**
1. Descarga GitHub Desktop desde https://desktop.github.com
2. File → Clone Repository → elige `obralicit`
3. Copia todos los archivos de este proyecto a esa carpeta
4. En GitHub Desktop → escribe "Primer commit" → Publish branch

**Opción B — Con la terminal:**
```bash
cd /ruta/a/tu/proyecto
git init
git add .
git commit -m "Primer commit ObraLicit"
git remote add origin https://github.com/TU_USUARIO/obralicit.git
git push -u origin main
```

### PASO 5 — Desplegar en Vercel

1. Ve a **https://vercel.com** y haz clic en **"Sign up"**
2. Elige **"Continue with GitHub"** — autoriza el acceso
3. Haz clic en **"Add New Project"**
4. Busca y selecciona tu repositorio `obralicit`
5. Antes de hacer Deploy, abre **"Environment Variables"** y añade:

   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | `https://TU_ID.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...tu clave anon...` |

6. Haz clic en **"Deploy"**
7. Espera 2-3 minutos
8. ¡Ya tienes tu URL! Algo como `obralicit.vercel.app`

### PASO 6 (OPCIONAL) — Dominio propio

Si quieres `obralicit.es` en vez de `obralicit.vercel.app`:

1. Ve a **https://porkbun.com** (el más barato) o https://namecheap.com
2. Busca `obralicit.es` o `obralicit.com` (~10€/año)
3. Cómpralo
4. En Vercel → tu proyecto → **"Domains"** → **"Add"**
5. Escribe tu dominio: `obralicit.es`
6. Vercel te mostrará unos registros DNS
7. Cópialos en Porkbun/Namecheap → DNS Management
8. En 10-30 minutos funcionará con HTTPS automático

---

## Desarrollo local (para modificar el código)

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env
cp .env.example .env
# Abre .env y rellena con tus claves de Supabase

# 3. Arrancar el servidor de desarrollo
npm run dev
# Abre http://localhost:5173
```

---

## Estructura del proyecto

```
obralicit/
├── index.html              # Entrada HTML
├── vite.config.js          # Config de Vite (bundler)
├── package.json            # Dependencias
├── .env.example            # Template de variables de entorno
├── .gitignore              # Archivos ignorados por git
├── supabase-schema.sql     # SQL para crear las tablas
└── src/
    ├── main.jsx            # Punto de entrada React
    ├── index.css           # Estilos globales y variables CSS
    ├── supabase.js         # Cliente Supabase + funciones de datos
    └── App.jsx             # Aplicación completa
```

---

## Coste

| Servicio | Plan gratuito incluye |
|----------|----------------------|
| Supabase | 500MB DB, 2GB transferencia, realtime, hasta 50.000 usuarios |
| Vercel   | Hosting ilimitado, HTTPS, CDN global |
| Dominio  | ~10€/año (único coste) |

**Total: 0€/mes** hasta crecer bastante

---

## Funcionalidades

- ✅ Feed público de licitaciones con filtros por especialidad, zona y tipo
- ✅ Precios, ofertas y feedbacks 100% públicos y transparentes
- ✅ Sistema de pujas con observaciones, plazo y teléfono de contacto
- ✅ Ranking automático de pujas por precio con % de ahorro vs salida
- ✅ Actualizaciones en tiempo real (Supabase Realtime)
- ✅ Enlace compartible por licitación
- ✅ Sistema de etiquetas para búsqueda fácil
- ✅ Valoraciones y feedback público de constructoras sobre subcontratas
- ✅ Panel de detalle con KPIs, presupuesto de referencia y mejor oferta

---

Hecho con React + Vite + Supabase
