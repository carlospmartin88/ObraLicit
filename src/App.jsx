import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'

// UUID del usuario administrador — ve todos los precios y conversaciones
const ADMIN_USER_ID = '4ab86804-df35-49c6-9919-2480ae898863'

// â”€â”€â”€ CONSTANTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â. ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
const ESPECIALIDAD = ['Micropilotes','Pilotes CPI','Inyecciones','Pantallas','Muros','Mejora terreno','Anclajes','Sondeos','Cimentaciones especiales']
const ZONAS = ['Madrid','Barcelona','Sevilla','Valencia','Bilbao','Zaragoza','Málaga','Galicia','Canarias']
const TYPES = ['Obra pública','Obra privada','Urgente','Industrial','Residencial','Infraestructura']
const TODAS_LAS_ETIQUETAS = [...ESPECIALIDAD, ...ZONAS, ...TIPOS]
const COLORES = ['#1a4d7a','#0a7c6e','#c0392b','#5a3fa0','#d4820a','#2d6a2d','#8b2fc9']
const EMAILJS_PUBLIC_KEY = '8XyB1sBak9kOD8d-k'
const EMAILJS_SERVICE_ID = 'service_w9gs91b'
const EMAILJS_TEMPLATE_ID = 'template_cyiz73e'
const MAX_FILE_BID = 10 * 1024 * 1024 // 10 MB
const MAX_FILE_PROJ = 25 * 1024 * 1024 // 25 MB

// â”€â”€â”€ UTILS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
const fmt = n => new Intl.NumberFormat('es-ES').format(Math.round(n)) + ' â‚¬'
const daysLeft = d => Math.ceil((new Date(d) - new Date()) / 86400000)
const timeAgo = d => { const days = Math.floor((new Date()-new Date(d))/86400000); return days===0?'Hoy':days===1?'Ayer':`Hace ${days}d` }
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,60)
const uid = () => Math.random().toString(36).slice(2,10)
const tagCat = t => SPECIALTY.includes(t)?'sp':ZONES.includes(t)?'zo':'ty'
const fmtSize = b => b > 1024*1024 ? (b/1024/1024).toFixed(1)+'MB' : (b/1024).toFixed(0)+'KB'

// â”€â”€â”€ ICONOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â. ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función Ic({ n, s=16 }) {
  const p = { width:s, height:s, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' }
  const iconos = {
    buscar: <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    más: <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x: <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    comprobar: <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    atrás: <svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    reloj: <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    euro: <svg {...p}><path d="M4 10h12M4 14h12M19.5 9.5a7 7 0 100 5"/></svg>,
    cerrar sesión: <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    copiar: <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
    globo: <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    usuario: <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    zap: <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    clip de papel:<svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
    archivo: <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    basura: <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    msg: <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    enviar: <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    edificio: <svg {...p}><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>,
    ojo: <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    bloqueo: <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  }
  devolver iconos[n] || nulo
}

