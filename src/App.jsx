import { useState, useEffect, useRef, useCallback } from 'react'
import {
  supabase,
  getProjects, insertProject, incrementViews,
  getBids, insertBid,
} from './supabase.js'

/* ─── CONSTANTS ──────────────────────────────────────────────────────────────── */
const SPECIALTY = ['Micropilotes','Pilotes CPI','Inyecciones','Pantallas','Muros','Mejora terreno','Anclajes','Sondeos','Cimentaciones especiales','Sostenimiento']
const ZONES     = ['Madrid','Barcelona','Sevilla','Valencia','Bilbao','Zaragoza','Málaga','Murcia','Galicia','Canarias']
const TYPES     = ['Obra pública','Obra privada','Urgente','Industrial','Residencial','Infraestructura','Rehabilitación']
const ALL_TAGS  = [...SPECIALTY, ...ZONES, ...TYPES]
const COLORS    = ['#1a4d7a','#0a7c6e','#c0392b','#5a3fa0','#d4820a','#2d6a2d','#8b2fc9','#1a6b8a']
const ROLE_COLORS = { constructora:'#e85d04', subcontrata:'#0a7c6e', especialista:'#5a3fa0' }

/* ─── UTILS ──────────────────────────────────────────────────────────────────── */
const fmt      = n  => new Intl.NumberFormat('es-ES').format(Math.round(n)) + ' €'
const daysLeft = d  => Math.ceil((new Date(d) - new Date()) / 86400000)
const timeAgo  = d  => { const days = Math.floor((new Date()-new Date(d))/86400000); return days===0?'Hoy':days===1?'Ayer':`Hace ${days}d` }
const slugify  = s  => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,60)
const uid      = () => Math.random().toString(36).slice(2,10)
const tagCat   = t  => SPECIALTY.includes(t)?'sp':ZONES.includes(t)?'zo':'ty'

/* ─── ICONS ──────────────────────────────────────────────────────────────────── */
function Ic({ n, s=16, style={} }) {
  const p = { width:s, height:s, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', style }
  const icons = {
    search:  <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus:    <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x:       <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    share:   <svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    clock:   <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    eye:     <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    map:     <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    euro:    <svg {...p}><path d="M4 10h12M4 14h12M19.5 9.5a7 7 0 100 5"/></svg>,
    check:   <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    back:    <svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    tag:     <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    logout:  <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    copy:    <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
    refresh: <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
    globe:   <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    zap:     <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    trend:   <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    user:    <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  }
  return icons[n] || null
}

/* ─── SMALL COMPONENTS ───────────────────────────────────────────────────────── */
function Stars({ rating }) {
  return (
    <div style={{ display:'flex', gap:2, marginTop:5 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:13, color: i<=rating ? 'var(--accent)' : 'var(--border2)' }}>★</span>
      ))}
    </div>
  )
}

function Tag({ t, onClick }) {
  const cat = tagCat(t)
  const styles = {
    sp: { background:'var(--purple-l)', color:'var(--purple)' },
    zo: { background:'var(--blue-l)',   color:'var(--blue)'   },
    ty: { background:'var(--amber-l)',  color:'var(--amber)'  },
  }
  const urg = t === 'Urgente'
  return (
    <span
      onClick={onClick}
      style={{
        padding:'3px 8px', borderRadius:4, fontSize:11, fontWeight:600,
        cursor:'pointer', display:'inline-flex', alignItems:'center',
        transition:'opacity .15s',
        ...(urg ? { background:'var(--red-l)', color:'var(--red)' } : styles[cat])
      }}
    >
      {urg ? '🔥 ' : ''}{t}
    </span>
  )
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const add = t => { const v=t.trim(); if(v&&!tags.includes(v)) onChange([...tags,v]); setInput('') }
  const rem = t => onChange(tags.filter(x=>x!==t))
  const onKey = e => { if(['Enter',',',' '].includes(e.key)){e.preventDefault();add(input)} }
  const getStyle = t => {
    if(SPECIALTY.includes(t)) return { bg:'var(--purple-l)', col:'var(--purple)' }
    if(ZONES.includes(t))     return { bg:'var(--blue-l)',   col:'var(--blue)'   }
    return                           { bg:'var(--amber-l)',  col:'var(--amber)'  }
  }
  return (
    <>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, padding:8, border:'1.5px solid var(--border)', borderRadius:'var(--r-sm)', background:'var(--white)', cursor:'text' }}>
        {tags.map(t => { const s=getStyle(t); return (
          <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:4, fontSize:12, fontWeight:600, background:s.bg, color:s.col }}>
            #{t}<span style={{ cursor:'pointer', opacity:.6, fontSize:16 }} onClick={()=>rem(t)}>×</span>
          </span>
        )})}
        <input
          style={{ border:'none', outline:'none', fontFamily:'Barlow,sans-serif', fontSize:13, flex:1, minWidth:80, background:'transparent', color:'var(--ink)' }}
          placeholder="Escribe y pulsa Enter..."
          value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey}
        />
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:7 }}>
        {ALL_TAGS.filter(t=>!tags.includes(t)).slice(0,14).map(t => (
          <button key={t} onClick={()=>add(t)} style={{ padding:'3px 9px', borderRadius:4, fontSize:12, border:'1.5px solid var(--border)', background:'transparent', cursor:'pointer', fontFamily:'Barlow,sans-serif', transition:'.15s' }}>
            +{t}
          </button>
        ))}
      </div>
    </>
  )
}

function Toast({ msg }) {
  return (
    <div style={{
      position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
      background:'var(--ink)', color:'#fff', padding:'11px 22px', borderRadius:22,
      fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, zIndex:999,
      boxShadow:'var(--sh-lg)', pointerEvents:'none',
      animation:'toastIn .3s, toastOut .3s 1.7s forwards',
    }}>{msg}</div>
  )
}

