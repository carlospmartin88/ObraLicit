-- ═══════════════════════════════════════════════════════
--  OBRALICIT — Schema SQL
--  Ejecuta esto en: Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════

-- 1. TABLA DE PROYECTOS / LICITACIONES
create table if not exists projects (
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
  views        integer default 0
);

-- 2. TABLA DE PUJAS / OFERTAS
create table if not exists bids (
  id            text primary key,
  proyecto_id   text references projects(id) on delete cascade,
  partida_id    text,
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

-- 3. ÍNDICES para búsquedas rápidas
create index if not exists idx_projects_estado    on projects(estado);
create index if not exists idx_projects_created   on projects(created_at desc);
create index if not exists idx_bids_proyecto      on bids(proyecto_id);
create index if not exists idx_bids_partida       on bids(partida_id);

-- 4. FUNCIÓN para incrementar vistas (evita race conditions)
create or replace function increment_views(project_id text)
returns void language sql as $$
  update projects set views = views + 1 where id = project_id;
$$;

-- 5. ROW LEVEL SECURITY — todo público (red abierta)
alter table projects enable row level security;
alter table bids     enable row level security;

-- Cualquiera puede leer
create policy "Lectura pública de proyectos"
  on projects for select using (true);

create policy "Lectura pública de pujas"
  on bids for select using (true);

-- Cualquiera puede insertar (sin login)
create policy "Inserción pública de proyectos"
  on projects for insert with check (true);

create policy "Inserción pública de pujas"
  on bids for insert with check (true);

-- Actualización pública (vistas, etc.)
create policy "Actualización pública de proyectos"
  on projects for update using (true);

-- 6. DATOS DE EJEMPLO (seed)
insert into projects (id, slug, nombre, empresa, e_init, e_color, descripcion, ubicacion, fecha_cierre, tags, partidas, views)
values
(
  'P001', 'viaducto-m50-micropilotes',
  'Viaducto M-50 Enlace Sur — Micropilotes y pantallas',
  'FCC Construcción', 'FC', '#1a4d7a',
  'Micropilotes de sustentación Ø168mm y muros pantalla en estribo sur. Acceso complicado, maquinaria compacta requerida. Trabajo nocturno posible.',
  'Madrid', '2026-06-10',
  ARRAY['Micropilotes','Pantallas','Madrid','Infraestructura','Obra pública'],
  '[
    {"id":"U01","codigo":"CIM-001","descripcion":"Micropilote Ø168mm L=12m c/camisa perdida","unidad":"ud","medicion":48,"precioSalida":850},
    {"id":"U02","codigo":"CIM-002","descripcion":"Muro pantalla e=60cm H=8m","unidad":"m²","medicion":320,"precioSalida":210},
    {"id":"U03","codigo":"INY-001","descripcion":"Inyección compactación terreno granular","unidad":"m","medicion":560,"precioSalida":38}
  ]'::jsonb,
  312
),
(
  'P002', 'tablas-r3-pilotaje',
  'Edificio Las Tablas R3 — Pilotaje CPI-8 y encepados',
  'Acciona Construcción', 'AC', '#0a7c6e',
  'Pilotes CPI-8 Ø600mm para edificio de 14 plantas + sótano doble. Solar libre, buen acceso. Se valora experiencia en zona norte de Madrid.',
  'Madrid', '2026-05-28',
  ARRAY['Pilotes CPI','Madrid','Residencial','Obra privada'],
  '[
    {"id":"U04","codigo":"PIL-001","descripcion":"Pilote CPI-8 Ø600mm L=18m con armadura","unidad":"ud","medicion":72,"precioSalida":1200},
    {"id":"U05","codigo":"PIL-002","descripcion":"Encepados HA-30/B/20/IIa","unidad":"m³","medicion":85,"precioSalida":320}
  ]'::jsonb,
  201
),
(
  'P003', 'metro-l11-autoperforantes',
  'Metro L11 Conde de Casal — Micropilotes autoperforantes URGENTE',
  'OHL Construcción', 'OH', '#5a3fa0',
  'Micropilotes autoperforantes N80 Ø185mm zona urbana consolidada. Trabajo nocturno obligatorio. Maquinaria compacta MC800/C6.',
  'Madrid', '2026-05-22',
  ARRAY['Micropilotes','Madrid','Infraestructura','Obra pública','Urgente'],
  '[
    {"id":"U06","codigo":"MIC-001","descripcion":"Micropilote autoperforante N80 Ø185mm L=10m","unidad":"ud","medicion":36,"precioSalida":920},
    {"id":"U07","codigo":"MIC-002","descripcion":"Viga de atado HA-25 20x30cm","unidad":"m","medicion":120,"precioSalida":55}
  ]'::jsonb,
  487
)
on conflict (id) do nothing;

insert into bids (id, proyecto_id, partida_id, empresa, contacto, telefono, precio, plazo, observaciones, estado, fecha, feedback, rating, feedback_tags)
values
(
  'B01','P001','U01','SITE S.A.','Carlos Pérez','622 345 678',
  790, 12,
  'Equipo MC800 disponible inmediatamente. Incluye camisa perdida y cabeza micropilote. No incluye vigas de atado.',
  'pendiente','2026-05-02',
  'Precio muy competitivo. Empresa de máxima confianza, excelente comunicación.',
  5, ARRAY['Puntual','Precio justo','Gran ejecución']
),
(
  'B02','P001','U01','Geotecnia Sur SL','Manuel Ruiz','634 123 456',
  820, 15,
  'Precio sin andamios auxiliares. Podemos ajustar si hay más de 2 partidas adjudicadas.',
  'pendiente','2026-05-03', null, null, ARRAY[]::text[]
),
(
  'B03','P001','U02','Muros & Pantallas SL','Ana García','612 987 654',
  195, 30,
  'Incluye entibación provisional y lodos bentoníticos. Equipo disponible semana siguiente.',
  'pendiente','2026-05-03', null, null, ARRAY[]::text[]
),
(
  'B04','P002','U04','SITE S.A.','Carlos Pérez','622 345 678',
  1100, 20,
  'Armadura y hormigonado incluidos. Certificados EHE-08. Maquinaria CFA propia.',
  'adjudicada','2026-05-01',
  'Trabajo impecable. Cumplieron plazo y calidad al 100%. Los recomendaremos.',
  5, ARRAY['Puntual','Alta calidad','Muy profesionales']
),
(
  'B05','P002','U04','Pilotes Centro SL','Javier Marcos','657 890 123',
  1180, 25,
  'Incluye ensayo integridad 10% pilotes.',
  'perdida','2026-05-02',
  'Buena propuesta técnica pero precio superior.',
  3, ARRAY['Precio alto']
),
(
  'B06','P003','U06','SITE S.A.','Carlos Pérez','622 345 678',
  870, 8,
  'Trabajo nocturno asumido. Klemm 706 compacto. Toda maquinaria auxiliar para zona urbana incluida.',
  'pendiente','2026-04-30', null, null, ARRAY[]::text[]
)
on conflict (id) do nothing;
