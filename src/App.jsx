import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from './lib/supabase'

const ADMIN_USER_ID = '4ab86804-df35-49c6-9919-2480ae898863'

const SPECIALTY = ['Micropilotes','Pilotes CPI','Inyecciones','Pantallas','Muros','Mejora terreno','Anclajes','Sondeos','Cimentaciones especiales']
const ZONES = ['Madrid','Barcelona','Sevilla','Valencia','Bilbao','Zaragoza','Málaga','Galicia','Canarias']
const TYPES = ['Obra pública','Obra privada','Urgente','Industrial','Residencial','Infraestructura']
const ALL_TAGS = [...SPECIALTY, ...ZONES, ...TYPES]
const COLORS = ['#1a4d7a','#0a7c6e','#c0392b','#5a3fa0','#d4820a','#2d6a2d','#8b2fc9']
const EMAILJS_PUBLIC_KEY = '8XyB1sBak9kOD8d-k'
const EMAILJS_SERVICE_ID = 'service_w9gs91b'
const EMAILJS_TEMPLATE_ID = 'template_cyiz73e'
const MAX_FILE_BID = 10 * 1024 * 1024
const MAX_FILE_PROJ = 25 * 1024 * 1024
const ROLE_OPTIONS = ['constructora','subcontrata','especialista','proveedor','admin']

const fmt = n => new Intl.NumberFormat('es-ES').format(Math.round(Number(n || 0))) + ' €'
const daysLeft = d => Math.ceil((new Date(d) - new Date()) / 86400000)
const timeAgo = d => {
  if (!d) return '—'
  const days = Math.floor((new Date() - new Date(d)) / 86400000)
  return days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `Hace ${days}d`
}
const slugify = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)
const uid = () => Math.random().toString(36).slice(2,10)
const tagCat = t => SPECIALTY.includes(t) ? 'sp' : ZONES.includes(t) ? 'zo' : 'ty'
const fmtSize = b => b > 1024*1024 ? (b/1024/1024).toFixed(1)+'MB' : (b/1024).toFixed(0)+'KB'

function Ic({ n, s=16, c='currentColor' }) {
  const p = { width:s, height:s, viewBox:'0 0 24 24', fill:'none', stroke:c, strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' }
  const icons = {
    search: <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    plus: <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x: <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check: <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    back: <svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    clock: <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    euro: <svg {...p}><path d="M4 10h12M4 14h12M19.5 9.5a7 7 0 100 5"/></svg>,
    logout: <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    copy: <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
    globe: <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    user: <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    zap: <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    paperclip: <svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
    file: <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    trash: <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    msg: <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    send: <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    building: <svg {...p}><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>,
    eye: <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    lock: <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    bell: <svg {...p}><path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    filter: <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  }
  return icons[n] || null
}

function Toast({ msg }) {
  return (
    <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#18170f', color:'#fff', padding:'11px 22px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, zIndex:9999, boxShadow:'0 8px 32px rgba(0,0,0,.2)', pointerEvents:'none', animation:'toastIn .3s, toastOut .3s 1.7s forwards' }}>
      {msg}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes toastOut{to{opacity:0;transform:translateX(-50%) translateY(8px)}}`}</style>
    </div>
  )
}

function Tag({ t, onClick }) {
  const colors = { sp:{bg:'#f0ecff',col:'#5a3fa0'}, zo:{bg:'#e5eef7',col:'#1a4d7a'}, ty:{bg:'#fef3e2',col:'#c97a0a'} }
  const urg = t === 'Urgente'
  const c = urg ? { bg:'#fdecea', col:'#c0392b' } : colors[tagCat(t)]
  return <span onClick={onClick} style={{ padding:'3px 8px', borderRadius:4, fontSize:11, fontWeight:600, cursor:'pointer', background:c.bg, color:c.col, display:'inline-flex', alignItems:'center' }}>{urg ? 'URGENTE' : t}</span>
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const add = t => {
    const v = (t || '').trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }
  const rem = t => onChange(tags.filter(x => x !== t))
  return (
    <>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, padding:8, border:'1.5px solid #ddd', borderRadius:6, background:'#fff', minHeight:42 }}>
        {tags.map(t => (
          <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:4, fontSize:12, fontWeight:600, background:'#e5eef7', color:'#1a4d7a' }}>
            #{t}<span style={{ cursor:'pointer', opacity:.7, fontSize:15 }} onClick={() => rem(t)}>×</span>
          </span>
        ))}
        <input
          style={{ border:'none', outline:'none', fontSize:13, flex:1, minWidth:80, background:'transparent' }}
          placeholder="Escribe y pulsa Enter..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (['Enter',','].includes(e.key)) { e.preventDefault(); add(input) } }}
        />
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:6 }}>
        {ALL_TAGS.filter(t => !tags.includes(t)).slice(0, 12).map(t => (
          <button key={t} type="button" onClick={() => add(t)} style={{ padding:'3px 8px', borderRadius:4, fontSize:11, border:'1px solid #ddd', background:'transparent', cursor:'pointer' }}>+{t}</button>
        ))}
      </div>
    </>
  )
}

function FileUploader({ archivos, onChange, maxSize, label }) {
  const ref = useRef(null)

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    const nuevos = []
    for (const file of files) {
      if (file.size > maxSize) {
        alert(`${file.name} supera el límite de ${fmtSize(maxSize)}`)
        continue
      }
      const path = `${uid()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
      const { error } = await supabase.storage.from('obralicit-files').upload(path, file)
      if (error) {
        alert('Error subiendo ' + file.name + ': ' + error.message)
        continue
      }
      const { data: signedData, error: signErr } = await supabase.storage.from('obralicit-files').createSignedUrl(path, 60 * 60 * 24 * 365)
      if (signErr) console.warn('Error generando URL:', signErr)
      nuevos.push({ nombre:file.name, path, url:signedData?.signedUrl || '', size:file.size, tipo:file.type })
    }
    if (nuevos.length) onChange([...(archivos || []), ...nuevos])
    e.target.value = ''
  }

  async function removeFile(path) {
    await supabase.storage.from('obralicit-files').remove([path])
    onChange((archivos || []).filter(a => a.path !== path))
  }

  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
        {(archivos || []).map(a => (
          <div key={a.path} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:6, fontSize:12 }}>
            <Ic n="file" s={13} />
            <a href={a.url} target="_blank" rel="noreferrer" style={{ color:'#5a3fa0', textDecoration:'none', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nombre}</a>
            <span style={{ fontSize:10, color:'#888' }}>({fmtSize(a.size)})</span>
            <button type="button" onClick={() => removeFile(a.path)} style={{ background:'none', border:'none', cursor:'pointer', color:'#c0392b', fontSize:16, lineHeight:1 }}>×</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => ref.current?.click()} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', border:'1.5px dashed #bbb', borderRadius:6, background:'transparent', cursor:'pointer', fontSize:12, color:'#666', fontFamily:'Barlow,sans-serif' }}>
        <Ic n="paperclip" s={13} /> {label || 'Adjuntar archivo'} (máx. {fmtSize(maxSize)})
      </button>
      <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display:'none' }} onChange={handleFiles} />
    </div>
  )
}

