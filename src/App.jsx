import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'

// UUID del usuario administrador — ve todos los precios y conversaciones
const ADMIN_USER_ID = '4ab86804-df35-49c6-9919-2480ae898863'

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const SPECIALTY = ['Micropilotes','Pilotes CPI','Inyecciones','Pantallas','Muros','Mejora terreno','Anclajes','Sondeos','Cimentaciones especiales']
const ZONES     = ['Madrid','Barcelona','Sevilla','Valencia','Bilbao','Zaragoza','Málaga','Galicia','Canarias']
const TYPES     = ['Obra pública','Obra privada','Urgente','Industrial','Residencial','Infraestructura']
const ALL_TAGS  = [...SPECIALTY, ...ZONES, ...TYPES]
const COLORS    = ['#1a4d7a','#0a7c6e','#c0392b','#5a3fa0','#d4820a','#2d6a2d','#8b2fc9']
const EMAILJS_PUBLIC_KEY  = '8XyB1sBak9kOD8d-k'
const EMAILJS_SERVICE_ID  = 'service_w9gs91b'
const EMAILJS_TEMPLATE_ID = 'template_cyiz73e'
const MAX_FILE_BID  = 10 * 1024 * 1024  // 10MB
const MAX_FILE_PROJ = 25 * 1024 * 1024  // 25MB

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt      = n => new Intl.NumberFormat('es-ES').format(Math.round(n)) + ' €'
const daysLeft = d => Math.ceil((new Date(d) - new Date()) / 86400000)
const timeAgo  = d => { const days = Math.floor((new Date()-new Date(d))/86400000); return days===0?'Hoy':days===1?'Ayer':`Hace ${days}d` }
const slugify  = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,60)
const uid      = () => Math.random().toString(36).slice(2,10)
const tagCat   = t => SPECIALTY.includes(t)?'sp':ZONES.includes(t)?'zo':'ty'
const fmtSize  = b => b > 1024*1024 ? (b/1024/1024).toFixed(1)+'MB' : (b/1024).toFixed(0)+'KB'