// â”€â”€â”€ TOSTADAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función Toast({ msg }) {
  devolver (
    <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#18170f', color:'#fff', padding:'11px 22px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, zIndex:9999, boxShadow:'0 8px 32px rgba(0,0,0,.2)', pointerEvents:'none', animation:'toastIn .3s, toastOut .3s 1.7s forwards' }}>
      {msg}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes toastOut{to{opacity:0;transform:translateX(-50%) translateY(8px)}}`}</style>
    </div>
  )
}

// â”€â”€â”€ ETIQUETA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función Etiqueta({ t, onClick }) {
  const colors = { sp:{bg:'#f0ecff',col:'#5a3fa0'}, zo:{bg:'#e5eef7',col:'#1a4d7a'}, ty:{bg:'#fef3e2',col:'#c97a0a'} }
  const urg = t === 'Urgente'
  const c = urg ? {bg:'#fdecea',col:'#c0392b'} : colors[tagCat(t)]
  return <span onClick={onClick} style={{ padding:'3px 8px', borderRadius:4, fontSize:11, fontWeight:600, cursor:'pointer', background:c.bg, color:c.col, display:'inline-flex', alignItems:'center' }}>{urg?'URGENTE':t}</span>
}

// â”€â”€â”€ ENTRADA DE ETIQUETA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const add = t => { const v = t.trim(); if (v && !tags.includes(v)) onChange([...tags, v]); setInput('') }
  const rem = t => onChange(tags.filter(x=>x!==t))
  devolver (
    <>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, padding:8, border:'1.5px solid #ddd', borderRadius:6, background:'#fff', minHeight:42 }}>
        {tags.map(t=>(
          <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:4, fontSize:12, fontWeight:600, background:'#e5eef7', color:'#1a4d7a' }}>
            #{t}<span style={{ cursor:'pointer', opacity:.7, fontSize:15 }} onClick={()=>rem(t)}>Ã—</span>
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

// â”€â”€â”€ SUBIR ARCHIVOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función FileUploader({ archivos, onChange, maxSize, label }) {
  const ref = useRef()
  función asíncrona handleFiles(e) {
    const archivos = Array.from(e.target.files)
    const nuevos = []
    para (const archivo de archivos) {
      if (file.size > maxSize) { alert(`${file.name} supera el tamaño de ${fmtSize(maxSize)}`); continue }
      const path = `${uid()}-${file.name.replace(/[^a-z0-9.\-_]/gi,'_')}`
      const { error } = await supabase.storage.from('obralicit-files').upload(path, file)
      if (error) { alert('Error subiendo ' + archivo.nombre + ': ' + error.mensaje); continuar }
      // Bucket privado: generar URL firmada válida 1 año
      const { data: signedData, error: signErr } = await supabase.storage
        .from('obralicit-files')
        .createSignedUrl(ruta, 60 * 60 * 24 * 365)
      const url = signedData?.signedUrl || ''
      if (signErr) console.warn('Error generando URL:', signErr)
      nuevos.push({ nombre: file.name, path, url, size: file.size, tipo: file.type })
    }
    if (nuevos.length) onChange([...archivos, ...nuevos])
    e.objetivo.valor = ''
  }
  función asíncrona removeFile(ruta) {
    await supabase.storage.from('obralicit-files').remove([path])
    onChange(archivos.filter(a=>a.path!==path))
  }
  devolver (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
        {archivos.map(a=>(
          <div key={a.path} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:6, fontSize:12 }}>
            <Ic n="file" s={13}/> <a href={a.url} target="_blank" rel="noreferrer" style={{ color:'#5a3fa0', textDecoration:'none', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nombre}</a>
            <span style={{ fontSize:10, color:'#888' }}>({fmtSize(a.size)})</span>
            <button onClick={()=>removeFile(a.path)} style={{ background:'none', border:'none', cursor:'pointer', color:'#c0392b', fontSize:16, lineHeight:1 }}>Ã—</button>
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

// â”€â”€â”€ PANTALLA AUTH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [correo electrónico, establecerCorreoElectrónico] = usarEstado('')
  const [pass, setPass] = useState('')
  const [nombre, setNombre] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [cif, setCif] = useState('')
  const [rol, setRole] = useState('subcontrata')
  const [tipo, setTipo] = useState('principal')
  const [cargando, setLoading] = useState(falso)
  const [msg, setMsg] = useState({ text:'', ok:false })

  función asíncrona handle(e) {
    e.preventDefault()
    setMsg({ texto:'', ok:false })
    setLoading(true)
    intentar {
      si (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
        si (error) lanzar error
        const { data: co } = await supabase.from('companies').select('*').eq('id', data.user.id).single()
        if (co?.estado === 'pendiente') throw new Error('Tu cuenta está pendiente de aprobación por la empresa principal con ese CIF.')
        onLogin(data.user, co)
      } demás {
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
        si (error) lanzar error
        si (data.user) {
          const { error: pe } = await supabase.from('companies').insert([{
            id: data.user.id, nombre: empresa, rol, telefono: '', cif: cifLimpio,
            estado: estadoInicial, parent_id: empresaExistente?.id || nulo, verificado: !empresaExistente
          }])
          si (pe) lanza pe
          // Si es filial, crear solicitud y notificación
          si (empresaExistente) {
            await supabase.from('company_requests').insert([{
              cif: cifLimpio, empresa_nueva: data.user.id, empresa_madre: empresaExistente.id, tipo
            }])
            // Notificar por email
            intentar {
              window.emailjs?.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                proyecto_nombre: 'Solicitud de acceso ObraLicit',
                partida_nombre: `Nueva empresa solicita unirse con CIF ${cifLimpio}`,
                constructora_nombre: empresaExistente.nombre,
                email_constructora: correo electrónico,
                subcontrata_nombre: empresa,
                precio: 'Pendiente aprobación',
                plazo: 'N/A',
                observaciones: `${empresa} quiere unirse como ${tipo} de su empresa. Entra en ObraLicit para aprobar o denegar.`,
                telefono_contacto: 'Ver plataforma'
              }, EMAILJS_PUBLIC_KEY)
            } catch(e) { console.warn('Correo electrónico no enviado:', e) }
            setMsg({ text: 'Solicitud enviada. La empresa principal con ese CIF recibirá un aviso para aprobar tu acceso. Mientras tanto tu cuenta está pendiente.', ok: true })
          } demás {
            setMsg({ text: 'Cuenta creada correctamente. Ya puedes iniciar sesión.', ok: true })
            establecerEsInicioDeSesión(verdadero)
          }
        }
      }
    } capturar (error) {
      setMsg({ text: err.message, ok: false })
    } finalmente {
      setLoading(false)
    }
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', fontFamily:'Barlow,sans-serif', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:11, fontWeight:700, letterSpacing:'.06em', color:'#888', marginBottom:5, fontFamily:'Syne,sans-serif' }

  devolver (
    <div style={{ minHeight:'100vh', background:'#f2f0eb', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:40, width:'100%', maxWidth:460, boxShadow:'0 8px 40px rgba(0,0,0,.1)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:48, height:48, background:'#18170f', borderRadius:10, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#e85d04', fontFamily:'Syne,sans-serif', marginBottom:10 }}>O</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800 }}>ObraLicit</div>
          <div style={{ fontSize:12, color:'#888', marginTop:3 }}>Rojo de contratación transparente para obra</div>
        </div>
        <h3 style={{ fontFamily:'Syne,sans-serif', marginBottom:20, fontSize:17 }}>{isLogin? 'Iniciar sesión' : 'Crear cuenta'}</h3>

        {!isLogin && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:18 }}>
              {[['constructora','Constructora'],['subcontrata','Subcontrata'],['especialista','Especialista']].map(([r,l])=>(
                <div key={r} onClick={()=>setRole(r)} style={{ border:`2px solid ${role===r?'#e85d04':'#ddd'}`, borderRadius:8, padding:'10px 6px', textAlign:'center', cursor:'pointer', background:role===r?'#fff2ec':'transparent' }}>
                  <div style={{ fontSize:11, fontWeight:700, fontFamily:'Syne,sans-serif' }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:12 }}><label style={lbl}>TU NOMBRE *</label><input style={inp} placeholder="Nombre y apellidos" value={nombre} onChange={e=>setNombre(e.target.value)} requerido /></div>
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
              </seleccionar>
            </div>
          </>
        )}

        <form onSubmit={handle}>
          <div style={{ marginBottom:12 }}><label style={lbl}>CORREO ELECTRÓNICO *</label><input style={inp} type="email" placeholder="tu@empresa.com" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
          <div style={{ marginBottom:20 }}><label style={lbl}>CONTRASEÃ'A *</label><input style={inp} type="password" placeholder="Mínimo 6 caracteres" value={pass} onChange={e=>setPass(e.target.value)} required minLength={6} /></div>
          {msg.text && <div style={{ padding:'10px 14px', background:msg.ok?'#e5f4ec':'#fdecea', color:msg.ok?'#1a6b3a':'#c0392b', borderRadius:6, fontSize:13, marginBottom:16, lineHeight:1.5 }}>{msg.text}</div>}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:13, background:'#e85d04', color:'#fff', border:'none', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, cursor:'pointer', opacity:loading?.6:1 }}>
            {cargando ? 'Cargando...' : isLogin ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#666' }}>
          {esIniciar sesión? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button onClick={()=>{setIsLogin(!isLogin);setMsg({text:'',ok:false})}} style={{ background:'none', border:'none', color:'#e85d04', cursor:'pointer', fontWeight:700, fontSize:13 }}>
            {esIniciar sesión? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}

// â”€â”€â”€ FORMULARIO PUJA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función BidForm({ partida, onSubmit, onCancel, initialData }) {
  const [precio, setPrecio] = useState(initialData?.precio?.toString()||'')
  const [plazo, setPlazo] = useState(initialData?.plazo?.toString()||'')
  const [obs, setObs] = useState(initialData?.observaciones||'')
  const [tel, setTel] = useState(initialData?.telefono||'')
  const [validezTipo, setValidezT] = useState(initialData?.validez_tipo||'indefinida')
  const [validezFecha, setValidezF] = useState(initialData?.validez_fecha||'')
  const [archivos, setArchivos] = useState(initialData?.archivos||[])
  const [cargando, setLoading] = useState(falso)

  const num = parseFloat(precio||0)
  const total = num * partida.medicion
  ahorro constante = precio? ((partida.precioSalida-num)/partida.precioSalida*100).toFixed(1) : null
  const isOk = saving !== null && parseFloat(saving) > 0

  función asíncrona submit(e) {
    e.preventDefault()
    if (!precio||isNaN(num)) devolver
    setLoading(true)
    await onSubmit({ precio:num, plazo:parseInt(plazo)||0, obs, tel, validezTipo, validezFecha, archivos })
    setLoading(false)
  }

  const inp = { padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', width:'100%', fontFamily:'Barlow,sans-serif' }
  const lbl = { fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.06em', color:'#888', display:'block', marginBottom:4 }

  devolver (
    <form onSubmit={submit} style={{ padding:16, background:'#fff9f5', borderTop:'2px solid #ffcba4' }}>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
        <Ic n="lock" s={14}/> {datosiniciales? 'Actualiza tu oferta â€” el publicador verÃ¡ los cambios' : 'Oferta confidencial â€” solo la constructora verÃ¡ tu precio'}
      </div>
      <div style={{ background:'#fff2ec', border:'1px solid #ffcba4', borderRadius:6, padding:'9px 13px', marginBottom:13, fontSize:12, color:'#c94f03' }}>
        Precio salida: <strong>{fmt(partida.precioSalida)}/{partida.unidad}</strong> — Medición: <strong>{partida.medicion} {partida.unidad}</strong> — Ref total: <strong>{fmt(partida.medicion*partida.precioSalida)}</strong>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <label style={lbl}>PRECIO UNITARIO (â‚¬/{partida.unidad}) *</label>
          <input style={inp} type="number" placeholder="0.00" value={precio} onChange={e=>setPrecio(e.target.value)} required />
          {ahorro!==null && <div style={{ fontSize:11, marginTop:3, fontWeight:600, color:isOk?'#1a6b3a':'#c0392b' }}>Total: {fmt(total)} â€— {isOk?'-':'+'}{Math.abs(ahorro)}% vs salida</div>}
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
      {/* VÁLDEZ */}
      <div style={{ marginBottom:10 }}>
        <label style={lbl}>VALIDEZ DE LA OFERTA</label>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select style={{ ...inp, flex:1, appearance:'auto' }} value={validezTipo} onChange={e=>setValidezT(e.target.value)}>
            <option value="indefinida">Indefinida</option>
            <option value="fecha">Hasta una fecha</option>
          </seleccionar>
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
          {cargando ? 'Publicando...' : 'Oferta pública'}
        </button>
        <button type="button" onClick={onCancel} style={{ background:'transparent', color:'#888', border:'1.5px solid #ddd', padding:'10px 16px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
      </div>
    </form>
  )
}

// â”€â”€â”€ PANEL DETALLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función DetailPanel({ proj, bids, user, company, onClose, onBid, onDeleteBid, setProjects }) {
  const [openForm, setOpenForm] = useState(nulo)
  const [copiado, establecerCopied] = useState(false)
  const [rechazando, setRechazando] = useState(null) // bid.id que se está rechazando
  const [motivoRechazo, setMotivo] = useState('')
  const [puedeActualizar, setPuedeAct] = useState(true)
  const [visLocal, setVisLocal] = useState({
    mostrar_num_pujas: proj.mostrar_num_pujas||false,
    mostrar_empresas: proj.mostrar_empresas||falso,
  })
  const totalRef = (proj.partidas||[]).reduce((s,p)=>s+p.medicion*p.precioSalida,0)
  const dl = días restantes(proj.fecha_cierre)
  const projBids = bids.filter(b=>b.proyecto_id===proj.id && !b.expirada)
  const esAdmin = user?.id === ADMIN_USER_ID || company?.role === 'admin'
  const esDuenio = user?.id === proj.user_id
  const esConstructora = esDuenio || esAdmin

  función handleCopy() {
    ¿navegador.clipboard?.writeText?.(`${window.location.origin}/?l=${proj.slug}`)
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  const dlStyle = dl<=2?{bg:'#fdecea',col:'#c0392b'}:dl<=7?{bg:'#fef3e2',col:'#c97a0a'}:{bg:'#e5f4ec',col:'#1a6b3a'}

  devolver (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.5)', backdropFilter:'blur(5px)', display:'flex' }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ marginLeft:'auto', width:'min(740px,100vw)', background:'#fff', height:'100vh', overflowY:'auto', boxShadow:'0 0 60px rgba(0,0,0,.2)' }}>
        {/* HÉROE */}
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
                    <Ic n="archivo" s={12}/> {a.nombre}
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
              {copiado? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          {/* Indicadores clave de rendimiento */}
          <div style={{ display:'flex', gap:20, marginTop:14, flexWrap:'wrap' }}>
            {[['Presupuesto',fmt(totalRef)],['Partidas',(proj.partidas||[]).length],
              ...(esConstructora?[['Ofertas',projBids.length]]:[]),
              ['Cierre',proj.fecha_cierre]].map(([l,v])=>(
              <div key={l}><div style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700 }}>{l}</div><div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:600, color:'#fff', marginTop:2 }}>{v}</div></div>
            ))}
          </div>
        </div>

        {/* CUERPO */}
        <div style={{ padding:'22px 28px' }}>

          {/* CONFIGURACIÃ“N VISIBILIDAD — solo para el dueÃ±o */}
          {esDuenio && (
            <div style={{ background:'#f8f7f4', border:'1px solid #eee', borderRadius:8, padding:'12px 16px', marginBottom:16 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'#555', marginBottom:10 }}>CONFIGURACIÃ“N DE VISIBILIDAD</div>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                {[
                  ['mostrar_num_pujas', 'Mostrar número de ofertas recibidas', visLocal.mostrar_num_pujas],
                  ['mostrar_empresas', 'Mostrar qué empresas han pujado (sin precios)', visLocal.mostrar_empresas],
                ].map(([campo, etiqueta, valor])=>(
                  <label key={campo} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#333' }}>
                    <input type="checkbox" checked={!!valor} onChange={async e=>{
                      const v = e.target.checked
                      setVisLocal(anterior=>({...anterior,[campo]:v}))
                      const { error } = await supabase.from('projects').update({ [campo]:v }).eq('id', proj.id)
                      if (error) { setVisLocal(prev=>({...prev,[campo]:!v})); console.error(error) }
                      else setProjects(prev=>prev.map(p=>p.id===proj.id?{...p,[campo]:v}:p))
                    }} style={{ width:16, height:16, cursor:'pointer', accentColor:'#e85d04' }}/>
                    {etiqueta}
                  </label>
                ))}
              </div>
              <div style={{ fontSize:11, color:'#888', marginTop:8 }}>El precio de las ofertas nunca es público. Solo tú lo ves.</div>
            </div>
          )}

          {/* AVISO PUJA CIEGA */}
          {!esConstructora && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:8, marginBottom:16, fontSize:13, color:'#5a3fa0' }}>
              <Ic n="lock" s={15}/> <strong>Pujas confidenciales</strong> — No verÃ¡s los precios de otras empresas. Solo la constructora tiene acceso al ranking completo.
            </div>
          )}

          <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'.08em', color:'#888', textTransform:'uppercase', marginBottom:14, paddingBottom:8, borderBottom:'1px solid #eee' }}>
            Partidas y ofertas
          </div>

          {(proj.partidas||[]).map(partida => {
            const todasPBids = projBids.filter(b=>b.partida_id===partida.id)
            // Constructora ve todo, subcontrata solo ve la suya
            const pBids = esConstructora ? todasPBids.sort((a,b)=>a.precio-b.precio) : todasPBids.filter(b=>b.user_id===usuario?.id)
            const myBid = user && todasPBids.find(b=>b.user_id===user.id)
            const best = esConstructora && todasPBids.length ? todasPBids.reduce((a,b)=>a.precio<b.precio?a:b) : null
            const isOpen = openForm===partida.id

            devolver (
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
                    {/*Solo constructora y mejor precio*/}
                    {best && <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'#888' }}>Mejor oferta</div><div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:17, fontWeight:600, color:'#1a6b3a' }}>{fmt(best.precio)}</div></div>}
                    {/* Subcontrata: número de ofertas sin precios */}
                    {!esConstructora && <div style={{ fontSize:11, color:'#888' }}>{todasPBids.length} oferta{todasPBids.length!==1?'s':''} recibida{todasPBids.length!==1?'s':''}</div>}
                    {!myBid && proj.estado==='abierta' && usuario && (
                      <button onClick={()=>setOpenForm(isOpen?null:partida.id)} style={{ background:'#18170f', color:'#fff', border:'none', padding:'7px 14px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                        {isOpen?'Cancelar':'Pujar'}
                      </button>
                    )}
                    {!user && <div style={{ fontSize:12, color:'#888' }}>Inicia sesión para pujar</div>}
                    {myBid && <div style={{ padding:'8px 12px', background:'#e4f5f2', borderRadius:6, fontSize:12, color:'#0a7c6e', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}><Ic n="check" s={12}/> Tu oferta: {fmt(myBid.precio)}</div>}
                  </div>
                </div>

                {isOpen && usuario && <BidForm partida={partida} onSubmit={f=>{ onBid(proj,partida,f); setOpenForm(null) }} onCancel={()=>setOpenForm(null)}/>}

                {/* LISTA DE PUJAS */}
                {/* Info publica si el dueño lo permite */}
                {!esConstructora && proj.mostrar_empresas && pBids.length>0 && (
                  <div style={{ padding:'10px 16px', background:'#f8f7f4', borderBottom:'1px solid #eee' }}>
                    <div style={{ fontSize:11, color:'#888', fontWeight:700, marginBottom:6 }}>EMPRESAS QUE HAN PRESENTADO OFERTA</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {pBids.map(b=>(
                        <span key={b.id} style={{ fontSize:12, padding:'3px 9px', background:'#fff', border:'1px solid #eee', borderRadius:4 }}>{b.empresa}</span>
                      ))}
                    </div>
                  </div>
                )}

                {pBids.length > 0 ? pBids.map((bid,idx)=>{
                  ahorro constante = ((partida.precioSalida-bid.precio)/partida.precioSalida*100).toFixed(1)
                  const rkCol = idx===0?'#1a6b3a':idx===1?'#c97a0a':'#888'
                  const esMia = bid.user_id===user?.id
                  const rechazada = bid.estado==='rechazada'
                  const bgRow = rechazada?'#f8f8f8':bid.estado==='adjudicada'?'#e5f4ec':esMia&&!esConstructora?'#fef9f5':'transparent'
                  devolver (
                    <div key={bid.id} style={{ borderBottom:'1px solid #f0f0f0', opacity:rechazada?.65:1 }}>
                      <div style={{ padding:'13px 16px', display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'start', background:bgRow }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                            {esConstructora && !rechazada && <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', background:rkCol, flexShrink:0 }}>{idx+1}</div>}
                            {rechazada && <div style={{ width:22, height:22, borderRadius:'50%', background:'#ddd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>âœ•</div>}
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:rechazada?'#999':'inherit' }}>
                                {esConstructora ? bid.empresa : 'Tu oferta'}
                                {bid.estado==='adjudicada' && <span style={{ fontSize:10, background:'#1a6b3a', color:'#fff', padding:'2px 8px', borderRadius:4, fontWeight:700, marginLeft:6 }}>ADJUDICADA</span>}
                                {rechazada && <span style={{ fontSize:10, background:'#eee', color:'#888', padding:'2px 8px', borderRadius:4, fontWeight:700, marginLeft:6 }}>RECHAZADA</span>}
                              </div>
                              {esConstructora && <div style={{ fontSize:11, color:'#888', marginTop:1 }}>{bid.contacto}{bid.telefono?` — ${bid.telefono}`:''}</div>}
                            </div>
                          </div>
                          {bid.observaciones && <div style={{ fontSize:12, color:rechazada?'#aaa':'#444', marginTop:7, lineHeight:1.55, fontStyle:'italic', padding:'8px 10px', background:'#f8f7f4', borderRadius:6, borderLeft:'3px solid #ddd' }}>"{bid.observaciones}"</div>}
                          {/*Motivo de rechazo visible para todos */}
                          {rechazada && bid.feedback && (
                            <div style={{ marginTop:8, padding:'10px 12px', background:'#f5f5f5', borderRadius:6, borderLeft:'3px solid #ccc' }}>
                              <div style={{ fontSize:11, fontWeight:700, color:'#888', marginBottom:3 }}>MOTIVO DEL RECHAZO</div>
                              <div style={{ fontSize:13, color:'#555' }}>{bid.feedback}</div>
                              {bid.puede_actualizar && esMia && (
                                <div style={{ marginTop:8, fontSize:12, color:'#1a4d7a', fontWeight:600 }}>
                                  El publicador te invita a mejorar tu oferta
                                </div>
                              )}
                            </div>
                          )}
                          {!rechazada && oferta.feedback && (
                            <div style={{ marginTop:8, padding:'8px 10px', background:'#fef3e2', borderRadius:6, fontSize:12, color:'#c97a0a', borderLeft:'3px solid #c97a0a' }}>
                              <strong>Comentarios:</strong> "{bid.feedback}"
                              {bid.rating && <div style={{ display:'flex', gap:2, marginTop:4 }}>{[1,2,3,4,5].map(i=><span key={i} style={{ fontSize:13, color:i<=bid.rating?'#e85d04':'#ddd' }}>â˜…</span>)}</div>}
                            </div>
                          )}
                          <div style={{ display:'flex', gap:12, marginTop:6, flexWrap:'wrap' }}>
                            {bid.plazo>0 && <span style={{ fontSize:11, color:'#888' }}>Plazo: {bid.plazo}d</span>}
                            <span style={{ fontSize:11, color:'#888' }}>{bid.fecha}</span>
                            {bid.validez_tipo==='fecha' && bid.validez_fecha && <span style={{ fontSize:11, color:'#c97a0a' }}>Válida hasta: {bid.validez_fecha}</span>}
                          </div>
                          {bid.archivos?.length>0 && (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
                              {bid.archivos.map(a=>(
                                <a key={a.path} href={a.url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:5, fontSize:11, color:'#5a3fa0', textDecoration:'none' }}>
                                  <Ic n="archivo" s={11}/> {a.nombre}
                                </a>
                              ))}
                            </div>
                          )}
                          {/* Botón actualizar oferta — solo para el pujador si fue rechazada con opción de mejora */}
                          {esMia && rechazada && bid.puede_actualizar && (
                            <button onClick={()=>setOpenForm('update-'+bid.id)}
                              style={{ marginTop:10, display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#e5eef7', border:'1px solid #b8cde0', borderRadius:6, color:'#1a4d7a', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Syne,sans-serif' }}>
                              Mejorar y reenviar oferta
                            </button>
                          )}
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:10, color:'#888', marginBottom:2 }}>precio/ud</div>
                          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:18, fontWeight:600, color:rechazada?'#aaa':idx===0&&esConstructora?'#1a6b3a':'#333', textDecoration:rechazada?'line-through':'none' }}>{fmt(bid.precio)}</div>
                          {esConstructora && !rechazada && <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, display:'inline-block', marginTop:3, background:parseFloat(saving)>0?'#e5f4ec':'#fdecea', color:parseFloat(saving)>0?'#1a6b3a':'#c0392b' }}>
                            {parseFloat(ahorro)>0?'-':'+'}{Math.abs(ahorro)}% vs salida
                          </span>}
                          {/* Acciones del duelo: rechazar (no eliminar) */}
                          {esDuenio && bid.estado==='pendiente' && (
                            <button onClick={()=>{ setRechazando(bid.id); setMotivo(''); setPuedeAct(true) }}
                              style={{ display:'block', marginTop:8, marginLeft:'auto', background:'#fdecea', border:'1px solid #f5c6c2', color:'#c0392b', borderRadius:4, padding:'5px 12px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif' }}>
                              Rechazar
                            </button>
                          )}
                          {/* Admin: puede eliminar físicamente */}
                          {esAdmin && onDeleteBid && (
                            <button onClick={()=>{ if(window.confirm('Â¿Eliminar esta oferta permanentemente?')) onDeleteBid(bid.id) }}
                              style={{ display:'block', marginTop:6, marginLeft:'auto', background:'#f5f5f5', border:'1px solid #ddd', color:'#888', borderRadius:4, padding:'4px 10px', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif' }}>
                              Eliminar (admin)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* FORMULARIO DE RECHAZO — inline bajo la puja */}
                      {rechazando===bid.id && (
                        <div style={{ padding:'14px 16px', background:'#fff5f5', borderTop:'1px solid #f5c6c2' }}>
                          <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'#c0392b', marginBottom:10 }}>MOTIVO DEL RECHAZO (obligatorio)</div>
                          <textarea
                            style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #f5c6c2', borderRadius:6, fontSize:13, outline:'none', resize:'vertical', minHeight:72, fontFamily:'Barlow,sans-serif', boxSizing:'border-box' }}
                            placeholder="Ej: El precio está por encima del mercado. El plazo de ejecución es demasiado largo..."
                            valor={motivoRechazo} onChange={e=>setMotivo(e.target.value)}
                          />
                          <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, cursor:'pointer', fontSize:13 }}>
                            <input type="checkbox" checked={puedeActualizar} onChange={e=>setPuedeAct(e.target.checked)} style={{ width:16, height:16, accentColor:'#1a4d7a' }}/>
                            <span>Dar oportunidad al pujador de mejorar y reenviar su oferta</span>
                          </label>
                          <div style={{ display:'flex', gap:8, marginTop:12 }}>
                            <botón
                              discapacitado={!motivoRechazo.trim()}
                              onClick={async ()=>{
                                si (!motivoRechazo.trim()) devuelve
                                const { error } = await supabase.from('bids').update({
                                  estado: 'rechazada',
                                  comentarios: motivoRechazo.trim(),
                                  puede_actualizar: puedeActualizar
                                }).eq('id', bid.id)
                                if (error) { alert('Error: '+error.message); return }
                                setBids(prev=>prev.map(b=>b.id===bid.id?{...b, estado:'rechazada', feedback:motivoRechazo.trim(), puede_actualizar:puedeActualizar}:b))
                                // Notificar al pujador
                                esperar supabase.from('notifications').insert([{
                                  ID de usuario: bid.user_id,
                                  tipo: 'puja',
                                  titulo: `Tu oferta en "${proj.nombre}" ha sido rechazada`,
                                  mensaje: `Motivo: ${motivoRechazo.trim()}${puedeActualizar?' — Puedes mejorar y reenviar tu oferta.':''}`,
                                  datos: JSON.stringify({ proyecto_id: proj.id })
                                }]).catch(()=>{})
                                setRechazando(null); setMotivo('')
                              }}
                              style={{ background:'#c0392b', color:'#fff', border:'none', padding:'9px 20px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', opacity:!motivoRechazo.trim()?.4:1 }}>
                              Confirmar rechazo
                            </button>
                            <button onClick={()=>setRechazando(null)}
                              style={{ background:'transparent', color:'#888', border:'1.5px solid #ddd', padding:'9px 14px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, cursor:'pointer' }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* FORMULARIO ACTUALIZAR OFERTA — para el pujador */}
                      {openForm==='update-'+bid.id && esMia && (
                        <BidForm partida={partida} inicialData={bid} onSubmit={async f=>{
                          // Actualizar la puja rechazada con los nuevos datos
                          const update = { precio:parseFloat(f.precio), plazo:parseInt(f.plazo)||0, observaciones:f.obs||'', estado:'pendiente', feedback:null, puede_actualizar:false, validez_tipo:f.validezTipo||'indefinida', validez_fecha:f.validezFecha||null, archivos:f.archivos||bid.archivos }
                          const { error } = await supabase.from('bids').update(updates).eq('id', bid.id)
                          si (!error) {
                            setBids(prev=>prev.map(b=>b.id===bid.id?{...b,...updates}:b))
                            // Notificar al dueÃ±o de la obra
                            esperar supabase.from('notifications').insert([{
                              user_id: proj.user_id, tipo:'puja',
                              titulo: `Oferta actualizada en "${proj.nombre}"`,
                              mensaje: `${bid.empresa} ha mejorado su oferta para la partida "${partida.descripcion}".`,
                              datos: JSON.stringify({ proyecto_id: proj.id })
                            }]).catch(()=>{})
                          }
                          setOpenForm(null)
                        }} onCancel={()=>setOpenForm(null)}/>
                      )}
                    </div>
                  )
                }) : (
                  <div style={{ padding:'18px 16px', fontSize:13, color:'#888', fontStyle:'italic', textAlign:'center' }}>
                    {usuario? (esConstructora ? 'Sin ofertas todavía' : 'Sé el primero en pujar esta partida') : 'Inicia sesión para ver y presentar ofertas'}
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

// â”€â”€â”€ PLANTILLA EXCEL â”€â”€â”€â”€â ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” €â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
// â”€â”€â”€ AUTOETIQUETADO IA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â. ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función asíncrona autoEtiquetar({ nombre, desc, partidas }) {
  // Mapa de palabras clave â†' etiquetas
  const texto = [nombre, desc, ...partidas.map(p=>p.descripcion)].join(' ').toLowerCase()
  const detectados = new Set()

  const reglas = [
    // Especialidades
    { tags:['Micropilotes'], keys:['micropilote','autoperforante','n80','tubex'] },
    { etiquetas:['Pilotes CPI'], claves:['pilote','cpi','cfa','Ï†','Ã¸600','Ã¸450','Ã¸350'] },
    { etiquetas:['Inyecciones'], claves:['inyeccion','inyección','grouting','compactacion'] },
    { etiquetas:['Pantallas'], teclas:['pantalla','muro pantalla','bentonit','lodo'] },
    { etiquetas:['Muros'], claves:['muro','contención','sostenimiento','berlinés'] },
    { etiquetas:['Mejora terreno'], teclas:['mejora','vibrof','columna grava','precarga','drena'] },
    { etiquetas:['Anclajes'], claves:['anclaje','tirante','bulbo','postesa'] },
    { etiquetas:['Sondeos'], teclas:['sondeo','testigo','perforación','geotecnia'] },
    { etiquetas:['Cimentaciones especiales'], claves:['cimentacion','zapata','losa','encepado','pilote'] },
    // Tipo obra
    { etiquetas:['Infraestructura'], claves:['viaducto','metro','tunel','carretera','ferroviario','puente','presa'] },
    { etiquetas:['Residencial'], claves:['residencial','vivienda','edificio','sótano','aparcamiento','bloque'] },
    { etiquetas:['Industrial'], claves:['nave','industrial','logistica','almacen','fabrica'] },
    { etiquetas:['Rehabilitación'], claves:['rehabilitacion','reforma','refuerzo','consolidacion','reparacion'] },
    // Tipo contrato
    { etiquetas:['Obra pública'], claves:['ayuntamiento','ministerio','adif','renfe','fomento','licitacion publica','concurso'] },
    { etiquetas:['Urgente'], claves:['urgente','urgencia','inmediato','rapido','prioritario'] },
    // Materiales detectados
    { tags:['Madrid'], keys:['madrid'] },
    { tags:['Barcelona'], keys:['barcelona'] },
    { tags:['Sevilla'], keys:['sevilla'] },
    { tags:['Valencia'], keys:['valencia'] },
    { tags:['Bilbao'], keys:['bilbao'] },
    { tags:['Zaragoza'], keys:['zaragoza'] },
    { etiquetas:['Málaga'], claves:['malaga','málaga'] },
    { etiquetas:['Galicia'], claves:['galicia','vigo','coruña','coruña'] },
    { etiquetas:['Canarias'], claves:['canarias','tenerife','palmas'] },
  ]

  para (const regla de reglas) {
    if (regla.keys.some(k => texto.includes(k))) {
      regla.tags.forEach(t => detectados.add(t))
    }
  }

  devolver [...detectados]
}

// Carga SheetJS dinámicamente si no está ya cargado
función loadSheetJS() {
  devolver nueva Promesa((resolver, rechazar) => {
    if (window.XLSX) { resolve(window.XLSX); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
    s.onload = () => resolve(window.XLSX)
    s.onerror = rechazar
    documento.head.appendChild(s)
  })
}

función asíncrona descargarPlantillaExcel() {
  const XLSX = await loadSheetJS()
  const datos = [
    // Fila de cabeceras
    ['TIPO','CODIGO','DESCRIPCION','UNIDAD','MEDICION','PRECIO_SALIDA_EUR'],
    // Ejemplos — TIPO puede ser "obra" o "material"
    ['obra','CIM-001','Micropilote Ã˜168mm L=12m c/camisa perdida','ud',48,850],
    ['obra','CIM-002','Muro pantalla e=60cm H=8m','m2',320,210],
    ['material','MAT-001','Tuberia acero galvanizado Ã˜168mm','m',200,45],
    ['material','MAT-002','Hormigon HA-25/B/20/IIa suministrado en obra','m3',85,120],
  ]
  const ws = XLSX.utils.aoa_to_sheet(datos)
  // Anchos de columna
  ws['!cols'] = [{ wch:10 },{ wch:12 },{ wch:50 },{ wch:8 },{ wch:12 },{ wch:20 }]
  // Estilo cabecera (color naranja) — SheetJS Community no soporta estilos, pero si usas Excel sí lo ven
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Partidas')
  XLSX.writeFile(wb, 'plantilla_partidas_ObraLicit.xlsx')
}

función asíncrona importarXLSX(archivo, onPartidas) {
  const XLSX = await loadSheetJS()
  const lector = nuevo lector de archivos()
  lector.onload = e => {
    intentar {
      const wb = XLSX.read(e.target.result, { type:'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const filas = XLSX.utils.sheet_to_json(ws, { encabezado:1, valor predeterminado:'' })
      const partidas = []
      para (sea i=1; i<rows.length; i++) {
        const [tipo, código, desc, unidad, med, prec] = filas[i]
        si (!desc || med==='' || prec==='') continuar
        const medNum = parseFloat(String(med).replace(',','.'))
        const precNum = parseFloat(String(prec).replace(',','.'))
        si (isNaN(medNum)||isNaN(precNum)) continuar
        partidas.push({
          id: 'U'+uid(),
          tipo: String(tipo||'obra').toLowerCase().trim() === 'material' ? 'material' : 'obra',
          código: String(código||'P-'+i).trim(),
          descripción: String(desc).trim(),
          unidad: String(unidad||'ud').trim(),
          Meditación: medNum,
          precioSalida: precNum
        })
      }
      if (partidas.longitud) onPartidas(partidas)
      else alert('No se encontraron partidas válidas. Asegúrese de usar la plantilla descargada.')
    } catch(err) {
      alert('Error leyendo el archivo: ' + err.message)
    }
  }
  lector.readAsBinaryString(archivo)
}

// â”€â”€â”€ VISTA PREVIA LICITACION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función VistaPrevia({ datos, empresa, alPublicar, alVolver, cargando }) {
  const totalRef = data.partidas.reduce((s,p)=>s+p.medicion*p.precioSalida, 0)
  const inp = { padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', width:'100%', fontFamily:'Barlow,sans-serif' }
  const lbl = { fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.06em', color:'#888', display:'block', marginBottom:4 }
  devolver (
    <div style={{ padding:'0 0 24px' }}>
      {/* Vista previa del encabezado */}
      <div style={{ background:'#18170f', color:'#fff', padding:'24px 28px 20px', margin:'0 0 20px' }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:4, fontWeight:700 }}>VISTA PREVIA — asÃ verÃ¡n tu licitaciÃ³n</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:8 }}>
          <div style={{ width:20,height:20,borderRadius:4,background:'#e85d04',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#fff' }}>{(company?.name||'XX').slice(0,2).toUpperCase()}</div>
          {nombre de empresa}
        </div>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, lineHeight:1.2, marginBottom:6 }}>{data.nombre||'Sin título'}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.65 }}>{data.desc||'Sin descripción'}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:12 }}>
          {data.tags.map(t=><span key={t} style={{ padding:'3px 9px',borderRadius:4,fontSize:11,fontWeight:600,background:'rgba(255,255,255,.1)',color:'rgba(255,255,255,.7)' }}>{t}</span>)}
        </div>
        <div style={{ display:'flex', gap:20, marginTop:14, flexWrap:'wrap' }}>
          {[['Ubicación',data.ubic||'—'],['Cierre ofertas',data.fechaCierre||'—'],['Inicio previsto',data.fechaInicio||'—'],['Visibilidad',data.visibilidad==='privada'?'Privada':'Pública']].map(([l,v])=>(
            <div key={l}><div style={{ fontSize:10,color:'rgba(255,255,255,.35)',fontWeight:700 }}>{l.toUpperCase()}</div><div style={{ fontSize:13,fontWeight:600,color:'#fff',marginTop:2 }}>{v}</div></div>
          ))}
        </div>
      </div>

      <div style={{ padding:'0 28px' }}>
        {/* Responsable */}
        {(data.respNombre||data.respEmail||data.respTel) && (
          <div style={{ background:'#f8f7f4', border:'1px solid #eee', borderRadius:8, padding:'12px 16px', marginBottom:16 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:8 }}>RESPONSABLE DE COMPRAS</div>
            <div style={{ fontSize:13, fontWeight:600 }}>{data.respNombre||'â€—'}</div>
            <div style={{ fontSize:12, color:'#888', marginTop:3 }}>{data.respEmail||''}{data.respEmail&&data.respTel?' Â· ':''}{data.respTel||''}</div>
          </div>
        )}

        {/* Resumen financiero */}
        <div style={{ display:'flex', gap:0, border:'1px solid #eee', borderRadius:8, overflow:'hidden', marginBottom:16 }}>
          {[['PARTIDAS',data.partidas.length,''],['PRESUP. TOTAL',fmt(totalRef),'#e85d04'],['EMPRESAS INVITADAS',data.visibilidad==='privada'?(data.invitadas||[]).length:'Pública','']].map(([l,v,c],i,a)=>(
            <div key={l} style={{ flex:1, padding:'12px 14px', background:'#f8f7f4', borderRight:i<a.length-1?'1px solid #eee':'none' }}>
              <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:16,fontWeight:600,color:c||'#18170f' }}>{v}</div>
              <div style={{ fontSize:10,color:'#888',fontWeight:700,letterSpacing:'.04em',marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Partidas */}
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:10 }}>PARTIDAS</div>
        {data.partidas.map(p=>(
          <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', border:'1px solid #eee', borderRadius:6, marginBottom:6, background:'#fff' }}>
            <div>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#888' }}>{p.codigo}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, marginTop:2 }}>{p.descripcion}</div>
              <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{p.medicion} {p.unidad} Ã— {fmt(p.precioSalida)} = <strong>{fmt(p.medicion*p.precioSalida)}</strong></div>
            </div>
          </div>
        ))}

        {data.archivos?.length>0 && (
          <div style={{ marginTop:12 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:8 }}>DOCUMENTACIÓN ADJUNTA</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {data.archivos.map(a=>(
                <span key={a.path} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background:'#f0f0f0', borderRadius:4, fontSize:11 }}>
                  <Ic n="archivo" s={11}/>{a.nombre}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={onBack} style={{ background:'transparent', color:'#888', border:'1.5px solid #ddd', padding:'11px 20px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}>â† Editar</button>
          <button onClick={onPublish} disabled={loading} style={{ flex:1, background:'#e85d04', color:'#fff', border:'none', padding:'11px 0', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, cursor:'pointer', opacity:loading?.6:1 }}>
            {cargando ? 'Publicando...' : data.visibilidad==='privada' ? 'Publicar (solo invitados)' : 'Publicar para todos'}
          </button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ MODAL NUEVO PROYECTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función NewProjectModal({ empresa, sesión, onClose, onSubmit }) {
  const [step, setStep] = useState(1)
  // Paso 1 — Información general
  const [nombre, setNombre] = useState('')
  const [desc, setDesc] = useState('')
  const [ubic, setUbic] = useState('')
  const [fechaCierre, setFechaCierre] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [tags, setTags] = useState([])
  const [visibilidad, setVis] = useState('publica')
  const [invitadas, setInvitadas] = useState('') ​​// correos electrónicos separados por coma
  // Responsable
  const [respNombre, setRespNombre] = useState('')
  const [respEmail, setRespEmail] = useState('')
  const [respTel, setRespTel] = useState('')
  // Paso 2 â€— partidas
  const [partidas, setPartidas] = useState([])
  const [archivos, setArchivos] = useState([])
  const [pf, setPf] = useState({ tipo:'obra', codigo:'', desc:'', unidad:'ud', medicion:'', precio:'' })
  const [cargando, setLoading] = useState(falso)
  const csvRef = useRef()

  función addPartida() {
    if (!pf.desc||!pf.medicion||!pf.precio) regresar
    setPartidas(prev=>[...prev,{ id:'U'+uid(), tipo:pf.tipo||'obra', codigo:pf.codigo||'P-'+(prev.length+1), descripcion:pf.desc, unidad:pf.unidad, medicion:parseFloat(pf.medicion), precioSalida:parseFloat(pf.precio) }])
    setPf({ tipo:'obra', codigo:'', desc:'', unidad:'ud', medicion:'', precio:'' })
  }

  const vista previaData = { nombre, desc, ubic, fechaCierre, fechaInicio, tags, visibilidad, invitadas:invitadas.split(',').map(e=>e.trim()).filter(Boolean), respNombre, respEmail, respTel, partidas, archivos }

  función asíncrona publicar() {
    setLoading(true)
    esperar onSubmit({
      nombre, desc, ubico,
      fecha: fechaCierre,
      fechaInicio,
      etiquetas,
      partidas,
      archivos,
      visibilidad,
      invitadas: invitadas.split(',').map(e=>e.trim()).filter(Boolean),
      email_contacto: respEmail,
      responsable_nombre: respNombre,
      correo_responsable: respEmail,
      responsable_tel: respTel,
    })
    setLoading(false)
    onClose()
  }

  const inp = { padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', width:'100%', fontFamily:'Barlow,sans-serif' }
  const lbl = { fontFamily:'Syne,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'.06em', color:'#888', display:'block', marginBottom:4 }
  const canNext1 = nombre.trim() && fechaCierre
  const STEPS = ['Información','Partidas','Vista previa']

  devolver (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,.6)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:700, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.2)' }}>

        {/* Encabezado */}
        <div style={{ padding:'24px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'sticky', top:0, background:'#fff', zIndex:10, borderBottom:'1px solid #eee', paddingBottom:16 }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800 }}>Publicar obra</div>
            <div style={{ display:'flex', gap:6, marginTop:10 }}>
              {PASOS.map((s,i)=>(
                <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,background:step>i+1?'#1a6b3a':step===i+1?'#e85d04':'#eee',color:step>=i+1?'#fff':'#888' }}>{step>i+1?'âœ“':i+1}</div>
                  <div style={{ fontSize:12,fontWeight:600,color:step===i+1?'#e85d04':step>i+1?'#1a6b3a':'#bbb' }}>{s}</div>
                  {i<STEPS.length-1 && <div style={{ width:24,height:2,background:step>i+1?'#1a6b3a':'#eee',borderRadius:1 }}/>}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:'50%',background:'#f2f0eb',border:'1px solid #ddd',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:20,flexShrink:0 }}>Ã—</button>
        </div>

        {/* PASO 1 — INFORMACIÓN GENERAL */}
        {paso===1 && (
          <div style={{ padding:'20px 28px 24px' }}>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>NOMBRE DEL PROYECTO *</label>
              <input style={inp} placeholder="Ej: Viaducto M-50 — Cimentaciones especiales" value={nombre} onChange={e=>setNombre(e.target.value)} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>DESCRIPCIÓN</label>
              <textarea style={{ ...inp, resize:'vertical', minHeight:72, fontSize:13 }} placeholder="Alcance, condicionantes, maquinaria requerida..." value={desc} onChange={e=>setDesc(e.target.value)} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
              <div><label style={lbl}>UBICACIÃ“N</label><input style={inp} placeholder="Ciudad/prov." value={ubic} onChange={e=>setUbic(e.target.value)} /></div>
              <div><label style={lbl}>CIERRE DE OFERTAS *</label><input style={inp} type="date" value={fechaCierre} onChange={e=>setFechaCierre(e.target.value)} /></div>
              <div><label style={lbl}>INICIO PREVISTO</label><input style={inp} type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} /></div>
            </div>

            {/* RESPONSABLE */}
            <div style={{ background:'#f8f7f4', border:'1px solid #eee', borderRadius:8, padding:'14px 16px', marginBottom:14 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'#555', marginBottom:12 }}>RESPONSABLE DE COMPRAS (opcional)</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9 }}>
                <div><label style={lbl}>NOMBRE</label><input style={inp} placeholder="Nombre y apellidos" value={respNombre} onChange={e=>setRespNombre(e.target.value)} /></div>
                <div><label style={lbl}>CORREO ELECTRÓNICO DIRECTO</label><input style={inp} type="email" placeholder="responsable@obra.com" value={respEmail} onChange={e=>setRespEmail(e.target.value)} /></div>
                <div><label style={lbl}>TELÉFONO</label><input style={inp} type="tel" placeholder="6XX XXX XXX" value={respTel} onChange={e=>setRespTel(e.target.value)} /></div>
              </div>
            </div>

            {/* VISIBILIDAD */}
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>VISIBILIDAD</label>
              <div style={{ display:'flex', gap:10 }}>
                {[['publica','Pública','Cualquier empresa puede ver y pujar'],['privada','Privada','Solo empresas que invites pueden pujar']].map(([v,l,sub])=>(
                  <div key={v} onClick={()=>setVis(v)} style={{ flex:1, border:`2px solid ${visibilidad===v?'#e85d04':'#eee'}`, borderRadius:8, padding:'12px 14px', cursor:'pointer', background:visibilidad===v?'#fff2ec':'transparent', transition:'.15s' }}>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:visibilidad===v?'#e85d04':'#333' }}>{visibilidad===v?'âœ“ ':''}{l}</div>
                    <div style={{ fontSize:11, color:'#888', marginTop:3 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {visibilidad==='privada' && (
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>EMAILS DE EMPRESAS INVITADAS (separados por coma)</label>
                <textarea style={{ ...inp, resize:'vertical', minHeight:56, fontSize:13 }} placeholder="empresa1@mail.com, empresa2@mail.com, ..." value={invitadas} onChange={e=>setInvitadas(e.target.value)} />
                <div style={{ fontSize:11, color:'#888', marginTop:4 }}>Recibirá un correo electrónico con el enlace directo a esta licitación</div>
              </div>
            )}

            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <label style={lbl}>ETIQUETAS</label>
                <button type="button" onClick={async ()=>{
                  const sugeridas = await autoEtiquetar({ nombre, desc, partidas })
                  if (!sugeridas.length) { alert('No se detectaron etiquetas automáticas. Añádelas manualmente.'); devolver }
                  setTags(anterior=>[...new Set([...anterior,...sugeridas])])
                }} style={{ fontSize:11, fontWeight:700, color:'#5a3fa0', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:4, padding:'3px 10px', cursor:'pointer', fontFamily:'Syne,sans-serif' }}>
                  âœ¨ Sugerir automáticamente
                </button>
              </div>
              <TagInput tags={tags} onChange={setTags}/>
              <div style={{ fontSize:11, color:'#888', marginTop:5 }}>Pulsa "Sugerir" para detectar etiquetas según la descripción y partidas, o áñelas manualmente</div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <button onClick={onClose} style={{ background:'transparent', color:'#888', border:'1.5px solid #ddd', padding:'10px 16px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
              <button onClick={()=>canNext1&&setStep(2)} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 22px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', opacity:canNext1?1:.4 }}>Siguiente â†'</button>
            </div>
          </div>
        )}

        {/* PASO 2 — PARTIDAS */}
        {paso===2 && (
          <div style={{ padding:'20px 28px 24px' }}>
            {/* Barra de herramientas importar/descargar */}
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <button onClick={descargarPlantillaExcel} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', border:'1.5px solid #1a6b3a', borderRadius:6, background:'#e5f4ec', color:'#1a6b3a', cursor:'pointer', fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700 }}>
                <Ic n="file" s={13}/> Descargar plantilla Excel
              </button>
              <button onClick={()=>csvRef.current.click()} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', border:'1.5px solid #1a4d7a', borderRadius:6, background:'#e5eef7', color:'#1a4d7a', cursor:'pointer', fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700 }}>
                <Ic n="paperclip" s={13}/> Importar relleno de Excel
              </button>
              <input ref={csvRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={e=>{ if(e.target.files[0]) importarXLSX(e.target.files[0], p=>setPartidas(prev=>[...prev,...p])) }} />
              <div style={{ fontSize:11, color:'#888', alignSelf:'center' }}>O añade las partidas manualmente abajo</div>
            </div>

            {/* Lista partidas añadidas */}
            {partidas.map(p=>(
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 13px', background:'#fff', border:'1px solid #eee', borderRadius:6, marginBottom:6 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3, background:p.tipo==='material'?'#e5eef7':'#e5f4ec', color:p.tipo==='material'?'#1a4d7a':'#1a6b3a' }}>{p.tipo==='material'?'MATERIAL':'OBRA'}</span>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#888' }}>{p.codigo}</span>
                  </div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, marginTop:2 }}>{p.descripcion}</div>
                  <div style={{ fontSize:11, color:'#888', marginTop:1 }}>{p.medicion} {p.unidad} Ã— {fmt(p.precioSalida)} = <strong>{fmt(p.medicion*p.precioSalida)}</strong></div>
                </div>
                <button onClick={()=>setPartidas(prev=>prev.filter(x=>x.id!==p.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'#ccc', fontSize:20, padding:'0 4px' }}>Ã—</button>
              </div>
            ))}

            {/*Formulario añadir manual de partida */}
            <div style={{ background:'#f8f7f4', border:'1.5px dashed #ddd', borderRadius:10, padding:14, marginTop:8, marginBottom:14 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:12, color:'#555' }}>+ AÃ±adir partida manualmente</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, marginBottom:9 }}>
                <div>
                  <label style={lbl}>TIPO</label>
                  <select style={{ ...inp, appearance:'auto' }} value={pf.tipo||'obra'} onChange={e=>setPf(f=>({...f,tipo:e.target.value}))}>
                    <option value="obra">Partida de obra</option>
                    <option value="material">Material / suministro</option>
                  </seleccionar>
                </div>
                <div><label style={lbl}>CÓDIGO</label><input style={inp} placeholder="CIM-001" value={pf.codigo} onChange={e=>setPf(f=>({...f,codigo:e.target.value}))} /></div>
                <div><label style={lbl}>UNIDAD</label><select style={{ ...inp, appearance:'auto' }} value={pf.unidad} onChange={e=>setPf(f=>({...f,unidad:e.target.value}))}>{['ud','m','m2','m3','kg','t','l','tn','PA'].map(u=><option key={u}>{u}</option>)}</select></div>
              </div>
              <div style={{ marginBottom:9 }}><label style={lbl}>DESCRIPCIÃ“N *</label><input style={inp} placeholder={pf.tipo==='material'?'Hormigon HA-25/B/20/IIa suministrado en obra':'Micropilote Ã˜168mm L=12m'} value={pf.desc} onChange={e=>setPf(f=>({...f,desc:e.target.value}))} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:10 }}>
                <div><label style={lbl}>MEDICINA *</label><input style={inp} type="number" placeholder="0" value={pf.medicion} onChange={e=>setPf(f=>({...f,medicion:e.target.value}))} /></div>
                <div><label style={lbl}>PRECIO SALIDA â‚¬/ud *</label><input style={inp} type="number" placeholder="0.00" value={pf.precio} onChange={e=>setPf(f=>({...f,precio:e.target.value}))} /></div>
              </div>
              <button onClick={addPartida} disabled={!pf.desc||!pf.medicion||!pf.precio} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 0', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', width:'100%', opacity:(!pf.desc||!pf.medicion||!pf.precio)?.4:1 }}>
                + AÃ±adir partida
              </button>
            </div>

            {/* Archivos */}
            <div style={{ marginBottom:6 }}>
              <label style={lbl}>DOCUMENTACIÓN (planos, BOQs — máx. 25MB por archivo)</label>
              <FileUploader archivos={archivos} onChange={setArchivos} maxSize={MAX_FILE_PROJ} label="Adjuntar documentación técnica" />
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <button onClick={()=>setStep(1)} style={{ background:'transparent', color:'#888', border:'1.5px solid #ddd', padding:'10px 16px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer' }}>â† Atrás</button>
              <button onClick={()=>{ if(partidas.length) setStep(3) }} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'10px 22px', borderRadius:6, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', opacity:partidas.length?1:.4 }}>
                Vista previa †'
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 — VISTA PREVIA */}
        {paso===3 && (
          <VistaPrevia data={previewData} company={company} onPublish={publish} onBack={()=>setStep(2)} loading={loading} />
        )}
      </div>
    </div>
  )
}

// â”€â”€â”€ PERFIL DEL PANEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â. ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
const ROLES_DISPONIBLES = ['constructora','subcontrata','especialista','promotora','ingeniería','laboratorio','suministrador']

función ProfilePanel({ usuario, empresa, proyectos, ofertas, onClose, onOpenDetail, onNewMsg, onCompanyUpdate, onDeleteProject, onDeleteBid, isAdmin }) {
  const misProyectos = proyectos.filter(p=>p.user_id===user.id)
  const misPujas = bids.filter(b=>b.user_id===user.id)
  const adjudicadas = misPujas.filter(b=>b.estado==='adjudicada')
  const [tab, setTab] = useState('proyectos')

  // Estado ediciÃ³n perfil
  const [editNombre, setEditNombre] = useState(¿empresa?.nombre||'')
  const [editTel, setEditTel] = useState(empresa?.telefono||'')
  const [editRoles, setEditRoles] = useState(
    empresa?.rol ? empresa.rol.split(',').map(r=>r.trim()) : ['subcontrata']
  )
  const [editEmail, setEditEmail] = useState(user?.email||'')
  const [editPass, setEditPass] = useState('')
  const [editPassConf, setEditPassConf] = useState('')
  const [ahorro, establecerAhorro] = usarEstado(falso)
  const [saveMsg, setSaveMsg] = useState({ text:'', ok:false })

  función alternarRol(r) {
    setEditRoles(prev =>
      anterior.incluye(r)
        ? prev.length > 1 ? prev.filter(x=>x!==r) : prev // mínimo 1 rol
        : [...anterior, r]
    )
  }

  función asíncrona guardarPerfil() {
    setSaving(true)
    setSaveMsg({ text:'', ok:false })
    intentar {
      // Actualizar datos de empresa en compañias
      const { error: ce } = await supabase.from('companies')
        .update({ name: editNombre.trim(), telefono: editTel.trim(), role: editRoles.join(',') })
        .eq('id', user.id)
      if (ce) throw new Error('Error al guardar: ' + ce.message)

      // Actualizar email si cambió
      if (editEmail.trim() && editEmail.trim() !== user.email) {
        const { error: ee } = await supabase.auth.updateUser({ email: editEmail.trim() })
        if (ee) throw new Error('Error al cambiar email: ' + ee.message)
      }

      // Actualizar contraseña si se rellenó
      si (editPass) {
        if (editPass !== editPassConf) throw new Error('Las contraseñas no coinciden')
        if (editPass.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')
        const { error: pe } = await supabase.auth.updateUser({ password: editPass })
        if (pe) throw new Error('Error al cambiar contraseÃ±a: ' + pe.message)
        setEditPass(''); setEditPassConf('')
      }

      setSaveMsg({ text: 'Perfil actualizado correctamente', ok: true })
      // Notificar al padre para refrescar empresa
      if (onCompanyUpdate) onCompanyUpdate({ name:editNombre.trim(), telefono:editTel.trim(), role:editRoles.join(',') })
    } catch(e) {
      setSaveMsg({ text: e.message, ok: false })
    } finalmente {
      setSaving(false)
    }
  }

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, outline:'none', fontFamily:'Barlow,sans-serif', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:11, fontWeight:700, letterSpacing:'.06em', color:'#888', marginBottom:5, fontFamily:'Syne,sans-serif' }

  devolver (
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
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800 }}>{isAdmin ? 'Administrador ObraLicit' : company?.name}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:3 }}>
                {esAdministrador}
                  ? <><span style={{ background:'#e85d04', color:'#fff', padding:'2px 10px', borderRadius:4, fontSize:11, fontWeight:700, marginRight:6 }}>ADMIN</span>Acceso total · Ve todos los precios y conversaciones</>
                  : <>{empresa?.role} — CIF: {empresa?.cif||'No registrado'}</>
                }
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:2 }}>{user.email}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:20, marginTop:18, flexWrap:'wrap' }}>
            {esAdministrador}
              ? [['Total obras',projects.length],['Total pujas',bids.length],['Empresas',[...new Set(bids.map(b=>b.empresa))].length]].map(([l,v])=>(
                  <div key={l}><div style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700 }}>{l.toUpperCase()}</div><div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:18, fontWeight:700, color:'#fff', marginTop:2 }}>{v}</div></div>
                ))
              : [['Proyectos',misProyectos.length],['Pujas enviadas',misPujas.length],['Contratos ganados',adjudicadas.length]].map(([l,v])=>(
                  <div key={l}><div style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700 }}>{l.toUpperCase()}</div><div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:18, fontWeight:700, color:'#fff', marginTop:2 }}>{v}</div></div>
                ))
            }
          </div>
        </div>

        {/* PESTAÑAS */}
        <div style={{ display:'flex', borderBottom:'1px solid #eee', background:'#f8f7f4', overflowX:'auto' }}>
          {[
            ['proyectos','Proyectos'],
            ['pujas','Mis pujas'],
            ...(isAdmin?[['estadisticas','Panel admin']]:[ ]),
            ['empresas','Directorio'],
            ['seguidores','Seguidores'],
            ['perfil', isAdmin?'Perfil Admin':'Mi perfil']
          ].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ flex:1, minWidth:70, padding:'12px 6px', border:'none', background:k==='estadisticas'&&tab===k?'#18170f':'transparent', fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, cursor:'pointer', color:tab===k?(k==='estadisticas'?'#e85d04':'#e85d04'):'#888', borderBottom:tab===k?'2px solid #e85d04':'2px solid transparent', transition:'.15s', whiteSpace:'nowrap' }}>{l}</button>
          ))}
        </div>

        <div style={{ padding:'20px 28px' }}>
          {tab==='proyectos' && (
            <>
                  {misProyectos.length===0
                ? <div style={{ textAlign:'center', padding:'40px 20px', color:'#888' }}><div style={{ fontSize:32, marginBottom:10 }}>ðŸ —ï¸ </div><div style={{ fontFamily:'Syne', fontWeight:700, marginBottom:6 }}>Sin proyectos publicados</div></div>
                : misProyectos.map(p=>(
                  <div key={p.id} style={{ padding:'14px 16px', border:'1px solid #eee', borderRadius:10, marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div style={{ flex:1, cursor:'pointer' }} onClick={()=>{ onOpenDetail(p.id); onClose() }}>
                        <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, marginBottom:3 }}>{p.nombre}</div>

                        <div style={{ fontSize:12, color:'#888' }}>{p.ubicacion} — Cierre: {p.fecha_cierre} — {bids.filter(b=>b.proyecto_id===p.id).length} oferta(s)</div>
                        <div style={{ display:'flex', gap:5, marginTop:8, flexWrap:'wrap' }}>{p.tags?.map(t=><Tag key={t} t={t}/>)}</div>
                      </div>
                      <botón
                        onClick={e=>{ e.stopPropagation(); if(window.confirm('Â¿Eliminar esta publicación? Se borrarán también todas sus pujas.')) onDeleteProject(p.id) }}
                        style={{ flexShrink:0, background:'#fdecea', border:'1px solid #f5c6c2', color:'#c0392b', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif' }}
                        title="Eliminar publicación"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              }
            </>
          )}
          {tab==='pujas' && (
            <>
                  {misPujas.length===0
                ? <div style={{ textAlign:'center', padding:'40px 20px', color:'#888' }}><div style={{ fontSize:32, marginBottom:10 }}>ðŸ“‹</div><div style={{ fontFamily:'Syne', fontWeight:700, marginBottom:6 }}>Sin pujas enviadas</div></div>
                : misPujas.map(b=>{
                  const proyecto = proyectos.find(p=>p.id===b.proyecto_id)
                  const puedeRetirar = b.estado === 'pendiente' && !b.expirada
                  devolver (
                    <div key={b.id} style={{ padding:'14px 16px', border:'1px solid #eee', borderRadius:10, marginBottom:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{proj?.nombre||'Proyecto'}</div>

                          <div style={{ fontSize:12, color:'#888', marginTop:3 }}>{b.fecha} — Plazo: {b.plazo}d</div>
                          {b.observaciones && <div style={{ fontSize:11, color:'#555', marginTop:3, fontStyle:'italic' }}>"{b.observaciones.slice(0,80)}{b.observaciones.length>80?'...':''}"</div>}
                          {b.validez_tipo==='fecha' && <div style={{ fontSize:11, color:'#c97a0a', marginTop:2 }}>Válida hasta: {b.validez_fecha}</div>}
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:16, fontWeight:600 }}>{fmt(b.precio)}</div>
                          <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, display:'inline-block', marginTop:3, background:b.estado==='adjudicada'?'#e5f4ec':b.expirada?'#f0f0f0':'#fff8e6', color:b.estado==='adjudicada'?'#1a6b3a':b.expirada?'#888':'#b07a10' }}>
                            {b.expirada?'EXPIRADA':b.estado.toUpperCase()}
                          </span>
                          <div style={{ marginTop:8, display:'flex', gap:6, justifyContent:'flex-end' }}>
                            {(puedeRetirar || esAdmin) && (
                              <botón
                                onClick={()=>{ if(window.confirm(isAdmin?'Â¿Eliminar esta puja?':'Â¿Retirar tu oferta? Esta acción no se puede deshacer.')) onDeleteBid(b.id) }}
                                style={{ background:'#fdecea', border:'1px solid #f5c6c2', color:'#c0392b', borderRadius:5, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif' }}
                              >
                                {esAdministrador? 'Eliminar' : 'Retirar oferta'}
                              </button>
                            )}
                            {b.estado==='adjudicada' && !isAdmin && (
                              <span style={{ fontSize:11, color:'#1a6b3a', fontWeight:600 }}>No se puede retirar</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              }
            </>
          )}
          {tab==='empresas' && (
            <EmpresasDirectorio currentUser={user} currentCompany={company} onNewMsg={onNewMsg}/>
          )}

          {tab==='seguidores' && (
            <GestionSeguidores user={user} company={company}/>
          )}

          {tab==='estadisticas' && isAdmin && (
            <AdminEstadísticas proyectos={proyectos} ofertas={ofertas}/>
          )}

          {tab==='perfil' && (
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:18 }}>DATOS DE LA EMPRESA</div>

              <div style={{ marginBottom:14 }}>
                <label style={lbl}>NOMBRE DE LA EMPRESA</label>
                <input style={inp} value={editNombre} onChange={e=>setEditNombre(e.target.value)} placeholder="Nombre de tu empresa"/>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={lbl}>TELÉFONO DE CONTACTO</label>
                <input style={inp} type="tel" value={editTel} onChange={e=>setEditTel(e.target.value)} placeholder="6XX XXX XXX"/>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={lbl}>ROLES DE LA EMPRESA (puedes tener varios)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                  {ROLES_DISPONIBLES.map(r=>(
                    <button key={r} onClick={()=>toggleRol(r)} style={{
                      relleno: '7px 14px', radio de borde: 20, tamaño de fuente: 12, peso de fuente: 600,
                      cursor:'pointer', fontFamily:'Barlow,sans-serif', transition:'.15s',
                      borde: editRoles.includes(r) ? '2px sólido #e85d04' : '2px sólido #eee',
                      fondo: editRoles.includes(r) ? '#fff2ec' : 'transparente',
                      color: editRoles.includes(r) ? '#e85d04' : '#888'
                    }}>
                      {editRoles.includes(r) ? 'âœ“ ' : '+ '}{r}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:11, color:'#888', marginTop:6 }}>Roles activos: <strong>{editRoles.join(', ')}</strong></div>
              </div>

              <div style={{ height:1, background:'#eee', margin:'20px 0' }}/>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:18 }}>ACCESO Y SEGURIDAD</div>

              <div style={{ marginBottom:14 }}>
                <label style={lbl}>EMAIL DE ACCESO</label>
                <input style={inp} type="email" value={editEmail} onChange={e=>setEditEmail(e.target.value)} placeholder="tu@empresa.com"/>
                <div style={{ fontSize:11, color:'#888', marginTop:4 }}>Si cambias el correo electrónico recibirás un enlace de confirmación</div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={lbl}>NUEVA CONTRASEÃ'A</label>
                  <input style={inp} type="password" value={editPass} onChange={e=>setEditPass(e.target.value)} placeholder="Mínimo 6 caracteres"/>
                </div>
                <div>
                  <label style={lbl}>CONFIRMAR CONTRASEÃ'A</label>
                  <input style={inp} type="password" value={editPassConf} onChange={e=>setEditPassConf(e.target.value)} placeholder="Repite la contraseÃ±a"/>
                </div>
              </div>
              <div style={{ fontSize:11, color:'#888', marginBottom:20 }}>Deja en blanco si no quieres cambiar la contraseña</div>

              {saveMsg.text && (
                <div style={{ padding:'10px 14px', background:saveMsg.ok?'#e5f4ec':'#fdecea', color:saveMsg.ok?'#1a6b3a':'#c0392b', borderRadius:6, fontSize:13, marginBottom:16, lineHeight:1.5 }}>
                  {saveMsg.text}
                </div>
              )}

              <button onClick={guardarPerfil} disabled={saving} style={{ background:'#e85d04', color:'#fff', border:'none', padding:'12px 28px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, cursor:'pointer', opacity:saving?.6:1 }}>
                {ahorrar? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// â”€â”€â”€ NOTIFICACIONES DEL PANEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â. ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función NotifPanel({ usuario, onClose, onOpenDetail }) {
  const [notificaciones, setNotifs] = useState([])
  const [cargando, establecerCargando] = usarEstado(true)

  useEffect(()=>{
    supabase.from('notifications').select('*').eq('user_id', user.id)
      .order('created_at', { ascending:false }).limit(50)
      .then(({ datos })=>{ if(datos) setNotifs(datos); setLoading(false) })

    const ch = supabase.channel('notifs-panel')
      .on('postgres_changes',{ event:'INSERT', schema:'public', table:'notifications' }, payload=>{
        if(payload.new.user_id===user.id) setNotifs(prev=>[payload.new,...prev])
      }).suscribir()
    return ()=>supbase.removeChannel(ch)
  },[])

  función asíncrona marcarTodas() {
    await supabase.from('notifications').update({ leida:true }).eq('user_id', user.id).eq('leida', false)
    setNotifs(prev=>prev.map(n=>({...n, leida:true})))
  }

  const iconoTipo = t => t==='puja'?'ðŸ'¶':t==='seguidor'?'ðŸ'¥':t==='seguimiento'?'ðŸ””':t==='obra'?'ðŸ —ï¸ ':'ðŸ“¢'

  devolver (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.5)', backdropFilter:'blur(5px)', display:'flex' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ marginLeft:'auto', width:'min(480px,100vw)', background:'#fff', height:'100vh', overflowY:'auto', boxShadow:'0 0 60px rgba(0,0,0,.2)', display:'flex', flexDirection:'column' }}>
        <div style={{ background:'#18170f', color:'#fff', padding:'24px 28px 20px', flexShrink:0 }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,.4)', cursor:'pointer', marginBottom:14, border:'none', background:'none' }}>
            <Ic n="back" s={13}/> Volver
          </button>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800 }}>Notificaciones</div>
            {notificaciones.algunos(n=>!n.leida) && (
              <button onClick={marcarTodas} style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontFamily:'Syne,sans-serif' }}>
                Marcar todas leÃdas
              </button>
            )}
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {cargando && <div style={{ padding:20, color:'#888', textAlign:'center' }}>Cargando...</div>}
          {!cargando && notifs.length===0 && (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#888' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>ðŸ””</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700 }}>Sin notificaciones</div>
            </div>
          )}
          {notifs.map(n=>(
            <div key={n.id} style={{ padding:'14px 20px', borderBottom:'1px solid #eee', background:n.leida?'#fff':'#fef9f5', cursor:(n.tipo==='puja'||n.tipo==='obra')?'pointer':'default' }}
              onClick={async ()=>{
                if(!n.leida){ await supabase.from('notifications').update({ leida:true }).eq('id',n.id); setNotifs(prev=>prev.map(x=>x.id===n.id?{...x,leida:true}:x)) }
                // Navegar a la obra si tiene proyecto_id
                const data = typeof n.data === 'string' ? JSON.parse(n.data||'{}') : (n.data||{})
                if ((n.tipo==='puja'||n.tipo==='obra') && data.proyecto_id && onOpenDetail) {
                  onOpenDetail(datos.proyecto_id)
                  onClose()
                }
              }}>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                <div style={{ fontSize:20, flexShrink:0 }}>{iconoTipo(n.tipo)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:2 }}>{n.titulo}</div>
                  {n.mensaje && <div style={{ fontSize:12, color:'#555', lineHeight:1.5 }}>{n.mensaje}</div>}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5 }}>
                    <div style={{ fontSize:11, color:'#aaa' }}>{new Date(n.created_at).toLocaleString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                    {(n.tipo==='puja'||n.tipo==='obra') && <div style={{ fontSize:10, color:'#e85d04', fontWeight:700 }}>Clic para ver la obra â†'</div>}
                  </div>
                </div>
                {!n.leida && <div style={{ width:8, height:8, borderRadius:'50%', background:'#e85d04', flexShrink:0, marginTop:4 }}/>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ BOTÃ“N SEGUIR EMPRESA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â. ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función BotonSeguir({ currentUser, targetUser, currentCompany }) {
  const [estado, setEstado] = useState(null) // null=no sigue, pendiente, confirmado
  const [cargando, setLoading] = useState(falso)

  useEffect(()=>{
    si (!usuarioactual || !usuariodestino) devolver
    supabase.from('follows').select('estado').eq('follower_id', currentUser.id).eq('following_id', targetUser.id).maybeSingle()
      .then(({ datos })=>{ if(datos) setEstado(datos.estado) })
  },[currentUser?.id, targetUser?.id])

  función asíncrona toggleFollow() {
    si (!usuarioactual) devolver
    setLoading(true)
    si (estado) {
      // Dejar de seguir
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', targetUser.id)
      establecerEstado(null)
    } demás {
      // Solicitar seguir
      esperar supabase.from('follows').insertar([{
        follower_id: currentUser.id,
        following_id: targetUser.id,
        follower_name: currentCompany?.name || currentUser.email,
        following_name: targetUser.name,
        estado: 'pendiente'
      }])
      // Notificar a la empresa seguida
      esperar supabase.from('notifications').insert([{
        user_id: targetUser.id,
        tipo: 'seguidor',
        título: `${empresaactual?.nombre || 'Una empresa'} quiere seguirte`,
        mensaje: `Ha solicitado seguir tus publicaciones. Acepta o rechaza desde tu perfil â†' Seguidores.`,
        datos:     { follower_id: currentUser.id, follower_name: currentCompany?.name }
      }])
      setEstado('pendiente')
    }
    setLoading(false)
  }

  const label = estado==='confirmado'?'Siguiendo':estado==='pendiente'?'Solicitud enviada':'+ Seguir'
  const style = {
    relleno:'6px 14px', radio de borde:6, familia de fuente:'Syne,sans-serif', tamaño de fuente:12, peso de fuente:700,
    cursor:'pointer', borde:'none', transición:'.15s',
    antecedentes: estado==='confirmado'?'#e5f4ec': estado==='pendiente'?'#f0f0f0':'#f0ecff',
    color: estado==='confirmado'?'#1a6b3a': estado==='pendiente'?'#888':'#5a3fa0',
    opacidad: cargando?.6:1
  }

  Si (currentUser?.id === targetUser?.id) devuelve null
  devolver <button onClick={toggleFollow} disabled={loading} style={style}>{label}</button>
}


