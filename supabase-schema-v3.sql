-- ═══════════════════════════════════════════════════════════════
--  OBRALICIT — SQL v3 — Ejecuta en Supabase SQL Editor
--  Añade: CIF, verificación empresa, validez pujas, archivos, mensajería
-- ═══════════════════════════════════════════════════════════════

-- ─── ACTUALIZAR TABLA COMPANIES ─────────────────────────────────
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS cif         text,
  ADD COLUMN IF NOT EXISTS telefono    text,
  ADD COLUMN IF NOT EXISTS estado      text default 'activo',
  ADD COLUMN IF NOT EXISTS parent_id   uuid references public.companies(id) on delete set null,
  ADD COLUMN IF NOT EXISTS verified    boolean default false;

-- Índice único en CIF (una empresa principal por CIF)
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_cif_unique
  ON public.companies(cif) WHERE parent_id IS NULL;

-- ─── ACTUALIZAR TABLA BIDS ──────────────────────────────────────
ALTER TABLE public.bids
  ADD COLUMN IF NOT EXISTS validez_tipo text default 'indefinida',
  ADD COLUMN IF NOT EXISTS validez_fecha date,
  ADD COLUMN IF NOT EXISTS archivos    jsonb default '[]',
  ADD COLUMN IF NOT EXISTS expirada    boolean default false;

-- ─── ACTUALIZAR TABLA PROJECTS ──────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS archivos    jsonb default '[]',
  ADD COLUMN IF NOT EXISTS email_contacto text;

-- ─── TABLA DE SOLICITUDES DE FILIAL ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_requests (
  id            uuid default gen_random_uuid() primary key,
  cif           text not null,
  empresa_nueva uuid references public.companies(id) on delete cascade,
  empresa_madre uuid references public.companies(id) on delete cascade,
  tipo          text default 'filial',
  estado        text default 'pendiente',
  token         text unique default encode(gen_random_bytes(32), 'hex'),
  created_at    timestamptz default now()
);

ALTER TABLE public.company_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica requests" ON public.company_requests FOR SELECT USING (true);
CREATE POLICY "Insercion publica requests" ON public.company_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Update publica requests" ON public.company_requests FOR UPDATE USING (true);

-- ─── TABLA DE MENSAJES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id            uuid default gen_random_uuid() primary key,
  from_user_id  uuid references auth.users(id) on delete cascade,
  to_user_id    uuid references auth.users(id) on delete cascade,
  from_empresa  text,
  to_empresa    text,
  asunto        text,
  contenido     text not null,
  leido         boolean default false,
  created_at    timestamptz default now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus mensajes" ON public.messages;
DROP POLICY IF EXISTS "Usuarios envian mensajes" ON public.messages;
DROP POLICY IF EXISTS "Usuarios marcan leidos" ON public.messages;

CREATE POLICY "Usuarios ven sus mensajes"
  ON public.messages FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Usuarios envian mensajes"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Usuarios marcan leidos"
  ON public.messages FOR UPDATE
  USING (auth.uid() = to_user_id);

-- ─── STORAGE: POLÍTICA PARA obralicit-files ─────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'obralicit-files',
  'obralicit-files',
  false,
  26214400,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/octet-stream']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/octet-stream'];

DROP POLICY IF EXISTS "Subida autenticada" ON storage.objects;
DROP POLICY IF EXISTS "Lectura autenticada" ON storage.objects;

CREATE POLICY "Subida autenticada"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'obralicit-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'obralicit-files' AND auth.uid() IS NOT NULL);

-- ─── FUNCIÓN: MARCAR PUJAS EXPIRADAS ────────────────────────────
CREATE OR REPLACE FUNCTION marcar_pujas_expiradas()
RETURNS void LANGUAGE sql AS $$
  UPDATE public.bids
  SET expirada = true
  WHERE validez_tipo = 'fecha'
    AND validez_fecha < current_date
    AND expirada = false;
$$;