/* ─── BID FORM ───────────────────────────────────────────────────────────────── */
function BidForm({ partida, onSubmit, onCancel }) {
  const [precio, setPrecio]   = useState('')
  const [plazo, setPlazo]     = useState('')
  const [obs, setObs]         = useState('')
  const [tel, setTel]         = useState('')
  const [loading, setLoading] = useState(false)

  const num    = parseFloat(precio||0)
  const total  = num * partida.medicion
  const saving = precio ? ((partida.precioSalida-num)/partida.precioSalida*100).toFixed(1) : null
  const isOk   = saving !== null && parseFloat(saving) > 0

  async function submit() {
    if (!precio || isNaN(num)) return
    setLoading(true)
    await onSubmit({ precio:num, plazo:parseInt(plazo)||0, obs, tel })
    setLoading(false)
  }

  const inputStyle = { padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:'var(--r-sm)', fontFamily:'Barlow,sans-serif', fontSize:14, outline:'none', background:'var(--white)', color:'var(--ink)', width:'100%' }

  return (
    <div style={{ padding:15, background:'linear-gradient(135deg,#fffaf7,var(--accent-l))', borderTop:'2px solid var(--accent-m)' }}>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:13 }}>
        💶 Presentar oferta — {partida.descripcion}
      </div>
      <div style={{ background:'var(--accent-l)', border:'1px solid var(--accent-m)', borderRadius:'var(--r-sm)', padding:'9px 13px', marginBottom:13, fontSize:12, color:'var(--accent-d)' }}>
        Precio de salida: <strong>{fmt(partida.precioSalida)}/{partida.unidad}</strong> ·
        Medición: <strong>{partida.medicion} {partida.unidad}</strong> ·
        Total ref: <strong>{fmt(partida.medicion*partida.precioSalida)}</strong>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <label style={{ fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.07em', color:'var(--muted)', display:'block', marginBottom:4 }}>
            PRECIO UNITARIO (€/{partida.unidad}) *
          </label>
          <input style={inputStyle} type="number" placeholder="0.00" value={precio} onChange={e=>setPrecio(e.target.value)} />
          {saving !== null && (
            <div style={{ fontSize:11, marginTop:3, fontWeight:600, color: isOk?'var(--green)':'var(--red)' }}>
              Total: {fmt(total)} · {isOk?'-':'+'}{Math.abs(saving)}% vs salida
            </div>
          )}
        </div>
        <div>
          <label style={{ fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.07em', color:'var(--muted)', display:'block', marginBottom:4 }}>PLAZO (días)</label>
          <input style={inputStyle} type="number" placeholder="ej: 15" value={plazo} onChange={e=>setPlazo(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={{ fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.07em', color:'var(--muted)', display:'block', marginBottom:4 }}>OBSERVACIONES Y CONDICIONES</label>
        <textarea style={{ ...inputStyle, resize:'vertical', minHeight:76, fontSize:13, lineHeight:1.5 }}
          placeholder="Qué incluye/excluye, maquinaria disponible, condicionantes, referencias de obra similares..."
          value={obs} onChange={e=>setObs(e.target.value)}
        />
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={{ fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.07em', color:'var(--muted)', display:'block', marginBottom:4 }}>TELÉFONO DE CONTACTO</label>
        <input style={inputStyle} type="tel" placeholder="6XX XXX XXX" value={tel} onChange={e=>setTel(e.target.value)} />
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>Visible públicamente para facilitar contacto directo</div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button
          onClick={submit} disabled={!precio||loading}
          style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'10px 22px', borderRadius:'var(--r-sm)', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity:(!precio||loading)?.5:1 }}
        >
          {loading ? <><Ic n="refresh" s={14} style={{ animation:'spin 1s linear infinite' }}/> Publicando...</> : <><Ic n="check" s={14}/> Publicar oferta</>}
        </button>
        <button onClick={onCancel} style={{ background:'transparent', color:'var(--muted)', border:'1.5px solid var(--border)', padding:'10px 16px', borderRadius:'var(--r-sm)', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

/* ─── DETAIL PANEL ───────────────────────────────────────────────────────────── */
function DetailPanel({ proj, bids, user, onClose, onBid, onLogin }) {
  const [openForm, setOpenForm] = useState(null)
  const [copied, setCopied]     = useState(false)
  const totalRef  = proj.partidas.reduce((s,p)=>s+p.medicion*p.precioSalida,0)
  const dl        = daysLeft(proj.fechaCierre)
  const projBids  = bids.filter(b=>b.proyectoId===proj.id)
  const feedbacks = projBids.filter(b=>b.feedback)

  function handleCopy() {
    const url = `${window.location.origin}/?l=${proj.slug}`
    navigator.clipboard?.writeText?.(url).catch(()=>{})
    setCopied(true); setTimeout(()=>setCopied(false),2200)
  }

  async function submitBid(partidaId, form) {
    await onBid(proj.id, partidaId, form)
    setOpenForm(null)
  }

  const dlStyle = dl<=2 ? { background:'var(--red-l)', color:'var(--red)' } : dl<=7 ? { background:'var(--amber-l)', color:'var(--amber)' } : { background:'var(--green-l)', color:'var(--green)' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(24,23,15,.55)', backdropFilter:'blur(6px)', display:'flex', animation:'fadeIn .2s' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose() }}
    >
      <div style={{ marginLeft:'auto', width:'min(740px,100vw)', background:'var(--white)', height:'100vh', overflowY:'auto', boxShadow:'var(--sh-xl)', animation:'slideIn .25s cubic-bezier(.25,.46,.45,.94)' }}>

        {/* HERO */}
        <div style={{ background:'var(--ink)', color:'#fff', padding:'26px 28px 22px' }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,.4)', cursor:'pointer', marginBottom:14, border:'none', background:'none', fontFamily:'Barlow,sans-serif', transition:'.15s' }}>
            <Ic n="back" s={13}/> Volver al feed
          </button>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:5, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:18, height:18, borderRadius:4, background:proj.eColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', fontFamily:'Syne,sans-serif' }}>{proj.eInit}</div>
                {proj.empresa}
              </div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:23, fontWeight:800, lineHeight:1.2, marginBottom:9 }}>{proj.nombre}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.65 }}>{proj.descripcion}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:13 }}>
                {proj.tags.map(t=><span key={t} style={{ padding:'4px 10px', borderRadius:4, fontSize:11, fontWeight:600, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', border:'1px solid rgba(255,255,255,.1)' }}>{t}</span>)}
              </div>
            </div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, padding:'6px 12px', borderRadius:8, display:'flex', alignItems:'center', gap:4, flexShrink:0, ...dlStyle }}>
              <Ic n="clock" s={11}/>{dl<=0?'Vence hoy':`${dl}d`}
            </div>
          </div>
          {/* SHARE */}
          <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 14px', marginTop:14, display:'flex', alignItems:'center', gap:10 }}>
            <Ic n="globe" s={13} style={{ color:'rgba(255,255,255,.4)', flexShrink:0 }}/>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'rgba(255,255,255,.4)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {window.location.origin}/?l={proj.slug}
            </span>
            <button onClick={handleCopy} style={{ padding:'5px 13px', background: copied?'var(--teal)':'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', border:'1px solid rgba(255,255,255,.12)', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif', transition:'.15s', flexShrink:0 }}>
              {copied ? <><Ic n="check" s={11}/> ¡Copiado!</> : <><Ic n="copy" s={11}/> Copiar enlace</>}
            </button>
          </div>
          {/* KPIS */}
          <div style={{ display:'flex', gap:20, marginTop:14, flexWrap:'wrap' }}>
            {[['Presupuesto ref.',fmt(totalRef)],['Partidas',proj.partidas.length],['Ofertas',projBids.length],['Cierre',proj.fechaCierre]].map(([l,v])=>(
              <div key={l}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700, letterSpacing:'.05em' }}>{l}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:15, fontWeight:600, color:'#fff', marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding:'22px 28px' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'.08em', color:'var(--muted)', textTransform:'uppercase', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
            Partidas y ofertas — 100% públicas
          </div>

          {proj.partidas.map(partida => {
            const pBids  = projBids.filter(b=>b.partidaId===partida.id).sort((a,b)=>a.precio-b.precio)
            const myBid  = user && pBids.find(b=>b.empresa===user.empresa)
            const best   = pBids.length ? pBids[0].precio : null
            const isOpen = openForm === partida.id

            return (
              <div key={partida.id} style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', marginBottom:12 }}>
                {/* Partida header */}
                <div style={{ padding:'13px 15px', background:'var(--bg)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--muted)' }}>{partida.codigo}</div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, margin:'3px 0 5px' }}>{partida.descripcion}</div>
                    <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                      {[['Medición',`${partida.medicion} ${partida.unidad}`],['P.salida',`${fmt(partida.precioSalida)}/${partida.unidad}`],['Total ref',fmt(partida.medicion*partida.precioSalida)]].map(([l,v])=>(
                        <span key={l} style={{ fontSize:12, color:'var(--muted)' }}>{l}: <strong style={{ color:'var(--ink)', fontFamily:'JetBrains Mono,monospace' }}>{v}</strong></span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                    {best && <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:10, color:'var(--muted)' }}>Mejor oferta</div>
                      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:17, fontWeight:600, color:'var(--green)' }}>{fmt(best)}</div>
                    </div>}
                    {!myBid && proj.estado==='abierta' && (
                      <button onClick={()=>{ if(!user){onLogin();return}; setOpenForm(isOpen?null:partida.id) }}
                        style={{ background:'var(--ink)', color:'#fff', border:'none', padding:'7px 14px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                        {isOpen?<><Ic n="x" s={12}/>Cancelar</>:<><Ic n="euro" s={12}/>Pujar</>}
                      </button>
                    )}
                    {myBid && <div style={{ padding:'10px 13px', background:'var(--teal-l)', borderRadius:'var(--r-sm)', fontSize:12, color:'var(--teal)', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}><Ic n="check" s={12}/> Tu oferta: {fmt(myBid.precio)}/{partida.unidad}</div>}
                  </div>
                </div>

                {isOpen && user && <BidForm partida={partida} onSubmit={f=>submitBid(partida.id,f)} onCancel={()=>setOpenForm(null)}/>}

                {pBids.length > 0 ? pBids.map((bid,idx) => {
                  const saving = ((partida.precioSalida-bid.precio)/partida.precioSalida*100).toFixed(1)
                  const rkColors = ['var(--green)','var(--amber)','#888','var(--border)']
                  const rkColor  = rkColors[Math.min(idx,3)]
                  return (
                    <div key={bid.id} style={{ padding:'13px 15px', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'start', background: bid.estado==='adjudicada'?'var(--green-l)':'transparent' }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                          <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', background:rkColor, flexShrink:0 }}>{idx+1}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700 }}>
                              {bid.empresa}
                              {bid.estado==='adjudicada' && <span style={{ fontSize:10, background:'var(--green)', color:'#fff', padding:'2px 8px', borderRadius:4, fontWeight:700, marginLeft:6 }}>✓ ADJUDICADA</span>}
                            </div>
                            <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>{bid.contacto}{bid.telefono?` · ${bid.telefono}`:''}</div>
                          </div>
                        </div>
                        {bid.observaciones && <div style={{ fontSize:12, color:'var(--ink2)', marginTop:7, lineHeight:1.55, fontStyle:'italic', padding:'8px 10px', background:'var(--bg)', borderRadius:'var(--r-sm)', borderLeft:'3px solid var(--border2)' }}>"{bid.observaciones}"</div>}
                        <div style={{ display:'flex', gap:12, marginTop:6, flexWrap:'wrap' }}>
                          <span style={{ fontSize:11, color:'var(--muted)' }}>⏱ Plazo: {bid.plazo} días</span>
                          <span style={{ fontSize:11, color:'var(--muted)' }}>📅 {bid.fecha}</span>
                        </div>
                        {bid.feedback && (
                          <div style={{ marginTop:8, padding:'8px 10px', background:'var(--amber-l)', borderRadius:'var(--r-sm)', fontSize:12, color:'var(--amber)', borderLeft:'3px solid var(--amber)' }}>
                            <strong>Feedback:</strong> "{bid.feedback}"
                            {bid.feedbackTags?.length>0 && <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:5 }}>{bid.feedbackTags.map(t=><span key={t} style={{ padding:'2px 8px', background:'var(--white)', border:'1px solid var(--border)', borderRadius:4, fontSize:11, fontWeight:500 }}>{t}</span>)}</div>}
                            {bid.rating && <Stars rating={bid.rating}/>}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:10, color:'var(--muted)', marginBottom:2 }}>precio/ud</div>
                        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:18, fontWeight:600, color:idx===0?'var(--green)':'var(--ink)' }}>{fmt(bid.precio)}</div>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, display:'inline-block', marginTop:3, ...(parseFloat(saving)>0 ? { background:'var(--green-l)', color:'var(--green)' } : { background:'var(--red-l)', color:'var(--red)' }) }}>
                          {parseFloat(saving)>0?'-':'+'}{Math.abs(saving)}% vs salida
                        </span>
                        <br/>
                        <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, marginTop:4, display:'inline-block', ...(bid.estado==='adjudicada'?{background:'var(--green-l)',color:'var(--green)'}:bid.estado==='perdida'?{background:'#f0f0f0',color:'#888'}:{background:'#fff8e6',color:'#b07a10'}) }}>
                          {bid.estado.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                }) : <div style={{ padding:'20px 15px', fontSize:13, color:'var(--muted)', fontStyle:'italic', textAlign:'center' }}>Sé el primero en pujar esta partida 👇</div>}
              </div>
            )
          })}

          {/* FEEDBACKS */}
          {feedbacks.length > 0 && (
            <>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'.08em', color:'var(--muted)', textTransform:'uppercase', margin:'26px 0 12px', paddingBottom:8, borderBottom:'1px solid var(--border)' }}>Valoraciones públicas</div>
              {feedbacks.map(bid => (
                <div key={bid.id} style={{ background:'var(--bg)', borderRadius:'var(--r-sm)', padding:13, border:'1px solid var(--border)', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', background:proj.eColor }}>{proj.eInit}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{proj.empresa} <span style={{ fontWeight:400, color:'var(--muted)' }}>sobre</span> {bid.empresa}</div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>{bid.fecha}</div>
                    </div>
                    {bid.rating && <div style={{ marginLeft:'auto' }}><Stars rating={bid.rating}/></div>}
                  </div>
                  <div style={{ fontSize:13, color:'var(--ink2)', lineHeight:1.6 }}>"{bid.feedback}"</div>
                  {bid.feedbackTags?.length>0 && <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:7 }}>{bid.feedbackTags.map(t=><span key={t} style={{ padding:'2px 8px', background:'var(--white)', border:'1px solid var(--border)', borderRadius:4, fontSize:11, fontWeight:500 }}>{t}</span>)}</div>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── NEW PROJECT MODAL ──────────────────────────────────────────────────────── */
function NewProjectModal({ user, onClose, onSubmit, onLogin }) {
  const [step,     setStep]     = useState(1)
  const [nombre,   setNombre]   = useState('')
  const [desc,     setDesc]     = useState('')
  const [ubic,     setUbic]     = useState('')
  const [fecha,    setFecha]    = useState('')
  const [tags,     setTags]     = useState([])
  const [partidas, setPartidas] = useState([])
  const [pf,       setPf]       = useState({ codigo:'', desc:'', unidad:'ud', medicion:'', precio:'' })
  const [loading,  setLoading]  = useState(false)

  function addPartida() {
    if (!pf.desc||!pf.medicion||!pf.precio) return
    setPartidas(prev=>[...prev,{ id:'U'+uid(), codigo:pf.codigo||'P-'+(prev.length+1), descripcion:pf.desc, unidad:pf.unidad, medicion:parseFloat(pf.medicion), precioSalida:parseFloat(pf.precio) }])
    setPf({ codigo:'', desc:'', unidad:'ud', medicion:'', precio:'' })
  }

  async function publish() {
    if (!user) { onLogin(); return }
    setLoading(true)
    await onSubmit({ nombre, desc, ubic, fecha, tags, partidas })
    setLoading(false)
    onClose()
  }

  const fi = { padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:'var(--r-sm)', fontFamily:'Barlow,sans-serif', fontSize:14, outline:'none', background:'var(--white)', color:'var(--ink)', width:'100%' }
  const fl = { fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.07em', color:'var(--muted)', display:'block', marginBottom:4 }
  const fg = { display:'flex', flexDirection:'column', gap:4 }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(24,23,15,.65)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'fadeIn .2s' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose() }}
    >
      <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--sh-xl)', animation:'slideUp .25s cubic-bezier(.25,.46,.45,.94)' }}>
        <div style={{ padding:'24px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800 }}>Publicar licitación</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>Paso {step} de 2 — {step===1?'Información general':'Partidas y presupuesto'}</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'var(--bg)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--muted)', fontSize:20 }}>×</button>
        </div>
        <div style={{ padding:'24px 28px' }}>
          {/* Progress bar */}
          <div style={{ display:'flex', gap:6, marginBottom:22 }}>
            {[1,2].map(s=><div key={s} style={{ flex:1, height:4, borderRadius:2, background:s<=step?'var(--accent)':'var(--border)', transition:'.3s' }}/>)}
          </div>

          {step===1 && (
            <>
              <div style={{ ...fg, marginBottom:13 }}>
                <label style={fl}>NOMBRE DEL PROYECTO / OBRA *</label>
                <input style={fi} placeholder="Ej: Viaducto M-50 — Cimentaciones especiales" value={nombre} onChange={e=>setNombre(e.target.value)}/>
              </div>
              <div style={{ ...fg, marginBottom:13 }}>
                <label style={fl}>DESCRIPCIÓN DE LOS TRABAJOS *</label>
                <textarea style={{ ...fi, resize:'vertical', minHeight:76, fontSize:13, lineHeight:1.5 }} placeholder="Alcance, condicionantes, acceso, maquinaria requerida..." value={desc} onChange={e=>setDesc(e.target.value)}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:13 }}>
                <div style={fg}><label style={fl}>UBICACIÓN</label><input style={fi} placeholder="Ciudad / provincia" value={ubic} onChange={e=>setUbic(e.target.value)}/></div>
                <div style={fg}><label style={fl}>FECHA LÍMITE OFERTAS *</label><input style={fi} type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/></div>
              </div>
              <div style={fg}>
                <label style={fl}>ETIQUETAS</label>
                <TagInput tags={tags} onChange={setTags}/>
              </div>
            </>
          )}

          {step===2 && (
            <>
              {partidas.map(p=>(
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', marginBottom:6 }}>
                  <div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600 }}>{p.descripcion}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>{p.codigo} · {p.medicion} {p.unidad} · {fmt(p.precioSalida)}/{p.unidad}</div>
                  </div>
                  <button onClick={()=>setPartidas(prev=>prev.filter(x=>x.id!==p.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:20, padding:'2px 6px' }}>×</button>
                </div>
              ))}
              <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:14, marginTop:10 }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:12 }}>+ Nueva partida</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:9 }}>
                  <div style={fg}><label style={fl}>CÓDIGO</label><input style={fi} placeholder="CIM-001" value={pf.codigo} onChange={e=>setPf(f=>({...f,codigo:e.target.value}))}/></div>
                  <div style={fg}><label style={fl}>UNIDAD</label>
                    <select style={{ ...fi, appearance:'auto' }} value={pf.unidad} onChange={e=>setPf(f=>({...f,unidad:e.target.value}))}>
                      {['ud','m','m²','m³','kg','t','PA'].map(u=><option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ ...fg, marginBottom:9 }}><label style={fl}>DESCRIPCIÓN *</label><input style={fi} placeholder="Micropilote Ø168mm L=12m c/camisa perdida" value={pf.desc} onChange={e=>setPf(f=>({...f,desc:e.target.value}))}/></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:9 }}>
                  <div style={fg}><label style={fl}>MEDICIÓN *</label><input style={fi} type="number" placeholder="0" value={pf.medicion} onChange={e=>setPf(f=>({...f,medicion:e.target.value}))}/></div>
                  <div style={fg}><label style={fl}>PRECIO SALIDA €/ud *</label><input style={fi} type="number" placeholder="0.00" value={pf.precio} onChange={e=>setPf(f=>({...f,precio:e.target.value}))}/></div>
                </div>
                <button onClick={addPartida} style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'10px 0', borderRadius:'var(--r-sm)', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Ic n="plus" s={14}/> Añadir partida
                </button>
              </div>
            </>
          )}
        </div>
        <div style={{ padding:'0 28px 24px', display:'flex', justifyContent:'flex-end', gap:10 }}>
          {step===2 && <button onClick={()=>setStep(1)} style={{ background:'transparent', color:'var(--muted)', border:'1.5px solid var(--border)', padding:'10px 16px', borderRadius:'var(--r-sm)', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}><Ic n="back" s={13}/> Atrás</button>}
          <div style={{ flex:1 }}/>
          <button onClick={onClose} style={{ background:'transparent', color:'var(--muted)', border:'1.5px solid var(--border)', padding:'10px 16px', borderRadius:'var(--r-sm)', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
          {step===1 && <button onClick={()=>(nombre.trim()&&fecha)&&setStep(2)} style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'10px 22px', borderRadius:'var(--r-sm)', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity:(nombre.trim()&&fecha)?1:.4 }}>Siguiente <Ic n="zap" s={13}/></button>}
          {step===2 && <button onClick={publish} disabled={!partidas.length||loading} style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'10px 22px', borderRadius:'var(--r-sm)', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity:partidas.length?1:.4 }}>
            {loading?<><Ic n="refresh" s={14} style={{ animation:'spin 1s linear infinite' }}/> Publicando...</>:<><Ic n="globe" s={14}/> Publicar para todos</>}
          </button>}
        </div>
      </div>
    </div>
  )
}