// ─── ICONOS ───────────────────────────────────────────────────────────────────
function Ic({ n, s=16 }) {
  const p = { width:s, height:s, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' }
  const icons = {
    search:   <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus:     <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x:        <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check:    <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    back:     <svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    clock:    <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    euro:     <svg {...p}><path d="M4 10h12M4 14h12M19.5 9.5a7 7 0 100 5"/></svg>,
    logout:   <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    copy:     <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
    globe:    <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    user:     <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    zap:      <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    paperclip:<svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
    file:     <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    trash:    <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    msg:      <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    send:     <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    building: <svg {...p}><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>,
    eye:      <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    lock:     <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  }
  return icons[n] || null
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  return (
    <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#18170f', color:'#fff', padding:'11px 22px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, zIndex:9999, boxShadow:'0 8px 32px rgba(0,0,0,.2)', pointerEvents:'none', animation:'toastIn .3s, toastOut .3s 1.7s forwards' }}>
      {msg}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes toastOut{to{opacity:0;transform:translateX(-50%) translateY(8px)}}`}</style>
    </div>
  )
}

// ─── TAG ──────────────────────────────────────────────────────────────────────
function Tag({ t, onClick }) {
  const colors = { sp:{bg:'#f0ecff',col:'#5a3fa0'}, zo:{bg:'#e5eef7',col:'#1a4d7a'}, ty:{bg:'#fef3e2',col:'#c97a0a'} }
  const urg = t === 'Urgente'
  const c = urg ? {bg:'#fdecea',col:'#c0392b'} : colors[tagCat(t)]
  return <span onClick={onClick} style={{ padding:'3px 8px', borderRadius:4, fontSize:11, fontWeight:600, cursor:'pointer', background:c.bg, color:c.col, display:'inline-flex', alignItems:'center' }}>{urg?'URGENTE':t}</span>
}

// ─── TAG INPUT ────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const add = t => { const v=t.trim(); if(v&&!tags.includes(v)) onChange([...tags,v]); setInput('') }
  const rem = t => onChange(tags.filter(x=>x!==t))
  return (
    <>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, padding:8, border:'1.5px solid #ddd', borderRadius:6, background:'#fff', minHeight:42 }}>
        {tags.map(t=>(
          <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:4, fontSize:12, fontWeight:600, background:'#e5eef7', color:'#1a4d7a' }}>
            #{t}<span style={{ cursor:'pointer', opacity:.7, fontSize:15 }} onClick={()=>rem(t)}>×</span>
          </span>
        ))}
        <input style={{ border:'none', outline:'none', fontSize:13, flex:1, minWidth:80, background:'transparent' }} placeholder="Escribe y pulsa Enter..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(['Enter',',',' '].includes(e.key)){e.preventDefault();add(input)} }} />
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:6 }}>
        {ALL_TAGS.filter(t=>!tags.includes(t)).slice(0,12).map(t=>(
          <button key={t} onClick={()=>add(t)} style={{ padding:'3px 8px', borderRadius:4, fontSize:11, border:'1px solid #ddd', background:'transparent', cursor:'pointer' }}>+{t}</button>
        ))}
      </div>
    </>
  )
}

// ─── UPLOAD ARCHIVOS ──────────────────────────────────────────────────────────
function FileUploader({ archivos, onChange, maxSize, label }) {
  const ref = useRef()
  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    const nuevos = []
    for (const file of files) {
      if (file.size > maxSize) { alert(`${file.name} supera el límite de ${fmtSize(maxSize)}`); continue }
      const path = `${uid()}-${file.name.replace(/[^a-z0-9.\-_]/gi,'_')}`
      const { error } = await supabase.storage.from('obralicit-files').upload(path, file)
      if (error) { alert('Error subiendo ' + file.name + ': ' + error.message); continue }
      // Bucket privado: generar URL firmada válida 1 año
      const { data: signedData, error: signErr } = await supabase.storage
        .from('obralicit-files')
        .createSignedUrl(path, 60 * 60 * 24 * 365)
      const url = signedData?.signedUrl || ''
      if (signErr) console.warn('Error generando URL:', signErr)
      nuevos.push({ nombre: file.name, path, url, size: file.size, tipo: file.type })
    }
    if (nuevos.length) onChange([...archivos, ...nuevos])
    e.target.value = ''
  }
  async function removeFile(path) {
    await supabase.storage.from('obralicit-files').remove([path])
    onChange(archivos.filter(a=>a.path!==path))
  }
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
        {archivos.map(a=>(
          <div key={a.path} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:6, fontSize:12 }}>
            <Ic n="file" s={13}/> <a href={a.url} target="_blank" rel="noreferrer" style={{ color:'#5a3fa0', textDecoration:'none', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nombre}</a>
            <span style={{ fontSize:10, color:'#888' }}>({fmtSize(a.size)})</span>
            <button onClick={()=>removeFile(a.path)} style={{ background:'none', border:'none', cursor:'pointer', color:'#c0392b', fontSize:16, lineHeight:1 }}>×</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={()=>ref.current.click()} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', border:'1.5px dashed #bbb', borderRadius:6, background:'transparent', cursor:'pointer', fontSize:12, color:'#666', fontFamily:'Barlow,sans-serif' }}>
        <Ic n="paperclip" s={13}/> {label || 'Adjuntar archivo'} (máx. {fmtSize(maxSize)})
      </button>
      <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display:'none' }} onChange={handleFiles} />
    </div>
  )
}

// ─── PANTALLA AUTH ────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin]     = useState(true)
  const [email, setEmail]         = useState('')
  const [pass, setPass]           = useState('')
  const [nombre, setNombre]       = useState('')
  const [empresa, setEmpresa]     = useState('')
  const [cif, setCif]             = useState('')
  const [role, setRole]           = useState('subcontrata')
  const [tipo, setTipo]           = useState('principal')
  const [loading, setLoading]     = useState(false)
  const [msg, setMsg]             = useState({ text:'', ok:false })

  async function handle(e) {
    e.preventDefault()
    setMsg({ text:'', ok:false })
    setLoading(true)
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) throw error
        const { data: co } = await supabase.from('companies').select('*').eq('id', data.user.id).single()
        if (co?.estado === 'pendiente') throw new Error('Tu cuenta está pendiente de aprobación por la empresa principal con ese CIF.')
        onLogin(data.user, co)
      } else {
        if (!nombre||!empresa||!cif) throw new Error('Rellena todos los campos obligatorios')
        const cifLimpio = cif.trim().toUpperCase()
        // Comprobar si existe empresa con ese CIF
        const { data: empresaExistente } = await supabase.from('companies').select('id,name').eq('cif', cifLimpio).maybeSingle()
        if (empresaExistente && tipo === 'principal') {
          throw new Error(`Ya existe una empresa registrada con el CIF ${cifLimpio}. Si eres una filial o departamento, selecciona esa opción.`)
        }
        const estadoInicial = empresaExistente ? 'pendiente' : 'activo'
        // Crear usuario en Supabase Auth
        const { data, error } = await supabase.auth.signUp({ email, password: pass })
        if (error) throw error
        if (data.user) {
          const { error: pe } = await supabase.from('companies').insert([{
            id: data.user.id, name: empresa, role, telefono: '', cif: cifLimpio,
            estado: estadoInicial, parent_id: empresaExistente?.id || null, verified: !empresaExistente
          }])
          if (pe) throw pe
          // Si es filial, crear solicitud y notificar
          if (empresaExistente) {
            await supabase.from('company_requests').insert([{
              cif: cifLimpio, empresa_nueva: data.user.id, empresa_madre: empresaExistente.id, tipo
            }])
            // Notificar por email
            try {
              window.emailjs?.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                proyecto_nombre: 'Solicitud de acceso ObraLicit',
                partida_nombre: `Nueva empresa solicita unirse con CIF ${cifLimpio}`,
                constructora_nombre: empresaExistente.name,
                email_constructora: email,
                subcontrata_nombre: empresa,
                precio: 'Pendiente aprobación',
                plazo: 'N/A',
                observaciones: `${empresa} quiere unirse como ${tipo} de vuestra empresa. Entra en ObraLicit para aprobar o denegar.`,
                telefono_contacto: 'Ver plataforma'
              }, EMAILJS_PUBLIC_KEY)
            } catch(e) { console.warn('Email no enviado:', e) }
            setMsg({ text: 'Solicitud enviada. La empresa principal con ese CIF recibirá un aviso para aprobar tu acceso. Mientras tanto tu cuenta está pendiente.', ok: true })
          } else {
            setMsg({ text: 'Cuenta creada correctamente. Ya puedes iniciar sesión.', ok: true })
            setIsLogin(true)
          }
        }
      }
    } catch (err) {
      setMsg({ text: err.message, ok: false })
    } finally {
      setLoading(false)
    }
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', fontFamily:'Barlow,sans-serif', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:11, fontWeight:700, letterSpacing:'.06em', color:'#888', marginBottom:5, fontFamily:'Syne,sans-serif' }

  return (
    <div style={{ minHeight:'100vh', background:'#f2f0eb', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:40, width:'100%', maxWidth:460, boxShadow:'0 8px 40px rgba(0,0,0,.1)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:48, height:48, background:'#18170f', borderRadius:10, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#e85d04', fontFamily:'Syne,sans-serif', marginBottom:10 }}>O</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800 }}>ObraLicit</div>
          <div style={{ fontSize:12, color:'#888', marginTop:3 }}>Red de contratación transparente para obra</div>
        </div>
        <h3 style={{ fontFamily:'Syne,sans-serif', marginBottom:20, fontSize:17 }}>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h3>

        {!isLogin && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:18 }}>
              {[['constructora','Constructora'],['subcontrata','Subcontrata'],['especialista','Especialista']].map(([r,l])=>(
                <div key={r} onClick={()=>setRole(r)} style={{ border:`2px solid ${role===r?'#e85d04':'#ddd'}`, borderRadius:8, padding:'10px 6px', textAlign:'center', cursor:'pointer', background:role===r?'#fff2ec':'transparent' }}>
                  <div style={{ fontSize:11, fontWeight:700, fontFamily:'Syne,sans-serif' }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:12 }}><label style={lbl}>TU NOMBRE *</label><input style={inp} placeholder="Nombre y apellidos" value={nombre} onChange={e=>setNombre(e.target.value)} required /></div>
            <div style={{ marginBottom:12 }}><label style={lbl}>EMPRESA *</label><input style={inp} placeholder="Nombre de tu empresa" value={empresa} onChange={e=>setEmpresa(e.target.value)} required /></div>
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>CIF DE LA EMPRESA *</label>
              <input style={inp} placeholder="B12345678" value={cif} onChange={e=>setCif(e.target.value)} required />
              <div style={{ fontSize:11, color:'#888', marginTop:4 }}>Si el CIF ya existe, podrás unirte como filial pendiente de aprobación</div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>TIPO DE REGISTRO</label>
              <select style={{ ...inp, appearance:'auto' }} value={tipo} onChange={e=>setTipo(e.target.value)}>
                <option value="principal">Empresa principal (nuevo CIF)</option>
                <option value="filial">Filial / delegación</option>
                <option value="departamento">Departamento interno</option>
              </select>
            </div>
          </>
        )}

        <form onSubmit={handle}>
          <div style={{ marginBottom:12 }}><label style={lbl}>EMAIL *</label><input style={inp} type="email" placeholder="tu@empresa.com" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
          <div style={{ marginBottom:20 }}><label style={lbl}>CONTRASEÑA *</label><input style={inp} type="password" placeholder="Mínimo 6 caracteres" value={pass} onChange={e=>setPass(e.target.value)} required minLength={6} /></div>
          {msg.text && <div style={{ padding:'10px 14px', background:msg.ok?'#e5f4ec':'#fdecea', color:msg.ok?'#1a6b3a':'#c0392b', borderRadius:6, fontSize:13, marginBottom:16, lineHeight:1.5 }}>{msg.text}</div>}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:13, background:'#e85d04', color:'#fff', border:'none', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, cursor:'pointer', opacity:loading?.6:1 }}>
            {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#666' }}>
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button onClick={()=>{setIsLogin(!isLogin);setMsg({text:'',ok:false})}} style={{ background:'none', border:'none', color:'#e85d04', cursor:'pointer', fontWeight:700, fontSize:13 }}>
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}

// ─── FORMULARIO PUJA ──────────────────────────────────────────────────────────
function BidForm({ partida, onSubmit, onCancel }) {
  const [precio, setPrecio]         = useState('')
  const [plazo, setPlazo]           = useState('')
  const [obs, setObs]               = useState('')
  const [tel, setTel]               = useState('')
  const [validezTipo, setValidezT]  = useState('indefinida')
  const [validezFecha, setValidezF] = useState('')
  const [archivos, setArchivos]     = useState([])
  const [loading, setLoading]       = useState(false)

  const num    = parseFloat(precio||0)
  const total  = num * partida.medicion
  const saving = precio ? ((partida.precioSalida-num)/partida.precioSalida*100).toFixed(1) : null
  const isOk   = saving !== null && parseFloat(saving) > 0

  async function submit(e) {
    e.preventDefault()
    if (!precio||isNaN(num)) return
    setLoading(true)
    await onSubmit({ precio:num, plazo:parseInt(plazo)||0, obs, tel, validezTipo, validezFecha, archivos })
    setLoading(false)
  }

  const inp = { padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', width:'100%', fontFamily:'Barlow,sans-serif' }
  const lbl = { fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.06em', color:'#888', display:'block', marginBottom:4 }

  return (
    <form onSubmit={submit} style={{ padding:16, background:'#fff9f5', borderTop:'2px solid #ffcba4' }}>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
        <Ic n="lock" s={14}/> Oferta confidencial — solo la constructora verá tu precio
      </div>
      <div style={{ background:'#fff2ec', border:'1px solid #ffcba4', borderRadius:6, padding:'9px 13px', marginBottom:13, fontSize:12, color:'#c94f03' }}>
        Precio salida: <strong>{fmt(partida.precioSalida)}/{partida.unidad}</strong> — Medición: <strong>{partida.medicion} {partida.unidad}</strong> — Total ref: <strong>{fmt(partida.medicion*partida.precioSalida)}</strong>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <label style={lbl}>PRECIO UNITARIO (€/{partida.unidad}) *</label>
          <input style={inp} type="number" placeholder="0.00" value={precio} onChange={e=>setPrecio(e.target.value)} required />
          {saving!==null && <div style={{ fontSize:11, marginTop:3, fontWeight:600, color:isOk?'#1a6b3a':'#c0392b' }}>Total: {fmt(total)} — {isOk?'-':'+'}{Math.abs(saving)}% vs salida</div>}
        </div>
        <div>
          <label style={lbl}>PLAZO (días)</label>
          <input style={inp} type="number" placeholder="15" value={plazo} onChange={e=>setPlazo(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={lbl}>OBSERVACIONES Y CONDICIONES</label>
        <textarea style={{ ...inp, resize:'vertical', minHeight:72, fontSize:13, lineHeight:1.5 }} placeholder="Qué incluye/excluye, maquinaria disponible, referencias..." value={obs} onChange={e=>setObs(e.target.value)} />
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={lbl}>TELÉFONO DE CONTACTO</label>
        <input style={inp} type="tel" placeholder="6XX XXX XXX" value={tel} onChange={e=>setTel(e.target.value)} />
      </div>
      {/* VALIDEZ */}
      <div style={{ marginBottom:10 }}>
        <label style={lbl}>VALIDEZ DE LA OFERTA</label>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select style={{ ...inp, flex:1, appearance:'auto' }} value={validezTipo} onChange={e=>setValidezT(e.target.value)}>
            <option value="indefinida">Indefinida</option>
            <option value="fecha">Hasta una fecha</option>
          </select>
          {validezTipo==='fecha' && <input style={{ ...inp, flex:1 }} type="date" value={validezFecha} onChange={e=>setValidezF(e.target.value)} required min={new Date().toISOString().split('T')[0]} />}
        </div>
      </div>
      {/* ARCHIVOS */}
      <div style={{ marginBottom:14 }}>
        <label style={lbl}>DOCUMENTACIÓN ADJUNTA (máx. 10MB por archivo)</label>
        <FileUploader archivos={archivos} onChange={setArchivos} maxSize={MAX_FILE_BID} label="Adjuntar certificados, fichas técnicas..." />
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button type="submit" disabled={!precio||loading} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 22px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', opacity:(!precio||loading)?.5:1 }}>
          {loading ? 'Publicando...' : 'Publicar oferta'}
        </button>
        <button type="button" onClick={onCancel} style={{ background:'transparent', color:'#888', border:'1.5px solid #ddd', padding:'10px 16px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
      </div>
    </form>
  )
}

// ─── PANEL DETALLE ────────────────────────────────────────────────────────────
function DetailPanel({ proj, bids, user, company, onClose, onBid }) {
  const [openForm, setOpenForm] = useState(null)
  const [copied, setCopied]     = useState(false)
  const totalRef  = (proj.partidas||[]).reduce((s,p)=>s+p.medicion*p.precioSalida,0)
  const dl        = daysLeft(proj.fecha_cierre)
  const projBids  = bids.filter(b=>b.proyecto_id===proj.id && !b.expirada)
  const esAdmin        = user?.id === ADMIN_USER_ID
  const esConstructora = company?.role === 'constructora' || esAdmin

  function handleCopy() {
    navigator.clipboard?.writeText?.(`${window.location.origin}/?l=${proj.slug}`)
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  const dlStyle = dl<=2?{bg:'#fdecea',col:'#c0392b'}:dl<=7?{bg:'#fef3e2',col:'#c97a0a'}:{bg:'#e5f4ec',col:'#1a6b3a'}

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.5)', backdropFilter:'blur(5px)', display:'flex' }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ marginLeft:'auto', width:'min(740px,100vw)', background:'#fff', height:'100vh', overflowY:'auto', boxShadow:'0 0 60px rgba(0,0,0,.2)' }}>
        {/* HERO */}
        <div style={{ background:'#18170f', color:'#fff', padding:'24px 28px 20px' }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,.4)', cursor:'pointer', marginBottom:14, border:'none', background:'none' }}>
            <Ic n="back" s={13}/> Volver
          </button>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:5, fontWeight:600 }}>{proj.empresa}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, lineHeight:1.2, marginBottom:8 }}>{proj.nombre}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.65 }}>{proj.descripcion}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:12 }}>
                {proj.tags?.map(t=><span key={t} style={{ padding:'3px 9px', borderRadius:4, fontSize:11, fontWeight:600, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)' }}>{t}</span>)}
              </div>
            </div>
            <div style={{ padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4, flexShrink:0, background:dlStyle.bg, color:dlStyle.col }}>
              <Ic n="clock" s={11}/>{dl<=0?'Vence hoy':`${dl}d`}
            </div>
          </div>
          {/* Archivos del proyecto */}
          {proj.archivos?.length>0 && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, fontWeight:700 }}>DOCUMENTACIÓN</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {proj.archivos.map(a=>(
                  <a key={a.path} href={a.url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:'rgba(255,255,255,.1)', borderRadius:6, fontSize:12, color:'rgba(255,255,255,.8)', textDecoration:'none' }}>
                    <Ic n="file" s={12}/> {a.nombre}
                  </a>
                ))}
              </div>
            </div>
          )}
          {/* Compartir */}
          <div style={{ background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 13px', marginTop:14, display:'flex', alignItems:'center', gap:10 }}>
            <Ic n="globe" s={13}/>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'rgba(255,255,255,.4)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{window.location.origin}/?l={proj.slug}</span>
            <button onClick={handleCopy} style={{ padding:'4px 12px', background:copied?'#0a7c6e':'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', border:'1px solid rgba(255,255,255,.12)', borderRadius:5, fontSize:11, fontWeight:700, cursor:'pointer' }}>
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          {/* KPIs */}
          <div style={{ display:'flex', gap:20, marginTop:14, flexWrap:'wrap' }}>
            {[['Presupuesto',fmt(totalRef)],['Partidas',(proj.partidas||[]).length],['Ofertas',projBids.length],['Cierre',proj.fecha_cierre]].map(([l,v])=>(
              <div key={l}><div style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700 }}>{l}</div><div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:600, color:'#fff', marginTop:2 }}>{v}</div></div>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding:'22px 28px' }}>
          {/* AVISO PUJA CIEGA */}
          {!esConstructora && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:8, marginBottom:16, fontSize:13, color:'#5a3fa0' }}>
              <Ic n="lock" s={15}/> <strong>Pujas confidenciales</strong> — No verás los precios de otras empresas. Solo la constructora tiene acceso al ranking completo.
            </div>
          )}

          <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'.08em', color:'#888', textTransform:'uppercase', marginBottom:14, paddingBottom:8, borderBottom:'1px solid #eee' }}>
            Partidas y ofertas
          </div>

          {(proj.partidas||[]).map(partida => {
            const todasPBids = projBids.filter(b=>b.partida_id===partida.id)
            // Constructora ve todo, subcontrata solo ve la suya
            const pBids = esConstructora ? todasPBids.sort((a,b)=>a.precio-b.precio) : todasPBids.filter(b=>b.user_id===user?.id)
            const myBid = user && todasPBids.find(b=>b.user_id===user.id)
            const best  = esConstructora && todasPBids.length ? todasPBids.reduce((a,b)=>a.precio<b.precio?a:b) : null
            const isOpen = openForm===partida.id

            return (
              <div key={partida.id} style={{ border:'1px solid #eee', borderRadius:10, overflow:'hidden', marginBottom:14 }}>
                {/* Cabecera partida */}
                <div style={{ padding:'13px 16px', background:'#f8f7f4', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#888' }}>{partida.codigo}</div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, margin:'3px 0 5px' }}>{partida.descripcion}</div>
                    <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                      {[['Medición',`${partida.medicion} ${partida.unidad}`],['P.salida',`${fmt(partida.precioSalida)}/${partida.unidad}`],['Total ref',fmt(partida.medicion*partida.precioSalida)]].map(([l,v])=>(
                        <span key={l} style={{ fontSize:12, color:'#888' }}>{l}: <strong style={{ color:'#333', fontFamily:'JetBrains Mono,monospace' }}>{v}</strong></span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                    {/* Solo constructora ve mejor precio */}
                    {best && <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'#888' }}>Mejor oferta</div><div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:17, fontWeight:600, color:'#1a6b3a' }}>{fmt(best.precio)}</div></div>}
                    {/* Subcontrata: número de ofertas sin precios */}
                    {!esConstructora && <div style={{ fontSize:11, color:'#888' }}>{todasPBids.length} oferta{todasPBids.length!==1?'s':''} recibida{todasPBids.length!==1?'s':''}</div>}
                    {!myBid && proj.estado==='abierta' && user && (
                      <button onClick={()=>setOpenForm(isOpen?null:partida.id)} style={{ background:'#18170f', color:'#fff', border:'none', padding:'7px 14px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                        {isOpen?'Cancelar':'Pujar'}
                      </button>
                    )}
                    {!user && <div style={{ fontSize:12, color:'#888' }}>Inicia sesión para pujar</div>}
                    {myBid && <div style={{ padding:'8px 12px', background:'#e4f5f2', borderRadius:6, fontSize:12, color:'#0a7c6e', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}><Ic n="check" s={12}/> Tu oferta: {fmt(myBid.precio)}</div>}
                  </div>
                </div>

                {isOpen && user && <BidForm partida={partida} onSubmit={f=>{ onBid(proj,partida,f); setOpenForm(null) }} onCancel={()=>setOpenForm(null)}/>}

                {/* LISTA DE PUJAS */}
                {pBids.length > 0 ? pBids.map((bid,idx)=>{
                  const saving = ((partida.precioSalida-bid.precio)/partida.precioSalida*100).toFixed(1)
                  const rkCol  = idx===0?'#1a6b3a':idx===1?'#c97a0a':'#888'
                  const esMia  = bid.user_id===user?.id
                  return (
                    <div key={bid.id} style={{ padding:'13px 16px', borderBottom:'1px solid #f0f0f0', display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'start', background:bid.estado==='adjudicada'?'#e5f4ec':esMia&&!esConstructora?'#f8f7f4':'transparent' }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                          {esConstructora && <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', background:rkCol, flexShrink:0 }}>{idx+1}</div>}
                          <div>
                            <div style={{ fontSize:13, fontWeight:700 }}>
                              {esConstructora ? bid.empresa : 'Tu oferta'}
                              {bid.estado==='adjudicada' && <span style={{ fontSize:10, background:'#1a6b3a', color:'#fff', padding:'2px 8px', borderRadius:4, fontWeight:700, marginLeft:6 }}>ADJUDICADA</span>}
                            </div>
                            {esConstructora && <div style={{ fontSize:11, color:'#888', marginTop:1 }}>{bid.contacto}{bid.telefono?` — ${bid.telefono}`:''}</div>}
                          </div>
                        </div>
                        {bid.observaciones && <div style={{ fontSize:12, color:'#444', marginTop:7, lineHeight:1.55, fontStyle:'italic', padding:'8px 10px', background:'#f8f7f4', borderRadius:6, borderLeft:'3px solid #ddd' }}>"{bid.observaciones}"</div>}
                        <div style={{ display:'flex', gap:12, marginTop:6, flexWrap:'wrap' }}>
                          {bid.plazo>0 && <span style={{ fontSize:11, color:'#888' }}>Plazo: {bid.plazo}d</span>}
                          <span style={{ fontSize:11, color:'#888' }}>{bid.fecha}</span>
                          {bid.validez_tipo==='fecha' && bid.validez_fecha && <span style={{ fontSize:11, color:'#c97a0a' }}>Válida hasta: {bid.validez_fecha}</span>}
                          {bid.validez_tipo==='indefinida' && <span style={{ fontSize:11, color:'#888' }}>Validez indefinida</span>}
                        </div>
                        {/* Archivos de la puja */}
                        {bid.archivos?.length>0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
                            {bid.archivos.map(a=>(
                              <a key={a.path} href={a.url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:5, fontSize:11, color:'#5a3fa0', textDecoration:'none' }}>
                                <Ic n="file" s={11}/> {a.nombre}
                              </a>
                            ))}
                          </div>
                        )}
                        {bid.feedback && (
                          <div style={{ marginTop:8, padding:'8px 10px', background:'#fef3e2', borderRadius:6, fontSize:12, color:'#c97a0a', borderLeft:'3px solid #c97a0a' }}>
                            <strong>Feedback:</strong> "{bid.feedback}"
                            {bid.rating && <div style={{ display:'flex', gap:2, marginTop:4 }}>{[1,2,3,4,5].map(i=><span key={i} style={{ fontSize:13, color:i<=bid.rating?'#e85d04':'#ddd' }}>★</span>)}</div>}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:10, color:'#888', marginBottom:2 }}>precio/ud</div>
                        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:18, fontWeight:600, color:idx===0&&esConstructora?'#1a6b3a':'#333' }}>{fmt(bid.precio)}</div>
                        {esConstructora && <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, display:'inline-block', marginTop:3, background:parseFloat(saving)>0?'#e5f4ec':'#fdecea', color:parseFloat(saving)>0?'#1a6b3a':'#c0392b' }}>
                          {parseFloat(saving)>0?'-':'+'}{Math.abs(saving)}% vs salida
                        </span>}
                      </div>
                    </div>
                  )
                }) : (
                  <div style={{ padding:'18px 16px', fontSize:13, color:'#888', fontStyle:'italic', textAlign:'center' }}>
                    {user ? (esConstructora ? 'Sin ofertas todavía' : 'Sé el primero en pujar esta partida') : 'Inicia sesión para ver y presentar ofertas'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── MODAL NUEVO PROYECTO ──────────────────────────────────────────────────────
function NewProjectModal({ company, session, onClose, onSubmit }) {
  const [step, setStep]         = useState(1)
  const [nombre, setNombre]     = useState('')
  const [desc, setDesc]         = useState('')
  const [ubic, setUbic]         = useState('')
  const [fecha, setFecha]       = useState('')
  const [email_c, setEmailC]    = useState('')
  const [tags, setTags]         = useState([])
  const [partidas, setPartidas] = useState([])
  const [archivos, setArchivos] = useState([])
  const [pf, setPf]             = useState({ codigo:'', desc:'', unidad:'ud', medicion:'', precio:'' })
  const [loading, setLoading]   = useState(false)

  function addPartida() {
    if (!pf.desc||!pf.medicion||!pf.precio) return
    setPartidas(prev=>[...prev,{ id:'U'+uid(), codigo:pf.codigo||'P-'+(prev.length+1), descripcion:pf.desc, unidad:pf.unidad, medicion:parseFloat(pf.medicion), precioSalida:parseFloat(pf.precio) }])
    setPf({ codigo:'', desc:'', unidad:'ud', medicion:'', precio:'' })
  }

  async function publish() {
    setLoading(true)
    await onSubmit({ nombre, desc, ubic, fecha, tags, partidas, archivos, email_contacto: email_c })
    setLoading(false)
    onClose()
  }

  const inp = { padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', width:'100%', fontFamily:'Barlow,sans-serif' }
  const lbl = { fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.06em', color:'#888', display:'block', marginBottom:4 }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,.6)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:660, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.2)' }}>
        <div style={{ padding:'24px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800 }}>Publicar licitación</div>
            <div style={{ fontSize:13, color:'#888', marginTop:4 }}>Paso {step} de 2 — {step===1?'Información general':'Partidas y documentación'}</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'#f2f0eb', border:'1px solid #ddd', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:20 }}>×</button>
        </div>
        <div style={{ padding:'20px 28px' }}>
          <div style={{ display:'flex', gap:6, marginBottom:22 }}>
            {[1,2].map(s=><div key={s} style={{ flex:1, height:4, borderRadius:2, background:s<=step?'#e85d04':'#eee', transition:'.3s' }}/>)}
          </div>
          {step===1 && (
            <>
              <div style={{ marginBottom:12 }}><label style={lbl}>NOMBRE DEL PROYECTO *</label><input style={inp} placeholder="Ej: Viaducto M-50 — Cimentaciones especiales" value={nombre} onChange={e=>setNombre(e.target.value)} /></div>
              <div style={{ marginBottom:12 }}><label style={lbl}>DESCRIPCIÓN</label><textarea style={{ ...inp, resize:'vertical', minHeight:72, fontSize:13 }} placeholder="Alcance, condicionantes, maquinaria requerida..." value={desc} onChange={e=>setDesc(e.target.value)} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                <div><label style={lbl}>UBICACIÓN</label><input style={inp} placeholder="Ciudad / provincia" value={ubic} onChange={e=>setUbic(e.target.value)} /></div>
                <div><label style={lbl}>FECHA LÍMITE *</label><input style={inp} type="date" value={fecha} onChange={e=>setFecha(e.target.value)} /></div>
              </div>
              <div style={{ marginBottom:12 }}><label style={lbl}>EMAIL CONTACTO (para notificaciones de pujas)</label><input style={inp} type="email" placeholder="obras@tuempresa.com" value={email_c} onChange={e=>setEmailC(e.target.value)} /></div>
              <div><label style={lbl}>ETIQUETAS</label><TagInput tags={tags} onChange={setTags}/></div>
            </>
          )}
          {step===2 && (
            <>
              {partidas.map(p=>(
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', background:'#fff', border:'1px solid #eee', borderRadius:6, marginBottom:6 }}>
                  <div><div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600 }}>{p.descripcion}</div><div style={{ fontSize:11, color:'#888', marginTop:1 }}>{p.codigo} — {p.medicion} {p.unidad} — {fmt(p.precioSalida)}/{p.unidad}</div></div>
                  <button onClick={()=>setPartidas(prev=>prev.filter(x=>x.id!==p.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:20 }}>×</button>
                </div>
              ))}
              <div style={{ background:'#f8f7f4', border:'1px solid #eee', borderRadius:10, padding:14, marginTop:8, marginBottom:14 }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:12 }}>+ Nueva partida</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:9 }}>
                  <div><label style={lbl}>CÓDIGO</label><input style={inp} placeholder="CIM-001" value={pf.codigo} onChange={e=>setPf(f=>({...f,codigo:e.target.value}))} /></div>
                  <div><label style={lbl}>UNIDAD</label><select style={{ ...inp, appearance:'auto' }} value={pf.unidad} onChange={e=>setPf(f=>({...f,unidad:e.target.value}))}>{['ud','m','m2','m3','kg','t','PA'].map(u=><option key={u}>{u}</option>)}</select></div>
                </div>
                <div style={{ marginBottom:9 }}><label style={lbl}>DESCRIPCIÓN *</label><input style={inp} placeholder="Micropilote Ø168mm L=12m" value={pf.desc} onChange={e=>setPf(f=>({...f,desc:e.target.value}))} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:10 }}>
                  <div><label style={lbl}>MEDICIÓN *</label><input style={inp} type="number" placeholder="0" value={pf.medicion} onChange={e=>setPf(f=>({...f,medicion:e.target.value}))} /></div>
                  <div><label style={lbl}>PRECIO SALIDA €/ud *</label><input style={inp} type="number" placeholder="0.00" value={pf.precio} onChange={e=>setPf(f=>({...f,precio:e.target.value}))} /></div>
                </div>
                <button onClick={addPartida} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 0', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', width:'100%' }}>
                  + Añadir partida
                </button>
              </div>
              <div>
                <label style={lbl}>DOCUMENTACIÓN DE LA OBRA (planos, BOQs — máx. 25MB por archivo)</label>
                <FileUploader archivos={archivos} onChange={setArchivos} maxSize={MAX_FILE_PROJ} label="Adjuntar documentación técnica" />
              </div>
            </>
          )}
        </div>
        <div style={{ padding:'0 28px 24px', display:'flex', justifyContent:'flex-end', gap:10 }}>
          {step===2 && <button onClick={()=>setStep(1)} style={{ background:'transparent', color:'#888', border:'1.5px solid #ddd', padding:'10px 16px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}>← Atrás</button>}
          <div style={{ flex:1 }}/>
          <button onClick={onClose} style={{ background:'transparent', color:'#888', border:'1.5px solid #ddd', padding:'10px 16px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
          {step===1 && <button onClick={()=>(nombre.trim()&&fecha)&&setStep(2)} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 22px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', opacity:(nombre.trim()&&fecha)?1:.4 }}>Siguiente →</button>}
          {step===2 && <button onClick={publish} disabled={!partidas.length||loading} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 22px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', opacity:partidas.length?1:.4 }}>
            {loading?'Publicando...':'Publicar para todos'}
          </button>}
        </div>
      </div>
    </div>
  )
}

// ─── PANEL PERFIL ─────────────────────────────────────────────────────────────
function ProfilePanel({ user, company, projects, bids, onClose, onOpenDetail, onNewMsg }) {
  const misProyectos = projects.filter(p=>p.user_id===user.id)
  const misPujas     = bids.filter(b=>b.user_id===user.id)
  const adjudicadas  = misPujas.filter(b=>b.estado==='adjudicada')
  const [tab, setTab] = useState('proyectos')

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.5)', backdropFilter:'blur(5px)', display:'flex' }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ marginLeft:'auto', width:'min(680px,100vw)', background:'#fff', height:'100vh', overflowY:'auto', boxShadow:'0 0 60px rgba(0,0,0,.2)' }}>
        <div style={{ background:'#18170f', color:'#fff', padding:'28px 28px 24px' }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,.4)', cursor:'pointer', marginBottom:18, border:'none', background:'none' }}>
            <Ic n="back" s={13}/> Volver
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:60, height:60, borderRadius:14, background:'#e85d04', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', fontFamily:'Syne,sans-serif' }}>
              {(company?.name||'?').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800 }}>{company?.name}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:3 }}>
                {user.id === ADMIN_USER_ID && <span style={{ background:'#e85d04', color:'#fff', padding:'1px 8px', borderRadius:4, fontSize:10, fontWeight:700, marginRight:6 }}>ADMIN</span>}
                {company?.role} — CIF: {company?.cif||'No registrado'}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:2 }}>{user.email}</div>
            </div>
          </div>
          {/* Stats rápidas */}
          <div style={{ display:'flex', gap:20, marginTop:18, flexWrap:'wrap' }}>
            {[['Proyectos publicados',misProyectos.length],['Pujas enviadas',misPujas.length],['Contratos ganados',adjudicadas.length]].map(([l,v])=>(
              <div key={l}><div style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700 }}>{l.toUpperCase()}</div><div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:18, fontWeight:700, color:'#fff', marginTop:2 }}>{v}</div></div>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', borderBottom:'1px solid #eee', background:'#f8f7f4' }}>
          {[['proyectos','Proyectos'],['pujas','Mis pujas'],['empresas','Directorio']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:'14px', border:'none', background:'transparent', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', color:tab===k?'#e85d04':'#888', borderBottom:tab===k?'2px solid #e85d04':'2px solid transparent', transition:'.15s' }}>{l}</button>
          ))}
        </div>

        <div style={{ padding:'20px 28px' }}>
          {tab==='proyectos' && (
            <>
              {misProyectos.length===0 ? <div style={{ textAlign:'center', padding:'40px 20px', color:'#888' }}><div style={{ fontSize:32, marginBottom:10 }}>🏗️</div><div style={{ fontFamily:'Syne', fontWeight:700, marginBottom:6 }}>Sin proyectos publicados</div></div> :
                misProyectos.map(p=>(
                  <div key={p.id} onClick={()=>{ onOpenDetail(p.id); onClose() }} style={{ padding:'14px 16px', border:'1px solid #eee', borderRadius:10, marginBottom:10, cursor:'pointer' }}>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, marginBottom:4 }}>{p.nombre}</div>
                    <div style={{ fontSize:12, color:'#888' }}>{p.ubicacion} — Cierre: {p.fecha_cierre} — {bids.filter(b=>b.proyecto_id===p.id).length} oferta(s)</div>
                    <div style={{ display:'flex', gap:5, marginTop:8, flexWrap:'wrap' }}>
                      {p.tags?.map(t=><Tag key={t} t={t}/>)}
                    </div>
                  </div>
                ))
              }
            </>
          )}
          {tab==='pujas' && (
            <>
              {misPujas.length===0 ? <div style={{ textAlign:'center', padding:'40px 20px', color:'#888' }}><div style={{ fontSize:32, marginBottom:10 }}>📋</div><div style={{ fontFamily:'Syne', fontWeight:700, marginBottom:6 }}>Sin pujas enviadas</div></div> :
                misPujas.map(b=>{
                  const proj = projects.find(p=>p.id===b.proyecto_id)
                  return (
                    <div key={b.id} style={{ padding:'14px 16px', border:'1px solid #eee', borderRadius:10, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{proj?.nombre||'Proyecto'}</div>
                        <div style={{ fontSize:12, color:'#888', marginTop:3 }}>{b.fecha} — Plazo: {b.plazo}d</div>
                        {b.validez_tipo==='fecha' && <div style={{ fontSize:11, color:'#c97a0a', marginTop:2 }}>Válida hasta: {b.validez_fecha}</div>}
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:16, fontWeight:600 }}>{fmt(b.precio)}</div>
                        <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, background:b.estado==='adjudicada'?'#e5f4ec':b.expirada?'#f0f0f0':'#fff8e6', color:b.estado==='adjudicada'?'#1a6b3a':b.expirada?'#888':'#b07a10' }}>
                          {b.expirada?'EXPIRADA':b.estado.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                })
              }
            </>
          )}
          {tab==='empresas' && (
            <EmpresasDirectorio currentUser={user} onNewMsg={onNewMsg}/>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── DIRECTORIO EMPRESAS ──────────────────────────────────────────────────────
function EmpresasDirectorio({ currentUser, onNewMsg }) {
  const [empresas, setEmpresas] = useState([])
  useEffect(()=>{
    supabase.from('companies').select('*').order('name').then(({ data })=>{ if(data) setEmpresas(data) })
  },[])
  return (
    <div>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:14 }}>EMPRESAS REGISTRADAS</div>
      {empresas.filter(e=>e.id!==currentUser.id).map(e=>(
        <div key={e.id} style={{ padding:'12px 14px', border:'1px solid #eee', borderRadius:8, marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:'#e85d04', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', fontFamily:'Syne' }}>{e.name.slice(0,2).toUpperCase()}</div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{e.name}</div>
              <div style={{ fontSize:11, color:'#888', marginTop:1 }}>{e.role} {e.cif?`— CIF: ${e.cif}`:''}</div>
            </div>
          </div>
          <button onClick={()=>onNewMsg(e)} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:6, color:'#5a3fa0', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'Syne' }}>
            <Ic n="msg" s={13}/> Mensaje
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── PANEL MENSAJES ───────────────────────────────────────────────────────────
function MessagesPanel({ user, company, onClose, initialTarget }) {
  const [mensajes, setMensajes]   = useState([])
  const [conv, setConv]           = useState(initialTarget || null) // empresa destinataria
  const [texto, setTexto]         = useState('')
  const [asunto, setAsunto]       = useState('')
  const [loading, setLoading]     = useState(false)

  useEffect(()=>{
    loadMessages()
    const ch = supabase.channel('msgs').on('postgres_changes',{ event:'INSERT', schema:'public', table:'messages' }, payload=>{
      if (payload.new.to_user_id===user.id||payload.new.from_user_id===user.id) setMensajes(prev=>[payload.new,...prev])
    }).subscribe()
    return ()=>supabase.removeChannel(ch)
  },[])

  async function loadMessages() {
    const esAdmin = user.id === ADMIN_USER_ID
    const query = esAdmin
      ? supabase.from('messages').select('*').order('created_at', { ascending:false })
      : supabase.from('messages').select('*').or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`).order('created_at', { ascending:false })
    const { data } = await query
    if (data) setMensajes(data)
  }

  async function enviar() {
    if (!texto.trim()||!conv) return
    setLoading(true)
    await supabase.from('messages').insert([{
      from_user_id: user.id, to_user_id: conv.id,
      from_empresa: company?.name, to_empresa: conv.name,
      asunto: asunto||'Sin asunto', contenido: texto
    }])
    setTexto(''); setAsunto(''); setLoading(false)
  }

  // Conversaciones agrupadas
  const convs = mensajes.reduce((acc, m)=>{
    const otherId = m.from_user_id===user.id ? m.to_user_id : m.from_user_id
    const otherName = m.from_user_id===user.id ? m.to_empresa : m.from_empresa
    if (!acc[otherId]) acc[otherId] = { id:otherId, name:otherName, msgs:[] }
    acc[otherId].msgs.push(m)
    return acc
  }, {})

  const noLeidos = mensajes.filter(m=>m.to_user_id===user.id&&!m.leido).length

  async function marcarLeido(convId) {
    await supabase.from('messages').update({ leido:true }).eq('to_user_id', user.id).eq('from_user_id', convId).eq('leido', false)
    setMensajes(prev=>prev.map(m=>m.from_user_id===convId&&m.to_user_id===user.id ? {...m,leido:true} : m))
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.5)', backdropFilter:'blur(5px)', display:'flex' }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ marginLeft:'auto', width:'min(680px,100vw)', background:'#fff', height:'100vh', display:'flex', flexDirection:'column', boxShadow:'0 0 60px rgba(0,0,0,.2)' }}>
        {/* Header */}
        <div style={{ background:'#18170f', color:'#fff', padding:'20px 28px' }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,.4)', cursor:'pointer', marginBottom:12, border:'none', background:'none' }}>
            <Ic n="back" s={13}/> Volver
          </button>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800 }}>Mensajes {noLeidos>0&&<span style={{ fontSize:12, background:'#e85d04', color:'#fff', padding:'2px 8px', borderRadius:20, marginLeft:8 }}>{noLeidos} nuevo{noLeidos!==1?'s':''}</span>}</div>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          {/* Lista de conversaciones */}
          <div style={{ width:220, borderRight:'1px solid #eee', overflowY:'auto', background:'#f8f7f4' }}>
            {Object.values(convs).length===0 ? (
              <div style={{ padding:20, fontSize:13, color:'#888', textAlign:'center' }}>Sin mensajes</div>
            ) : Object.values(convs).map(c=>{
              const noLeid = c.msgs.filter(m=>m.to_user_id===user.id&&!m.leido).length
              return (
                <div key={c.id} onClick={()=>{ setConv(c); setAsunto(''); marcarLeido(c.id) }} style={{ padding:'12px 16px', cursor:'pointer', background:conv?.id===c.id?'#fff':'transparent', borderBottom:'1px solid #eee' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700 }}>{c.name}</div>
                    {noLeid>0 && <span style={{ fontSize:10, background:'#e85d04', color:'#fff', padding:'1px 6px', borderRadius:10, fontWeight:700 }}>{noLeid}</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#888', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.msgs[0]?.contenido?.slice(0,40)}...</div>
                </div>
              )
            })}
          </div>

          {/* Conversación activa */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {conv ? (
              <>
                <div style={{ padding:'12px 18px', borderBottom:'1px solid #eee', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>
                  Conversación con {conv.name}
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                  {[...(convs[conv.id]?.msgs||[])].reverse().map(m=>{
                    const esMio = m.from_user_id===user.id
                    return (
                      <div key={m.id} style={{ display:'flex', justifyContent:esMio?'flex-end':'flex-start' }}>
                        <div style={{ maxWidth:'75%', padding:'10px 14px', borderRadius:12, background:esMio?'#e85d04':'#f0ecff', color:esMio?'#fff':'#333', fontSize:13, lineHeight:1.5 }}>
                          {m.asunto && m.asunto!=='Sin asunto' && <div style={{ fontSize:10, fontWeight:700, opacity:.7, marginBottom:4 }}>{m.asunto}</div>}
                          {m.contenido}
                          <div style={{ fontSize:10, opacity:.6, marginTop:4 }}>{new Date(m.created_at).toLocaleString('es-ES',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'})}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ padding:'14px 18px', borderTop:'1px solid #eee', display:'flex', flexDirection:'column', gap:8 }}>
                  <input style={{ padding:'8px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13, outline:'none', fontFamily:'Barlow' }} placeholder="Asunto (opcional)" value={asunto} onChange={e=>setAsunto(e.target.value)} />
                  <div style={{ display:'flex', gap:8 }}>
                    <textarea style={{ flex:1, padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13, outline:'none', resize:'none', fontFamily:'Barlow', minHeight:60 }} placeholder="Escribe tu mensaje..." value={texto} onChange={e=>setTexto(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&e.ctrlKey) enviar() }} />
                    <button onClick={enviar} disabled={!texto.trim()||loading} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 16px', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:'Syne', fontWeight:700, fontSize:13, opacity:(!texto.trim()||loading)?.5:1 }}>
                      <Ic n="send" s={15}/>
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:'#888' }}>Ctrl+Enter para enviar</div>
                </div>
              </>
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, color:'#888' }}>
                <Ic n="msg" s={40}/>
                <div style={{ fontFamily:'Syne', fontSize:14, fontWeight:700 }}>Selecciona una conversación</div>
                <div style={{ fontSize:13 }}>O inicia una nueva desde el directorio de empresas</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [session,     setSession]     = useState(null)
  const [company,     setCompany]     = useState(null)
  const [projects,    setProjects]    = useState([])
  const [bids,        setBids]        = useState([])
  const [authReady,   setAuthReady]   = useState(false)
  const [dataLoaded,  setDataLoaded]  = useState(false)
  const [activeTags,  setActiveTags]  = useState([])
  const [sortBy,      setSortBy]      = useState('reciente')
  const [search,      setSearch]      = useState('')
  const [detailId,    setDetailId]    = useState(null)
  const [showNew,     setShowNew]     = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showMsgs,    setShowMsgs]    = useState(false)
  const [msgTarget,   setMsgTarget]   = useState(null)
  const [toast,       setToast]       = useState(null)
  const [noLeidos,    setNoLeidos]    = useState(0)

  const showToast = useCallback(msg=>{ setToast(msg); setTimeout(()=>setToast(null),2100) },[])

  // ── SESIÓN ───────────────────────────────────────────────────────────────────
  useEffect(()=>{
    // getSession lee directamente del localStorage — INSTANTÁNEO, no necesita red
    supabase.auth.getSession().then(async ({ data: { session } })=>{
      if (session) {
        setSession(session)
        try {
          const { data:co } = await supabase.from('companies').select('*').eq('id',session.user.id).single()
          setCompany(co)
        } catch(e){ console.warn('company load error:', e) }
      }
      setAuthReady(true)
    }).catch(()=>setAuthReady(true))

    // onAuthStateChange para cambios posteriores (login, logout, token refresh)
    const { data:{ subscription } } = supabase.auth.onAuthStateChange(async (event, session)=>{
      if (event === 'SIGNED_OUT') {
        setSession(null); setCompany(null); return
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session)
        if (session) {
          try {
            const { data:co } = await supabase.from('companies').select('*').eq('id',session.user.id).single()
            setCompany(co)
          } catch(e){ console.warn(e) }
        }
        setAuthReady(true)
      }
    })

    // Al cerrar pestaña: cerrar sesión
    const handleUnload = () => supabase.auth.signOut()
    window.addEventListener('beforeunload', handleUnload)

    return ()=>{
      subscription.unsubscribe()
      window.removeEventListener('beforeunload', handleUnload)
    }
  },[])


  // ── DATOS: se cargan independientemente de la sesión ─────────────────────────
  useEffect(()=>{
    loadData()
  },[])

  async function loadData() {
    try {
      // Primero marcar pujas expiradas
      await supabase.rpc('marcar_pujas_expiradas').catch(()=>{})
      const [{ data:p },{ data:b }] = await Promise.all([
        supabase.from('projects').select('*').order('created_at',{ ascending:false }),
        supabase.from('bids').select('*').order('fecha',{ ascending:false })
      ])
      if(p) setProjects(p)
      if(b) setBids(b)
    } catch(e){ console.error(e) }
    finally { setDataLoaded(true) }
  }

  // ── REALTIME ─────────────────────────────────────────────────────────────────
  useEffect(()=>{
    const ch = supabase.channel('rt')
      .on('postgres_changes',{ event:'INSERT', schema:'public', table:'projects' },
        payload=>setProjects(prev=>{
          // evitar duplicados si ya lo añadimos en handleNewProject
          if (prev.find(p=>p.id===payload.new.id)) return prev
          return [payload.new,...prev]
        }))
      .on('postgres_changes',{ event:'INSERT', schema:'public', table:'bids' },
        payload=>setBids(prev=>[payload.new,...prev]))
      .on('postgres_changes',{ event:'UPDATE', schema:'public', table:'bids' },
        payload=>setBids(prev=>prev.map(b=>b.id===payload.new.id?payload.new:b)))
      .subscribe()
    return ()=>supabase.removeChannel(ch)
  },[])

  // ── MENSAJES NO LEÍDOS ────────────────────────────────────────────────────────
  useEffect(()=>{
    if (!session) return
    supabase.from('messages').select('id',{ count:'exact' }).eq('to_user_id',session.user.id).eq('leido',false)
      .then(({ count })=>setNoLeidos(count||0))
    const ch = supabase.channel('msg-badge').on('postgres_changes',{ event:'INSERT', schema:'public', table:'messages' },
      payload=>{ if(payload.new.to_user_id===session.user.id) setNoLeidos(n=>n+1) }).subscribe()
    return ()=>supabase.removeChannel(ch)
  },[session])

  // ── FILTROS ──────────────────────────────────────────────────────────────────
  const filtered = (()=>{
    const q = search.toLowerCase()
    let r = projects.filter(p=>{
      const mq = !q||p.nombre?.toLowerCase().includes(q)||p.empresa?.toLowerCase().includes(q)||p.ubicacion?.toLowerCase().includes(q)||p.tags?.some(t=>t.toLowerCase().includes(q))
      const mt = activeTags.length===0||activeTags.every(t=>p.tags?.includes(t))
      return mq&&mt
    })
    if(sortBy==='reciente')  r.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
    if(sortBy==='populares') r.sort((a,b)=>b.views-a.views)
    if(sortBy==='cierre')    r.sort((a,b)=>new Date(a.fecha_cierre)-new Date(b.fecha_cierre))
    if(sortBy==='pujas')     r.sort((a,b)=>bids.filter(x=>x.proyecto_id===b.id).length-bids.filter(x=>x.proyecto_id===a.id).length)
    return r
  })()

  const detailProj = projects.find(p=>p.id===detailId)
  const tagCount   = t=>projects.filter(p=>p.tags?.includes(t)).length
  const toggleTag  = t=>setActiveTags(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])
  const avgSaving  = bids.length?(bids.reduce((s,b)=>{
    const p=projects.flatMap(pr=>pr.partidas||[]).find(pa=>pa.id===b.partida_id)
    return s+(p?(p.precioSalida-b.precio)/p.precioSalida*100:0)
  },0)/bids.length).toFixed(1):'—'

  // ── HANDLERS ─────────────────────────────────────────────────────────────────
  async function handleBid(proj, partida, form) {
    const bidData = {
      id:            'B'+uid(),
      proyecto_id:   proj.id,
      partida_id:    partida.id,
      user_id:       session.user.id,
      empresa:       company?.name||session.user.email,
      contacto:      session.user.email,
      telefono:      form.tel||'',
      precio:        parseFloat(form.precio),
      plazo:         parseInt(form.plazo)||0,
      observaciones: form.obs||'',
      estado:        'pendiente',
      fecha:         new Date().toISOString().split('T')[0],
      validez_tipo:  form.validezTipo||'indefinida',
      validez_fecha: form.validezFecha||null,
      archivos:      form.archivos||[],
      feedback:null, rating:null, feedback_tags:[], expirada:false
    }
    const { error } = await supabase.from('bids').insert([bidData])
    if (error) { showToast('Error: '+error.message); return }
    // Email
    try {
      window.emailjs?.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,{
        proyecto_nombre:proj.nombre, partida_nombre:partida.descripcion,
        constructora_nombre:proj.empresa, email_constructora:proj.email_contacto||'',
        subcontrata_nombre:company?.name||'', precio:form.precio, plazo:form.plazo,
        observaciones:form.obs||'Sin observaciones', telefono_contacto:form.tel||'No facilitado'
      },EMAILJS_PUBLIC_KEY)
    } catch(e){ console.warn(e) }
    showToast('Oferta publicada correctamente')
  }

  async function handleNewProject(data) {
    const proj = {
      id:           'P'+uid(),
      slug:         slugify(data.nombre),
      nombre:       data.nombre,
      empresa:      company?.name || session.user.email,
      e_init:       (company?.name||'XX').slice(0,2).toUpperCase(),
      e_color:      COLORS[Math.floor(Math.random()*COLORS.length)],
      descripcion:  data.desc,
      ubicacion:    data.ubic || 'España',
      fecha_cierre: data.fecha,        // snake_case correcto para Supabase
      tags:         data.tags || [],
      estado:       'abierta',
      partidas:     data.partidas || [],
      views:        0,
      user_id:      session.user.id,
      archivos:     data.archivos || [],
      email_contacto: data.email_contacto || ''
    }
    const { data: inserted, error } = await supabase.from('projects').insert([proj]).select().single()
    if (error) { console.error('Error insertando proyecto:', error); showToast('Error: '+error.message); return }
    // Añadir al estado local inmediatamente (no esperar al realtime)
    if (inserted) setProjects(prev=>[inserted,...prev])
    showToast('Licitación publicada para todos')
  }

  async function handleOpenDetail(id) {
    setDetailId(id)
    await supabase.rpc('increment_views',{ project_id:id }).catch(()=>{})
  }

  function handleNewMsg(empresa) {
    setMsgTarget(empresa)
    setShowProfile(false)
    setShowMsgs(true)
  }

  // ── LOADING — solo espera la sesión, los datos cargan en segundo plano ────────
  if (!authReady) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f2f0eb', flexDirection:'column', gap:14 }}>
      <div style={{ width:48, height:48, background:'#18170f', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#e85d04', fontFamily:'Syne,sans-serif' }}>O</div>
      <div style={{ fontSize:14, color:'#888', fontFamily:'Syne,sans-serif' }}>Conectando...</div>
    </div>
  )

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  if (!session) return (
    <AuthScreen onLogin={async (user,co)=>{
      setSession({user})
      // Recargar company fresco desde DB para asegurar todos los campos incluido CIF
      try {
        const { data:coFresh } = await supabase.from('companies').select('*').eq('id',user.id).single()
        setCompany(coFresh || co)
      } catch(e){ setCompany(co) }
    }}/>
  )

  // ── APP ───────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:'Barlow,sans-serif', background:'#f2f0eb', minHeight:'100vh', color:'#18170f' }}>

      {/* BARRA LIVE */}
      <div style={{ background:'#18170f', color:'rgba(255,255,255,.55)', fontSize:11, padding:'5px 24px', display:'flex', gap:14, flexWrap:'wrap', fontFamily:'JetBrains Mono,monospace' }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block' }}></span> EN DIRECTO</span>
        <span><strong style={{ color:'#fff' }}>{projects.filter(p=>p.estado==='abierta').length}</strong> licitaciones</span>
        <span><strong style={{ color:'#fff' }}>{bids.filter(b=>!b.expirada).length}</strong> ofertas activas</span>
        {avgSaving!=='—'&&<span><strong style={{ color:'#4ade80' }}>-{avgSaving}%</strong> ahorro medio</span>}
      </div>

      {/* NAV */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #eee', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', gap:14, height:58 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, background:'#18170f', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#e85d04' }}>O</div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:19, fontWeight:800, lineHeight:1 }}>ObraLicit</div>
              <div style={{ fontSize:10, color:'#888' }}>Contratación transparente</div>
            </div>
          </div>
          <div style={{ flex:1, maxWidth:400, position:'relative', marginLeft:8 }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#888' }}><Ic n="search" s={14}/></span>
            <input style={{ width:'100%', padding:'9px 14px 9px 36px', border:'1.5px solid #eee', borderRadius:22, fontFamily:'Barlow,sans-serif', fontSize:14, outline:'none', background:'#f2f0eb', color:'#18170f' }}
              placeholder="Buscar obra, empresa, especialidad..."
              value={search} onChange={e=>setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            {/* Mensajes */}
            <button onClick={()=>setShowMsgs(true)} style={{ position:'relative', display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'#555', border:'1.5px solid #eee' }}>
              <Ic n="msg" s={15}/>
              {noLeidos>0 && <span style={{ position:'absolute', top:2, right:2, width:16, height:16, borderRadius:'50%', background:'#e85d04', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{noLeidos}</span>}
            </button>
            <button onClick={()=>setShowNew(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:'#e85d04', color:'#fff' }}>
              <Ic n="plus" s={14}/> Publicar
            </button>
            {/* Avatar / Perfil */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 14px 5px 6px', background:'#f2f0eb', border:'1.5px solid #eee', borderRadius:22, cursor:'pointer', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600 }}
              onClick={()=>setShowProfile(true)}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', background:'#e85d04' }}>
                {(company?.name||session.user.email).slice(0,2).toUpperCase()}
              </div>
              {company?.name||session.user.email}
            </div>
            <button onClick={()=>supabase.auth.signOut()} style={{ display:'flex', alignItems:'center', padding:'8px', borderRadius:22, border:'1.5px solid #eee', background:'transparent', cursor:'pointer', color:'#888' }} title="Cerrar sesión">
              <Ic n="logout" s={15}/>
            </button>
          </div>
        </div>
      </nav>

      {/* LAYOUT */}
      <div style={{ maxWidth:1300, margin:'0 auto', padding:'28px 24px', display:'grid', gridTemplateColumns:'248px 1fr', gap:22 }}>
        {/* SIDEBAR */}
        <aside style={{ display:'flex', flexDirection:'column', gap:12, position:'sticky', top:80, alignSelf:'start' }}>
          <div style={{ background:'#fff', borderRadius:10, border:'1px solid #eee', padding:16 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:12 }}>MERCADO EN VIVO</div>
            {[['Licitaciones abiertas',projects.filter(p=>p.estado==='abierta').length],['Ofertas activas',bids.filter(b=>!b.expirada).length],['Ahorro medio',`-${avgSaving}%`]].map(([l,v])=>(
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f0f0f0' }}>
                <span style={{ fontSize:12, color:'#888' }}>{l}</span>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:600, color:String(v).includes('-')&&v!=='—%'?'#1a6b3a':'#333' }}>{v}</span>
              </div>
            ))}
          </div>
          {[['ESPECIALIDAD',SPECIALTY],['ZONA',ZONES],['TIPO',TYPES]].map(([hd,tg])=>(
            <div key={hd} style={{ background:'#fff', borderRadius:10, border:'1px solid #eee', overflow:'hidden' }}>
              <div style={{ padding:'11px 14px', borderBottom:'1px solid #eee', fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888' }}>{hd}</div>
              <div style={{ padding:12, display:'flex', flexWrap:'wrap', gap:5 }}>
                {tg.map(t=>(
                  <button key={t} onClick={()=>toggleTag(t)} style={{ padding:'4px 10px', borderRadius:20, fontSize:11, cursor:'pointer', border:`1.5px solid ${activeTags.includes(t)?'#e85d04':'#eee'}`, background:activeTags.includes(t)?'#e85d04':'transparent', color:activeTags.includes(t)?'#fff':'#555', fontFamily:'Barlow', transition:'.15s' }}>
                    {t} ({tagCount(t)})
                  </button>
                ))}
              </div>
            </div>
          ))}
          {activeTags.length>0 && <button onClick={()=>setActiveTags([])} style={{ padding:'9px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'#888', border:'1.5px solid #eee', width:'100%' }}>Borrar filtros ({activeTags.length})</button>}
        </aside>

        {/* FEED */}
        <section>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18, gap:12, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:800 }}>Licitaciones abiertas</div>
              <div style={{ fontSize:13, color:'#888', marginTop:3 }}>{filtered.length} resultado{filtered.length!==1?'s':''}{activeTags.length>0?` — ${activeTags.join(', ')}`:''}
                {search?` — "${search}"`:''}
                {' — '}<span style={{ color:'#1a6b3a', fontWeight:600 }}>Pujas confidenciales</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:2, background:'#f2f0eb', border:'1px solid #eee', borderRadius:22, padding:3 }}>
              {[['reciente','Recientes'],['populares','Populares'],['cierre','Cierre próximo'],['pujas','Más pujas']].map(([v,l])=>(
                <button key={v} onClick={()=>setSortBy(v)} style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, border:'none', background:sortBy===v?'#fff':'transparent', color:sortBy===v?'#18170f':'#888', cursor:'pointer', fontFamily:'Syne', boxShadow:sortBy===v?'0 1px 3px rgba(0,0,0,.08)':'none', whiteSpace:'nowrap' }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {filtered.length===0 && (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <div style={{ fontSize:48, marginBottom:14 }}>🔍</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, marginBottom:8 }}>Sin resultados</div>
                <div style={{ fontSize:13, color:'#888' }}>Prueba otros filtros o publica la primera licitación.</div>
              </div>
            )}
            {filtered.map(proj=>{
              const projBids = bids.filter(b=>b.proyecto_id===proj.id&&!b.expirada)
              const totalRef = (proj.partidas||[]).reduce((s,p)=>s+p.medicion*p.precioSalida,0)
              const dl = daysLeft(proj.fecha_cierre)
              const dlStyle = proj.estado==='cerrada'?{bg:'#f0f0f0',col:'#888'}:dl<=2?{bg:'#fdecea',col:'#c0392b'}:dl<=7?{bg:'#fef3e2',col:'#c97a0a'}:{bg:'#e5f4ec',col:'#1a6b3a'}

              return (
                <article key={proj.id} style={{ background:'#fff', borderRadius:16, border:'1px solid #eee', boxShadow:'0 2px 8px rgba(0,0,0,.05)', overflow:'hidden' }}>
                  <div style={{ padding:'20px 22px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'#444' }}>
                        <div style={{ width:22, height:22, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', background:proj.e_color||'#333', flexShrink:0 }}>{proj.e_init||'?'}</div>
                        {proj.empresa}
                      </div>
                      <span style={{ width:3, height:3, borderRadius:'50%', background:'#ddd' }}/>
                      <span style={{ fontSize:11, color:'#888' }}>{timeAgo(proj.created_at)}</span>
                      <span style={{ width:3, height:3, borderRadius:'50%', background:'#ddd' }}/>
                      <span style={{ fontSize:11, color:'#888' }}>{proj.ubicacion}</span>
                      {proj.tags?.includes('Urgente')&&<Tag t="Urgente"/>}
                    </div>
                    <div onClick={()=>handleOpenDetail(proj.id)} style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, lineHeight:1.25, marginBottom:8, cursor:'pointer', color:'#18170f' }}
                      onMouseEnter={e=>e.target.style.color='#e85d04'} onMouseLeave={e=>e.target.style.color='#18170f'}>
                      {proj.nombre}
                    </div>
                    <div style={{ fontSize:13, color:'#444', lineHeight:1.65, marginBottom:12 }}>{proj.descripcion}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:4 }}>
                      {proj.tags?.filter(t=>t!=='Urgente').map(t=><Tag key={t} t={t} onClick={()=>toggleTag(t)}/>)}
                    </div>
                    {proj.archivos?.length>0 && (
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
                        {proj.archivos.map(a=>(
                          <a key={a.path} href={a.url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', background:'#f0f0f0', borderRadius:4, fontSize:11, color:'#555', textDecoration:'none' }}>
                            <Ic n="file" s={11}/> {a.nombre}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Stats bar */}
                  <div style={{ display:'flex', background:'#f8f7f4', borderTop:'1px solid #eee', borderBottom:'1px solid #eee' }}>
                    {[['PARTIDAS',(proj.partidas||[]).length,''],['PRESUP. REF.',fmt(totalRef),'#e85d04'],['OFERTAS',projBids.length,''],['VISITAS',proj.views||0,'']].map(([l,v,c],idx,arr)=>(
                      <div key={l} style={{ flex:1, padding:'10px 14px', borderRight:idx<arr.length-1?'1px solid #eee':'none' }}>
                        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:500, color:c||'#18170f' }}>{v}</div>
                        <div style={{ fontSize:10, color:'#888', fontWeight:700, letterSpacing:'.04em', marginTop:2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Acciones */}
                  <div style={{ padding:'12px 22px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <button onClick={()=>handleOpenDetail(proj.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:'#18170f', color:'#fff' }}>
                      Ver y pujar
                    </button>
                    <button onClick={()=>{ navigator.clipboard?.writeText?.(`${window.location.origin}/?l=${proj.slug}`); showToast('Enlace copiado') }}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'#888', border:'1.5px solid #eee' }}>
                      <Ic n="copy" s={14}/>
                    </button>
                    <div style={{ marginLeft:'auto', fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, padding:'6px 12px', borderRadius:8, display:'flex', alignItems:'center', gap:4, background:dlStyle.bg, color:dlStyle.col }}>
                      <Ic n="clock" s={11}/>{proj.estado==='cerrada'?'Cerrada':dl<=0?'Vence hoy':`${dl}d restantes`}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>

      {/* PANELES Y MODALES */}
      {detailProj && <DetailPanel proj={detailProj} bids={bids} user={session?.user} company={company} onClose={()=>setDetailId(null)} onBid={handleBid}/>}
      {showNew    && <NewProjectModal company={company} session={session} onClose={()=>setShowNew(false)} onSubmit={handleNewProject}/>}
      {showProfile && <ProfilePanel user={session.user} company={company} projects={projects} bids={bids} onClose={()=>setShowProfile(false)} onOpenDetail={handleOpenDetail} onNewMsg={handleNewMsg}/>}
      {showMsgs   && <MessagesPanel user={session.user} company={company} onClose={()=>setShowMsgs(false)} initialTarget={msgTarget}/>}
      {toast      && <Toast msg={toast}/>}
    </div>
  )
}
