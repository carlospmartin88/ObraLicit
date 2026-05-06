-- ═══════════════════════════════════════════════════════════════
--  OBRALICIT — SQL COMPLETO CORREGIDO
--  Pega TODO esto en Supabase → SQL Editor → New Query → Run
--  Si ya tienes las tablas, este script las actualiza sin borrar datos
-- ═══════════════════════════════════════════════════════════════

-- ─── PASO 1: TABLA DE EMPRESAS/USUARIOS ─────────────────────────
-- Esta tabla guarda el perfil de cada empresa registrada
create table if not exists public.companies (
  id          uuid references auth.users(id) on delete cascade not null primary key,
  name        text not null,
  role        text default 'subcontrata',
  telefono    text,
  created_at  timestamptz default now()
);

-- ─── PASO 2: TABLA DE PROYECTOS / LICITACIONES ──────────────────
create table if not exists public.projects (
  id           text primary key,
  slug         text unique not null,
  nombre       text not null,
  empresa      text,
  e_init       text,
  e_color      text,
  descripcion  text,
  ubicacion    text,
  fecha_cierre date,
  created_at   timestamptz default now(),
  tags         text[],
  estado       text default 'abierta',
  partidas     jsonb default '[]',
  views        integer default 0,
  user_id      uuid references auth.users(id) on delete set null
);

-- ─── PASO 3: TABLA DE PUJAS / OFERTAS ───────────────────────────
create table if not exists public.bids (
  id            text primary key,
  proyecto_id   text references public.projects(id) on delete cascade,
  partida_id    text,
  user_id       uuid references auth.users(id) on delete cascade,
  empresa       text,
  contacto      text,
  telefono      text,
  precio        numeric(12,2),
  plazo         integer,
  observaciones text,
  estado        text default 'pendiente',
  fecha         date default current_date,
  feedback      text,
  rating        integer check (rating between 1 and 5),
  feedback_tags text[]
);

-- ─── PASO 4: ÍNDICES ────────────────────────────────────────────
create index if not exists idx_projects_estado  on public.projects(estado);
create index if not exists idx_projects_created on public.projects(created_at desc);
create index if not exists idx_bids_proyecto    on public.bids(proyecto_id);
create index if not exists idx_bids_partida     on public.bids(partida_id);
create index if not exists idx_bids_user        on public.bids(user_id);

-- ─── PASO 5: FUNCIÓN PARA INCREMENTAR VISTAS ────────────────────
create or replace function increment_views(project_id text)
returns void language sql as $$
  update public.projects set views = views + 1 where id = project_id;
$$;

-- ─── PASO 6: SEGURIDAD (RLS) ────────────────────────────────────
alter table public.companies enable row level security;
alter table public.projects  enable row level security;
alter table public.bids      enable row level security;

-- Borrar políticas existentes para evitar conflictos
drop policy if exists "Perfiles visibles para todos"           on public.companies;
drop policy if exists "Usuarios crean su perfil"               on public.companies;
drop policy if exists "Usuarios editan su perfil"              on public.companies;
drop policy if exists "Lectura pública de proyectos"           on public.projects;
drop policy if exists "Inserción pública de proyectos"         on public.projects;
drop policy if exists "Actualización pública de proyectos"     on public.projects;
drop policy if exists "Lectura pública de pujas"               on public.bids;
drop policy if exists "Solo usuarios autenticados insertan pujas" on public.bids;

-- Políticas para companies
create policy "Perfiles visibles para todos"
  on public.companies for select using (true);

create policy "Usuarios crean su perfil"
  on public.companies for insert with check (auth.uid() = id);

create policy "Usuarios editan su perfil"
  on public.companies for update using (auth.uid() = id);

-- Políticas para projects (lectura pública, escritura autenticada)
create policy "Lectura pública de proyectos"
  on public.projects for select using (true);

create policy "Usuarios autenticados crean proyectos"
  on public.projects for insert with check (auth.uid() is not null);

create policy "Actualización pública de proyectos"
  on public.projects for update using (true);

-- Políticas para bids (lectura pública, escritura solo autenticados)
create policy "Lectura pública de pujas"
  on public.bids for select using (true);

create policy "Solo usuarios autenticados insertan pujas"
  on public.bids for insert with check (auth.uid() = user_id);

-- ─── PASO 7: DATOS DE EJEMPLO ───────────────────────────────────
insert into public.projects (id, slug, nombre, empresa, e_init, e_color, descripcion, ubicacion, fecha_cierre, tags, partidas, views)
values
(
  'P001', 'viaducto-m50-micropilotes',
  'Viaducto M-50 Enlace Sur — Micropilotes y pantallas',
  'FCC Construcción', 'FC', '#1a4d7a',
  'Micropilotes de sustentación Ø168mm y muros pantalla en estribo sur. Acceso complicado, maquinaria compacta requerida.',
  'Madrid', '2026-06-10',
  ARRAY['Micropilotes','Pantallas','Madrid','Infraestructura','Obra pública'],
  '[
    {"id":"U01","codigo":"CIM-001","descripcion":"Micropilote Ø168mm L=12m c/camisa perdida","unidad":"ud","medicion":48,"precioSalida":850},
    {"id":"U02","codigo":"CIM-002","descripcion":"Muro pantalla e=60cm H=8m","unidad":"m2","medicion":320,"precioSalida":210},
    {"id":"U03","codigo":"INY-001","descripcion":"Inyeccion compactacion terreno granular","unidad":"m","medicion":560,"precioSalida":38}
  ]'::jsonb, 312
),
(
  'P002', 'tablas-r3-pilotaje',
  'Edificio Las Tablas R3 — Pilotaje CPI-8 y encepados',
  'Acciona Construcción', 'AC', '#0a7c6e',
  'Pilotes CPI-8 Ø600mm para edificio de 14 plantas + sotano doble. Solar libre, buen acceso.',
  'Madrid', '2026-06-15',
  ARRAY['Pilotes CPI','Madrid','Residencial','Obra privada'],
  '[
    {"id":"U04","codigo":"PIL-001","descripcion":"Pilote CPI-8 Ø600mm L=18m con armadura","unidad":"ud","medicion":72,"precioSalida":1200},
    {"id":"U05","codigo":"PIL-002","descripcion":"Encepados HA-30/B/20/IIa","unidad":"m3","medicion":85,"precioSalida":320}
  ]'::jsonb, 201
),
(
  'P003', 'metro-l11-autoperforantes',
  'Metro L11 Conde de Casal — Micropilotes autoperforantes URGENTE',
  'OHL Construccion', 'OH', '#5a3fa0',
  'Micropilotes autoperforantes N80 Ø185mm zona urbana. Trabajo nocturno. Maquinaria compacta MC800/C6.',
  'Madrid', '2026-05-30',
  ARRAY['Micropilotes','Madrid','Infraestructura','Obra pública','Urgente'],
  '[
    {"id":"U06","codigo":"MIC-001","descripcion":"Micropilote autoperforante N80 Ø185mm L=10m","unidad":"ud","medicion":36,"precioSalida":920},
    {"id":"U07","codigo":"MIC-002","descripcion":"Viga de atado HA-25 20x30cm","unidad":"m","medicion":120,"precioSalida":55}
  ]'::jsonb, 487
)
on conflict (id) do nothing;
