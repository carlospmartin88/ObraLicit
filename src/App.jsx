import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const COLORS = {
  bg: "#f2f0eb",
  panel: "#ffffff",
  soft: "#f8f7f4",
  line: "#e7e1d8",
  text: "#18170f",
  muted: "#888",
  primary: "#e85d04",
  primarySoft: "#fff2ec",
  ok: "#1a6b3a",
  okSoft: "#e5f4ec",
  danger: "#c0392b",
  dangerSoft: "#fdecea",
  info: "#1a4d7a",
  infoSoft: "#e5eef7",
};

const TAGS = [
  "Micropilotes",
  "Pilotes CPI",
  "Inyecciones",
  "Pantallas",
  "Muros",
  "Mejora terreno",
  "Anclajes",
  "Sondeos",
  "Cimentaciones especiales",
  "Madrid",
  "Barcelona",
  "Sevilla",
  "Valencia",
  "Bilbao",
  "Zaragoza",
  "Málaga",
  "Galicia",
  "Canarias",
  "Obra pública",
  "Obra privada",
  "Urgente",
  "Industrial",
  "Residencial",
  "Infraestructura",
];

function fmtCurrency(n) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function slugify(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function Ic({ n, s = 16, color = "currentColor" }) {
  const p = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    search: (
      <svg {...p}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    plus: (
      <svg {...p}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    x: (
      <svg {...p}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    logout: (
      <svg {...p}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    back: (
      <svg {...p}>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    ),
    building: (
      <svg {...p}>
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      </svg>
    ),
  };

  return icons[n] || null;
}

function Toast({ msg }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: COLORS.text,
        color: "#fff",
        padding: "11px 22px",
        borderRadius: 22,
        fontSize: 13,
        fontWeight: 700,
        zIndex: 9999,
        boxShadow: "0 8px 32px rgba(0,0,0,.2)",
      }}
    >
      {msg}
    </div>
  );
}

function Tag({ t, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        border: `1px solid ${active ? "#ffd0b0" : "#ddd"}`,
        background: active ? COLORS.primarySoft : "#fff",
        color: active ? COLORS.primary : COLORS.muted,
      }}
    >
      {t}
    </button>
  );
}

