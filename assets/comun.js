/* CazaPromo · utilidades compartidas por todas las páginas */
const CP = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const urlSegura = (u) => {
    try {
      const x = new URL(u, location.href);
      return x.protocol === "http:" || x.protocol === "https:" ? x.href : "#";
    } catch {
      return "#";
    }
  };

  const cop = (v) => "$" + Math.round(v).toLocaleString("es-CO");
  const copCorto = (v) => {
    if (v >= 1e6) return "$" + (v / 1e6).toLocaleString("es-CO", { maximumFractionDigits: 1 }) + " M";
    if (v >= 1e3) return "$" + Math.round(v / 1e3).toLocaleString("es-CO") + " mil";
    return cop(v);
  };

  const haceCuanto = (iso) => {
    if (!iso) return "";
    const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
    if (s < 60) return `hace ${Math.max(1, Math.round(s))} s`;
    if (s < 3600) return `hace ${Math.round(s / 60)} min`;
    if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
    const d = Math.round(s / 86400);
    return d === 1 ? "ayer" : `hace ${d} días`;
  };
  const fecha = (iso) => new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  const fechaHora = (iso) => new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  /* Íconos (trazos estilo Lucide, dibujados aquí para no depender de nadie) */
  const RUTAS = {
    buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    corazon: '<path d="M12 20.5s-7.5-4.6-9.4-9.1C1.2 8 3.3 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.6 0 5.7 3.5 4.3 6.9-1.9 4.5-9.4 9.1-9.4 9.1z"/>',
    compartir: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    grafica: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    luna: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    externo: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
    campana: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    carrito: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
    whatsapp: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>',
    telegram: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4zM17.5 6.5h.01"/>',
    flecha: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  };
  const icono = (n, clase = "") => `<svg class="icono ${clase}" viewBox="0 0 24 24" aria-hidden="true">${RUTAS[n] || ""}</svg>`;

  /* Color de cada tienda (las conocidas con su color; las demás, uno estable según el nombre) */
  const COLORES = {
    amazon: "#ff9900", "mercado libre": "#ffd100", aliexpress: "#e62e04", "éxito": "#ffd400", falabella: "#3b9c35",
    alkosto: "#e30613", ktronix: "#0055a5", steam: "#1b2838", gog: "#86328a", epic: "#2a2a2a", humble: "#cc2929",
    tennis: "#111111", "studio f": "#1f1f1f", "arturo calle": "#0b2341", temu: "#fb7701", shein: "#222222",
  };
  const OSCURO_EN_CLARO = new Set(["mercado libre", "éxito"]);
  const colorTienda = (nombre) => {
    const k = String(nombre || "").toLowerCase();
    if (COLORES[k]) return COLORES[k];
    let h = 0;
    for (const c of k) h = (h * 31 + c.charCodeAt(0)) % 360;
    return `hsl(${h} 62% 42%)`;
  };
  const logoTienda = (nombre) => {
    const k = String(nombre || "").toLowerCase();
    const letra = esc((nombre || "?").trim().charAt(0).toUpperCase());
    return `<span class="tienda-logo" style="background:${colorTienda(nombre)};${OSCURO_EN_CLARO.has(k) ? "color:#111" : ""}">${letra}</span>`;
  };

  /* Datos: el JSON se vuelve a pedir sin caché para ver las ofertas nuevas sin recargar */
  const datos = async () => {
    const r = await fetch(`datos/ofertas.json?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) throw new Error("No se pudieron cargar las ofertas");
    return r.json();
  };

  const rel = (o) => (o.afiliado ? "sponsored noopener" : "noopener");
  const ficha = (o) => `producto.html?id=${encodeURIComponent(o.id)}`;

  const precioHTML = (o) => {
    if (o.oculta_precio) return `<p class="precio"><span class="ver-precio">Mira el precio en ${esc(o.tienda_nombre)}</span></p>`;
    if (o.gratis) return `<p class="precio"><span class="gratis-txt">¡GRATIS!</span>${o.antes ? `<s>${cop(o.antes)}</s>` : ""}</p>`;
    const original = o.precio_tienda ? `<span class="tienda-precio">${esc(o.precio_tienda)} en la tienda · pesos con la TRM</span>` : "";
    return `<p class="precio">${o.aproximado ? "≈ " : ""}${cop(o.precio)}${o.antes ? `<s>${cop(o.antes)}</s>` : ""}${original}</p>`;
  };

  const esNueva = (o, desde) => desde && o.en_web && Date.parse(o.en_web) > desde;

  const insignias = (o, desde) => {
    const xs = [];
    if (o.estado === "expirada") xs.push(`<span class="insignia expirada">Expirada</span>`);
    else if (esNueva(o, desde)) xs.push(`<span class="insignia nueva">NUEVA</span>`);
    if (o.gratis) xs.push(`<span class="insignia gratis">GRATIS</span>`);
    else if (o.descuento) xs.push(`<span class="insignia">-${o.descuento}%</span>`);
    if (o.minimo_historico) xs.push(`<span class="insignia minimo">Mínimo histórico</span>`);
    return `<div class="insignias">${xs.join("")}</div>`;
  };

  const imagen = (o, clase = "") => o.imagen
    ? `<img class="${clase}" src="${esc(urlSegura(o.imagen))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">`
    : `<div class="sin-foto">${esc(o.titulo)}</div>`;

  /* Mini gráfica de la tarjeta: precio más bajo de cada día */
  const tendencia = (o) => {
    const v = o.mini || [];
    if (v.length < 2 || o.sin_historial) return "";
    const lo = Math.min(...v), hi = Math.max(...v), W = 72, H = 22, p = 3;
    const x = (i) => p + (i / (v.length - 1)) * (W - 2 * p);
    const y = (n) => (hi === lo ? H / 2 : p + ((hi - n) / (hi - lo)) * (H - 2 * p));
    const d = v.map((n, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(n).toFixed(1)}`).join(" ");
    const texto = o.precio <= lo ? "el más bajo que hemos visto" : `mín. ${copCorto(lo)}`;
    return `<div class="tendencia" title="Precio de los últimos ${v.length} días"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${d}"/><circle cx="${x(v.length - 1)}" cy="${y(v[v.length - 1])}" r="2.6"/></svg><span>${esc(texto)}</span></div>`;
  };

  const datosExtra = (o) => {
    const xs = [];
    if (o.ahorro) xs.push(`<span class="dato ahorro">Ahorras ${copCorto(o.ahorro)}</span>`);
    if (o.envio_gratis) xs.push(`<span class="dato">🚚 Envío gratis</span>`);
    if (o.importado) xs.push(`<span class="dato">✈️ Internacional</span>`);
    if (o.digital) xs.push(`<span class="dato">🎮 Digital</span>`);
    return xs.length ? `<div class="datos">${xs.join("")}</div>` : "";
  };

  const cupon = (o) => o.cupon
    ? `<p class="cupon"><span>Cupón <code>${esc(o.cupon)}</code></span><button class="copiar" type="button" data-copiar="${esc(o.cupon)}">Copiar</button></p>` : "";

  const tarjeta = (o, desde) => `
    <article class="tarjeta${o.estado === "expirada" ? " expirada" : ""}">
      <a class="tarjeta-img" href="${ficha(o)}" aria-label="${esc(o.titulo)}">${imagen(o)}${insignias(o, desde)}</a>
      <button class="guardar" type="button" data-guardar="${esc(o.id)}" aria-pressed="${guardadas.tiene(o.id)}" aria-label="Guardar oferta">${icono("corazon")}</button>
      <div class="tarjeta-cuerpo">
        <div class="fila-tienda"><span class="tienda-chip">${logoTienda(o.tienda_nombre)}<span>${esc(o.tienda_nombre)}</span></span><span>${esc(haceCuanto(o.en_web))}</span></div>
        <h3 class="titulo"><a href="${ficha(o)}">${esc(o.titulo)}</a></h3>
        ${precioHTML(o)}
        ${datosExtra(o)}
        ${tendencia(o)}
        ${cupon(o)}
        <div class="acciones">
          <a class="boton boton-marca" href="${esc(urlSegura(o.url))}" target="_blank" rel="${rel(o)}">Ver oferta ${icono("externo")}</a>
          <button class="boton boton-sec boton-icono" type="button" data-compartir="${esc(o.id)}" aria-label="Compartir">${icono("compartir")}</button>
        </div>
        <p class="verificado">Precio revisado ${esc(haceCuanto(o.verificado || o.en_web))}</p>
      </div>
    </article>`;

  /* Ofertas guardadas en este navegador */
  const guardadas = (() => {
    let ids = new Set();
    try { ids = new Set(JSON.parse(localStorage.getItem("cp-guardadas") || "[]")); } catch { /* sin almacenamiento */ }
    const guardar = () => { try { localStorage.setItem("cp-guardadas", JSON.stringify([...ids])); } catch { /* sin almacenamiento */ } };
    return {
      tiene: (id) => ids.has(id),
      todas: () => ids,
      alternar: (id) => { ids.has(id) ? ids.delete(id) : ids.add(id); guardar(); return ids.has(id); },
    };
  })();

  const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

  let notitaTimer;
  const notita = (texto) => {
    let el = document.querySelector(".notita");
    if (!el) { el = document.createElement("div"); el.className = "notita"; el.setAttribute("role", "status"); document.body.append(el); }
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(notitaTimer);
    notitaTimer = setTimeout(() => { el.hidden = true; }, 2200);
  };

  const compartir = async (o) => {
    const url = new URL(ficha(o), location.href).href;
    const texto = `${o.titulo} · ${o.oculta_precio ? "oferta" : o.gratis ? "¡GRATIS!" : cop(o.precio)} en ${o.tienda_nombre}`;
    if (navigator.share) {
      try { await navigator.share({ title: o.titulo, text: texto, url }); return; } catch { return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${texto}\n${url}`)}`, "_blank", "noopener");
  };

  const copiar = async (texto) => {
    try { await navigator.clipboard.writeText(texto); notita(`Cupón ${texto} copiado`); } catch { notita(`Cupón: ${texto}`); }
  };

  /* Tema claro (por defecto, fondo blanco) / oscuro (el morado de la marca) */
  const tema = {
    actual: () => document.documentElement.dataset.tema === "oscuro" ? "oscuro" : "claro",
    pintarBoton: () => {
      const b = document.getElementById("tema");
      if (!b) return;
      const claro = tema.actual() === "claro";
      b.innerHTML = icono(claro ? "luna" : "sol");
      b.setAttribute("aria-label", claro ? "Usar tema oscuro" : "Usar tema claro");
    },
    alternar: () => {
      const nuevo = tema.actual() === "claro" ? "oscuro" : "claro";
      if (nuevo === "oscuro") document.documentElement.dataset.tema = "oscuro"; else delete document.documentElement.dataset.tema;
      escribir("cp-tema", nuevo);
      tema.pintarBoton();
    },
  };

  /* Enlaces a la comunidad (los que estén configurados) */
  const redes = (s) => [
    s.url_whatsapp && { clase: "boton-wa", icono: "whatsapp", texto: "Grupo de WhatsApp", url: s.url_whatsapp },
    s.url_canal_whatsapp && { clase: "boton-wa", icono: "whatsapp", texto: "Canal de WhatsApp", url: s.url_canal_whatsapp },
    s.url_telegram && { clase: "boton-tg", icono: "telegram", texto: "Canal de Telegram", url: s.url_telegram },
    s.url_facebook && { clase: "boton-fb", icono: "facebook", texto: "Facebook", url: s.url_facebook },
    s.url_instagram && { clase: "boton-ig", icono: "instagram", texto: "Instagram", url: s.url_instagram },
  ].filter(Boolean);
  const botonRed = (r, chico = false) => `<a class="boton ${r.clase}${chico ? " boton-chico" : ""}" href="${esc(urlSegura(r.url))}" target="_blank" rel="noopener">${icono(r.icono)}${esc(r.texto)}</a>`;

  /* Encabezado y pie comunes */
  const marco = (d) => {
    const s = d.sitio || {};
    const unirse = document.getElementById("unirse");
    const principal = redes(s)[0];
    if (unirse && principal) {
      unirse.href = urlSegura(principal.url);
      unirse.className = `boton ${principal.clase} boton-chico`;
      unirse.innerHTML = `${icono(principal.icono)}<span>Únete</span>`;
      unirse.hidden = false;
    }
    const pieRedes = document.getElementById("pie-redes");
    if (pieRedes) {
      pieRedes.innerHTML = redes(s).filter((r) => r.texto !== "Canal de WhatsApp")
        .map((r) => `<a href="${esc(urlSegura(r.url))}" target="_blank" rel="noopener" aria-label="${esc(r.texto)}">${icono(r.icono)}</a>`).join("");
    }
    const el = document.getElementById("pie-datos");
    if (el && d.generado) el.textContent = `Precios revisados ${haceCuanto(d.generado)} · dólar a ${cop(d.trm)} (TRM del día).`;
  };

  /* Acciones con un solo manejador para todo el documento */
  let porId = new Map();
  const registrar = (ofertas) => { porId = new Map(ofertas.map((o) => [o.id, o])); };
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-guardar]");
    if (g) {
      const si = guardadas.alternar(g.dataset.guardar);
      document.querySelectorAll(`[data-guardar="${CSS.escape(g.dataset.guardar)}"]`).forEach((b) => b.setAttribute("aria-pressed", si));
      notita(si ? "Guardada en ❤️ Guardadas" : "Quitada de Guardadas");
      document.dispatchEvent(new CustomEvent("cp-guardadas"));
      return;
    }
    const c = e.target.closest("[data-compartir]");
    if (c && porId.has(c.dataset.compartir)) return compartir(porId.get(c.dataset.compartir));
    const k = e.target.closest("[data-copiar]");
    if (k) return copiar(k.dataset.copiar);
    if (e.target.closest("#tema")) tema.alternar();
  });
  document.addEventListener("DOMContentLoaded", tema.pintarBoton);

  return {
    esc, urlSegura, cop, copCorto, haceCuanto, fecha, fechaHora, icono, logoTienda, datos, rel, ficha, precioHTML,
    insignias, imagen, tendencia, datosExtra, cupon, tarjeta, guardadas, leer, escribir, notita, redes, botonRed, marco, registrar,
  };
})();