function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [nombre, setNombre] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [cif, setCif] = useState('')
  const [role, setRole] = useState('subcontrata')
  const [tipo, setTipo] = useState('principal')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text:'', ok:false })

  async function handle(e) {
    e.preventDefault()
    setMsg({ text:'', ok:false })
    setLoading(true)
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) throw error
        const { data: co, error: coErr } = await supabase.from('companies').select('*').eq('id', data.user.id).maybeSingle()
        if (coErr) console.warn(coErr)
        if (co?.estado === 'pendiente') throw new Error('Tu cuenta está pendiente de aprobación por la empresa principal con ese CIF.')
        onLogin(data.user, co)
      } else {
        if (!nombre || !empresa || !cif) throw new Error('Rellena todos los campos obligatorios')
        const cifLimpio = cif.trim().toUpperCase()
        const { data: empresaExistente } = await supabase.from('companies').select('id,name').eq('cif', cifLimpio).maybeSingle()
        if (empresaExistente && tipo === 'principal') {
          throw new Error(`Ya existe una empresa registrada con el CIF ${cifLimpio}. Si eres una filial o departamento, selecciona esa opción.`)
        }
        const estadoInicial = empresaExistente ? 'pendiente' : 'activo'
        const { data, error } = await supabase.auth.signUp({ email, password: pass })
        if (error) throw error

        if (data.user) {
          const companyPayload = {
            id: data.user.id,
            name: empresa,
            role,
            telefono: '',
            cif: cifLimpio,
            estado: estadoInicial,
            parent_id: empresaExistente?.id || null,
            verified: !empresaExistente,
            contact_name: nombre,
          }
          let { error: pe } = await supabase.from('companies').insert([companyPayload])
          if (pe) {
            const retry = { ...companyPayload, parentid: companyPayload.parent_id }
            delete retry.parent_id
            const r = await supabase.from('companies').insert([retry])
            pe = r.error
          }
          if (pe) throw pe

          if (empresaExistente) {
            let { error: reqError } = await supabase.from('company_requests').insert([{ cif:cifLimpio, empresa_nueva:data.user.id, empresa_madre:empresaExistente.id, tipo }])
            if (reqError) {
              const retry = await supabase.from('companyrequests').insert([{ cif:cifLimpio, empresanueva:data.user.id, empresamadre:empresaExistente.id, tipo }])
              reqError = retry.error
            }
            if (reqError) console.warn(reqError)
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
            } catch(e) {
              console.warn('Email no enviado:', e)
            }
            setMsg({ text:'Solicitud enviada. La empresa principal con ese CIF recibirá un aviso para aprobar tu acceso. Mientras tanto tu cuenta está pendiente.', ok:true })
          } else {
            setMsg({ text:'Cuenta creada correctamente. Ya puedes iniciar sesión.', ok:true })
            setIsLogin(true)
          }
        }
      }
    } catch (err) {
      setMsg({ text: err?.message || 'Error', ok:false })
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:18 }}>
              {[['constructora','Constructora'],['subcontrata','Subcontrata'],['especialista','Especialista'],['proveedor','Proveedor']].map(([r,l]) => (
                <div key={r} onClick={() => setRole(r)} style={{ border:`2px solid ${role===r?'#e85d04':'#ddd'}`, borderRadius:8, padding:'10px 6px', textAlign:'center', cursor:'pointer', background:role===r?'#fff2ec':'transparent' }}>
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
          <button type="submit" disabled={loading} style={{ width:'100%', padding:13, background:'#e85d04', color:'#fff', border:'none', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, cursor:'pointer', opacity:loading?0.6:1 }}>
            {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#666' }}>
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setMsg({ text:'', ok:false }) }} style={{ background:'none', border:'none', color:'#e85d04', cursor:'pointer', fontWeight:700, fontSize:13 }}>
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}

function BidForm({ partida, onSubmit, onCancel, initialData }) {
  const [precio, setPrecio] = useState(initialData?.precio?.toString() || '')
  const [plazo, setPlazo] = useState(initialData?.plazo?.toString() || '')
  const [obs, setObs] = useState(initialData?.observaciones || '')
  const [tel, setTel] = useState(initialData?.telefono || '')
  const [validezTipo, setValidezT] = useState(initialData?.validez_tipo || initialData?.valideztipo || 'indefinida')
  const [validezFecha, setValidezF] = useState(initialData?.validez_fecha || initialData?.validezfecha || '')
  const [archivos, setArchivos] = useState(initialData?.archivos || [])
  const [loading, setLoading] = useState(false)

  const num = parseFloat(precio || 0)
  const total = num * (partida.medicion || 0)
  const saving = precio ? (((partida.precioSalida - num) / partida.precioSalida) * 100).toFixed(1) : null
  const isOk = saving !== null && parseFloat(saving) > 0

  async function submit(e) {
    e.preventDefault()
    if (!precio || isNaN(num)) return
    setLoading(true)
    await onSubmit({ precio:num, plazo:parseInt(plazo)||0, obs, tel, validezTipo, validezFecha, archivos })
    setLoading(false)
  }

  const inp = { padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', width:'100%', fontFamily:'Barlow,sans-serif' }
  const lbl = { fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.06em', color:'#888', display:'block', marginBottom:4 }

  return (
    <form onSubmit={submit} style={{ padding:16, background:'#fff9f5', borderTop:'2px solid #ffcba4' }}>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
        <Ic n="lock" s={14} /> {initialData ? 'Actualiza tu oferta — el publicador verá los cambios' : 'Oferta confidencial — solo la constructora verá tu precio'}
      </div>

      <div style={{ background:'#fff2ec', border:'1px solid #ffcba4', borderRadius:6, padding:'9px 13px', marginBottom:13, fontSize:12, color:'#c94f03' }}>
        Precio salida: <strong>{fmt(partida.precioSalida)}/{partida.unidad}</strong> — Medición: <strong>{partida.medicion} {partida.unidad}</strong> — Total ref: <strong>{fmt((partida.medicion||0)*(partida.precioSalida||0))}</strong>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <label style={lbl}>PRECIO UNITARIO (€/{partida.unidad}) *</label>
          <input style={inp} type="number" placeholder="0.00" value={precio} onChange={e=>setPrecio(e.target.value)} required />
          {saving !== null && <div style={{ fontSize:11, marginTop:3, fontWeight:600, color:isOk?'#1a6b3a':'#c0392b' }}>Total: {fmt(total)} — {isOk?'-':'+'}{Math.abs(saving)}% vs salida</div>}
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

      <div style={{ marginBottom:10 }}>
        <label style={lbl}>VALIDEZ DE LA OFERTA</label>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select style={{ ...inp, flex:1, appearance:'auto' }} value={validezTipo} onChange={e=>setValidezT(e.target.value)}>
            <option value="indefinida">Indefinida</option>
            <option value="fecha">Hasta una fecha</option>
          </select>
          {validezTipo === 'fecha' && <input style={{ ...inp, flex:1 }} type="date" value={validezFecha} onChange={e=>setValidezF(e.target.value)} required min={new Date().toISOString().split('T')[0]} />}
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={lbl}>DOCUMENTACIÓN ADJUNTA (máx. 10MB por archivo)</label>
        <FileUploader archivos={archivos} onChange={setArchivos} maxSize={MAX_FILE_BID} label="Adjuntar certificados, fichas técnicas..." />
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <button type="submit" disabled={!precio || loading} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 22px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', opacity:(!precio||loading)?0.5:1 }}>
          {loading ? 'Publicando...' : 'Publicar oferta'}
        </button>
        <button type="button" onClick={onCancel} style={{ background:'transparent', color:'#888', border:'1.5px solid #ddd', padding:'10px 16px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
      </div>
    </form>
  )
}

function NewProjectModal({ company, session, onClose, onSubmit }) {
  const [nombre, setNombre] = useState('')
  const [desc, setDesc] = useState('')
  const [ubic, setUbic] = useState('')
  const [fecha, setFecha] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [tags, setTags] = useState([])
  const [visibilidad, setVisibilidad] = useState('publica')
  const [invitadas, setInvitadas] = useState('')
  const [responsableNombre, setResponsableNombre] = useState(company?.contact_name || '')
  const [responsableEmail, setResponsableEmail] = useState(session?.user?.email || '')
  const [responsableTel, setResponsableTel] = useState(company?.telefono || '')
  const [emailContacto, setEmailContacto] = useState(session?.user?.email || '')
  const [archivos, setArchivos] = useState([])
  const [partidas, setPartidas] = useState([])
  const [pf, setPf] = useState({ codigo:'', descripcion:'', unidad:'ud', medicion:'', precioSalida:'' })
  const [loading, setLoading] = useState(false)

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'Barlow,sans-serif' }
  const lbl = { display:'block', fontSize:11, fontWeight:700, letterSpacing:'.06em', color:'#888', marginBottom:5, fontFamily:'Syne,sans-serif' }

  function addPartida() {
    if (!pf.descripcion || !pf.medicion || !pf.precioSalida) return
    setPartidas(prev => [...prev, {
      id: `PA-${uid()}`,
      codigo: pf.codigo || `PA-${partidas.length + 1}`,
      descripcion: pf.descripcion,
      unidad: pf.unidad,
      medicion: parseFloat(pf.medicion),
      precioSalida: parseFloat(pf.precioSalida),
    }])
    setPf({ codigo:'', descripcion:'', unidad:'ud', medicion:'', precioSalida:'' })
  }

  function removePartida(id) {
    setPartidas(prev => prev.filter(p => p.id !== id))
  }

  async function submit(e) {
    e.preventDefault()
    if (!nombre || !fecha || !partidas.length) return alert('Completa nombre, fecha de cierre y al menos una partida')
    setLoading(true)
    await onSubmit({
      nombre,
      desc,
      ubic,
      fecha,
      fechaInicio,
      tags,
      visibilidad,
      invitadas: invitadas.split(',').map(x => x.trim()).filter(Boolean),
      responsableNombre,
      responsableEmail,
      responsableTel,
      emailcontacto: emailContacto,
      archivos,
      partidas,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', width:'min(980px,100%)', maxHeight:'92vh', overflowY:'auto', borderRadius:18, boxShadow:'0 24px 80px rgba(0,0,0,.25)' }}>
        <div style={{ padding:'22px 26px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800 }}>Publicar obra</div>
            <div style={{ fontSize:12, color:'#888', marginTop:4 }}>Crea una licitación con partidas, documentación y responsables</div>
          </div>
          <button type="button" onClick={onClose} style={{ background:'transparent', border:'none', fontSize:22, cursor:'pointer', color:'#888' }}>×</button>
        </div>

        <form onSubmit={submit} style={{ padding:26 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr .8fr', gap:18 }}>
            <div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>NOMBRE DE LA OBRA</label>
                <input style={inp} value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Cimentación especial nave logística" />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>DESCRIPCIÓN</label>
                <textarea style={{ ...inp, minHeight:86, resize:'vertical' }} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Alcance, hitos, condicionantes, documentación requerida..." />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                <div><label style={lbl}>UBICACIÓN</label><input style={inp} value={ubic} onChange={e=>setUbic(e.target.value)} placeholder="Madrid" /></div>
                <div><label style={lbl}>CIERRE DE OFERTAS</label><input style={inp} type="date" value={fecha} onChange={e=>setFecha(e.target.value)} /></div>
                <div><label style={lbl}>FECHA DE INICIO</label><input style={inp} type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} /></div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>TAGS</label>
                <TagInput tags={tags} onChange={setTags} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>DOCUMENTACIÓN DE PROYECTO</label>
                <FileUploader archivos={archivos} onChange={setArchivos} maxSize={MAX_FILE_PROJ} label="Adjuntar memorias, planos, pliegos..." />
              </div>
            </div>

            <div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>VISIBILIDAD</label>
                <select style={{ ...inp, appearance:'auto' }} value={visibilidad} onChange={e=>setVisibilidad(e.target.value)}>
                  <option value="publica">Pública</option>
                  <option value="privada">Privada</option>
                </select>
              </div>
              {visibilidad === 'privada' && (
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>EMPRESAS INVITADAS (emails separados por coma)</label>
                  <textarea style={{ ...inp, minHeight:72, resize:'vertical' }} value={invitadas} onChange={e=>setInvitadas(e.target.value)} placeholder="compras@empresa1.com, tecnico@empresa2.com" />
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>RESPONSABLE NOMBRE</label>
                <input style={inp} value={responsableNombre} onChange={e=>setResponsableNombre(e.target.value)} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>RESPONSABLE EMAIL</label>
                <input style={inp} type="email" value={responsableEmail} onChange={e=>setResponsableEmail(e.target.value)} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>RESPONSABLE TELÉFONO</label>
                <input style={inp} value={responsableTel} onChange={e=>setResponsableTel(e.target.value)} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>EMAIL CONTACTO</label>
                <input style={inp} type="email" value={emailContacto} onChange={e=>setEmailContacto(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ marginTop:10, borderTop:'1px solid #eee', paddingTop:18 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, marginBottom:10 }}>Partidas</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr .8fr .8fr .8fr auto', gap:8, alignItems:'end', marginBottom:12 }}>
              <div><label style={lbl}>CÓDIGO</label><input style={inp} value={pf.codigo} onChange={e=>setPf(f=>({ ...f, codigo:e.target.value }))} placeholder="01.01" /></div>
              <div><label style={lbl}>DESCRIPCIÓN</label><input style={inp} value={pf.descripcion} onChange={e=>setPf(f=>({ ...f, descripcion:e.target.value }))} placeholder="Micropilote Ø..." /></div>
              <div><label style={lbl}>UNIDAD</label><input style={inp} value={pf.unidad} onChange={e=>setPf(f=>({ ...f, unidad:e.target.value }))} placeholder="m" /></div>
              <div><label style={lbl}>MEDICIÓN</label><input style={inp} type="number" value={pf.medicion} onChange={e=>setPf(f=>({ ...f, medicion:e.target.value }))} /></div>
              <div><label style={lbl}>PRECIO SALIDA</label><input style={inp} type="number" value={pf.precioSalida} onChange={e=>setPf(f=>({ ...f, precioSalida:e.target.value }))} /></div>
              <button type="button" onClick={addPartida} style={{ background:'#18170f', color:'#fff', border:'none', height:42, borderRadius:8, cursor:'pointer', fontFamily:'Syne,sans-serif', fontWeight:700 }}>Añadir</button>
            </div>

            <div style={{ display:'grid', gap:8 }}>
              {partidas.map(p => (
                <div key={p.id} style={{ padding:'12px 14px', border:'1px solid #eee', borderRadius:10, display:'flex', justifyContent:'space-between', gap:12, alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#888' }}>{p.codigo}</div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{p.descripcion}</div>
                    <div style={{ fontSize:12, color:'#777', marginTop:4 }}>{p.medicion} {p.unidad} · {fmt(p.precioSalida)}/{p.unidad} · Ref. {fmt((p.medicion||0)*(p.precioSalida||0))}</div>
                  </div>
                  <button type="button" onClick={() => removePartida(p.id)} style={{ background:'#fdecea', color:'#c0392b', border:'1px solid #f5c6c2', borderRadius:6, padding:'6px 10px', cursor:'pointer' }}>Eliminar</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
            <button type="button" onClick={onClose} style={{ background:'transparent', color:'#888', border:'1.5px solid #ddd', padding:'10px 16px', borderRadius:8, cursor:'pointer', fontFamily:'Syne,sans-serif', fontWeight:600 }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 20px', borderRadius:8, cursor:'pointer', fontFamily:'Syne,sans-serif', fontWeight:700, opacity:loading?0.6:1 }}>{loading ? 'Publicando...' : 'Publicar obra'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DetailPanel({ proj, bids, user, company, onClose, onBid, onDeleteBid, setProjects }) {
  const [openForm, setOpenForm] = useState(null)
  const [copied, setCopied] = useState(false)
  const [visLocal, setVisLocal] = useState({
    mostrar_num_pujas: proj.mostrar_num_pujas || proj.mostrarnumpujas || false,
    mostrar_empresas: proj.mostrar_empresas || proj.mostrarempresas || false,
  })

  const partidas = proj.partidas || []
  const totalRef = partidas.reduce((s,p) => s + ((p.medicion||0) * (p.precioSalida||0)), 0)
  const dl = daysLeft(proj.fecha_cierre || proj.fechacierre)
  const projBids = bids.filter(b => (b.proyecto_id || b.proyectoid) === proj.id && !b.expirada)
  const esAdmin = user?.id === ADMIN_USER_ID || company?.role === 'admin'
  const esDuenio = user?.id === (proj.user_id || proj.userid)
  const esConstructora = esDuenio || esAdmin

  function handleCopy() {
    navigator.clipboard?.writeText?.(`${window.location.origin}/?l=${proj.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const dlStyle = dl <= 2 ? { bg:'#fdecea', col:'#c0392b' } : dl <= 7 ? { bg:'#fef3e2', col:'#c97a0a' } : { bg:'#e5f4ec', col:'#1a6b3a' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.5)', backdropFilter:'blur(5px)', display:'flex' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ marginLeft:'auto', width:'min(760px,100vw)', background:'#fff', height:'100vh', overflowY:'auto', boxShadow:'0 0 60px rgba(0,0,0,.2)' }}>
        <div style={{ background:'#18170f', color:'#fff', padding:'24px 28px 20px' }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,.4)', cursor:'pointer', marginBottom:14, border:'none', background:'none' }}>
            <Ic n="back" s={13} /> Volver
          </button>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:5, fontWeight:600 }}>{proj.empresa}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, lineHeight:1.2, marginBottom:8 }}>{proj.nombre}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.65 }}>{proj.descripcion}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:12 }}>
                {proj.tags?.map(t => <span key={t} style={{ padding:'3px 9px', borderRadius:4, fontSize:11, fontWeight:600, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)' }}>{t}</span>)}
              </div>
            </div>

            <div style={{ padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4, flexShrink:0, background:dlStyle.bg, color:dlStyle.col }}>
              <Ic n="clock" s={11} /> {dl <= 0 ? 'Vence hoy' : `${dl}d`}
            </div>
          </div>

          {proj.archivos?.length > 0 && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:6, fontWeight:700 }}>DOCUMENTACIÓN</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {proj.archivos.map(a => (
                  <a key={a.path} href={a.url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:'rgba(255,255,255,.1)', borderRadius:6, fontSize:12, color:'rgba(255,255,255,.8)', textDecoration:'none' }}>
                    <Ic n="file" s={12} /> {a.nombre}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div style={{ background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 13px', marginTop:14, display:'flex', alignItems:'center', gap:10 }}>
            <Ic n="globe" s={13} />
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'rgba(255,255,255,.4)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{window.location.origin}/?l={proj.slug}</span>
            <button onClick={handleCopy} style={{ padding:'4px 12px', background:copied?'#0a7c6e':'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', border:'1px solid rgba(255,255,255,.12)', borderRadius:5, fontSize:11, fontWeight:700, cursor:'pointer' }}>{copied ? 'Copiado!' : 'Copiar'}</button>
          </div>

          <div style={{ display:'flex', gap:20, marginTop:14, flexWrap:'wrap' }}>
            {[['Presupuesto', fmt(totalRef)], ['Partidas', partidas.length], ...(esConstructora ? [['Ofertas', projBids.length]] : []), ['Cierre', proj.fecha_cierre || proj.fechacierre]].map(([l,v]) => (
              <div key={l}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700 }}>{l}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:600, color:'#fff', marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:'22px 28px' }}>
          {esDuenio && (
            <div style={{ background:'#f8f7f4', border:'1px solid #eee', borderRadius:8, padding:'12px 16px', marginBottom:16 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'#555', marginBottom:10 }}>CONFIGURACIÓN DE VISIBILIDAD</div>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                {[
                  ['mostrar_num_pujas', 'Mostrar número de ofertas recibidas', visLocal.mostrar_num_pujas],
                  ['mostrar_empresas', 'Mostrar qué empresas han pujado (sin precios)', visLocal.mostrar_empresas],
                ].map(([campo, label, valor]) => (
                  <label key={campo} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#333' }}>
                    <input
                      type="checkbox"
                      checked={!!valor}
                      onChange={async e => {
                        const v = e.target.checked
                        setVisLocal(prev => ({ ...prev, [campo]:v }))
                        const payload = campo === 'mostrar_num_pujas'
                          ? { mostrar_num_pujas:v, mostrarnumpujas:v }
                          : { mostrar_empresas:v, mostrarempresas:v }
                        const { error } = await supabase.from('projects').update(payload).eq('id', proj.id)
                        if (error) {
                          setVisLocal(prev => ({ ...prev, [campo]:!v }))
                          console.error(error)
                        } else {
                          setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, ...payload } : p))
                        }
                      }}
                      style={{ width:16, height:16, cursor:'pointer', accentColor:'#e85d04' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div style={{ fontSize:11, color:'#888', marginTop:8 }}>El precio de las ofertas nunca es público. Solo tú lo ves.</div>
            </div>
          )}

          {!esConstructora && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:8, marginBottom:16, fontSize:13, color:'#5a3fa0' }}>
              <Ic n="lock" s={15} /> <strong>Pujas confidenciales</strong> — No verás los precios de otras empresas. Solo la constructora tiene acceso al ranking completo.
            </div>
          )}

          <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'.08em', color:'#888', textTransform:'uppercase', marginBottom:14, paddingBottom:8, borderBottom:'1px solid #eee' }}>Partidas y ofertas</div>

          {partidas.map(partida => {
            const todasPBids = projBids.filter(b => (b.partida_id || b.partidaid) === partida.id)
            const pBids = esConstructora ? [...todasPBids].sort((a,b) => a.precio - b.precio) : todasPBids.filter(b => (b.user_id || b.userid) === user?.id)
            const myBid = user && todasPBids.find(b => (b.user_id || b.userid) === user.id)
            const best = esConstructora && todasPBids.length ? todasPBids.reduce((a,b) => a.precio < b.precio ? a : b) : null
            const isOpen = openForm === partida.id

            return (
              <div key={partida.id} style={{ border:'1px solid #eee', borderRadius:10, overflow:'hidden', marginBottom:14 }}>
                <div style={{ padding:'13px 16px', background:'#f8f7f4', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#888' }}>{partida.codigo}</div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, margin:'3px 0 5px' }}>{partida.descripcion}</div>
                    <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                      {[['Medición', `${partida.medicion} ${partida.unidad}`], ['P.salida', `${fmt(partida.precioSalida)}/${partida.unidad}`], ['Total ref', fmt((partida.medicion||0)*(partida.precioSalida||0))]].map(([l,v]) => (
                        <span key={l} style={{ fontSize:12, color:'#888' }}>{l}: <strong style={{ color:'#333', fontFamily:'JetBrains Mono,monospace' }}>{v}</strong></span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                    {best && <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'#888' }}>Mejor oferta</div><div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:17, fontWeight:600, color:'#1a6b3a' }}>{fmt(best.precio)}</div></div>}
                    {!esConstructora && <div style={{ fontSize:11, color:'#888' }}>{todasPBids.length} oferta{todasPBids.length!==1?'s':''} recibida{todasPBids.length!==1?'s':''}</div>}
                    {!myBid && (proj.estado === 'abierta' || proj.estado === 'open') && user && (
                      <button onClick={() => setOpenForm(isOpen ? null : partida.id)} style={{ background:'#18170f', color:'#fff', border:'none', padding:'7px 14px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                        {isOpen ? 'Cancelar' : 'Pujar'}
                      </button>
                    )}
                    {!user && <div style={{ fontSize:12, color:'#888' }}>Inicia sesión para pujar</div>}
                    {myBid && <div style={{ padding:'8px 12px', background:'#e4f5f2', borderRadius:6, fontSize:12, color:'#0a7c6e', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}><Ic n="check" s={12} /> Tu oferta: {fmt(myBid.precio)}</div>}
                  </div>
                </div>

                {isOpen && user && <BidForm partida={partida} initialData={myBid} onSubmit={f => { onBid(proj, partida, f, myBid); setOpenForm(null) }} onCancel={() => setOpenForm(null)} />}

                {!esConstructora && (visLocal.mostrar_empresas || proj.mostrar_empresas || proj.mostrarempresas) && todasPBids.length > 0 && (
                  <div style={{ padding:'10px 16px', background:'#f8f7f4', borderBottom:'1px solid #eee' }}>
                    <div style={{ fontSize:11, color:'#888', fontWeight:700, marginBottom:6 }}>EMPRESAS QUE HAN PRESENTADO OFERTA</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {todasPBids.map(b => <span key={b.id} style={{ fontSize:12, padding:'3px 9px', background:'#fff', border:'1px solid #eee', borderRadius:4 }}>{b.empresa}</span>)}
                    </div>
                  </div>
                )}

                {pBids.length > 0 ? pBids.map((bid, idx) => {
                  const saving = (((partida.precioSalida - bid.precio) / partida.precioSalida) * 100).toFixed(1)
                  const rkCol = idx===0 ? '#1a6b3a' : idx===1 ? '#c97a0a' : '#888'
                  const esMia = (bid.user_id || bid.userid) === user?.id
                  const bgRow = bid.estado === 'adjudicada' ? '#e5f4ec' : esMia && !esConstructora ? '#fef9f5' : 'transparent'
                  return (
                    <div key={bid.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                      <div style={{ padding:'13px 16px', display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'start', background:bgRow }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                            {esConstructora && <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', background:rkCol, flexShrink:0 }}>{idx+1}</div>}
                            <div>
                              <div style={{ fontSize:13, fontWeight:700 }}>
                                {esConstructora ? bid.empresa : 'Tu oferta'}
                                {bid.estado === 'adjudicada' && <span style={{ fontSize:10, background:'#1a6b3a', color:'#fff', padding:'2px 8px', borderRadius:4, fontWeight:700, marginLeft:6 }}>ADJUDICADA</span>}
                              </div>
                              {esConstructora && <div style={{ fontSize:11, color:'#888', marginTop:1 }}>{bid.contacto}{bid.telefono ? ` — ${bid.telefono}` : ''}</div>}
                            </div>
                          </div>
                          {bid.observaciones && <div style={{ fontSize:12, color:'#444', marginTop:7, lineHeight:1.55, fontStyle:'italic', padding:'8px 10px', background:'#f8f7f4', borderRadius:6 }}>“{bid.observaciones}”</div>}
                          {bid.validezfecha && <div style={{ fontSize:11, color:'#c97a0a', marginTop:6 }}>Válida hasta {bid.validezfecha}</div>}
                          {bid.archivos?.length > 0 && (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                              {bid.archivos.map(a => (
                                <a key={a.path} href={a.url} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 8px', background:'#f0f0f0', borderRadius:4, fontSize:11, color:'#555', textDecoration:'none' }}>
                                  <Ic n="file" s={11} /> {a.nombre}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign:'right', minWidth:120 }}>
                          {esConstructora ? (
                            <>
                              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:17, fontWeight:700, color:'#18170f' }}>{fmt(bid.precio)}</div>
                              <div style={{ fontSize:11, color:parseFloat(saving) > 0 ? '#1a6b3a' : '#c0392b', fontWeight:600 }}>{parseFloat(saving) > 0 ? '-' : '+'}{Math.abs(saving)}%</div>
                              <div style={{ fontSize:11, color:'#888', marginTop:4 }}>Plazo: {bid.plazo || 0}d</div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize:12, color:'#888', fontWeight:700 }}>Oferta enviada</div>
                              <div style={{ fontSize:11, color:'#888', marginTop:4 }}>Plazo: {bid.plazo || 0}d</div>
                            </>
                          )}

                          {esMia && bid.estado !== 'adjudicada' && (
                            <button type="button" onClick={() => onDeleteBid(bid.id)} style={{ marginTop:10, background:'#fdecea', border:'1px solid #f5c6c2', color:'#c0392b', borderRadius:5, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif' }}>
                              Retirar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }) : (
                  <div style={{ padding:'14px 16px', fontSize:12, color:'#888' }}>Todavía no hay ofertas en esta partida.</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function NotifPanel({ user, onClose, onOpenDetail }) {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.from('notifications').select('*').eq('userid', user.id).order('createdat', { ascending:false }).limit(50).then(({ data }) => {
      if (mounted) {
        setNotifs(data || [])
        setLoading(false)
      }
    })
    const ch = supabase.channel('notifs-panel').on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications' }, payload => {
      if (payload.new.userid === user.id) setNotifs(prev => [payload.new, ...prev])
    }).subscribe()
    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [user.id])

  async function marcarTodas() {
    await supabase.from('notifications').update({ leida:true }).eq('userid', user.id).eq('leida', false)
    setNotifs(prev => prev.map(n => ({ ...n, leida:true })))
  }

  const iconoTipo = t => t === 'puja' ? '💶' : t === 'seguidor' ? '👥' : t === 'seguimiento' ? '✅' : t === 'obra' ? '🏗️' : '🔔'

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.5)', backdropFilter:'blur(5px)', display:'flex' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ marginLeft:'auto', width:'min(480px,100vw)', background:'#fff', height:'100vh', overflowY:'auto', boxShadow:'0 0 60px rgba(0,0,0,.2)', display:'flex', flexDirection:'column' }}>
        <div style={{ background:'#18170f', color:'#fff', padding:'24px 28px 20px', flexShrink:0 }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,.4)', cursor:'pointer', marginBottom:14, border:'none', background:'none' }}><Ic n="back" s={13} /> Volver</button>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800 }}>Notificaciones</div>
            {notifs.some(n => !n.leida) && <button onClick={marcarTodas} style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontFamily:'Syne,sans-serif' }}>Marcar todas leídas</button>}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {loading && <div style={{ padding:20, color:'#888', textAlign:'center' }}>Cargando...</div>}
          {!loading && notifs.length === 0 && <div style={{ textAlign:'center', padding:'40px 20px', color:'#888' }}><div style={{ fontSize:36, marginBottom:10 }}>🔕</div><div style={{ fontFamily:'Syne,sans-serif', fontWeight:700 }}>Sin notificaciones</div></div>}
          {notifs.map(n => (
            <div
              key={n.id}
              style={{ padding:'14px 20px', borderBottom:'1px solid #eee', background:n.leida ? '#fff' : '#fff9f5', cursor:(n.tipo === 'puja' || n.tipo === 'obra') ? 'pointer' : 'default' }}
              onClick={async () => {
                if (!n.leida) {
                  await supabase.from('notifications').update({ leida:true }).eq('id', n.id)
                  setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, leida:true } : x))
                }
                const data = typeof n.data === 'string' ? JSON.parse(n.data || '{}') : (n.data || {})
                if ((n.tipo === 'puja' || n.tipo === 'obra') && data.proyectoid) {
                  onOpenDetail(data.proyectoid)
                  onClose()
                }
              }}
            >
              <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                <div style={{ fontSize:20, flexShrink:0 }}>{iconoTipo(n.tipo)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:2 }}>{n.titulo}</div>
                  {n.mensaje && <div style={{ fontSize:12, color:'#555', lineHeight:1.5 }}>{n.mensaje}</div>}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5 }}>
                    <div style={{ fontSize:11, color:'#aaa' }}>{new Date(n.createdat).toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
                    {(n.tipo === 'puja' || n.tipo === 'obra') && <div style={{ fontSize:10, color:'#e85d04', fontWeight:700 }}>Clic para ver la obra</div>}
                  </div>
                </div>
                {!n.leida && <div style={{ width:8, height:8, borderRadius:'50%', background:'#e85d04', flexShrink:0, marginTop:4 }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BotonSeguir({ currentUser, targetUser, currentCompany }) {
  const [estado, setEstado] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentUser || !targetUser) return
    supabase.from('follows').select('estado').eq('followerid', currentUser.id).eq('followingid', targetUser.id).maybeSingle().then(({ data }) => {
      if (data) setEstado(data.estado)
    })
  }, [currentUser?.id, targetUser?.id])

  async function toggleFollow() {
    if (!currentUser) return
    setLoading(true)
    if (estado) {
      await supabase.from('follows').delete().eq('followerid', currentUser.id).eq('followingid', targetUser.id)
      setEstado(null)
    } else {
      await supabase.from('follows').insert({
        followerid: currentUser.id,
        followingid: targetUser.id,
        followername: currentCompany?.name || currentUser.email,
        followingname: targetUser.name,
        estado: 'pendiente'
      })
      await supabase.from('notifications').insert({
        userid: targetUser.id,
        tipo: 'seguidor',
        titulo: `${currentCompany?.name || currentUser.email} quiere seguirte`,
        mensaje: 'Ha solicitado seguir tus publicaciones. Acepta o rechaza desde tu perfil > Seguidores.',
        data: { followerid: currentUser.id, followername: currentCompany?.name || currentUser.email }
      })
      setEstado('pendiente')
    }
    setLoading(false)
  }

  if (currentUser?.id === targetUser?.id) return null

  const label = estado === 'confirmado' ? 'Siguiendo' : estado === 'pendiente' ? 'Solicitud enviada' : 'Seguir'
  const style = {
    padding:'6px 14px',
    borderRadius:6,
    fontFamily:'Syne,sans-serif',
    fontSize:12,
    fontWeight:700,
    cursor:'pointer',
    border:'none',
    transition:'.15s',
    background: estado === 'confirmado' ? '#e5f4ec' : estado === 'pendiente' ? '#f0f0f0' : '#f0ecff',
    color: estado === 'confirmado' ? '#1a6b3a' : estado === 'pendiente' ? '#888' : '#5a3fa0',
    opacity: loading ? 0.6 : 1
  }

  return <button type="button" onClick={toggleFollow} disabled={loading} style={style}>{label}</button>
}

function EmpresasDirectorio({ currentUser, currentCompany, onNewMsg }) {
  const [empresas, setEmpresas] = useState([])

  useEffect(() => {
    supabase.from('companies').select('*').order('name').then(({ data }) => {
      if (data) setEmpresas(data)
    })
  }, [])

  return (
    <div>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:14 }}>EMPRESAS REGISTRADAS</div>
      {empresas.filter(e => e.id !== currentUser.id).map(e => (
        <div key={e.id} style={{ padding:'12px 14px', border:'1px solid #eee', borderRadius:8, marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'#e85d04', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', fontFamily:'Syne' }}>{(e.name || 'EM').slice(0,2).toUpperCase()}</div>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{e.name}</div>
                <div style={{ fontSize:11, color:'#888', marginTop:1 }}>{e.role} {e.cif ? `· CIF ${e.cif}` : ''}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <BotonSeguir currentUser={currentUser} targetUser={e} currentCompany={currentCompany} />
              <button type="button" onClick={() => onNewMsg(e)} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:6, color:'#5a3fa0', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'Syne' }}>
                <Ic n="msg" s={13} /> Mensaje
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function GestionSeguidores({ user, company }) {
  const [pendientes, setPendientes] = useState([])
  const [siguiendo, setSiguiendo] = useState([])
  const [seguidores, setSeguidores] = useState([])

  useEffect(() => {
    supabase.from('follows').select('*').eq('followingid', user.id).eq('estado', 'pendiente').then(({ data }) => { if (data) setPendientes(data) })
    supabase.from('follows').select('*').eq('followerid', user.id).then(({ data }) => { if (data) setSiguiendo(data) })
    supabase.from('follows').select('*').eq('followingid', user.id).eq('estado', 'confirmado').then(({ data }) => { if (data) setSeguidores(data) })
  }, [user.id])

  async function responder(id, followerid, followername, aceptar) {
    if (aceptar) {
      await supabase.from('follows').update({ estado:'confirmado' }).eq('id', id)
      await supabase.from('notifications').insert({
        userid: followerid,
        tipo:'seguimiento',
        titulo: `${company?.name} ha aceptado tu solicitud`,
        mensaje:'Ahora recibirás notificaciones cuando publiquen nuevas obras.',
        data:{ followingid:user.id }
      }).catch(() => {})
      setPendientes(prev => prev.filter(f => f.id !== id))
      setSeguidores(prev => [...prev, { id, followerid, followername, estado:'confirmado' }])
    } else {
      await supabase.from('follows').delete().eq('id', id)
      setPendientes(prev => prev.filter(f => f.id !== id))
    }
  }

  async function dejarDeSeguir(id) {
    await supabase.from('follows').delete().eq('id', id)
    setSiguiendo(prev => prev.filter(f => f.id !== id))
  }

  const seccStyle = { fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:10, marginTop:18 }

  return (
    <div>
      {pendientes.length > 0 && (
        <>
          <div style={seccStyle}>SOLICITUDES PENDIENTES ({pendientes.length})</div>
          {pendientes.map(f => (
            <div key={f.id} style={{ padding:'12px 14px', border:'1.5px solid #ffcba4', borderRadius:8, marginBottom:8, background:'#fff9f5', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{f.followername || 'Empresa'}</div>
                <div style={{ fontSize:11, color:'#888', marginTop:2 }}>Quiere seguir tus publicaciones</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button type="button" onClick={() => responder(f.id, f.followerid, f.followername, true)} style={{ padding:'6px 14px', background:'#e5f4ec', border:'1px solid #b8ddc8', borderRadius:5, color:'#1a6b3a', fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, cursor:'pointer' }}>Aceptar</button>
                <button type="button" onClick={() => responder(f.id, f.followerid, f.followername, false)} style={{ padding:'6px 14px', background:'#fdecea', border:'1px solid #f5c6c2', borderRadius:5, color:'#c0392b', fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, cursor:'pointer' }}>Rechazar</button>
              </div>
            </div>
          ))}
        </>
      )}

      <div style={seccStyle}>ESTOY SIGUIENDO ({siguiendo.length})</div>
      {siguiendo.length === 0 ? <div style={{ fontSize:13, color:'#888', fontStyle:'italic' }}>No sigues a ninguna empresa todavía. Búscalas en el Directorio.</div> : siguiendo.map(f => (
        <div key={f.id} style={{ padding:'11px 14px', border:'1px solid #eee', borderRadius:8, marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{f.followingname || 'Empresa'}</div>
            <div style={{ fontSize:11, marginTop:2, color:f.estado==='confirmado' ? '#1a6b3a' : '#c97a0a', fontWeight:600 }}>{f.estado==='confirmado' ? 'Confirmado · recibes notificaciones' : 'Pendiente de aceptación'}</div>
          </div>
          <button type="button" onClick={() => dejarDeSeguir(f.id)} style={{ fontSize:11, padding:'4px 10px', background:'#f0f0f0', border:'1px solid #ddd', borderRadius:4, cursor:'pointer', fontFamily:'Syne,sans-serif', color:'#888' }}>Dejar de seguir</button>
        </div>
      ))}

      <div style={seccStyle}>ME SIGUEN ({seguidores.length})</div>
      {seguidores.length === 0 ? <div style={{ fontSize:13, color:'#888', fontStyle:'italic' }}>Nadie te sigue todavía.</div> : seguidores.map(f => (
        <div key={f.id} style={{ padding:'11px 14px', border:'1px solid #eee', borderRadius:8, marginBottom:6 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{f.followername || 'Empresa'}</div>
        </div>
      ))}
    </div>
  )
}

function AdminEstadisticas({ projects, bids }) {
  const [empresas, setEmpresas] = useState([])

  useEffect(() => {
    supabase.from('companies').select('*').order('createdat', { ascending:false }).then(({ data }) => {
      if (data) setEmpresas(data)
    })
  }, [])

  const obrasAbiertas = projects.filter(p => (p.estado || '').toLowerCase() === 'abierta' || (p.estado || '').toLowerCase() === 'open').length
  const obrasCerradas = projects.length - obrasAbiertas
  const totalBids = bids.length
  const bidsAdjudicadas = bids.filter(b => b.estado === 'adjudicada').length
  const bidsExpiradas = bids.filter(b => b.expirada).length
  const avgSaving = bids.length ? bids.reduce((s, b) => {
    const p = projects.flatMap(pr => pr.partidas || []).find(pa => pa.id === (b.partidaid || b.partida_id))
    return s + (p ? ((p.precioSalida - b.precio) / p.precioSalida * 100) : 0)
  }, 0) / bids.length : 0
  const totalRef = projects.reduce((s, p) => s + (p.partidas || []).reduce((ss, pa) => ss + ((pa.medicion || 0) * (pa.precioSalida || 0)), 0), 0)
  const totalAdjudicado = bids.filter(b => b.estado === 'adjudicada').reduce((s, b) => {
    const p = projects.flatMap(pr => pr.partidas || []).find(pa => pa.id === (b.partidaid || b.partida_id))
    return s + (p ? b.precio * p.medicion : 0)
  }, 0)
  const porEmpresa = bids.reduce((acc, b) => {
    acc[b.empresa] = (acc[b.empresa] || 0) + 1
    return acc
  }, {})
  const topEmpresas = Object.entries(porEmpresa).sort((a,b) => b[1] - a[1]).slice(0,5)
  const porObra = projects.map(p => ({ nombre:p.nombre, empresa:p.empresa, pujas:bids.filter(b => (b.proyectoid || b.proyecto_id) === p.id).length })).sort((a,b) => b.pujas - a.pujas).slice(0,5)

  const card = (titulo, valor, color='#18170f', sub='') => (
    <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:'14px 16px', flex:1, minWidth:130 }}>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:6 }}>{titulo}</div>
      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:22, fontWeight:700, color }}>{valor}</div>
      {sub && <div style={{ fontSize:11, color:'#888', marginTop:4 }}>{sub}</div>}
    </div>
  )

  return (
    <div>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:14 }}>RESUMEN PLATAFORMA</div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
        {card('OBRAS ABIERTAS', obrasAbiertas, '#1a6b3a')}
        {card('OBRAS CERRADAS', obrasCerradas, '#888')}
        {card('EMPRESAS', empresas.length, '#1a4d7a')}
        {card('OFERTAS TOTALES', totalBids)}
        {card('ADJUDICADAS', bidsAdjudicadas, '#1a6b3a')}
        {card('AHORRO MEDIO', `${avgSaving ? '-' + avgSaving.toFixed(1) : '0.0'}%`, '#1a6b3a')}
      </div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
        {card('PRESUPUESTO TOTAL REF.', fmt(totalRef), '#e85d04', 'suma de todas las obras')}
        {card('VALOR ADJUDICADO', fmt(totalAdjudicado), '#1a6b3a', 'contratado en plataforma')}
        {card('OFERTAS EXPIRADAS', bidsExpiradas, '#888')}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:12 }}>TOP EMPRESAS PUJADORAS</div>
          {topEmpresas.map(([emp, n], i) => (
            <div key={emp} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:i < topEmpresas.length-1 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:['#e85d04','#1a4d7a','#1a6b3a','#5a3fa0','#888'][i], color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</div>
                <span style={{ fontSize:13, fontWeight:600 }}>{emp}</span>
              </div>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13 }}>{n} pujas</span>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:12 }}>OBRAS MÁS ACTIVAS</div>
          {porObra.map((o, i) => (
            <div key={o.nombre} style={{ padding:'7px 0', borderBottom:i < porObra.length-1 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div style={{ fontSize:12, fontWeight:600, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:8 }}>{o.nombre}</div>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, flexShrink:0 }}>{o.pujas} ofertas</span>
              </div>
              <div style={{ fontSize:11, color:'#888' }}>{o.empresa}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:'14px 16px' }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:12 }}>ÚLTIMAS EMPRESAS REGISTRADAS</div>
        {empresas.slice(0, 8).map(e => (
          <div key={e.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f5f5f5' }}>
            <div>
              <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{e.name}</span>
              <span style={{ fontSize:11, color:'#888', marginLeft:8 }}>{e.role}</span>
              {e.cif && <span style={{ fontSize:11, color:'#888', marginLeft:8 }}>CIF {e.cif}</span>}
            </div>
            <div style={{ fontSize:11, color:'#888' }}>{e.createdat ? new Date(e.createdat).toLocaleDateString('es-ES') : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MessagesPanel({ user, company, onClose, initialTarget, isAdmin }) {
  const [mensajes, setMensajes] = useState([])
  const [conv, setConv] = useState(initialTarget || null)
  const [texto, setTexto] = useState('')
  const [asunto, setAsunto] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMessages()
    const ch = supabase.channel('msgs').on('postgres_changes', { event:'INSERT', schema:'public', table:'messages' }, payload => {
      if (payload.new.touserid === user.id || payload.new.fromuserid === user.id) setMensajes(prev => [payload.new, ...prev])
    }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [user.id, company?.role, isAdmin])

  async function loadMessages() {
    const esAdmin = isAdmin || company?.role === 'admin'
    const query = esAdmin
      ? supabase.from('messages').select('*').order('createdat', { ascending:false })
      : supabase.from('messages').select('*').or(`fromuserid.eq.${user.id},touserid.eq.${user.id}`).order('createdat', { ascending:false })

    const { data } = await query
    if (data) setMensajes(data)
  }

  async function enviar() {
    if (!texto.trim() || !conv) return
    setLoading(true)
    const nuevoMsg = {
      id: 'M' + Math.random().toString(36).slice(2,10),
      fromuserid: user.id,
      touserid: conv.id,
      fromempresa: company?.name || user.email,
      toempresa: conv.name,
      asunto: asunto || 'Sin asunto',
      contenido: texto,
      leido: false,
      createdat: new Date().toISOString()
    }
    const { error } = await supabase.from('messages').insert({
      fromuserid: nuevoMsg.fromuserid,
      touserid: nuevoMsg.touserid,
      fromempresa: nuevoMsg.fromempresa,
      toempresa: nuevoMsg.toempresa,
      asunto: nuevoMsg.asunto,
      contenido: nuevoMsg.contenido,
      leido: false
    })
    if (!error) {
      setMensajes(prev => [nuevoMsg, ...prev])
      setTexto('')
      setAsunto('')
    }
    setLoading(false)
  }

  const convs = Object.values(mensajes.reduce((acc, m) => {
    const otherId = m.fromuserid === user.id ? m.touserid : m.fromuserid
    const otherName = m.fromuserid === user.id ? m.toempresa : m.fromempresa
    if (!acc[otherId]) acc[otherId] = { id:otherId, name:otherName, msgs:[] }
    acc[otherId].msgs.push(m)
    return acc
  }, {}))

  async function marcarLeido(convId) {
    await supabase.from('messages').update({ leido:true }).eq('touserid', user.id).eq('fromuserid', convId).eq('leido', false)
    setMensajes(prev => prev.map(m => m.fromuserid === convId && m.touserid === user.id ? { ...m, leido:true } : m))
  }

  const noLeidos = mensajes.filter(m => m.touserid === user.id && !m.leido).length

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.5)', backdropFilter:'blur(5px)', display:'flex' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ marginLeft:'auto', width:'min(980px,100vw)', background:'#fff', height:'100vh', display:'flex', flexDirection:'column', boxShadow:'0 0 60px rgba(0,0,0,.2)' }}>
        <div style={{ background:'#18170f', color:'#fff', padding:'20px 28px' }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,.4)', cursor:'pointer', marginBottom:12, border:'none', background:'none' }}>
            <Ic n="back" s={13} /> Volver
          </button>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800 }}>
            Mensajes {noLeidos > 0 && <span style={{ fontSize:12, background:'#e85d04', color:'#fff', padding:'2px 8px', borderRadius:20, marginLeft:8 }}>{noLeidos} nuevo{noLeidos !== 1 ? 's' : ''}</span>}
          </div>
        </div>

        <div style={{ flex:1, display:'grid', gridTemplateColumns:'300px 1fr', minHeight:0 }}>
          <div style={{ borderRight:'1px solid #eee', overflowY:'auto' }}>
            {convs.length === 0 ? (
              <div style={{ padding:20, color:'#888' }}>No hay conversaciones todavía.</div>
            ) : convs.map(c => {
              const unread = c.msgs.filter(m => m.fromuserid === c.id && m.touserid === user.id && !m.leido).length
              const latest = [...c.msgs].sort((a,b) => new Date(b.createdat) - new Date(a.createdat))[0]
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setConv(c); marcarLeido(c.id) }}
                  style={{ width:'100%', textAlign:'left', padding:'14px 16px', border:'none', borderBottom:'1px solid #f0f0f0', background:conv?.id === c.id ? '#fff9f5' : '#fff', cursor:'pointer' }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{c.name}</div>
                    {unread > 0 && <span style={{ minWidth:18, height:18, borderRadius:'50%', background:'#e85d04', color:'#fff', fontSize:10, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>{unread}</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#888', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{latest?.contenido}</div>
                </button>
              )
            })}
          </div>

          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {conv ? (
              <>
                <div style={{ padding:'12px 18px', borderBottom:'1px solid #eee', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>Conversación con {conv.name}</div>
                <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                  {[...(convs.find(c => c.id === conv.id)?.msgs || [])].reverse().map(m => {
                    const esMio = m.fromuserid === user.id
                    return (
                      <div key={m.id} style={{ display:'flex', justifyContent:esMio ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth:'75%', padding:'10px 14px', borderRadius:12, background:esMio ? '#e85d04' : '#f0ecff', color:esMio ? '#fff' : '#333', fontSize:13, lineHeight:1.5 }}>
                          {m.asunto && m.asunto !== 'Sin asunto' && <div style={{ fontSize:10, fontWeight:700, opacity:.7, marginBottom:4 }}>{m.asunto}</div>}
                          {m.contenido}
                          <div style={{ fontSize:10, opacity:.6, marginTop:4 }}>{new Date(m.createdat).toLocaleString('es-ES', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' })}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ padding:'14px 18px', borderTop:'1px solid #eee', display:'flex', flexDirection:'column', gap:8 }}>
                  <input style={{ padding:'8px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13, outline:'none', fontFamily:'Barlow' }} placeholder="Asunto opcional" value={asunto} onChange={e=>setAsunto(e.target.value)} />
                  <div style={{ display:'flex', gap:8 }}>
                    <textarea style={{ flex:1, padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13, outline:'none', resize:'none', fontFamily:'Barlow', minHeight:60 }} placeholder="Escribe tu mensaje..." value={texto} onChange={e=>setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) enviar() }} />
                    <button onClick={enviar} disabled={!texto.trim() || loading} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 16px', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:'Syne', fontWeight:700, fontSize:13, opacity:(!texto.trim()||loading)?0.5:1 }}>
                      <Ic n="send" s={15} /> Enviar
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:'#888' }}>Ctrl+Enter para enviar</div>
                </div>
              </>
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, color:'#888' }}>
                <Ic n="msg" s={40} />
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

function ProfilePanel({ user, company, projects, bids, onClose, onOpenDetail, onNewMsg, onCompanyUpdate, onDeleteProject, onDeleteBid, isAdmin }) {
  const [tab, setTab] = useState('perfil')
  const [editNombre, setEditNombre] = useState(company?.name || '')
  const [editTel, setEditTel] = useState(company?.telefono || '')
  const [editRoles, setEditRoles] = useState(company?.roles ? company.roles.split(',').map(s => s.trim()).filter(Boolean) : (company?.role ? [company.role] : []))
  const [editEmail, setEditEmail] = useState(user?.email || '')
  const [editPass, setEditPass] = useState('')
  const [editPassConf, setEditPassConf] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState({ text:'', ok:false })

  const misProjects = projects.filter(p => (p.user_id || p.userid) === user.id)
  const misPujas = bids.filter(b => (b.user_id || b.userid) === user.id)

  async function guardarPerfil() {
    try {
      setSaving(true)
      setSaveMsg({ text:'', ok:false })
      const payload = { name:editNombre, telefono:editTel, roles:editRoles.join(','), role:editRoles[0] || company?.role || 'subcontrata' }
      const { error } = await supabase.from('companies').update(payload).eq('id', user.id)
      if (error) throw error

      if (editEmail && editEmail !== user.email) {
        const { error: emErr } = await supabase.auth.updateUser({ email: editEmail })
        if (emErr) throw emErr
      }

      if (editPass || editPassConf) {
        if (editPass.length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres')
        if (editPass !== editPassConf) throw new Error('Las contraseñas no coinciden')
        const { error: pwErr } = await supabase.auth.updateUser({ password: editPass })
        if (pwErr) throw pwErr
      }

      onCompanyUpdate(payload)
      setSaveMsg({ text:'Perfil actualizado correctamente', ok:true })
      setEditPass('')
      setEditPassConf('')
    } catch (e) {
      setSaveMsg({ text:e.message || 'Error guardando perfil', ok:false })
    } finally {
      setSaving(false)
    }
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', fontFamily:'Barlow,sans-serif', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:11, fontWeight:700, letterSpacing:'.06em', color:'#888', marginBottom:5, fontFamily:'Syne,sans-serif' }

  function toggleRol(r) {
    setEditRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.5)', backdropFilter:'blur(5px)', display:'flex' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ marginLeft:'auto', width:'min(860px,100vw)', background:'#fff', height:'100vh', overflowY:'auto', boxShadow:'0 0 60px rgba(0,0,0,.2)' }}>
        <div style={{ background:'#18170f', color:'#fff', padding:'24px 28px 20px' }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,.4)', cursor:'pointer', marginBottom:14, border:'none', background:'none' }}><Ic n="back" s={13} /> Volver</button>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, marginBottom:12 }}>Mi perfil</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              ['perfil','Perfil'],
              ['obras','Mis obras'],
              ['pujas','Mis pujas'],
              ['empresas','Directorio'],
              ['seguidores','Seguidores'],
              ...(isAdmin ? [['estadisticas','Admin']] : []),
            ].map(([k,l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} style={{ padding:'7px 12px', borderRadius:22, border:'1px solid rgba(255,255,255,.12)', background:tab===k?'rgba(255,255,255,.14)':'rgba(255,255,255,.04)', color:'#fff', cursor:'pointer', fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700 }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ padding:'22px 28px' }}>
          {tab === 'perfil' && (
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:18 }}>DATOS DE LA EMPRESA</div>
              <div style={{ marginBottom:14 }}><label style={lbl}>NOMBRE DE LA EMPRESA</label><input style={inp} value={editNombre} onChange={e=>setEditNombre(e.target.value)} placeholder="Nombre de tu empresa" /></div>
              <div style={{ marginBottom:14 }}><label style={lbl}>TELÉFONO DE CONTACTO</label><input style={inp} type="tel" value={editTel} onChange={e=>setEditTel(e.target.value)} placeholder="6XX XXX XXX" /></div>
              <div style={{ marginBottom:20 }}>
                <label style={lbl}>ROLES DE LA EMPRESA (puedes tener varios)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                  {ROLE_OPTIONS.map(r => (
                    <button key={r} type="button" onClick={() => toggleRol(r)} style={{ padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Barlow,sans-serif', transition:'.15s', border:editRoles.includes(r)?'2px solid #e85d04':'2px solid #eee', background:editRoles.includes(r)?'#fff2ec':'transparent', color:editRoles.includes(r)?'#e85d04':'#888' }}>
                      {r}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:11, color:'#888', marginTop:6 }}>Roles activos: <strong>{editRoles.join(', ') || 'ninguno'}</strong></div>
              </div>

              <div style={{ height:1, background:'#eee', margin:'20px 0' }} />

              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:18 }}>ACCESO Y SEGURIDAD</div>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>EMAIL DE ACCESO</label>
                <input style={inp} type="email" value={editEmail} onChange={e=>setEditEmail(e.target.value)} placeholder="tu@empresa.com" />
                <div style={{ fontSize:11, color:'#888', marginTop:4 }}>Si cambias el email recibirás un enlace de confirmación</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div><label style={lbl}>NUEVA CONTRASEÑA</label><input style={inp} type="password" value={editPass} onChange={e=>setEditPass(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
                <div><label style={lbl}>CONFIRMAR CONTRASEÑA</label><input style={inp} type="password" value={editPassConf} onChange={e=>setEditPassConf(e.target.value)} placeholder="Repite la contraseña" /></div>
              </div>
              <div style={{ fontSize:11, color:'#888', marginBottom:20 }}>Deja en blanco si no quieres cambiar la contraseña</div>

              {saveMsg.text && <div style={{ padding:'10px 14px', background:saveMsg.ok?'#e5f4ec':'#fdecea', color:saveMsg.ok?'#1a6b3a':'#c0392b', borderRadius:6, fontSize:13, marginBottom:16, lineHeight:1.5 }}>{saveMsg.text}</div>}
              <button type="button" onClick={guardarPerfil} disabled={saving} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'12px 28px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?0.6:1 }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}

          {tab === 'obras' && (
            <>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:14 }}>MIS OBRAS ({misProjects.length})</div>
              {misProjects.length === 0 ? <div style={{ color:'#888' }}>No has publicado obras todavía.</div> : misProjects.map(p => {
                const totalRef = (p.partidas || []).reduce((s, pa) => s + ((pa.medicion||0)*(pa.precioSalida||0)), 0)
                return (
                  <div key={p.id} style={{ padding:'14px 16px', border:'1px solid #eee', borderRadius:10, marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{p.nombre}</div>
                        <div style={{ fontSize:12, color:'#888', marginTop:3 }}>{p.ubicacion} · Cierre {p.fecha_cierre || p.fechacierre}</div>
                        <div style={{ fontSize:12, color:'#444', marginTop:6 }}>{p.descripcion}</div>
                        <div style={{ fontSize:12, color:'#888', marginTop:6 }}>{(p.partidas||[]).length} partidas · Ref. {fmt(totalRef)}</div>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button type="button" onClick={() => onOpenDetail(p.id)} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #ddd', background:'#fff', cursor:'pointer' }}>Abrir</button>
                        <button type="button" onClick={() => { if (window.confirm('¿Eliminar esta publicación? Se borrarán también todas sus pujas.')) onDeleteProject(p.id) }} style={{ background:'#fdecea', border:'1px solid #f5c6c2', color:'#c0392b', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif' }}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {tab === 'pujas' && (
            <>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:14 }}>MIS PUJAS ({misPujas.length})</div>
              {misPujas.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'#888' }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
                  <div style={{ fontFamily:'Syne', fontWeight:700, marginBottom:6 }}>Sin pujas enviadas</div>
                </div>
              ) : misPujas.map(b => {
                const proj = projects.find(p => p.id === (b.proyectoid || b.proyecto_id))
                const puedeRetirar = b.estado === 'pendiente' && !b.expirada
                return (
                  <div key={b.id} style={{ padding:'14px 16px', border:'1px solid #eee', borderRadius:10, marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{proj?.nombre || 'Proyecto'}</div>
                        <div style={{ fontSize:12, color:'#888', marginTop:3 }}>{b.fecha} · Plazo {b.plazo}d</div>
                        {b.observaciones && <div style={{ fontSize:11, color:'#555', marginTop:3, fontStyle:'italic' }}>{b.observaciones.slice(0,80)}{b.observaciones.length > 80 ? '...' : ''}</div>}
                        {b.validezfecha && <div style={{ fontSize:11, color:'#c97a0a', marginTop:2 }}>Válida hasta {b.validezfecha}</div>}
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:16, fontWeight:600 }}>{fmt(b.precio)}</div>
                        <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, display:'inline-block', marginTop:3, background:b.estado==='adjudicada'?'#e5f4ec':b.expirada?'#f0f0f0':'#fff8e6', color:b.estado==='adjudicada'?'#1a6b3a':b.expirada?'#888':'#b07a10' }}>{b.expirada ? 'EXPIRADA' : (b.estado || '').toUpperCase()}</span>
                        <div style={{ marginTop:8, display:'flex', gap:6, justifyContent:'flex-end' }}>
                          {puedeRetirar && !isAdmin && <button type="button" onClick={() => { if (window.confirm('¿Retirar tu oferta? Esta acción no se puede deshacer.')) onDeleteBid(b.id) }} style={{ background:'#fdecea', border:'1px solid #f5c6c2', color:'#c0392b', borderRadius:5, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif' }}>Retirar oferta</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {tab === 'empresas' && <EmpresasDirectorio currentUser={user} currentCompany={company} onNewMsg={onNewMsg} />}
          {tab === 'seguidores' && <GestionSeguidores user={user} company={company} />}
          {tab === 'estadisticas' && isAdmin && <AdminEstadisticas projects={projects} bids={bids} />}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [company, setCompany] = useState(null)
  const [projects, setProjects] = useState([])
  const [bids, setBids] = useState([])
  const [authReady, setAuthReady] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [activeTags, setActiveTags] = useState([])
  const [sortBy, setSortBy] = useState('reciente')
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showMsgs, setShowMsgs] = useState(false)
  const [msgTarget, setMsgTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [noLeidos, setNoLeidos] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [noLeidosNotif, setNoLeidosNotif] = useState(0)

  const showToast = useCallback(msg => {
    setToast(msg)
    setTimeout(() => setToast(null), 2100)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session
      if (s?.user) {
        setSession(s)
        supabase.from('companies').select('*').eq('id', s.user.id).maybeSingle().then(({ data }) => {
          if (data) setCompany(data)
        }).catch(e => console.warn('company', e))
      } else {
        setSession(null)
        setCompany(null)
      }
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setCompany(null)
        setAuthReady(true)
        return
      }

      if (s) {
        setSession(s)
        supabase.from('companies').select('*').eq('id', s.user.id).maybeSingle().then(({ data }) => {
          if (data) setCompany(data)
        }).catch(e => console.warn('company', e))
      } else {
        setSession(null)
        setCompany(null)
      }

      setAuthReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) return
    supabase.from('notifications').select('id', { count:'exact', head:true }).eq('userid', session.user.id).eq('leida', false).then(({ count }) => setNoLeidosNotif(count || 0))
    const ch = supabase.channel('notif-count').on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications' }, payload => {
      if (payload.new.userid === session.user.id) setNoLeidosNotif(n => n + 1)
    }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user) return
    supabase.from('messages').select('id', { count:'exact' }).eq('touserid', session.user.id).eq('leido', false).then(({ count }) => setNoLeidos(count || 0))
    const ch = supabase.channel('msg-badge').on('postgres_changes', { event:'INSERT', schema:'public', table:'messages' }, payload => {
      if (payload.new.touserid === session.user.id) setNoLeidos(n => n + 1)
    }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [session?.user?.id])

  async function loadData() {
    try {
      try { await supabase.rpc('marcarpujasexpiradas') } catch {}
      const [{ data:p }, { data:b }] = await Promise.all([
        supabase.from('projects').select('*').order('createdat', { ascending:false }),
        supabase.from('bids').select('*').order('fecha', { ascending:false })
      ])
      if (p) setProjects(p)
      if (b) setBids(b)
    } catch (e) {
      console.error(e)
    } finally {
      setDataLoaded(true)
    }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const ch = supabase.channel('rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'projects' }, payload => {
        setProjects(prev => prev.find(p => p.id === payload.new.id) ? prev : [payload.new, ...prev])
      })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'bids' }, payload => {
        setBids(prev => prev.find(b => b.id === payload.new.id) ? prev : [payload.new, ...prev])
      })
      .on('postgres_changes', { event:'DELETE', schema:'public', table:'bids' }, payload => {
        setBids(prev => prev.filter(b => b.id !== payload.old.id))
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bids' }, payload => {
        setBids(prev => prev.map(b => b.id === payload.new.id ? payload.new : b))
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  async function handleDeleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) return showToast('Error: ' + error.message)
    setProjects(prev => prev.filter(p => p.id !== id))
    setBids(prev => prev.filter(b => (b.proyectoid || b.proyecto_id) !== id))
    showToast('Publicación eliminada')
  }

  async function handleDeleteBid(id) {
    const { error } = await supabase.from('bids').delete().eq('id', id)
    if (error) return showToast('Error: ' + error.message)
    setBids(prev => prev.filter(b => b.id !== id))
    showToast('Oferta retirada')
  }

  async function handleOpenDetail(id) {
    setDetailId(id)
    await supabase.rpc('incrementviews', { projectid:id }).catch(() => {})
  }

  function handleNewMsg(empresa) {
    setMsgTarget({ id:empresa.id, name:empresa.name })
    setShowProfile(false)
    setShowMsgs(true)
  }

  async function handleNewProject(data) {
    const proj = {
      id: 'P' + uid(),
      slug: slugify(data.nombre),
      nombre: data.nombre,
      empresa: company?.name || session?.user?.email || 'Admin',
      einit: (company?.name || session?.user?.email || 'AD').slice(0,2).toUpperCase(),
      ecolor: COLORS[Math.floor(Math.random() * COLORS.length)],
      descripcion: data.desc,
      ubicacion: data.ubic || 'España',
      fecha_cierre: data.fecha,
      fechacierre: data.fecha,
      fecha_inicio: data.fechaInicio || null,
      fechainicio: data.fechaInicio || null,
      tags: data.tags || [],
      estado: 'abierta',
      partidas: data.partidas || [],
      views: 0,
      user_id: session.user.id,
      userid: session.user.id,
      archivos: data.archivos || [],
      email_contacto: data.emailcontacto || data.responsableEmail,
      emailcontacto: data.emailcontacto || data.responsableEmail,
      responsable_nombre: data.responsableNombre,
      responsablenombre: data.responsableNombre,
      responsable_email: data.responsableEmail,
      responsableemail: data.responsableEmail,
      responsable_tel: data.responsableTel,
      responsabletel: data.responsableTel,
      visibilidad: data.visibilidad || 'publica',
      empresas_invitadas: data.invitadas || [],
      empresasinvitadas: data.invitadas || [],
      mostrar_num_pujas: false,
      mostrar_empresas: false,
      mostrarnumpujas: false,
      mostrarempresas: false,
      createdat: new Date().toISOString()
    }

    const { data: inserted, error } = await supabase.from('projects').insert(proj).select().single()
    if (error) {
      console.error('Error insertando proyecto', error)
      showToast('Error: ' + error.message)
      return
    }

    if (inserted) setProjects(prev => [inserted, ...prev])

    if (data.visibilidad === 'privada' && data.invitadas?.length) {
      data.invitadas.forEach(email => {
        try {
          window.emailjs?.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            proyecto_nombre: proj.nombre,
            partida_nombre: 'Licitación privada: has sido invitado',
            constructora_nombre: company?.name || '',
            email_constructora: email,
            subcontrata_nombre: email,
            precio: 'Ver en plataforma',
            plazo: proj.fecha_cierre,
            observaciones: `Has sido invitado a pujar en ${proj.nombre}. Entra en ObraLicit para ver los detalles.`,
            telefono_contacto: data.responsableTel || 'Ver plataforma'
          }, EMAILJS_PUBLIC_KEY)
        } catch(e) {
          console.warn('Email invitacion', e)
        }
      })
    }

    if (inserted) {
      supabase.from('follows').select('followerid').eq('followingid', session.user.id).eq('estado', 'confirmado').then(({ data: segs }) => {
        if (segs?.length) {
          supabase.from('notifications').insert(segs.map(s => ({
            userid: s.followerid,
            tipo: 'obra',
            titulo: `${company?.name || 'Una empresa'} ha publicado una nueva obra`,
            mensaje: `${inserted.nombre} · ${inserted.ubicacion || 'España'}`,
            data: { proyectoid: inserted.id }
          }))).catch(() => {})
        }
      }).catch(() => {})
    }

    const msg = data.visibilidad === 'privada' ? `Obra privada publicada · ${data.invitadas?.length || 0} empresas notificadas` : 'Obra publicada para todos'
    showToast(msg)
  }

  async function handleBid(proj, partida, form, existingBid) {
    if (!session?.user) return
    if (existingBid) {
      const updateData = {
        precio: parseFloat(form.precio),
        plazo: parseInt(form.plazo || 0),
        observaciones: form.obs,
        telefono: form.tel,
        valideztipo: form.validezTipo || 'indefinida',
        valideztipo: form.validezTipo || 'indefinida',
        validezfecha: form.validezFecha || null,
        validez_fecha: form.validezFecha || null,
        archivos: form.archivos || [],
        feedback: null,
      }
      const { error } = await supabase.from('bids').update(updateData).eq('id', existingBid.id)
      if (error) return showToast('Error: ' + error.message)
      setBids(prev => prev.map(b => b.id === existingBid.id ? { ...b, ...updateData } : b))
      showToast('Oferta actualizada')
      return
    }

    const bidData = {
      id: 'B' + uid(),
      proyectoid: proj.id,
      proyecto_id: proj.id,
      partidaid: partida.id,
      partida_id: partida.id,
      userid: session.user.id,
      user_id: session.user.id,
      empresa: company?.name || session.user.email,
      contacto: session.user.email,
      telefono: form.tel,
      precio: parseFloat(form.precio),
      plazo: parseInt(form.plazo || 0),
      observaciones: form.obs,
      estado: 'pendiente',
      fecha: new Date().toISOString().split('T')[0],
      valideztipo: form.validezTipo || 'indefinida',
      validez_tipo: form.validezTipo || 'indefinida',
      validezfecha: form.validezFecha || null,
      validez_fecha: form.validezFecha || null,
      archivos: form.archivos || [],
      feedback: null,
      rating: null,
      feedbacktags: [],
      expirada: false,
    }

    const { error } = await supabase.from('bids').insert(bidData)
    if (error) return showToast('Error: ' + error.message)

    setBids(prev => prev.find(b => b.id === bidData.id) ? prev : [bidData, ...prev])

    if ((proj.user_id || proj.userid) && (proj.user_id || proj.userid) !== session.user.id) {
      const notifResult = await supabase.from('notifications').insert({
        userid: proj.user_id || proj.userid,
        tipo: 'puja',
        titulo: 'Nueva oferta en tu obra',
        mensaje: `${company?.name || 'Una empresa'} ha presentado oferta en ${proj.nombre}, partida ${partida.descripcion}.`,
        data: JSON.stringify({ proyectoid: proj.id })
      })
      if (notifResult.error) console.warn('Notif puja error', notifResult.error)
    }

    try {
      window.emailjs?.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        proyecto_nombre: proj.nombre,
        partida_nombre: partida.descripcion,
        constructora_nombre: proj.empresa,
        email_constructora: proj.emailcontacto || proj.email_contacto,
        subcontrata_nombre: company?.name || '',
        precio: form.precio,
        plazo: form.plazo,
        observaciones: form.obs || 'Sin observaciones',
        telefono_contacto: form.tel || 'No facilitado'
      }, EMAILJS_PUBLIC_KEY)
    } catch(e) {
      console.warn(e)
    }

    showToast('Oferta publicada correctamente')
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let r = projects.filter(p => {
      const mq = !q
        || p.nombre?.toLowerCase().includes(q)
        || p.empresa?.toLowerCase().includes(q)
        || p.ubicacion?.toLowerCase().includes(q)
        || p.tags?.some(t => t.toLowerCase().includes(q))
      const mt = activeTags.length === 0 || activeTags.every(t => p.tags?.includes(t))
      return mq && mt
    })
    if (sortBy === 'reciente') r.sort((a,b) => new Date(b.createdat) - new Date(a.createdat))
    if (sortBy === 'populares') r.sort((a,b) => (b.views || 0) - (a.views || 0))
    if (sortBy === 'cierre') r.sort((a,b) => new Date(a.fecha_cierre || a.fechacierre) - new Date(b.fecha_cierre || b.fechacierre))
    if (sortBy === 'pujas') r.sort((a,b) => bids.filter(x => (x.proyectoid || x.proyecto_id) === b.id).length - bids.filter(x => (x.proyectoid || x.proyecto_id) === a.id).length)
    return r
  }, [projects, search, activeTags, sortBy, bids])

  const detailProj = projects.find(p => p.id === detailId)
  const tagCount = t => projects.filter(p => p.tags?.includes(t)).length
  const toggleTag = t => setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  const avgSaving = bids.length ? bids.reduce((s, b) => {
    const p = projects.flatMap(pr => pr.partidas || []).find(pa => pa.id === (b.partidaid || b.partida_id))
    return s + (p ? ((p.precioSalida - b.precio) / p.precioSalida * 100) : 0)
  }, 0) / bids.length : 0

  if (!authReady) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f2f0eb', flexDirection:'column', gap:14 }}>
        <div style={{ width:48, height:48, background:'#18170f', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#e85d04', fontFamily:'Syne,sans-serif' }}>O</div>
        <div style={{ fontSize:14, color:'#888', fontFamily:'Syne,sans-serif' }}>Conectando...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <AuthScreen onLogin={async (user, co) => {
        const fakeSession = { user }
        setSession(fakeSession)
        try {
          const { data: coFresh } = await supabase.from('companies').select('*').eq('id', user.id).maybeSingle()
          setCompany(coFresh || co)
        } catch {
          setCompany(co)
        }
      }} />
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f2f0eb' }}>
      {toast && <Toast msg={toast} />}

      <header style={{ position:'sticky', top:0, zIndex:40, background:'rgba(242,240,235,.95)', backdropFilter:'blur(10px)', borderBottom:'1px solid #e7e1d8' }}>
        <div style={{ maxWidth:1320, margin:'0 auto', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:42, height:42, borderRadius:10, background:'#18170f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#e85d04', fontFamily:'Syne,sans-serif' }}>O</div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:19, fontWeight:800 }}>ObraLicit</div>
              <div style={{ fontSize:11, color:'#888' }}>Mercado de contratación y pujas de obra</div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <button onClick={() => setShowNotifs(true)} style={{ position:'relative', display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'#555', border:'1.5px solid #eee' }}>
              <Ic n="bell" s={15} /> Notificaciones
              {noLeidosNotif > 0 && <span style={{ position:'absolute', top:-2, right:-2, minWidth:16, height:16, borderRadius:'50%', background:'#e85d04', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>{noLeidosNotif}</span>}
            </button>

            <button onClick={() => setShowMsgs(true)} style={{ position:'relative', display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'#555', border:'1.5px solid #eee' }}>
              <Ic n="msg" s={15} /> Mensajes
              {noLeidos > 0 && <span style={{ position:'absolute', top:-2, right:-2, minWidth:16, height:16, borderRadius:'50%', background:'#e85d04', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>{noLeidos}</span>}
            </button>

            <button onClick={() => setShowNew(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:'#e85d04', color:'#fff' }}>
              <Ic n="plus" s={14} c="#fff" /> Publicar obra
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 14px 5px 6px', background:'#f2f0eb', border:'1.5px solid #eee', borderRadius:22, cursor:'pointer', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600' }} onClick={() => setShowProfile(true)}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', background:'#e85d04' }}>{(company?.name || session.user.email).slice(0,2).toUpperCase()}</div>
              {company?.name || session.user.email}
            </div>

            <button onClick={() => supabase.auth.signOut()} style={{ display:'flex', alignItems:'center', padding:8, borderRadius:22, border:'1.5px solid #eee', background:'transparent', cursor:'pointer', color:'#888' }} title="Cerrar sesión">
              <Ic n="logout" s={15} />
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:1320, margin:'0 auto', padding:'18px', display:'grid', gridTemplateColumns:'280px 1fr', gap:18 }}>
        <aside style={{ position:'sticky', top:84, alignSelf:'start' }}>
          <div style={{ background:'#fff', borderRadius