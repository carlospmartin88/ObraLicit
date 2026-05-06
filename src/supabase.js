import { createClient } from '@supabase/supabase-js'

// Lee las variables de entorno (definidas en .env o en Vercel)
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('⚠️  Faltan variables de entorno de Supabase. Copia .env.example a .env y rellénalo.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

/* ─── PROYECTOS ─────────────────────────────────────────────────────────────── */

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('getProjects:', error); return [] }
  return data.map(dbToProject)
}

export async function insertProject(proj) {
  const { data, error } = await supabase
    .from('projects')
    .insert([projectToDb(proj)])
    .select()
    .single()
  if (error) { console.error('insertProject:', error); return null }
  return dbToProject(data)
}

export async function incrementViews(id) {
  await supabase.rpc('increment_views', { project_id: id })
}

/* ─── PUJAS / BIDS ──────────────────────────────────────────────────────────── */

export async function getBids() {
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .order('fecha', { ascending: false })
  if (error) { console.error('getBids:', error); return [] }
  return data.map(dbToBid)
}

export async function insertBid(bid) {
  const { data, error } = await supabase
    .from('bids')
    .insert([bidToDb(bid)])
    .select()
    .single()
  if (error) { console.error('insertBid:', error); return null }
  return dbToBid(data)
}

/* ─── MAPPERS  (JS camelCase ↔ DB snake_case) ──────────────────────────────── */

function projectToDb(p) {
  return {
    id:           p.id,
    slug:         p.slug,
    nombre:       p.nombre,
    empresa:      p.empresa,
    e_init:       p.eInit,
    e_color:      p.eColor,
    descripcion:  p.descripcion,
    ubicacion:    p.ubicacion,
    fecha_cierre: p.fechaCierre,
    tags:         p.tags,
    estado:       p.estado,
    partidas:     p.partidas,
    views:        p.views ?? 0,
  }
}

function dbToProject(r) {
  return {
    id:          r.id,
    slug:        r.slug,
    nombre:      r.nombre,
    empresa:     r.empresa,
    eInit:       r.e_init,
    eColor:      r.e_color,
    descripcion: r.descripcion,
    ubicacion:   r.ubicacion,
    fechaCierre: r.fecha_cierre,
    createdAt:   r.created_at?.split('T')[0] ?? r.fecha_cierre,
    tags:        r.tags ?? [],
    estado:      r.estado,
    partidas:    r.partidas ?? [],
    views:       r.views ?? 0,
  }
}

function bidToDb(b) {
  return {
    id:            b.id,
    proyecto_id:   b.proyectoId,
    partida_id:    b.partidaId,
    empresa:       b.empresa,
    contacto:      b.contacto,
    telefono:      b.telefono,
    precio:        b.precio,
    plazo:         b.plazo,
    observaciones: b.observaciones,
    estado:        b.estado,
    fecha:         b.fecha,
    feedback:      b.feedback,
    rating:        b.rating,
    feedback_tags: b.feedbackTags,
  }
}

function dbToBid(r) {
  return {
    id:            r.id,
    proyectoId:    r.proyecto_id,
    partidaId:     r.partida_id,
    empresa:       r.empresa,
    contacto:      r.contacto,
    telefono:      r.telefono,
    precio:        Number(r.precio),
    plazo:         r.plazo,
    observaciones: r.observaciones,
    estado:        r.estado,
    fecha:         r.fecha,
    feedback:      r.feedback,
    rating:        r.rating,
    feedbackTags:  r.feedback_tags ?? [],
  }
}