// â”€â”€â”€ PANEL ESTADÍSTICAS ADMIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función AdminEstadísticas({ proyectos, ofertas }) {
  const [empresas, setEmpresas] = useState([])
  const [usuarios, setUsuarios] = useState([])

  useEffect(()=>{
    supabase.from('companies').select('*').order('created_at', { ascending:false })
      .then(({ datos })=>{ if(datos) setEmpresas(datos) })
  },[])

  // Cálculos
  const obrasAbiertas = proyectos.filter(p=>p.estado==='abierta').length
  const obrasCerradas = proyectos.filter(p=>p.estado!=='abierta').length
  const totalBids = bids.length
  const ofertasAdjudicadas = ofertas.filtro(b=>b.estado==='adjudicada').length
  const bidsExpiradas = bids.filter(b=>b.expirada).length
  const avgSaving = bids.length ? (bids.reduce((s,b)=>{
    const p = proyectos.flatMap(pr=>pr.partidas||[]).find(pa=>pa.id===b.partida_id)
    devolver s + (p ? (p.precioSalida-b.precio)/p.precioSalida*100 : 0)
  },0)/bids.length).toFixed(1) : 'â€—'
  const totalRef = proyectos.reduce((s,p)=>(p.partidas||[]).reduce((ss,pa)=>ss+pa.medicion*pa.precioSalida,0)+s,0)
  const totalAdjudicado = bids.filter(b=>b.estado==='adjudicado').reduce((s,b)=>{
    const p = proyectos.flatMap(pr=>pr.partidas||[]).find(pa=>pa.id===b.partida_id)
    devolver s + (p ? b.precio*p.medicion : 0)
  },0)

  // Top empresas por pujas
  const porEmpresa = bids.reduce((acc,b)=>{ acc[b.empresa]=(acc[b.empresa]||0)+1; return acc },{})
  const topEmpresas = Object.entries(porEmpresa).sort(([,a],[,b])=>ba).slice(0,5)

  // Obras mÃ¡s activas
  const porObra = proyectos.map(p=>({ nombre:p.nombre, empresa:p.empresa, pujas:bids.filter(b=>b.proyecto_id===p.id).length })).sort((a,b)=>b.pujas-a.pujas).slice(0,5)

  const tarjeta = (título, valor, color='#18170f', sub='') => (
    <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:'14px 16px', flex:1, minWidth:130 }}>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:6 }}>{titulo}</div>
      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:22, fontWeight:700, color }}>{valor}</div>
      {sub && <div style={{ fontSize:11, color:'#888', marginTop:4 }}>{sub}</div>}
    </div>
  )

  devolver (
    <div>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:14 }}>RESUMEN PLATAFORMA</div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
        {card('OBRAS ABIERTAS', obrasAbiertas, '#1a6b3a')}
        {card('OBRAS CERRADAS', obrasCerradas, '#888')}
        {card('EMPRESAS', empresas.length, '#1a4d7a')}
        {card('OFERTAS TOTALES', totalBids, '#18170f')}
        {card('ADJUDICADAS', ofertasAdjudicadas, '#1a6b3a')}
        {card('AHORRO MEDIO', avgSaving!=='—'?`-${avgSaving}%`:'—', '#1a6b3a')}
      </div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
        {card('PRESUPUESTO TOTAL REF.', fmt(totalRef), '#e85d04', 'suma de todas las obras')}
        {card('VALOR ADJUDICADO', fmt(totalAdjudicado), '#1a6b3a', 'contratado en plataforma')}
        {card('OFERTAS EXPIRADAS', bidsExpiradas, '#888')}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:12 }}>TOP EMPRESAS PUJADORAS</div>
          {topEmpresas.map(([emp,n],i)=>(
            <div key={emp} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:i<topEmpresas.length-1?'1px solid #f0f0f0':'none' }}>
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
          {porObra.map((o,i)=>(
            <div key={o.nombre} style={{ padding:'7px 0', borderBottom:i<porObra.length-1?'1px solid #f0f0f0':'none' }}>
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
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:12 }}>ÃšLTIMAS EMPRESAS REGISTRADAS</div>
        {empresas.slice(0,8).map(e=>(
          <div key={e.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f5f5f5' }}>
            <div>
              <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{e.name}</span>
              <span style={{ fontSize:11, color:'#888', marginLeft:8 }}>{e.role}</span>
              {e.cif && <span style={{ fontSize:11, color:'#888', marginLeft:8 }}>CIF: {e.cif}</span>}
            </div>
            <div style={{ fontSize:11, color:'#888' }}>{new Date(e.created_at).toLocaleDateString('es-ES')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// â”€â”€â”€ GESTIÓN SEGUIDORES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función GestionSeguidores({ usuario, empresa }) {
  const [pendientes, setPendientes] = useState([])
  const [siguiendo, setSiguiendo] = useState([])
  const [seguidores, setSeguidores] = useState([])

  useEffect(()=>{
    // Solicitudes pendientes que me han hecho a mÃ
    supabase.from('follows').select('*').eq('following_id', user.id).eq('estado','pendiente')
      .then(({ datos })=>{ if(datos) setPendientes(datos) })
    // A quiÃ©n estoy siguiendo
    supabase.from('follows').select('*').eq('follower_id', user.id)
      .then(({ datos })=>{ if(datos) setSiguiendo(datos) })
    // Quién me sigue (confirmados)
    supabase.from('follows').select('*').eq('following_id', user.id).eq('estado','confirmado')
      .then(({ datos })=>{ if(datos) setSeguidores(datos) })
  },[user.id])

  función asíncrona responder(id, follower_id, follower_name, aceptar) {
    si (aceptar) {
      await supabase.from('follows').update({ estado:'confirmado' }).eq('id', id)
      // Notificar al que solicitó
      esperar supabase.from('notifications').insert([{
        user_id: follower_id, tipo:'seguimiento',
        titulo: `${company?.name||'Una empresa'} ha aceptado tu solicitud`,
        mensaje: `Ahora recibirás notificaciones cuando publiquen nuevas obras.`,
        datos: { following_id: user.id }
      }]).catch(()=>{})
      setPendientes(prev=>prev.filter(f=>f.id!==id))
      setSeguidores(prev=>[...prev,{ id, follower_id, follower_name, estado:'confirmado' }])
    } demás {
      await supabase.from('follows').delete().eq('id', id)
      setPendientes(prev=>prev.filter(f=>f.id!==id))
    }
  }

  función asíncrona dejarDeSeguir(id) {
    await supabase.from('follows').delete().eq('id', id)
    setSiguiendo(prev=>prev.filter(f=>f.id!==id))
  }

  const seccStyle = { fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:10, marginTop:18 }

  devolver (
    <div>
      {pendientes.length>0 && <>
        <div style={seccStyle}>SOLICITUDES PENDIENTES ({pendientes.length})</div>
        {pendientes.map(f=>(
          <div key={f.id} style={{ padding:'12px 14px', border:'1.5px solid #ffcba4', borderRadius:8, marginBottom:8, background:'#fff9f5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{f.follower_name||'Empresa'}</div>
              <div style={{ fontSize:11, color:'#888', marginTop:2 }}>Quiere seguir tus publicaciones</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>responder(f.id, f.follower_id, f.follower_name, true)}
                style={{ padding:'6px 14px', background:'#e5f4ec', border:'1px solid #b8ddc8', borderRadius:5, color:'#1a6b3a', fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                Aceptar
              </button>
              <button onClick={()=>responder(f.id, f.follower_id, f.follower_name, false)}
                style={{ padding:'6px 14px', background:'#fdecea', border:'1px solid #f5c6c2', borderRadius:5, color:'#c0392b', fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </>}

      <div style={seccStyle}>ESTOY SIGUIENDO ({siguiendo.length})</div>
      {siguiendo.length===0
        ? <div style={{ fontSize:13, color:'#888', fontStyle:'italic' }}>No sigues a ninguna empresa todavÃa. Búscalas en el Directorio.</div>
        : siguiendo.map(f=>(
          <div key={f.id} style={{ padding:'11px 14px', border:'1px solid #eee', borderRadius:8, marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{f.following_name||'Empresa'}</div>
              <div style={{ fontSize:11, marginTop:2, color:f.estado==='confirmado'?'#1a6b3a':'#c97a0a', fontWeight:600 }}>
                {f.estado==='confirmado'?'Confirmado — recibes notificaciones':'Pendiente de aceptación'}
              </div>
            </div>
            <button onClick={()=>dejarDeSeguir(f.id)}
              style={{ fontSize:11, padding:'4px 10px', background:'#f0f0f0', border:'1px solid #ddd', borderRadius:4, cursor:'pointer', fontFamily:'Syne,sans-serif', color:'#888' }}>
              Dejar de seguir
            </button>
          </div>
        ))
      }

      <div style={seccStyle}>ME SIGUEN ({seguidores.length})</div>
      {seguidores.length===0
        ? <div style={{ fontSize:13, color:'#888', fontStyle:'italic' }}>Nadie te sigue todavÃa.</div>
        : seguidores.map(f=>(
          <div key={f.id} style={{ padding:'11px 14px', border:'1px solid #eee', borderRadius:8, marginBottom:6 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{f.follower_name||'Empresa'}</div>
          </div>
        ))
      }
    </div>
  )
}

// â”€â”€â”€ DIRECTORIO EMPRESAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función EmpresasDirectorio({ currentUser, currentCompany, onNewMsg }) {
  const [empresas, setEmpresas] = useState([])
  useEffect(()=>{
    supabase.from('companies').select('*').order('name').then(({ data })=>{ if(data) setEmpresas(data) })
  },[])
  devolver (
    <div>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#888', marginBottom:14 }}>EMPRESAS REGISTRADAS</div>
      {empresas.filter(e=>e.id!==currentUser.id).map(e=>(
        <div key={e.id} style={{ padding:'12px 14px', border:'1px solid #eee', borderRadius:8, marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'#e85d04', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', fontFamily:'Syne' }}>{e.name.slice(0,2).toUpperCase()}</div>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>{e.name}</div>
                <div style={{ fontSize:11, color:'#888', marginTop:1 }}>{e.role} {e.cif?`— CIF: ${e.cif}`:''}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <BotonSeguir currentUser={currentUser} targetUser={e} currentCompany={currentCompany}/>
              <button onClick={()=>onNewMsg(e)} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', background:'#f0ecff', border:'1px solid #d4c8ff', borderRadius:6, color:'#5a3fa0', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'Syne' }}>
                <Ic n="msg" s={13}/> Mensaje
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// â”€â”€â”€ PANEL MENSAJES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â. ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
función MessagesPanel({ usuario, empresa, alCerrar, objetivoInicial, esAdministrador }) {
  const [mensajes, setMensajes] = useState([])
  const [conv, setConv] = useState(initialTarget || null) // empresa destinataria
  const [texto, setTexto] = useState('')
  const [asunto, setAsunto] = usarEstado('')
  const [cargando, setLoading] = useState(falso)

  useEffect(()=>{
    cargarMensajes()
    const ch = supabase.channel('msgs').on('postgres_changes',{ event:'INSERT', schema:'public', table:'messages' }, payload=>{
      if (payload.new.to_user_id===user.id||payload.new.from_user_id===user.id) setMensajes(prev=>[payload.new,...prev])
    }).suscribir()
    return ()=>supbase.removeChannel(ch)
  },[])

  función asíncrona loadMessages() {
    const esAdmin = isAdmin || company?.role === 'admin'
    const consulta = esAdmin
      ? supabase.from('messages').select('*').order('created_at', { ascending:false })
      : supabase.from('messages').select('*').or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`).order('created_at', { ascending:false })
    const { datos } = esperar consulta
    si (datos) establecerMensajes(datos)
  }

  función asíncrona enviar() {
    si (!texto.trim()||!conv) devolver
    setLoading(true)
    const nuevoMsg = {
      id: 'M'+Math.random().toString(36).slice(2,10),
      from_user_id: user.id, to_user_id: conv.id,
      de_empresa: empresa?.nombre, a_empresa: conv.nombre,
      asunto: asunto||'Sin asunto', contenido: texto,
      leido: false, created_at: new Date().toISOString()
    }
    const { error } = await supabase.from('messages').insert([{
      from_user_id: nuevoMsg.from_user_id, to_user_id: nuevoMsg.to_user_id,
      de_empresa: nuevoMsg.from_empresa, to_empresa: nuevoMsg.to_empresa,
      asunto: nuevoMsg.asunto, contenido: nuevoMsg.contenido
    }])
    si (!error) {
      // Añadir al estado local inmediatamente
      setMensajes(anterior=>[nuevoMsg,...anterior])
    }
    establecerTexto(''); setAsunto(''); establecer cargando (falso)
  }

  // Conversaciones agrupadas
  const convs = mensajes.reduce((acc, m)=>{
    const otherId = m.from_user_id===user.id ? m.to_user_id : m.from_user_id
    const otherName = m.from_user_id===user.id ? m.to_empresa : m.from_empresa
    if (!acc[otherId]) acc[otherId] = { id:otherId, name:otherName, msgs:[] }
    acc[otherId].msgs.push(m)
    devolver cuenta
  }, {})

  const noLeidos = mensajes.filter(m=>m.to_user_id===user.id&&!m.leido).length

  función asíncrona marcarLeido(convId) {
    await supabase.from('messages').update({ leido:true }).eq('to_user_id', user.id).eq('from_user_id', convId).eq('leido', false)
    setMensajes(prev=>prev.map(m=>m.from_user_id===convId&&m.to_user_id===user.id ? {...m,leido:true} : m))
  }

  devolver (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.5)', backdropFilter:'blur(5px)', display:'flex' }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{ marginLeft:'auto', width:'min(680px,100vw)', background:'#fff', height:'100vh', display:'flex', flexDirection:'column', boxShadow:'0 0 60px rgba(0,0,0,.2)' }}>
        {/* Encabezado */}
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
              devolver (
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

          {/*Conversación activa*/}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {conv ? (
              <>
                <div style={{ padding:'12px 18px', borderBottom:'1px solid #eee', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700 }}>
                  Conversación con {conv.name}
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                  {[...(convs[conv.id]?.msgs||[])].reverse().map(m=>{
                    const esMio = m.from_user_id===user.id
                    devolver (
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
            ): (
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

// â”€â”€â”€ PRINCIPAL DE LA APLICACIÓN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â. ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
export default function App() {
  const [session, setSession] = useState(null)
  const [company, setCompany] = useState(null)
  const [proyectos, establecerProyectos] = usarEstado([])
  const [bids, setBids] = useState([])
  const [authReady, setAuthReady] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [activeTags, setActiveTags] = useState([])
  const [sortBy, setSortBy] = useState('reciente')
  const [search, setSearch] = useState('')
  const [detalleId, setDetailId] = useState(nulo)
  const [showNew, setShowNew] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showMsgs, setShowMsgs] = useState(false)
  const [msgTarget, setMsgTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [noLeidos, setNoLeidos] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [noLeidosNotif, setNoLeidosNotif] = useState(0)

  const showToast = useCallback(msg=>{ setToast(msg); setTimeout(()=>setToast(null),2100) },[])

  // â”€â”€ SESIÃ“N â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”. ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
  useEffect(()=>{
    // REGLA CLAVE: el callback de onAuthStateChange NO puede ser async
    // porque Supabase no espera la promesa — usar .then() en su lugar
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((event, session)=>{
      si (evento === 'SIGNED_OUT') {
        setSession(null)
        establecerCompañía(nulo)
        setAuthReady(true)
        devolver
      }
      // Para cualquier evento con sesión (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED)
      si (sesión) {
        establecerSesión(sesión)
        // Carga empresa en paralelo, SIN bloquear el setAuthReady
        supabase.from('companies').select('*').eq('id', session.user.id).single()
          .then(({ datos }) => { if (datos) setCompany(datos) })
          .catch(e => console.warn('company:', e))
      }
      // Marcar auth listo INMEDIATAMENTE, sin esperar a loadCompany
      setAuthReady(true)
    })

    return ()=>{ suscripción.cancelar() }
  },[])

  // Cerrar sesión al cerrar la ventana (NO al recargar)
  useEffect(()=>{
    // Solo cerramos sesión si el usuario cierra la VENTANA, no si recarga
    // Usamos sessionStorage como flag: si existe, es una recarga
    const handleBeforeUnload = (e) => {
      // Marcar que es una recarga (se borra automáticamente al cerrar)
      sessionStorage.setItem('reloading', '1')
    }
    ventana.addEventListener('beforeunload', handleBeforeUnload)

    // Si NO viene de recarga (sessionStorage vacío al abrir por primera vez),
    // significa que abrimos pestaña nueva o volvimos tras cerrarla
    // En ese caso la sesión de Supabase ya no existe (la borramos al cerrar)
    // Nota: sessionStorage se comparte en la misma pestaña pero NO entre pestañas
    // y se borra al cerrar la pestaña — exactamente lo que queremos

    return ()=> window.removeEventListener('beforeunload', handleBeforeUnload)
  },[])



  // â”€â”€ DATOS: se cargan independientemente de la sesión â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
  useEffect(()=>{
    cargarDatos()
  },[])

  función asíncrona loadData() {
    intentar {
      // Marcar pujas expiradas
      try { await supabase.rpc('marcar_pujas_expiradas') } catch(_){}
      const [{ data:p },{ data:b }] = await Promise.all([
        supabase.from('projects').select('*').order('created_at',{ ascending:false }),
        supabase.from('bids').select('*').order('fecha',{ ascending:false })
      ])
      si(p) establecerProyectos(p)
      si(b) establecerOfertas(b)
    } catch(e){ console.error(e) }
    finalmente { setDataLoaded(true) }
  }

  // ♥♥ TIEMPO REAL ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥ ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
  useEffect(()=>{
    const ch = supabase.channel('rt')
      .on('postgres_changes',{ event:'INSERT', schema:'public', table:'projects' },
        payload=>setProjects(prev=>{
          // evitar duplicados si ya lo añadimos en handleNewProject
          si (prev.find(p=>p.id===payload.new.id)) devolver prev
          devolver [payload.new,...prev]
        }))
      .on('postgres_changes',{ event:'INSERT', schema:'public', table:'bids' },
        payload=>setBids(prev=>{
          si (prev.find(b=>b.id===payload.new.id)) devolver prev
          devolver [payload.new,...prev]
        }))
      .on('postgres_changes',{ event:'DELETE', schema:'public', table:'bids' },
        payload=>setBids(prev=>prev.filter(b=>b.id!==payload.old.id)))
      .on('postgres_changes',{ event:'UPDATE', schema:'public', table:'bids' },
        payload=>setBids(prev=>prev.map(b=>b.id===payload.new.id?payload.new:b)))
      .suscribir()
    return ()=>supbase.removeChannel(ch)
  },[])

  // â”€â”€ NOTIFICACIONES NO LEÃ DAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
  useEffect(()=>{
    si (!sesión) devolver
    const loadNotifCount = () => {
      supabase.from('notifications').select('id', { count:'exact', head:true })
        .eq('user_id', session.user.id).eq('leida', false)
        .then(({ count })=>setNoLeidosNotif(count||0))
    }
    cargarNotifCount()
    const ch = supabase.channel('notif-count')
      .on('postgres_changes',{ event:'INSERT', schema:'public', table:'notifications' }, payload=>{
        if(payload.new.user_id===session.user.id) setNoLeidosNotif(n=>n+1)
      }).suscribir()
    return ()=>supbase.removeChannel(ch)
  },[sesión])

  // â”€â”€ MENSAJES NO LEÃ DOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
  useEffect(()=>{
    si (!sesión) devolver
    supabase.from('messages').select('id',{ count:'exact' }).eq('to_user_id',session.user.id).eq('leido',false)
      .then(({ count })=>setNoLeidos(count||0))
    const ch = supabase.channel('msg-badge').on('postgres_changes',{ event:'INSERT', schema:'public', table:'messages' },
      payload=>{ if(payload.new.to_user_id===session.user.id) setNoLeidos(n=>n+1) }).subscribe()
    return ()=>supbase.removeChannel(ch)
  },[sesión])

  // â”€â”€ FILTROS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
  const filtrado = (()=>{
    const q = search.toLowerCase()
    let r = proyectos.filter(p=>{
      const mq = !q||p.nombre?.toLowerCase().includes(q)||p.empresa?.toLowerCase().includes(q)||p.ubicacion?.toLowerCase().includes(q)||p.tags?.some(t=>t.toLowerCase().includes(q))
      const mt = activeTags.length===0||activeTags.every(t=>p.tags?.includes(t))
      devolver mq&&mt
    })
    if(sortBy==='reciente') r.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
    if(sortBy==='populares') r.sort((a,b)=>b.views-a.views)
    if(sortBy==='cierre') r.sort((a,b)=>nueva Fecha(a.fecha_cierre)-nueva Fecha(b.fecha_cierre))
    if(sortBy==='pujas') r.sort((a,b)=>bids.filter(x=>x.proyecto_id===b.id).length-bids.filter(x=>x.proyecto_id===a.id).length)
    devolver r
  })()

  const detalleProj = proyectos.find(p=>p.id===detalleId)
  const tagCount = t=>projects.filter(p=>p.tags?.includes(t)).length
  const toggleTag = t=>setActiveTags(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])
  const avgSaving = bids.length?(bids.reduce((s,b)=>{
    const p=projects.flatMap(pr=>pr.partidas||[]).find(pa=>pa.id===b.partida_id)
    devolver s+(p?(p.precioSalida-b.precio)/p.precioSalida*100:0)
  },0)/bids.length).toFixed(1):'â€—'

  // â”€â”€ MANEJADORES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
  función asíncrona handleBid(proj, partida, form) {
    const bidData = {
      id: 'B'+uid(),
      proyecto_id: proj.id,
      partida_id: partida.id,
      user_id: session.user.id,
      empresa: company?.name||session.user.email,
      contacto: session.user.email,
      teléfono: formulario.tel||'',
      precio: parseFloat(form.precio),
      plazo: parseInt(form.plazo)||0,
      observaciones: form.obs||'',
      estado: 'pendiente',
      fecha: new Date().toISOString().split('T')[0],
      validez_tipo: form.validezTipo||'indefinida',
      validez_fecha: formulario.validezFecha||null,
      archivos: formulario.archivos||[],
      feedback:null, rating:null, feedback_tags:[], expirada:false
    }
    const { error } = await supabase.from('bids').insert([bidData])
    if (error) { showToast('Error: '+error.message); return }

    // Añadir al estado local INMEDIATAMENTE sin esperar realtime
    setBids(prev => {
      si (prev.find(b=>b.id===bidData.id)) devolver prev
      devolver [bidData, ...prev]
    })

    // Notificar al publicador de la obra
    Si (proj.user_id && proj.user_id !== session.user.id) {
      const notifResult = await supabase.from('notifications').insert([{
        ID de usuario: proj.user_id,
        tipo: 'puja',
        título: `Nueva oferta en tu obra`,
        mensaje: `${empresa?.nombre || 'Una empresa'} ha presentado oferta en "${proj.nombre}" — partida: ${partida.descripcion}.`,
        datos: JSON.stringify({ proyecto_id: proj.id })
      }])
      if (notifResult.error) console.warn('Error de notificación puja:', notifResult.error)
    }

    // Correo electrónico
    intentar {
      window.emailjs?.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,{
        proyecto_nombre:proj.nombre, partida_nombre:partida.descripcion,
        constructora_nombre:proj.empresa, email_constructora:proj.email_contacto||'',
        subcontrata_nombre:empresa?.nombre||'', precio:form.precio, plazo:form.plazo,
        observaciones:form.obs||'Sin observaciones', telefono_contacto:form.tel||'No facilitado'
      },EMAILJS_PUBLIC_KEY)
    } catch(e){ console.warn(e) }
    showToast('Oferta publicada correctamente')
  }

  función asíncrona handleNewProject(data) {
    const proj = {
      id: 'P'+uid(),
      slug: slugify(data.nombre),
      nombre: data.nombre,
      empresa: company?.name || session?.user?.email || 'Admin',
      e_init: (company?.name || session?.user?.email || 'AD').slice(0,2).toUpperCase(),
      e_color: COLORS[Math.floor(Math.random()*COLORS.length)],
      descripción: data.desc,
      ubicacion: data.ubic || 'España',
      fecha_cierre: data.fecha,
      fecha_inicio: data.fechaInicio || nulo,
      etiquetas: data.tags || [],
      estado: 'abierta',
      partidas: datos.partidas || [],
      vistas: 0,
      user_id: session.user.id,
      archivos: datos.archivos || [],
      email_contacto: datos.email_contacto || datos.correo_correo_responsable || '',
      responsable_nombre: data.responsable_nombre || '',
      correo_email_responsable: datos.email_responsable || '',
      responsable_tel: datos.responsable_tel || '',
      visibilidad: data.visibilidad || 'pública',
      empresas_invitadas: datos.invitadas || [],
    }
    const { data: inserted, error } = await supabase.from('projects').insert([proj]).select().single()
    if (error) { console.error('Error al insertar proyecto:', error); showToast('Error: '+error.message); devolver }
    si (insertado) establecerProyectos(prev=>[insertado,...prev])

    // Notificar a empresas invitadas si es licitación privada
    if (data.visibilidad === 'privada' && data.invitadas?.length) {
      datos.invitadas.forEach(correo electrónico => {
        intentar {
          window.emailjs?.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            proyecto_nombre: proj.nombre,
            partida_nombre: 'Licitacion privada — ha sido invitado',
            constructora_nombre: empresa?.nombre || '',
            email_constructora: correo electrónico,
            subcontrata_nombre: email,
            precio: 'Ver en plataforma',
            plazo: proj.fecha_cierre,
            observaciones: `Has sido invitado a pujar en "${proj.nombre}". Entra en ObraLicit para ver los detalles.`,
            telefono_contacto: data.responsable_tel || 'Ver plataforma'
          }, EMAILJS_PUBLIC_KEY)
        } catch(e){ console.warn('Invitación por correo electrónico:', e) }
      })
    }

    const msg = data.visibilidad==='privada'
      ? `Obra privada publicada — ${data.invitadas?.length||0} empresa(s) notificadas`
      : 'Obra publicada para todos'
    mostrarToast(ms)

    // Notificar a seguidores confirmados
    si (insertado) {
      supabase.from('follows').select('follower_id')
        .eq('following_id', session.user.id).eq('estado', 'confirmado')
        .then(({ data: segs })=>{
          si (segs?.length) {
            supabase.from('notifications').insert(segs.map(s=>({
              user_id: s.follower_id, tipo:'obra',
              titulo: `${company?.name||'Una empresa'} ha publicado una nueva obra`,
              mensaje: `"${inserted.nombre}" — ${inserted.ubicacion || 'España'}`,
              datos: { proyecto_id: insertado.id }
            }))).catch(()=>{})
          }
        }).catch(()=>{})
    }
  }

  función asíncrona handleDeleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { showToast('Error: ' + error.message); return }
    setProjects(prev => prev.filter(p => p.id !== id))
    setBids(prev => prev.filter(b => b.proyecto_id !== id))
    showToast('Publicación eliminada')
  }

  función asíncrona handleDeleteBid(id) {
    const { error } = await supabase.from('bids').delete().eq('id', id)
    if (error) { showToast('Error: ' + error.message); return }
    setBids(prev => prev.filter(b => b.id !== id))
    showToast('Oferta retirada')
  }

  función asíncrona handleOpenDetail(id) {
    establecerDetalleId(id)
    await supabase.rpc('increment_views',{ project_id:id }).catch(()=>{})
  }

  función handleNewMsg(empresa) {
    setMsgTarget(empresa)
    mostrarPerfil(falso)
    establecerMostrarMensajes(verdadero)
  }

  // â”€â”€ LOADING — solo espera la sesión, los datos cargan en segundo plano â”€â”€â”€â”€â”€â”€â”€â”€
  si (!authReady) devolver (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f2f0eb', flexDirection:'column', gap:14 }}>
      <div style={{ width:48, height:48, background:'#18170f', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#e85d04', fontFamily:'Syne,sans-serif' }}>O</div>
      <div style={{ fontSize:14, color:'#888', fontFamily:'Syne,sans-serif' }}>Conectando...</div>
    </div>
  )

  // â”€â”€ INICIAR SESIÓN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€. â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
  si (!sesión) devolver (
    <AuthScreen onLogin={async (usuario,co)=>{
      setSession({usuario})
      // Recargar company fresco desde DB para asegurar todos los campos incluidos CIF
      intentar {
        const { data:coFresh } = await supabase.from('companies').select('*').eq('id',user.id).single()
        setCompany(coFresh || co)
      } catch(e){ setCompany(co) }
    }}/>
  )

  // â”€â”€ APP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â. ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€.
  devolver (
    <div style={{ fontFamily:'Barlow,sans-serif', background:'#f2f0eb', minHeight:'100vh', color:'#18170f' }}>

      {/* BARRA EN VIVO */}
      <div style={{ background:'#18170f', color:'rgba(255,255,255,.55)', fontSize:11, padding:'5px 24px', display:'flex', gap:14, flexWrap:'wrap', fontFamily:'JetBrains Mono,monospace' }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block' }}></span> EN DIRECTO</span>
        <span><strong style={{ color:'#fff' }}>{projects.filter(p=>p.estado==='abierta').length}</strong> obras</span>
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
              valor={búsqueda} alCambiar={e=>establecerBúsqueda(e.objetivo.valor)}
            />
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            {/* Notificaciones */}
            <button onClick={()=>setShowNotifs(true)} style={{ position:'relative', display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'#555', border:'1.5px solid #eee' }}>
              ðŸ””
              {noLeidosNotif>0 && <span style={{ position:'absolute', top:2, right:2, width:16, height:16, borderRadius:'50%', background:'#e85d04', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{noLeidosNotif}</span>}
            </button>
            {/* Mensajes */}
            <button onClick={()=>setShowMsgs(true)} style={{ position:'relative', display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'#555', border:'1.5px solid #eee' }}>
              <Ic n="msg" s={15}/>
              {noLeidos>0 && <span style={{ position:'absolute', top:2, right:2, width:16, height:16, borderRadius:'50%', background:'#e85d04', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{noLeidos}</span>}
            </button>
            <button onClick={()=>setShowNew(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:22, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:'#e85d04', color:'#fff' }}>
              <Ic n="plus" s={14}/> Publicar obra
            </button>
            {/* Avatar / Perfil */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 14px 5px 6px', background:'#f2f0eb', border:'1.5px solid #eee', borderRadius:22, cursor:'pointer', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600 }}
              onClick={()=>setShowProfile(true)}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', background:'#e85d04' }}>
                {(company?.name||session.user.email).slice(0,2).toUpperCase()}
              </div>
              {empresa?.nombre||sesión.usuario.correo electrónico}
            </div>
            <button onClick={()=>supabase.auth.signOut()} style={{ display:'flex', alignItems:'center', padding:'8px', borderRadius:22, border:'1.5px solid #eee', background:'transparent', cursor:'pointer', color:'#888' }} title="Cerrar sesión">
              <Ic n="logout" s={15}/>
            </button>
          </div>
        </div>
      </nav>

      {/* DISPOSICIÓN */}
      <div style={{ maxWidth:1300, margin:'0 auto', padding:'28px 24px', display:'grid', gridTemplateColumns:'248px 1fr', gap:22 }}>
        {/* BARRA LATERAL */}
        <aside style={{ display:'flex', flexDirection:'column', gap:12, position:'sticky', top:80, alignSelf:'start' }}>
          <div style={{ background:'#fff', borderRadius:10, border:'1px solid #eee', padding:16 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#888', marginBottom:12 }}>MERCADO EN VIVO</div>
            {[['Licitaciones abiertas',projects.filter(p=>p.estado==='abierta').length],['Ofertas activas',bids.filter(b=>!b.expirada).length],['Ahorro medio',`-${avgSaving}%`]].map(([l,v])=>(
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f0f0f0' }}>
                <span style={{ fontSize:12, color:'#888' }}>{l}</span>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:600, color:String(v).includes('-')&&v!=='â€—%'?'#1a6b3a':'#333' }}>{v}</span>
              </div>
            ))}
          </div>
          {[['ESPECIALIDAD',ESPECIALIDAD],['ZONA',ZONAS],['TIPO',TIPOS]].map(([hd,tg])=>(
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

        {/* ALIMENTAR */}
        <sección>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18, gap:12, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:800 }}>Licitaciones abiertas</div>
              <div style={{ fontSize:13, color:'#888', marginTop:3 }}>{filtered.length} resultado{filtered.length!==1?'s':''}{activeTags.length>0?` â€— ${activeTags.join(', ')}`:''}
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
                <div style={{ fontSize:48, marginBottom:14 }}>ðŸ” </div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, marginBottom:8 }}>Sin resultados</div>
                <div style={{ fontSize:13, color:'#888' }}>Prueba otros filtros o publica la primera licitación.</div>
              </div>
            )}
            {filtered.map(proj=>{
              const projBids = bids.filter(b=>b.proyecto_id===proj.id&&!b.expirada)
              const totalRef = (proj.partidas||[]).reduce((s,p)=>s+p.medicion*p.precioSalida,0)
              const dl = días restantes(proj.fecha_cierre)
              constante dlEstilo = proj.estado==='cerrada'?{bg:'#f0f0f0',col:'#888'}:dl<=2?{bg:'#fdecea',col: '#c0392b'}:dl<=7?{bg:'#fef3e2',col:'#c97a0a'}:{bg:'#e5f4ec',col:'#1a6b3a'}

              devolver (
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
                            <Ic n="archivo" s={11}/> {a.nombre}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Barra de estadísticas */}
                  <div style={{ display:'flex', background:'#f8f7f4', borderTop:'1px solid #eee', borderBottom:'1px solid #eee' }}>
                    {[['PARTIDAS',(proj.partidas||[]).length,''],['PRESUP. REF.',fmt(totalRef),'#e85d04'],
                      ...((proj.user_id===session?.user?.id||session?.user?.id===ADMIN_USER_ID||proj.mostrar_num_pujas)?[['OFERTAS',projBids.length,'']]:[] ),
                      ['VISITAS',proj.views||0,'']].map(([l,v,c],idx,arr)=>(
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
                    {/* Administrador: eliminar obra desde el feed */}
                    {session?.user?.id === ADMIN_USER_ID && (
                      <button onClick={()=>{ if(window.confirm('Â¿Eliminar esta obra y todas sus pujas?')) handleDeleteProject(proj.id) }}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'8px 12px', borderRadius:8, fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, cursor:'pointer', background:'#fdecea', color:'#c0392b', border:'1px solid #f5c6c2' }}>
                        <Ic n="trash" s={13}/> Eliminar
                      </button>
                    )}
                    <div style={{ marginLeft:'auto', fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, padding:'6px 12px', borderRadius:8, display:'flex', alignItems:'center', gap:4, background:dlStyle.bg, color:dlStyle.col }}>
                      <Ic n="reloj" s={11}/>{proj.estado==='cerrada'?'Cerrada':dl<=0?'Vence hoy':`${dl}d restantes`}
                    </div>
                  </div>
                </artículo>
              )
            })}
          </div>
        </section>
      </div>

      {/* PANELES Y MODALES */}
      {detailProj && <DetailPanel proj={detailProj} bids={bids} user={session?.user} company={company} onClose={()=>setDetailId(null)} onBid={handleBid} onDeleteBid={handleDeleteBid} setProjects={setProjects}/>}
      {showNew && <NewProjectModal company={company} session={session} onClose={()=>setShowNew(false)} onSubmit={handleNewProject}/>}
      {showProfile && <ProfilePanel user={session.user} company={company} projects={projects} bids={bids} onClose={()=>setShowProfile(false)} onOpenDetail={handleOpenDetail} onNewMsg={handleNewMsg} onCompanyUpdate={updates=>setCompany(prev=>({...prev,...updates}))} onDeleteProject={handleDeleteProject} onDeleteBid={handleDeleteBid} isAdmin={session.user.id===ADMIN_USER_ID}/>}
      {showNotifs && <NotifPanel user={session.user} onClose={()=>{ setShowNotifs(false); setNoLeidosNotif(0) }} onOpenDetail={handleOpenDetail}/>}
      {showMsgs && <MessagesPanel user={session.user} company={company} onClose={()=>setShowMsgs(false)} initialTarget={msgTarget} isAdmin={session.user.id===ADMIN_USER_ID}/>}
      {tostada && <mensaje tostado={tostada}/>}
    </div>
  )
}