function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [role, setRole] = useState("subcontrata");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });

  async function handle(e) {
    e.preventDefault();
    setMsg({ text: "", ok: false });
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) throw error;

        const { data: co } = await supabase
          .from("companies")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        onLogin(data.user, co);
      } else {
        if (!nombre || !empresa) throw new Error("Rellena nombre y empresa");

        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
        });
        if (error) throw error;

        if (data.user) {
          const { error: pe } = await supabase.from("companies").upsert({
            id: data.user.id,
            name: empresa,
            role,
            contact_name: nombre,
          });
          if (pe) throw pe;
        }

        setMsg({ text: "Cuenta creada correctamente. Ya puedes iniciar sesión.", ok: true });
        setIsLogin(true);
      }
    } catch (err) {
      setMsg({ text: err.message || "Error", ok: false });
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  };

  const lbl = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".06em",
    color: "#888",
    marginBottom: 5,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 40,
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 8px 40px rgba(0,0,0,.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: COLORS.text,
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              color: COLORS.primary,
              marginBottom: 10,
            }}
          >
            O
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>ObraLicit</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
            Red de contratación transparente para obra
          </div>
        </div>

        <h3 style={{ marginBottom: 20, fontSize: 17 }}>
          {isLogin ? "Iniciar sesión" : "Crear cuenta"}
        </h3>

        <form onSubmit={handle}>
          {!isLogin && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>TU NOMBRE</label>
                <input
                  style={inp}
                  placeholder="Nombre y apellidos"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>EMPRESA</label>
                <input
                  style={inp}
                  placeholder="Nombre de tu empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>ROL</label>
                <select style={inp} value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="constructora">Constructora</option>
                  <option value="subcontrata">Subcontrata</option>
                  <option value="proveedor">Proveedor</option>
                  <option value="especialista">Especialista</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>EMAIL</label>
            <input
              style={inp}
              type="email"
              placeholder="tu@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>CONTRASEÑA</label>
            <input
              style={inp}
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {msg.text && (
            <div
              style={{
                padding: "10px 14px",
                background: msg.ok ? COLORS.okSoft : COLORS.dangerSoft,
                color: msg.ok ? COLORS.ok : COLORS.danger,
                borderRadius: 6,
                fontSize: 13,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 13,
              background: COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Cargando..." : isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#666" }}>
          {isLogin ? "No tienes cuenta? " : "Ya tienes cuenta? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMsg({ text: "", ok: false });
            }}
            style={{
              background: "none",
              border: "none",
              color: COLORS.primary,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {isLogin ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}

function NewWorkModal({ session, company, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tags, setTags] = useState([]);
  const [items, setItems] = useState([]);
  const [pf, setPf] = useState({
    item_type: "ejecucion",
    title: "",
    unit: "ud",
    quantity: "",
    price_reference: "",
  });
  const [loading, setLoading] = useState(false);

  function toggleTag(t) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function addItem() {
    if (!pf.title || !pf.quantity) return;
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        item_type: pf.item_type,
        title: pf.title,
        unit: pf.unit,
        quantity: Number(pf.quantity || 0),
        price_reference: Number(pf.price_reference || 0),
      },
    ]);
    setPf({
      item_type: "ejecucion",
      title: "",
      unit: "ud",
      quantity: "",
      price_reference: "",
    });
  }

  async function publish() {
    try {
      setLoading(true);

      const payload = {
        slug: `${slugify(title)}-${uid()}`,
        title,
        description,
        location,
        deadline: deadline || null,
        owner_user_id: session.id,
        company_id: session.id,
        contact_name: company?.name || "",
        contact_email: session.email || "",
        status: "open",
        visibility: "public",
        tags,
      };

      const { data: work, error } = await supabase
        .from("works")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      if (items.length) {
        const rows = items.map((it) => ({
          work_id: work.id,
          item_type: it.item_type,
          title: it.title,
          unit: it.unit,
          quantity: it.quantity,
          price_reference: it.price_reference,
          status: "open",
          tags,
        }));

        const { error: e2 } = await supabase.from("items").insert(rows);
        if (e2) throw e2;
      }

      onCreated();
      onClose();
    } catch (e) {
      alert(e.message || "Error publicando obra");
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 760,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,.2)",
        }}
      >
        <div
          style={{
            padding: "24px 28px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Publicar obra</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              Crea la obra y añade partidas o suministros
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: COLORS.bg,
              border: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "20px 28px 24px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 5 }}>
              NOMBRE DE LA OBRA
            </label>
            <input
              style={inp}
              placeholder="Ej. Cimentación especial nave logística"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 5 }}>
              DESCRIPCIÓN
            </label>
            <textarea
              style={{ ...inp, minHeight: 72, resize: "vertical" }}
              placeholder="Alcance, condicionantes, maquinaria requerida..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 5 }}>
                UBICACIÓN
              </label>
              <input
                style={inp}
                placeholder="Ciudad / provincia"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 5 }}>
                CIERRE DE OFERTAS
              </label>
              <input style={inp} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 8 }}>
              ETIQUETAS
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TAGS.map((t) => (
                <Tag key={t} t={t} active={tags.includes(t)} onClick={() => toggleTag(t)} />
              ))}
            </div>
          </div>

          <div
            style={{
              background: COLORS.soft,
              border: "1.5px dashed #ddd",
              borderRadius: 10,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#555" }}>
              Añadir partida manualmente
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 9 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 5 }}>
                  TIPO
                </label>
                <select
                  style={inp}
                  value={pf.item_type}
                  onChange={(e) => setPf((f) => ({ ...f, item_type: e.target.value }))}
                >
                  <option value="ejecucion">Partida de obra</option>
                  <option value="material">Material</option>
                  <option value="maquinaria">Maquinaria</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 5 }}>
                  UNIDAD
                </label>
                <select
                  style={inp}
                  value={pf.unit}
                  onChange={(e) => setPf((f) => ({ ...f, unit: e.target.value }))}
                >
                  {["ud", "m", "m2", "m3", "kg", "t", "l", "tn", "PA"].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 5 }}>
                  CANTIDAD
                </label>
                <input
                  style={inp}
                  type="number"
                  placeholder="0"
                  value={pf.quantity}
                  onChange={(e) => setPf((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginBottom: 9 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 5 }}>
                DESCRIPCIÓN
              </label>
              <input
                style={inp}
                placeholder="Micropilote 168 mm L=12m / Hormigón / etc."
                value={pf.title}
                onChange={(e) => setPf((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 9, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#888", display: "block", marginBottom: 5 }}>
                  PRECIO REFERENCIA
                </label>
                <input
                  style={inp}
                  type="number"
                  placeholder="0.00"
                  value={pf.price_reference}
                  onChange={(e) => setPf((f) => ({ ...f, price_reference: e.target.value }))}
                />
              </div>
            </div>

            <button
              onClick={addItem}
              disabled={!pf.title || !pf.quantity}
              style={{
                background: COLORS.primary,
                color: "#fff",
                border: "none",
                padding: "10px 14px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
                opacity: !pf.title || !pf.quantity ? 0.4 : 1,
              }}
            >
              Añadir partida
            </button>
          </div>

          {!!items.length && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10 }}>
                PARTIDAS AÑADIDAS
              </div>
              {items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 13px",
                    background: "#fff",
                    border: "1px solid #eee",
                    borderRadius: 6,
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{it.title}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>
                      {it.quantity} {it.unit} · Ref. {fmtCurrency(it.price_reference)}
                    </div>
                  </div>
                  <button
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ccc",
                      fontSize: 20,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                color: "#888",
                border: "1.5px solid #ddd",
                padding: "10px 16px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              onClick={publish}
              disabled={loading || !title}
              style={{
                background: COLORS.primary,
                color: "#fff",
                border: "none",
                padding: "10px 22px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                opacity: loading || !title ? 0.6 : 1,
              }}
            >
              {loading ? "Publicando..." : "Publicar obra"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfferForm({ item, session, company, myOffer, onDone }) {
  const [price, setPrice] = useState(myOffer?.price || "");
  const [termDays, setTermDays] = useState(myOffer?.term_days || "");
  const [conditions, setConditions] = useState(myOffer?.conditions || "");
  const [availability, setAvailability] = useState(myOffer?.availability || "");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        work_id: item.work_id,
        item_id: item.id,
        company_id: session.id,
        user_id: session.id,
        company_name: company?.name || session.email,
        company_type: company?.role || "subcontrata",
        price: Number(price || 0),
        price_total: Number(price || 0) * Number(item.quantity || 1),
        term_days: Number(termDays || 0),
        conditions,
        availability,
        status: "pending",
      };

      if (myOffer?.id) {
        const { error } = await supabase.from("offers").update(payload).eq("id", myOffer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("offers").insert(payload);
        if (error) throw error;
      }

      onDone();
    } catch (e) {
      alert(e.message || "Error enviando oferta");
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <input
          style={inp}
          type="number"
          placeholder="Precio unitario"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <input
          style={inp}
          type="number"
          placeholder="Plazo en días"
          value={termDays}
          onChange={(e) => setTermDays(e.target.value)}
        />
      </div>

      <input
        style={{ ...inp, marginBottom: 10 }}
        placeholder="Disponibilidad"
        value={availability}
        onChange={(e) => setAvailability(e.target.value)}
      />

      <textarea
        style={{ ...inp, minHeight: 72, resize: "vertical", marginBottom: 10 }}
        placeholder="Condiciones y observaciones"
        value={conditions}
        onChange={(e) => setConditions(e.target.value)}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          background: COLORS.primary,
          color: "#fff",
          border: "none",
          padding: "10px 22px",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Guardando..." : myOffer ? "Actualizar oferta" : "Enviar oferta"}
      </button>
    </form>
  );
}

function DetailPanel({ work, items, offers, session, company, onClose, onReload }) {
  const [openForm, setOpenForm] = useState(null);

  const isOwner = work.owner_user_id === session.id || work.company_id === session.id;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,.5)",
        backdropFilter: "blur(5px)",
        display: "flex",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          marginLeft: "auto",
          width: "min(860px,100vw)",
          background: "#fff",
          height: "100vh",
          overflowY: "auto",
          boxShadow: "0 0 60px rgba(0,0,0,.2)",
        }}
      >
        <div style={{ background: COLORS.text, color: "#fff", padding: "24px 28px 20px" }}>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: "rgba(255,255,255,.4)",
              cursor: "pointer",
              marginBottom: 14,
              border: "none",
              background: "none",
            }}
          >
            <Ic n="back" s={13} color="rgba(255,255,255,.4)" />
            Volver
          </button>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 5, fontWeight: 600 }}>
            {company?.name || session.email}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
            {work.title}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", lineHeight: 1.65 }}>
            {work.description}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
            {(work.tags || []).map((t) => (
              <span
                key={t}
                style={{
                  padding: "3px 9px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: "rgba(255,255,255,.1)",
                  color: "rgba(255,255,255,.7)",
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
            {[
              ["Ubicación", work.location || "—"],
              ["Cierre", fmtDate(work.deadline)],
              ["Ítems", items.length],
              ["Ofertas", offers.length],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", fontWeight: 700 }}>
                  {l.toUpperCase()}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 28px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10 }}>PARTIDAS</div>

          {items.map((item) => {
            const itemOffers = offers
              .filter((o) => o.item_id === item.id)
              .sort((a, b) => Number(a.price || 0) - Number(b.price || 0));

            const myOffer = itemOffers.find((o) => o.user_id === session.id);

            return (
              <div
                key={item.id}
                style={{
                  padding: 14,
                  border: "1px solid #eee",
                  borderRadius: 10,
                  marginBottom: 12,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#888", fontWeight: 700, marginBottom: 4 }}>
                      {item.item_type?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                      {item.quantity} {item.unit} · Ref. {fmtCurrency(item.price_reference)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>OFERTAS</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{itemOffers.length}</div>
                  </div>
                </div>

                {!isOwner && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={() => setOpenForm(openForm === item.id ? null : item.id)}
                      style={{
                        background: myOffer ? COLORS.infoSoft : COLORS.primarySoft,
                        border: "1px solid #ddd",
                        color: myOffer ? COLORS.info : COLORS.primary,
                        borderRadius: 6,
                        padding: "9px 14px",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {myOffer ? "Editar mi oferta" : "Enviar oferta"}
                    </button>

                    {openForm === item.id && (
                      <OfferForm
                        item={item}
                        session={session}
                        company={company}
                        myOffer={myOffer}
                        onDone={onReload}
                      />
                    )}
                  </div>
                )}

                {itemOffers.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8 }}>
                      {isOwner ? "OFERTAS RECIBIDAS" : "TU OFERTA"}
                    </div>

                    {(isOwner ? itemOffers : itemOffers.filter((o) => o.user_id === session.id)).map((o, idx) => (
                      <div
                        key={o.id}
                        style={{
                          padding: "11px 12px",
                          border: "1px solid #eee",
                          borderRadius: 8,
                          marginBottom: 8,
                          background: idx === 0 && isOwner ? "#f9fcfa" : "#fff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                              {isOwner ? o.company_name : "Tu oferta"}
                            </div>
                            <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
                              Plazo: {o.term_days || 0} días · Disponibilidad: {o.availability || "—"}
                            </div>
                            {o.conditions && (
                              <div style={{ fontSize: 12, color: "#666", marginTop: 5 }}>{o.conditions}</div>
                            )}
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>PRECIO</div>
                            <div
                              style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: idx === 0 && isOwner ? COLORS.ok : COLORS.text,
                              }}
                            >
                              {fmtCurrency(o.price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [company, setCompany] = useState(null);
  const [works, setWorks] = useState([]);
  const [items, setItems] = useState([]);
  const [offers, setOffers] = useState([]);
  const [authReady, setAuthReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeTags, setActiveTags] = useState([]);
  const [sortBy, setSortBy] = useState("reciente");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2100);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;

      if (s?.user) {
        setSession(s.user);

        supabase
          .from("companies")
          .select("*")
          .eq("id", s.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setCompany(data);
          })
          .catch((e) => console.warn("company", e));
      } else {
        setSession(null);
        setCompany(null);
      }

      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setCompany(null);
        setAuthReady(true);
        return;
      }

      if (s?.user) {
        setSession(s.user);

        supabase
          .from("companies")
          .select("*")
          .eq("id", s.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setCompany(data);
          })
          .catch((e) => console.warn("company", e));
      } else {
        setSession(null);
        setCompany(null);
      }

      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadData() {
    try {
      const [{ data: w }, { data: i }, { data: o }] = await Promise.all([
        supabase.from("works").select("*").order("created_at", { ascending: false }),
        supabase.from("items").select("*").order("created_at", { ascending: false }),
        supabase.from("offers").select("*").order("submitted_at", { ascending: false }),
      ]);

      setWorks(w || []);
      setItems(i || []);
      setOffers(o || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoaded(true);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel("rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "works" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => loadData())
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    let r = works.filter((w) => {
      const mq =
        !q ||
        w.title?.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        w.location?.toLowerCase().includes(q) ||
        w.tags?.some((t) => t.toLowerCase().includes(q));

      const mt = activeTags.length === 0 || activeTags.every((t) => w.tags?.includes(t));
      return mq && mt;
    });

    if (sortBy === "reciente") {
      r.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    if (sortBy === "cierre") {
      r.sort((a, b) => new Date(a.deadline || "9999-12-31") - new Date(b.deadline || "9999-12-31"));
    }
    if (sortBy === "ofertas") {
      r.sort(
        (a, b) =>
          offers.filter((x) => x.work_id === b.id).length - offers.filter((x) => x.work_id === a.id).length
      );
    }

    return r;
  }, [works, search, activeTags, sortBy, offers]);

  const detailWork = works.find((w) => w.id === detailId);
  const detailItems = items.filter((i) => i.work_id === detailId);
  const detailOffers = offers.filter((o) => o.work_id === detailId);

  function toggleTag(t) {
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setCompany(null);
  }

  if (!authReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.bg,
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: COLORS.text,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 800,
            color: COLORS.primary,
          }}
        >
          O
        </div>
        <div style={{ fontSize: 14, color: "#888" }}>Conectando...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthScreen
        onLogin={async (user, co) => {
          setSession(user);

          try {
            const { data: coFresh } = await supabase
              .from("companies")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();

            setCompany(coFresh || co);
          } catch {
            setCompany(co);
          }
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      {toast && <Toast msg={toast} />}

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(242,240,235,.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: COLORS.text,
                color: COLORS.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
              }}
            >
              O
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>ObraLicit</div>
              <div style={{ fontSize: 12, color: "#888" }}>{company?.name || session.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowNew(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 22,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: COLORS.primary,
                color: "#fff",
              }}
            >
              <Ic n="plus" s={14} color="#fff" />
              Publicar obra
            </button>

            <button
              onClick={logout}
              style={{
                display: "flex",
                alignItems: "center",
                padding: 8,
                borderRadius: 22,
                border: "1.5px solid #eee",
                background: "transparent",
                cursor: "pointer",
                color: "#888",
              }}
              title="Cerrar sesión"
            >
              <Ic n="logout" s={15} />
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "290px 1fr", gap: 18, alignItems: "start" }}>
          <aside style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 12 }}>
                PERFIL EMPRESA
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: COLORS.primary,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {(company?.name || session.email).slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{company?.name || "Empresa"}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{company?.role || "usuario"}</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10 }}>BUSCADOR</div>

              <div style={{ marginBottom: 12 }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar obra, ubicación o etiqueta"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #ddd",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #ddd",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#fff",
                  }}
                >
                  <option value="reciente">Más recientes</option>
                  <option value="cierre">Cierre más próximo</option>
                  <option value="ofertas">Más ofertadas</option>
                </select>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TAGS.slice(0, 18).map((t) => (
                  <Tag key={t} t={t} active={activeTags.includes(t)} onClick={() => toggleTag(t)} />
                ))}
              </div>
            </div>
          </aside>

          <section>
            <div
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888" }}>OBRAS PUBLICADAS</div>
                <div style={{ fontSize: 12, color: "#888" }}>{filtered.length} resultados</div>
              </div>

              {!dataLoaded ? (
                <div style={{ color: "#888", padding: "14px 0" }}>Cargando obras...</div>
              ) : filtered.length === 0 ? (
                <div style={{ color: "#888", padding: "14px 0" }}>No hay obras con esos filtros.</div>
              ) : (
                filtered.map((w) => {
                  const nItems = items.filter((x) => x.work_id === w.id).length;
                  const nOffers = offers.filter((x) => x.work_id === w.id).length;

                  return (
                    <div
                      key={w.id}
                      style={{
                        padding: "14px 16px",
                        border: "1px solid #eee",
                        borderRadius: 10,
                        marginBottom: 10,
                        cursor: "pointer",
                        background: "#fff",
                      }}
                      onClick={() => setDetailId(w.id)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{w.title}</div>
                          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                            {w.description || "Sin descripción"}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 14,
                              flexWrap: "wrap",
                              marginTop: 9,
                              fontSize: 12,
                              color: "#888",
                            }}
                          >
                            <span>{w.location || "Sin ubicación"}</span>
                            <span>Cierre: {fmtDate(w.deadline)}</span>
                            <span>{nItems} ítems</span>
                            <span>{nOffers} ofertas</span>
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                            {(w.tags || []).slice(0, 6).map((t) => (
                              <span
                                key={t}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: COLORS.soft,
                                  color: "#777",
                                  border: "1px solid #eee",
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ textAlign: "right", minWidth: 90 }}>
                          <div style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>ESTADO</div>
                          <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4, color: COLORS.primary }}>
                            {w.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>

      {showNew && (
        <NewWorkModal
          session={session}
          company={company}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            loadData();
            showToast("Obra publicada");
          }}
        />
      )}

      {detailWork && (
        <DetailPanel
          work={detailWork}
          items={detailItems}
          offers={detailOffers}
          session={session}
          company={company}
          onClose={() => setDetailId(null)}
          onReload={() => {
            loadData();
            showToast("Oferta guardada");
          }}
        />
      )}
    </div>
  );
}