/* ─── LOGIN MODAL ─────────────────────────────────────────────────────────────── */
function LoginModal({ onClose, onLogin }) {
  const [role,   setRole]   = useState('constructora')
  const [nombre, setNombre] = useState('')
  const [empresa,setEmpresa]= useState('')
  const fi = { padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:'var(--r-sm)', fontFamily:'Barlow,sans-serif', fontSize:14, outline:'none', background:'var(--white)', color:'var(--ink)', width:'100%' }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(24,23,15,.65)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'fadeIn .2s' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose() }}
    >
      <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', width:'100%', maxWidth:430, boxShadow:'var(--sh-xl)', animation:'slideUp .25s cubic-bezier(.25,.46,.45,.94)' }}>
        <div style={{ padding:'24px 28px 0', display:'flex', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800 }}>Únete a ObraLicit</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>Gratis · Sin burocracia · Todo transparente</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'var(--bg)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--muted)', fontSize:20 }}>×</button>
        </div>
        <div style={{ padding:'24px 28px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
            {[['constructora','🏗️','Constructora','Publico y adjudico'],['subcontrata','⚙️','Subcontrata','Pujo partidas'],['especialista','🔬','Especialista','Consultor técnico']].map(([r,ico,n,s])=>(
              <div key={r} onClick={()=>setRole(r)} style={{ border:`2px solid ${role===r?'var(--accent)':'var(--border)'}`, borderRadius:'var(--r)', padding:14, textAlign:'center', cursor:'pointer', background:role===r?'var(--accent-l)':'transparent', transition:'.15s' }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{ico}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700 }}>{n}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.07em', color:'var(--muted)', display:'block', marginBottom:4 }}>TU NOMBRE</label>
            <input style={fi} placeholder="Nombre y apellidos" value={nombre} onChange={e=>setNombre(e.target.value)}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.07em', color:'var(--muted)', display:'block', marginBottom:4 }}>EMPRESA</label>
            <input style={fi} placeholder="Nombre de tu empresa" value={empresa} onChange={e=>setEmpresa(e.target.value)}/>
          </div>
          <button onClick={()=>{ if(!nombre.trim()||!empresa.trim()) return; onLogin({ nombre:nombre.trim(), empresa:empresa.trim(), rol:role, initials:empresa.trim().slice(0,2).toUpperCase(), color:ROLE_COLORS[role] }) }}
            style={{ background:'var(--accent)', color:'#fff', border:'none', padding:14, borderRadius:'var(--r-sm)', fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, cursor:'pointer', width:'100%', opacity:(nombre.trim()&&empresa.trim())?1:.4 }}>
            Entrar a la plataforma →
          </button>
          <div style={{ textAlign:'center', fontSize:11, color:'var(--muted)', marginTop:12 }}>Toda la información es pública y visible para todos</div>
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN APP ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [projects,    setProjects]    = useState([])
  const [bids,        setBids]        = useState([])
  const [user,        setUser]        = useState(null)
  const [activeTags,  setActiveTags]  = useState([])
  const [sortBy,      setSortBy]      = useState('reciente')
  const [search,      setSearch]      = useState('')
  const [favs,        setFavs]        = useState([])
  const [detailId,    setDetailId]    = useState(null)
  const [showNew,     setShowNew]     = useState(false)
  const [showLogin,   setShowLogin]   = useState(false)
  const [toast,       setToast]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [syncing,     setSyncing]     = useState(false)

  const showToast = useCallback(msg => { setToast(msg); setTimeout(()=>setToast(null),2100) }, [])

  /* LOAD DATA */
  useEffect(()=>{
    ;(async()=>{
      setLoading(true)
      const [p,b] = await Promise.all([getProjects(), getBids()])
      setProjects(p); setBids(b)
      setLoading(false)
    })()
  },[])

  /* REALTIME SUBSCRIPTION */
  useEffect(()=>{
    const ch = supabase.channel('obralicit-changes')
      .on('postgres_changes',{ event:'INSERT', schema:'public', table:'projects' }, payload => {
        setProjects(prev=>[dbToProjectRT(payload.new),...prev])
      })
      .on('postgres_changes',{ event:'INSERT', schema:'public', table:'bids' }, payload => {
        setBids(prev=>[dbToBidRT(payload.new),...prev])
      })
      .on('postgres_changes',{ event:'UPDATE', schema:'public', table:'projects' }, payload => {
        setProjects(prev=>prev.map(p=>p.id===payload.new.id ? dbToProjectRT(payload.new) : p))
      })
      .subscribe()
    return ()=>{ supabase.removeChannel(ch) }
  },[])

  // RT mappers (same logic as supabase.js but inline for realtime events)
  function dbToProjectRT(r) {
    return { id:r.id, slug:r.slug, nombre:r.nombre, empresa:r.empresa, eInit:r.e_init, eColor:r.e_color, descripcion:r.descripcion, ubicacion:r.ubicacion, fechaCierre:r.fecha_cierre, createdAt:r.created_at?.split('T')[0]??r.fecha_cierre, tags:r.tags??[], estado:r.estado, partidas:r.partidas??[], views:r.views??0 }
  }
  function dbToBidRT(r) {
    return { id:r.id, proyectoId:r.proyecto_id, partidaId:r.partida_id, empresa:r.empresa, contacto:r.contacto, telefono:r.telefono, precio:Number(r.precio), plazo:r.plazo, observaciones:r.observaciones, estado:r.estado, fecha:r.fecha, feedback:r.feedback, rating:r.rating, feedbackTags:r.feedback_tags??[] }
  }

  /* FILTER + SORT */
  const filtered = (() => {
    const q = search.toLowerCase()
    let r = projects.filter(p => {
      const mq = !q || p.nombre.toLowerCase().includes(q) || p.empresa.toLowerCase().includes(q) || p.ubicacion?.toLowerCase().includes(q) || p.tags.some(t=>t.toLowerCase().includes(q))
      const mt = activeTags.length===0 || activeTags.every(t=>p.tags.includes(t))
      return mq && mt
    })
    if(sortBy==='reciente')  r.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
    if(sortBy==='populares') r.sort((a,b)=>b.views-a.views)
    if(sortBy==='cierre')    r.sort((a,b)=>new Date(a.fechaCierre)-new Date(b.fechaCierre))
    if(sortBy==='pujas')     r.sort((a,b)=>bids.filter(x=>x.proyectoId===b.id).length - bids.filter(x=>x.proyectoId===a.id).length)
    return r
  })()

  const detailProj  = projects.find(p=>p.id===detailId)
  const tagCount    = t => projects.filter(p=>p.tags.includes(t)).length
  const toggleTag   = t => setActiveTags(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])
  const avgSaving   = bids.length ? (bids.reduce((s,b)=>{ const p=projects.flatMap(pr=>pr.partidas).find(pa=>pa.id===b.partidaId); return s+(p?(p.precioSalida-b.precio)/p.precioSalida*100:0) },0)/bids.length).toFixed(1) : '—'
  const companies   = [...new Set(bids.map(b=>b.empresa))].length

  /* HANDLERS */
  async function handleBid(proyectoId, partidaId, form) {
    const bid = { id:'B'+uid(), proyectoId, partidaId, empresa:user.empresa, contacto:user.nombre, telefono:form.tel||'', precio:form.precio, plazo:form.plazo, observaciones:form.obs||'', estado:'pendiente', fecha:new Date().toISOString().split('T')[0], feedback:null, rating:null, feedbackTags:[] }
    await insertBid(bid)  // realtime will update state automatically
    showToast('✅ Oferta publicada — visible para todos en tiempo real')
  }

  async function handleNewProject(data) {
    const proj = { id:'P'+uid(), slug:slugify(data.nombre), nombre:data.nombre, empresa:user.empresa, eInit:user.empresa.slice(0,2).toUpperCase(), eColor:COLORS[Math.floor(Math.random()*COLORS.length)], descripcion:data.desc, ubicacion:data.ubic||'España', fechaCierre:data.fecha, createdAt:new Date().toISOString().split('T')[0], tags:data.tags, estado:'abierta', partidas:data.partidas, views:1 }
    await insertProject(proj)
    showToast('🎉 Licitación publicada — ya visible para toda la red')
  }

  async function handleOpenDetail(id) {
    setDetailId(id)
    await incrementViews(id)
  }

  function copyLink(slug) {
    const url = `${window.location.origin}/?l=${slug}`
    navigator.clipboard?.writeText?.(url).catch(()=>{})
    showToast('🔗 Enlace copiado — compártelo con cualquiera')
  }

  /* LOADING SCREEN */
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, fontFamily:'Syne,sans-serif', background:'var(--bg)' }}>
      <div style={{ width:48, height:48, background:'var(--ink)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'var(--accent)', animation:'pulse 1.5s infinite' }}>O</div>
      <div style={{ fontSize:14, color:'var(--muted)' }}>Cargando ObraLicit…</div>
    </div>
  )

  /* SIDEBAR TAG GROUP */
  const SidebarTagGroup = ({ title, tags }) => (
    <div style={{ background:'var(--white)', borderRadius:'var(--r)', border:'1px solid var(--border)', boxShadow:'var(--sh)', overflow:'hidden' }}>
      <div style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'.07em', color:'var(--muted)' }}>{title}</div>
      <div style={{ padding:'12px 14px', display:'flex', flexWrap:'wrap', gap:5 }}>
        {tags.map(t=>(
          <button key={t} onClick={()=>toggleTag(t)} style={{ padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:`1.5px solid ${activeTags.includes(t)?'var(--accent)':'var(--border)'}`, background:activeTags.includes(t)?'var(--accent)':'transparent', color:activeTags.includes(t)?'#fff':'var(--ink2)', fontFamily:'Barlow,sans-serif', transition:'.15s' }}>
            {t}<span style={{ fontSize:10, opacity:.45, marginLeft:2 }}>·{tagCount(t)}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* LIVE STATUS BAR */}
      <div style={{ background:'var(--ink)', color:'rgba(255,255,255,.6)', fontSize:11, padding:'5px 24px', display:'flex', alignItems:'center', gap:14, fontFamily:'JetBrains Mono,monospace', flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block', animation:'pulse 2s infinite' }}></span> EN DIRECTO</span>
        {[['Licitaciones abiertas',projects.filter(p=>p.estado==='abierta').length],['Ofertas publicadas',bids.length],['Ahorro medio',`-${avgSaving}%`],['Empresas activas',companies]].map(([l,v])=>(
          <span key={l}><span style={{ color:'#fff', fontWeight:600 }}>{v}</span> {l}</span>
        ))}
      </div>

      {/* NAV */}
      <nav style={{ background:'var(--white)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100, boxShadow:'var(--sh)' }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', gap:14, height:58 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <div style={{ width:36, height:36, background:'var(--ink)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'var(--accent)', flexShrink:0 }}>O</div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:19, fontWeight:800, lineHeight:1 }}>ObraLicit</div>
              <div style={{ fontSize:10, color:'var(--muted)', fontWeight:500 }}>Red de contratación transparente</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'#e8f5ee', border:'1px solid #b8ddc8', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, color:'var(--green)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', display:'inline-block', animation:'pulse 2s infinite' }}></span>
            TIEMPO REAL
          </div>
          <div style={{ flex:1, maxWidth:400, position:'relative', marginLeft:8 }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}><Ic n="search" s={14}/></span>
            <input style={{ width:'100%', padding:'9px 14px 9px 36px', border:'1.5px solid var(--border)', borderRadius:22, fontFamily:'Barlow,sans-serif', fontSize:14, outline:'none', background:'var(--bg)', color:'var(--ink)' }}
              placeholder="Buscar obra, empresa, especialidad, zona..."
              value={search} onChange={e=>setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            {user ? (
              <>
                <button onClick={()=>setShowNew(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:'var(--accent)', color:'#fff' }}>
                  <Ic n="plus" s={14}/> Publicar licitación
                </button>
                <div onClick={()=>setUser(null)} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 14px 5px 6px', background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:22, cursor:'pointer', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', background:user.color }}>{user.initials}</div>
                  {user.empresa} <Ic n="logout" s={13}/>
                </div>
              </>
            ) : (
              <>
                <button onClick={()=>setShowLogin(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'var(--ink2)', border:'1.5px solid var(--border)' }}>Entrar</button>
                <button onClick={()=>setShowNew(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:'var(--ink)', color:'#fff' }}><Ic n="plus" s={14}/> Publicar</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* PAGE */}
      <div style={{ maxWidth:1300, margin:'0 auto', padding:'28px 24px', display:'grid', gridTemplateColumns:'256px 1fr', gap:22 }}>

        {/* SIDEBAR */}
        <aside style={{ display:'flex', flexDirection:'column', gap:12, position:'sticky', top:90, alignSelf:'start', maxHeight:'calc(100vh - 110px)', overflowY:'auto' }}>
          {/* Stats */}
          <div style={{ background:'var(--white)', borderRadius:'var(--r)', border:'1px solid var(--border)', boxShadow:'var(--sh)', overflow:'hidden' }}>
            <div style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'.07em', color:'var(--muted)', display:'flex', alignItems:'center', gap:6 }}>
              <Ic n="trend" s={11}/> ESTADÍSTICAS EN VIVO
            </div>
            <div style={{ padding:'12px 14px' }}>
              {[['Licitaciones abiertas',projects.filter(p=>p.estado==='abierta').length],['Total ofertas',bids.length],['Ahorro medio',`-${avgSaving}%`],['Empresas activas',companies],['Total licitaciones',projects.length]].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>{l}</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:500, color:String(v).includes('-')&&v!=='—'?'var(--green)':'' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <SidebarTagGroup title="🏗️ ESPECIALIDAD" tags={SPECIALTY}/>
          <SidebarTagGroup title="📍 ZONA"          tags={ZONES}/>
          <SidebarTagGroup title="📋 TIPO DE OBRA"  tags={TYPES}/>
          {activeTags.length>0 && (
            <button onClick={()=>setActiveTags([])} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 0', borderRadius:'var(--r-sm)', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'var(--ink2)', border:'1.5px solid var(--border)', width:'100%' }}>
              <Ic n="x" s={13}/> Borrar filtros ({activeTags.length})
            </button>
          )}
        </aside>

        {/* FEED */}
        <section>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18, gap:12, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:800 }}>Licitaciones abiertas</div>
              <div style={{ fontSize:13, color:'var(--muted)', marginTop:3 }}>
                {filtered.length} resultado{filtered.length!==1?'s':''}
                {activeTags.length>0?` · ${activeTags.join(', ')}`:''}
                {search?` · "${search}"`:''} ·{' '}
                <span style={{ color:'var(--green)', fontWeight:600 }}>Precios 100% públicos</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:2, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:22, padding:3 }}>
              {[['reciente','Recientes'],['populares','Populares'],['cierre','Cierre próximo'],['pujas','Más pujas']].map(([v,l])=>(
                <button key={v} onClick={()=>setSortBy(v)} style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, border:'none', background:sortBy===v?'var(--white)':'transparent', color:sortBy===v?'var(--ink)':'var(--muted)', cursor:'pointer', fontFamily:'Syne,sans-serif', boxShadow:sortBy===v?'var(--sh)':'none', transition:'.15s', whiteSpace:'nowrap' }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {filtered.length===0 && (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <div style={{ fontSize:48, marginBottom:14 }}>🔍</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, marginBottom:8 }}>Sin resultados</div>
                <div style={{ fontSize:13, color:'var(--muted)' }}>Prueba otros filtros o publica la primera licitación.</div>
              </div>
            )}
            {filtered.map((proj,i)=>{
              const projBids = bids.filter(b=>b.proyectoId===proj.id)
              const best     = projBids.length ? projBids.reduce((a,b)=>a.precio<b.precio?a:b) : null
              const totalRef = proj.partidas.reduce((s,p)=>s+p.medicion*p.precioSalida,0)
              const dl       = daysLeft(proj.fechaCierre)
              const isFav    = favs.includes(proj.id)
              const dlStyle  = proj.estado==='cerrada' ? { background:'#f0f0f0',color:'#888' } : dl<=2 ? { background:'var(--red-l)',color:'var(--red)' } : dl<=7 ? { background:'var(--amber-l)',color:'var(--amber)' } : { background:'var(--green-l)',color:'var(--green)' }
              const dlText   = proj.estado==='cerrada'?'Cerrada':dl<=0?'Vence hoy':`${dl}d restantes`

              return (
                <article key={proj.id} style={{ background:'var(--white)', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', boxShadow:'var(--sh)', overflow:'hidden', transition:'.2s', animation:`fadeUp .3s ease ${i*0.05}s both', cursor:'default' }}>
                  <div style={{ padding:'20px 22px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:11, flexWrap:'wrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'var(--ink2)' }}>
                        <div style={{ width:22, height:22, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', fontFamily:'Syne,sans-serif', background:proj.eColor, flexShrink:0 }}>{proj.eInit}</div>
                        {proj.empresa}
                      </div>
                      <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--border2)' }}/>
                      <span style={{ fontSize:11, color:'var(--muted)' }}>{timeAgo(proj.createdAt)}</span>
                      <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--border2)' }}/>
                      <span style={{ fontSize:11, color:'var(--muted)', display:'flex', alignItems:'center', gap:3 }}><Ic n="map" s={11}/>{proj.ubicacion}</span>
                      {proj.tags.includes('Urgente') && <Tag t="Urgente"/>}
                    </div>
                    <div onClick={()=>handleOpenDetail(proj.id)} style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, lineHeight:1.25, marginBottom:8, color:'var(--ink)', cursor:'pointer' }}
                      onMouseEnter={e=>e.target.style.color='var(--accent)'} onMouseLeave={e=>e.target.style.color='var(--ink)'}>
                      {proj.nombre}
                    </div>
                    <div style={{ fontSize:13, color:'var(--ink2)', lineHeight:1.65, marginBottom:13 }}>{proj.descripcion}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
                      {proj.tags.filter(t=>t!=='Urgente').map(t=><Tag key={t} t={t} onClick={()=>toggleTag(t)}/>)}
                    </div>
                  </div>
                  {/* Stats bar */}
                  <div style={{ display:'flex', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
                    {[['PARTIDAS',proj.partidas.length,''],['PRESUP. REF.',fmt(totalRef),'var(--accent)'],['OFERTAS',projBids.length,''],best?['MEJOR OFERTA',fmt(best.precio),'var(--green)']:null,['VISITAS',`👁 ${proj.views}`,'']].filter(Boolean).map(([l,v,c],idx,arr)=>(
                      <div key={l} style={{ flex:1, padding:'10px 14px', borderRight:idx<arr.length-1?'1px solid var(--border)':'none' }}>
                        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:500, color:c||'var(--ink)' }}>{v}</div>
                        <div style={{ fontSize:10, color:'var(--muted)', fontWeight:700, letterSpacing:'.04em', marginTop:2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Actions */}
                  <div style={{ padding:'12px 22px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <button onClick={()=>handleOpenDetail(proj.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:'var(--ink)', color:'#fff' }}>
                      <Ic n="euro" s={14}/> Ver y pujar
                    </button>
                    <button onClick={()=>handleOpenDetail(proj.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'var(--ink2)', border:'1.5px solid var(--border)' }}>
                      Ver detalle →
                    </button>
                    <button onClick={()=>copyLink(proj.slug)} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'var(--muted)', border:'1.5px solid var(--border)' }} title="Copiar enlace compartible">
                      <Ic n="share" s={14}/>
                    </button>
                    <button onClick={()=>setFavs(f=>f.includes(proj.id)?f.filter(x=>x!==proj.id):[...f,proj.id])}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 13px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:isFav?'var(--accent-l)':'transparent', color:isFav?'var(--accent)':'var(--muted)', border:`1.5px solid ${isFav?'var(--accent)':'var(--border)'}` }}>
                      {isFav?'♥ Guardada':'♡ Guardar'}
                    </button>
                    <div style={{ marginLeft:'auto', fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, padding:'6px 12px', borderRadius:8, display:'flex', alignItems:'center', gap:4, ...dlStyle }}>
                      <Ic n="clock" s={11}/>{dlText}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>

      {/* MODALS & PANELS */}
      {detailProj && <DetailPanel proj={detailProj} bids={bids} user={user} onClose={()=>setDetailId(null)} onBid={handleBid} onLogin={()=>setShowLogin(true)}/>}
      {showNew    && <NewProjectModal user={user} onClose={()=>setShowNew(false)} onSubmit={handleNewProject} onLogin={()=>{setShowNew(false);setShowLogin(true)}}/>}
      {showLogin  && <LoginModal onClose={()=>setShowLogin(false)} onLogin={u=>{setUser(u);setShowLogin(false);showToast(`👋 Bienvenido, ${u.nombre}`)}}/>}
      {toast      && <Toast msg={toast}/>}
    </>
  )
}
