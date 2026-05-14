import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const COLORS = {
  bg: "#f5f1ea",
  panel: "#ffffff",
  panelSoft: "#fbf8f3",
  line: "#e7ded1",
  text: "#18170f",
  muted: "#7b7468",
  primary: "#e85d04",
  primarySoft: "#fff1e8",
  ok: "#1a6b3a",
  okSoft: "#e8f4ec",
  info: "#1a4d7a",
  infoSoft: "#e9f1f8",
  danger: "#c0392b",
  dangerSoft: "#fdecea",
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

function slugify(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function Icon({ name, size = 16, color = "currentColor" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    plus: (
      <svg {...common}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    x: (
      <svg {...common}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    back: (
      <svg {...common}>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    ),
    building: (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
      </svg>
    ),
    euro: (
      <svg {...common}>
        <path d="M4 10h12" />
        <path d="M4 14h12" />
        <path d="M19.5 9.5a7 7 0 1 0 0 5" />
      </svg>
    ),
    clock: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </svg>
    ),
    user: (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.8-3.5 5-5 8-5s6.2 1.5 8 5" />
      </svg>
    ),
    logout: (
      <svg {...common}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    file: (
      <svg {...common}>
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function Toast({ message }) {
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        background: COLORS.text,
        color: "#fff",
        padding: "10px 18px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        zIndex: 9999,
        boxShadow: "0 12px 32px rgba(0,0,0,.18)",
      }}
    >
      {message}
    </div>
  );
}

function Tag({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${active ? COLORS.primary : COLORS.line}`,
        background: active ? COLORS.primarySoft : COLORS.panel,
        color: active ? COLORS.primary : COLORS.muted,
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 16,
        boxShadow: "0 6px 24px rgba(24,23,15,.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.muted, letterSpacing: ".06em" }}>
        {children}
      </div>
      {right}
    </div>
  );
}

function AuthScreen({ onReady }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("constructora");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const { data: company } = await supabase
          .from("companies")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        onReady(data.session, company);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          const { error: cErr } = await supabase.from("companies").upsert({
            id: data.user.id,
            name: companyName,
            role: companyType,
          });
          if (cErr) throw cErr;
        }

        setMsg("Cuenta creada. Inicia sesión.");
        setIsLogin(true);
      }
    } catch (err) {
      setMsg(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  const input = {
    width: "100%",
    padding: "12px 14px",
    border: `1.5px solid ${COLORS.line}`,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 460, padding: 34 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: "0 auto 12px",
              borderRadius: 12,
              background: COLORS.text,
              color: COLORS.primary,
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            O
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text }}>ObraLicit</div>
          <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 5 }}>
            Contratación estructurada de obra
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div style={{ marginBottom: 12 }}>
                <input
                  style={input}
                  placeholder="Nombre de empresa"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <select
                  style={input}
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                >
                  <option value="constructora">Constructora</option>
                  <option value="subcontrata">Subcontrata</option>
                  <option value="proveedor">Proveedor</option>
                  <option value="alquiler_maquinaria">Alquiler maquinaria</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginBottom: 12 }}>
            <input
              style={input}
              type="email"
              placeholder="email@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <input
              style={input}
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {msg && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 12px",
                borderRadius: 10,
                background: "#f7f0e8",
                color: COLORS.muted,
                fontSize: 13,
              }}
            >
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 10,
              border: "none",
              background: COLORS.primary,
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? "Cargando..." : isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          style={{
            marginTop: 14,
            background: "transparent",
            border: "none",
            color: COLORS.primary,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
          }}
        >
          {isLogin ? "No tienes cuenta? Regístrate" : "Ya tienes cuenta? Inicia sesión"}
        </button>
      </Card>
    </div>
  );
}

function NewWorkModal({ company, session, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [needStart, setNeedStart] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [tags, setTags] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    item_type: "ejecucion",
    title: "",
    unit: "ud",
    quantity: "",
    price_reference: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  function toggleTag(tag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function addItem() {
    if (!form.title || !form.quantity) return;
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        ...form,
        quantity: Number(form.quantity || 0),
        price_reference: Number(form.price_reference || 0),
      },
    ]);
    setForm({
      item_type: "ejecucion",
      title: "",
      unit: "ud",
      quantity: "",
      price_reference: "",
      description: "",
    });
  }

  async function handlePublish() {
    if (!title.trim()) return;
    setLoading(true);

    try {
      const payload = {
        slug: `${slugify(title)}-${uid()}`,
        owner_user_id: session.user.id,
        company_id: company?.id || session.user.id,
        title: title.trim(),
        description,
        location,
        visibility,
        status: "open",
        deadline: deadline || null,
        need_start: needStart || null,
        tags,
        contact_name: company?.name || "",
        contact_email: session.user.email || "",
      };

      const { data: work, error } = await supabase
        .from("works")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      if (items.length) {
        const rows = items.map((it) => ({
          work_id: work.id,
          item_type: it.item_type,
          title: it.title,
          description: it.description || null,
          unit: it.unit || null,
          quantity: Number(it.quantity || 0),
          price_reference: Number(it.price_reference || 0),
          status: "open",
          tags,
        }));

        const { error: itemErr } = await supabase.from("items").insert(rows);
        if (itemErr) throw itemErr;
      }

      onCreated();
      onClose();
    } catch (err) {
      alert(err.message || "Error al publicar obra");
    } finally {
      setLoading(false);
    }
  }

  const input = {
    width: "100%",
    padding: "11px 12px",
    border: `1.5px solid ${COLORS.line}`,
    borderRadius: 10,
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
        background: "rgba(0,0,0,.42)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        zIndex: 1000,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 840, maxHeight: "92vh", overflow: "auto" }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>Nueva obra</div>
            <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>
              Publica la obra y añade partidas o suministros
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <SectionTitle>DATOS GENERALES</SectionTitle>

          <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
            <input style={input} placeholder="Nombre de la obra" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea
              style={{ ...input, minHeight: 80, resize: "vertical" }}
              placeholder="Descripción y alcance"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <input style={input} placeholder="Ubicación" value={location} onChange={(e) => setLocation(e.target.value)} />
              <input style={input} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              <input style={input} type="date" value={needStart} onChange={(e) => setNeedStart(e.target.value)} />
            </div>
            <select style={input} value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="public">Pública</option>
              <option value="private">Privada</option>
            </select>
          </div>

          <SectionTitle>ETIQUETAS</SectionTitle>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {TAGS.map((tag) => (
              <Tag key={tag} active={tags.includes(tag)} onClick={() => toggleTag(tag)}>
                {tag}
              </Tag>
            ))}
          </div>

          <SectionTitle>ÍTEMS DE LICITACIÓN</SectionTitle>

          <div
            style={{
              border: `1px dashed ${COLORS.line}`,
              borderRadius: 14,
              padding: 16,
              background: COLORS.panelSoft,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.7fr .8fr .8fr .9fr", gap: 10, marginBottom: 10 }}>
              <select
                style={input}
                value={form.item_type}
                onChange={(e) => setForm((p) => ({ ...p, item_type: e.target.value }))}
              >
                <option value="ejecucion">Ejecución</option>
                <option value="material">Material</option>
                <option value="maquinaria">Maquinaria</option>
              </select>
              <input
                style={input}
                placeholder="Título de la partida o suministro"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
              <input
                style={input}
                placeholder="Unidad"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
              />
              <input
                style={input}
                type="number"
                placeholder="Cantidad"
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              />
              <input
                style={input}
                type="number"
                placeholder="Precio ref."
                value={form.price_reference}
                onChange={(e) => setForm((p) => ({ ...p, price_reference: e.target.value }))}
              />
            </div>

            <textarea
              style={{ ...input, minHeight: 72, resize: "vertical", marginBottom: 10 }}
              placeholder="Descripción opcional"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />

            <button
              onClick={addItem}
              type="button"
              style={{
                background: COLORS.text,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Añadir ítem
            </button>
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
            {items.map((item, i) => (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.muted }}>
                    {item.item_type.toUpperCase()} · #{i + 1}
                  </div>
                  <div style={{ fontWeight: 800, color: COLORS.text, marginTop: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>
                    {item.quantity} {item.unit} · Precio ref. {fmtCurrency(item.price_reference)}
                  </div>
                </div>
                <button
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: COLORS.danger,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: `1px solid ${COLORS.line}`,
                borderRadius: 10,
                padding: "11px 16px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handlePublish}
              disabled={loading}
              style={{
                background: COLORS.primary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "11px 18px",
                cursor: "pointer",
                fontWeight: 800,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Publicando..." : "Publicar obra"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function OfferForm({ item, company, session, onDone, myOffer }) {
  const [price, setPrice] = useState(myOffer?.price || "");
  const [termDays, setTermDays] = useState(myOffer?.term_days || "");
  const [availability, setAvailability] = useState(myOffer?.availability || "");
  const [conditions, setConditions] = useState(myOffer?.conditions || "");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        work_id: item.work_id,
        item_id: item.id,
        company_id: company?.id || session.user.id,
        user_id: session.user.id,
        company_name: company?.name || session.user.email,
        company_type: company?.role || "subcontrata",
        price: Number(price || 0),
        price_total: Number(price || 0) * Number(item.quantity || 1),
        availability,
        term_days: Number(termDays || 0),
        conditions,
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
    } catch (err) {
      alert(err.message || "Error al enviar oferta");
    } finally {
      setLoading(false);
    }
  }

  const input = {
    width: "100%",
    padding: "10px 12px",
    border: `1.5px solid ${COLORS.line}`,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.line}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <input
          style={input}
          type="number"
          placeholder="Precio unitario"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <input
          style={input}
          type="number"
          placeholder="Plazo en días"
          value={termDays}
          onChange={(e) => setTermDays(e.target.value)}
        />
      </div>
      <input
        style={{ ...input, marginBottom: 10 }}
        placeholder="Disponibilidad"
        value={availability}
        onChange={(e) => setAvailability(e.target.value)}
      />
      <textarea
        style={{ ...input, minHeight: 72, resize: "vertical", marginBottom: 10 }}
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
          borderRadius: 10,
          padding: "10px 16px",
          fontWeight: 800,
          cursor: "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Guardando..." : myOffer ? "Actualizar oferta" : "Enviar oferta"}
      </button>
    </form>
  );
}

function WorkDetail({ work, items, offers, session, company, onClose, onRefresh }) {
  const [openItem, setOpenItem] = useState(null);

  const isOwner =
    session?.user?.id &&
    (work.owner_user_id === session.user.id || work.company_id === company?.id);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        zIndex: 999,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 1040, maxHeight: "92vh", overflow: "auto" }}>
        <div style={{ background: COLORS.text, color: "#fff", padding: 24 }}>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,.7)",
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            <Icon name="back" size={14} color="rgba(255,255,255,.7)" />
            Volver
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 700, marginBottom: 6 }}>
                {work.visibility === "private" ? "LICITACIÓN PRIVADA" : "LICITACIÓN PÚBLICA"}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>{work.title}</div>
              <div style={{ marginTop: 8, color: "rgba(255,255,255,.7)", fontSize: 14, maxWidth: 780 }}>
                {work.description || "Sin descripción"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {(work.tags || []).map((t) => (
                  <span
                    key={t}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,.1)",
                      color: "rgba(255,255,255,.8)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ minWidth: 220 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 700 }}>UBICACIÓN</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{work.location || "—"}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", fontWeight: 700, marginTop: 14 }}>CIERRE</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{fmtDate(work.deadline)}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <SectionTitle>ÍTEMS</SectionTitle>

          <div style={{ display: "grid", gap: 12 }}>
            {items.map((item) => {
              const itemOffers = offers
                .filter((o) => o.item_id === item.id)
                .sort((a, b) => Number(a.price || 0) - Number(b.price || 0));

              const myOffer = itemOffers.find((o) => o.user_id === session?.user?.id);
              const bestOffer = itemOffers[0];

              return (
                <Card key={item.id} style={{ overflow: "hidden" }}>
                  <div
                    style={{
                      padding: "14px 16px",
                      background: COLORS.panelSoft,
                      borderBottom: `1px solid ${COLORS.line}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 800, marginBottom: 4 }}>
                        {item.item_type.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.text }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 5 }}>
                        {item.quantity || 0} {item.unit || "ud"} · Ref. {fmtCurrency(item.price_reference)}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6 }}>{item.description}</div>
                      )}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 800 }}>OFERTAS</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, marginTop: 3 }}>
                        {itemOffers.length}
                      </div>
                      {isOwner && bestOffer && (
                        <div style={{ fontSize: 12, color: COLORS.ok, fontWeight: 700, marginTop: 4 }}>
                          Mejor: {fmtCurrency(bestOffer.price)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: 16 }}>
                    {!isOwner && (
                      <button
                        onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
                        style={{
                          background: myOffer ? COLORS.infoSoft : COLORS.primarySoft,
                          color: myOffer ? COLORS.info : COLORS.primary,
                          border: `1px solid ${myOffer ? "#c9dbeb" : "#ffd8bf"}`,
                          borderRadius: 10,
                          padding: "10px 14px",
                          fontWeight: 800,
                          cursor: "pointer",
                          marginBottom: 12,
                        }}
                      >
                        {myOffer ? "Editar mi oferta" : "Enviar oferta"}
                      </button>
                    )}

                    {!isOwner && openItem === item.id && (
                      <OfferForm
                        item={item}
                        company={company}
                        session={session}
                        myOffer={myOffer}
                        onDone={onRefresh}
                      />
                    )}

                    {itemOffers.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.muted, marginBottom: 8 }}>
                          {isOwner ? "OFERTAS RECIBIDAS" : "TU OFERTA"}
                        </div>

                        <div style={{ display: "grid", gap: 8 }}>
                          {(isOwner ? itemOffers : itemOffers.filter((o) => o.user_id === session?.user?.id)).map((offer, idx) => (
                            <div
                              key={offer.id}
                              style={{
                                border: `1px solid ${COLORS.line}`,
                                borderRadius: 12,
                                padding: "12px 14px",
                                background:
                                  offer.user_id === session?.user?.id ? "#fff9f5" : "#fff",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>
                                    {isOwner ? offer.company_name || "Empresa" : "Tu oferta"}
                                    {isOwner && idx === 0 && (
                                      <span
                                        style={{
                                          marginLeft: 8,
                                          background: COLORS.okSoft,
                                          color: COLORS.ok,
                                          fontSize: 10,
                                          padding: "3px 7px",
                                          borderRadius: 999,
                                          fontWeight: 800,
                                        }}
                                      >
                                        MEJOR
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
                                    Plazo: {offer.term_days || 0} días · Disponibilidad: {offer.availability || "—"}
                                  </div>
                                  {offer.conditions && (
                                    <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 7 }}>
                                      {offer.conditions}
                                    </div>
                                  )}
                                </div>

                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 800 }}>
                                    PRECIO
                                  </div>
                                  <div style={{ fontSize: 20, fontWeight: 800, color: isOwner && idx === 0 ? COLORS.ok : COLORS.text }}>
                                    {fmtCurrency(offer.price)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Card>
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
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [showNew, setShowNew] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  }, []);

  async function loadAll() {
    setLoadingData(true);
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
      setLoadingData(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      setSession(s || null);

      if (s?.user) {
        const { data: co } = await supabase.from("companies").select("*").eq("id", s.user.id).maybeSingle();
        setCompany(co || null);
      }

      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s || null);

      if (s?.user) {
        const { data: co } = await supabase.from("companies").select("*").eq("id", s.user.id).maybeSingle();
        setCompany(co || null);
      } else {
        setCompany(null);
      }

      setAuthReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadAll();

    const ch = supabase
      .channel("obralicit-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "works" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, loadAll)
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const filteredWorks = useMemo(() => {
    const q = search.toLowerCase().trim();

    let result = works.filter((w) => {
      const textMatch =
        !q ||
        w.title?.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        w.location?.toLowerCase().includes(q) ||
        (w.tags || []).some((t) => t.toLowerCase().includes(q));

      const tagMatch =
        !activeTags.length || activeTags.every((tag) => (w.tags || []).includes(tag));

      return textMatch && tagMatch;
    });

    if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    if (sortBy === "deadline") {
      result.sort((a, b) => new Date(a.deadline || "9999-12-31") - new Date(b.deadline || "9999-12-31"));
    }
    if (sortBy === "offers") {
      result.sort(
        (a, b) =>
          offers.filter((x) => x.work_id === b.id).length - offers.filter((x) => x.work_id === a.id).length
      );
    }

    return result;
  }, [works, search, activeTags, sortBy, offers]);

  const detailWork = works.find((w) => w.id === detailId);
  const detailItems = items.filter((i) => i.work_id === detailId);
  const detailOffers = offers.filter((o) => o.work_id === detailId);

  const myWorks = works.filter((w) => w.owner_user_id === session?.user?.id);
  const myOffers = offers.filter((o) => o.user_id === session?.user?.id);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setCompany(null);
    showToast("Sesión cerrada");
  }

  function toggleTag(tag) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: COLORS.bg }}>
        <div style={{ color: COLORS.muted, fontWeight: 700 }}>Conectando...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onReady={(s, c) => { setSession(s); setCompany(c); }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text }}>
      {toast && <Toast message={toast} />}

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(245,241,234,.94)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${COLORS.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: COLORS.text,
                color: COLORS.primary,
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
              }}
            >
              O
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>ObraLicit</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>
                {company?.name || session.user.email}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowNew(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: COLORS.primary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              <Icon name="plus" size={16} color="#fff" />
              Nueva obra
            </button>

            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#fff",
                color: COLORS.text,
                border: `1px solid ${COLORS.line}`,
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              <Icon name="logout" size={16} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px,300px) 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <Card style={{ padding: 16 }}>
              <SectionTitle>PERFIL</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: COLORS.primary,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                  }}
                >
                  {(company?.name || session.user.email || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>{company?.name || "Mi empresa"}</div>
                  <div style={{ fontSize: 13, color: COLORS.muted }}>{company?.role || "usuario"}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
                <div style={{ padding: 12, borderRadius: 12, background: COLORS.panelSoft, border: `1px solid ${COLORS.line}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.muted }}>MIS OBRAS</div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{myWorks.length}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 12, background: COLORS.panelSoft, border: `1px solid ${COLORS.line}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.muted }}>MIS OFERTAS</div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{myOffers.length}</div>
                </div>
              </div>
            </Card>

            <Card style={{ padding: 16 }}>
              <SectionTitle>FILTROS</SectionTitle>

              <div style={{ position: "relative", marginBottom: 12 }}>
                <Icon name="search" size={15} color={COLORS.muted} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar obras, ubicación, etiquetas..."
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: "11px 12px",
                    borderRadius: 10,
                    border: `1.5px solid ${COLORS.line}`,
                    outline: "none",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: `1.5px solid ${COLORS.line}`,
                  outline: "none",
                  fontSize: 14,
                  boxSizing: "border-box",
                  marginBottom: 14,
                  background: "#fff",
                }}
              >
                <option value="recent">Más recientes</option>
                <option value="deadline">Cierre más próximo</option>
                <option value="offers">Más ofertadas</option>
              </select>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TAGS.slice(0, 18).map((tag) => (
                  <Tag key={tag} active={activeTags.includes(tag)} onClick={() => toggleTag(tag)}>
                    {tag}
                  </Tag>
                ))}
              </div>
            </Card>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <Card style={{ padding: 18 }}>
              <SectionTitle
                right={
                  <div style={{ fontSize: 13, color: COLORS.muted }}>
                    {filteredWorks.length} obras visibles
                  </div>
                }
              >
                MERCADO DE OBRAS
              </SectionTitle>

              {loadingData ? (
                <div style={{ color: COLORS.muted, padding: "10px 0" }}>Cargando datos...</div>
              ) : filteredWorks.length === 0 ? (
                <div style={{ color: COLORS.muted, padding: "10px 0" }}>No hay obras con esos filtros.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {filteredWorks.map((work) => {
                    const workItems = items.filter((i) => i.work_id === work.id);
                    const workOffers = offers.filter((o) => o.work_id === work.id);

                    return (
                      <div
                        key={work.id}
                        onClick={() => setDetailId(work.id)}
                        style={{
                          border: `1px solid ${COLORS.line}`,
                          borderRadius: 14,
                          padding: 16,
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 5 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: "4px 8px",
                                  borderRadius: 999,
                                  background: work.visibility === "private" ? COLORS.infoSoft : COLORS.okSoft,
                                  color: work.visibility === "private" ? COLORS.info : COLORS.ok,
                                }}
                              >
                                {work.visibility === "private" ? "PRIVADA" : "PÚBLICA"}
                              </span>
                              <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700 }}>
                                {fmtDate(work.deadline)}
                              </span>
                            </div>

                            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{work.title}</div>
                            <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6, lineHeight: 1.55 }}>
                              {work.description || "Sin descripción"}
                            </div>

                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontSize: 13, color: COLORS.muted }}>
                              <span>{work.location || "Sin ubicación"}</span>
                              <span>{workItems.length} ítems</span>
                              <span>{workOffers.length} ofertas</span>
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                              {(work.tags || []).slice(0, 6).map((tag) => (
                                <span
                                  key={tag}
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: 999,
                                    background: COLORS.panelSoft,
                                    color: COLORS.muted,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    border: `1px solid ${COLORS.line}`,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ minWidth: 120, textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 800 }}>ESTADO</div>
                            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4, color: COLORS.primary }}>
                              {work.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {showNew && (
        <NewWorkModal
          company={company}
          session={session}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            loadAll();
            showToast("Obra publicada");
          }}
        />
      )}

      {detailWork && (
        <WorkDetail
          work={detailWork}
          items={detailItems}
          offers={detailOffers}
          company={company}
          session={session}
          onClose={() => setDetailId(null)}
          onRefresh={() => {
            loadAll();
            showToast("Oferta guardada");
          }}
        />
      )}
    </div>
  );
}