/* CazaPromo · portada: filtros, búsqueda, ofertas en vivo */
(async () => {
  const $ = (id) => document.getElementById(id);
  const POR_PAGINA = 24;
  const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const reciente = (o, horas) => o.en_web && Date.now() - Date.parse(o.en_web) < horas * 3600e3;
  const activa = (o) => o.estado === "activa";

  const PESTANAS = [
    { id: "todas", nombre: "Nuevas", f: () => true },
    { id: "tendencia", nombre: "🔥 Tendencia", f: (o) => activa(o) && reciente(o, 72) && (o.gratis || o.descuento >= 40), caliente: true },
    { id: "minimos", nombre: "📉 Mínimos históricos", f: (o) => o.minimo_historico },
    { id: "gratis", nombre: "🎁 Gratis", f: (o) => o.gratis },
    { id: "cupones", nombre: "🎟️ Cupones", f: (o) => !!o.cupon },
    { id: "locales", nombre: "📍 Colombia", f: (o) => !o.aproximado },
    { id: "importados", nombre: "✈️ Internacionales", f: (o) => o.importado },
    { id: "guardadas", nombre: "❤️ Guardadas", f: (o) => CP.guardadas.tiene(o.id) },
  ];

  const params = new URLSearchParams(location.search);
  const estado = {
    ver: params.get("ver") || "todas",
    cat: params.get("cat") || "",
    tienda: params.get("tienda") || "",
    q: params.get("q") || "",
    orden: "recientes",
    pagina: 1,
  };
  const desde = Number(CP.leer("cp-visita")) || Date.now();  // lo publicado después de tu última visita sale como NUEVA
  CP.escribir("cp-visita", String(Date.now()));

  let d;
  let pendiente = null;
  try {
    d = await CP.datos();
  } catch (e) {
    $("estado").textContent = "No pudimos cargar las ofertas. Intenta de nuevo en un momento.";
    return;
  }
  $("buscar").value = estado.q;

  const guardarURL = () => {
    const p = new URLSearchParams();
    if (estado.ver !== "todas") p.set("ver", estado.ver);
    if (estado.cat) p.set("cat", estado.cat);
    if (estado.tienda) p.set("tienda", estado.tienda);
    if (estado.q) p.set("q", estado.q);
    history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
  };

  const pestana = () => PESTANAS.find((x) => x.id === estado.ver) || PESTANAS[0];

  const filtradas = (sinCategoria = false) => {
    const q = normalizar(estado.q.trim());
    return d.ofertas.filter(pestana().f)
      .filter((o) => sinCategoria || !estado.cat || o.grupo === estado.cat)
      .filter((o) => !estado.tienda || o.tienda_nombre === estado.tienda)
      .filter((o) => !q || normalizar(`${o.titulo} ${o.tienda_nombre} ${o.categoria || ""} ${o.grupo || ""} ${o.cupon || ""}`).includes(q));
  };

  const ordenar = (lista) => {
    const peso = (o) => (activa(o) ? 0 : 1);  // las expiradas al final
    const criterios = {
      recientes: (a, b) => peso(a) - peso(b) || Date.parse(b.en_web) - Date.parse(a.en_web),
      descuento: (a, b) => peso(a) - peso(b) || (b.gratis - a.gratis) || (b.descuento || 0) - (a.descuento || 0),
      ahorro: (a, b) => peso(a) - peso(b) || (b.ahorro || 0) - (a.ahorro || 0),
      precio: (a, b) => peso(a) - peso(b) || (a.precio ?? 1e15) - (b.precio ?? 1e15),
    };
    return [...lista].sort(criterios[estado.orden]);
  };

  const pintarPestanas = () => {
    $("pestanas").innerHTML = PESTANAS.map((x) => {
      const n = x.id === "todas" ? 0 : d.ofertas.filter(x.f).length;
      if (x.id !== "todas" && x.id !== "guardadas" && !n) return "";
      const extra = x.caliente && n ? `<span class="caliente">HOT</span>` : n ? `<span class="cuenta">${n}</span>` : "";
      return `<button class="pestana" type="button" data-ver="${x.id}" aria-pressed="${x.id === estado.ver}">${CP.esc(x.nombre)}${extra}</button>`;
    }).join("");
  };

  const pintarCategorias = () => {
    const cuenta = new Map();
    for (const o of filtradas(true)) cuenta.set(o.grupo || "Otros", (cuenta.get(o.grupo || "Otros") || 0) + 1);
    const grupos = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
    if (estado.cat && !cuenta.has(estado.cat)) grupos.unshift([estado.cat, 0]);
    const total = [...cuenta.values()].reduce((a, b) => a + b, 0);
    $("categorias").innerHTML = [`<button class="chip" type="button" data-cat="" aria-pressed="${!estado.cat}">Todas <small>${total}</small></button>`]
      .concat(grupos.map(([g, n]) => `<button class="chip" type="button" data-cat="${CP.esc(g)}" aria-pressed="${g === estado.cat}">${CP.esc(g)} <small>${n}</small></button>`))
      .join("");
  };

  const banner = () => {
    const r = CP.redes(d.sitio || {});
    if (!r.length) return "";
    return `<aside class="banner">
      <img src="assets/marca/mascota.webp" alt="" width="92" height="69" loading="lazy">
      <div><h3>Recibe las ofertas al instante</h3><p>Las bajadas de precio más fuertes duran poco. Te avisamos primero en el grupo.</p></div>
      <div class="botones">${r.slice(0, 2).map((x) => CP.botonRed(x)).join("")}</div>
    </aside>`;
  };

  const pintarOfertas = () => {
    const lista = ordenar(filtradas());
    const visibles = lista.slice(0, estado.pagina * POR_PAGINA);
    const html = visibles.map((o) => CP.tarjeta(o, desde));
    if (html.length > 8) html.splice(8, 0, banner());
    if (!lista.length) {
      const texto = estado.ver === "guardadas" ? "Aún no guardas ofertas. Toca el ❤️ de una oferta para verla aquí."
        : d.ofertas.length ? "No hay ofertas con ese filtro. Prueba con otra categoría o tienda." : "Estamos cazando las primeras ofertas. Vuelve en un rato.";
      html.push(`<div class="vacio"><img src="assets/marca/mascota.webp" alt="" width="150" height="112"><p>${CP.esc(texto)}</p></div>`);
    }
    $("ofertas").innerHTML = html.join("");
    $("mas").hidden = visibles.length >= lista.length;
    const filtro = [pestana().id !== "todas" && pestana().nombre, estado.cat, estado.tienda, estado.q && `“${estado.q}”`].filter(Boolean).join(" · ");
    $("estado").textContent = `${lista.length} oferta${lista.length === 1 ? "" : "s"}${filtro ? ` · ${filtro}` : ""}`;
    $("titulo-feed").textContent = estado.ver === "todas" && !estado.cat && !estado.tienda && !estado.q ? "Lo último en ofertas" : "Ofertas encontradas";
  };

  const pintarLateral = () => {
    const top = d.ofertas.filter((o) => activa(o) && !o.gratis && o.descuento)
      .sort((a, b) => b.descuento - a.descuento || (b.ahorro || 0) - (a.ahorro || 0)).slice(0, 5);
    $("caja-top").hidden = !top.length;
    $("top").innerHTML = top.map((o) => `<li><a href="${CP.ficha(o)}">
        ${o.imagen ? `<img class="mini-img" src="${CP.esc(CP.urlSegura(o.imagen))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">` : `<span class="mini-img"></span>`}
        <span><span class="t">${CP.esc(o.titulo)}</span><span class="p">${CP.cop(o.precio)}<span>-${o.descuento}%</span></span></span></a></li>`).join("");

    const cuenta = new Map();
    for (const o of d.ofertas) cuenta.set(o.tienda_nombre, (cuenta.get(o.tienda_nombre) || 0) + 1);
    const tiendas = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
    $("caja-tiendas").hidden = !tiendas.length;
    $("tiendas").innerHTML = tiendas.map(([t, n]) => `<button class="tienda-btn" type="button" data-tienda="${CP.esc(t)}" aria-pressed="${t === estado.tienda}">
        ${CP.logoTienda(t)}<span>${CP.esc(t)}</span><small>${n} oferta${n === 1 ? "" : "s"}</small></button>`).join("");

    const redes = CP.redes(d.sitio || {});
    $("caja-comunidad").hidden = !redes.length;
    $("comunidad").innerHTML = redes.map((r) => CP.botonRed(r)).join("");
  };

  const pintarCifras = () => {
    const activas = d.ofertas.filter(activa);
    const mayor = Math.max(0, ...activas.filter((o) => !o.gratis).map((o) => o.descuento || 0));
    const hoy = d.ofertas.filter((o) => reciente(o, 24)).length;
    const vivo = d.generado && Date.now() - Date.parse(d.generado) < 30 * 60e3;
    $("cifras").innerHTML = [
      `<span class="cifra"><span class="vivo-punto${vivo ? "" : " pausa"}"></span><span>${vivo ? "En vivo" : "Actualizado"} · <span id="hace">${CP.esc(CP.haceCuanto(d.generado))}</span></span></span>`,
      `<span class="cifra"><strong>${activas.length}</strong> ofertas activas</span>`,
      hoy ? `<span class="cifra"><strong>${hoy}</strong> nuevas hoy</span>` : "",
      mayor ? `<span class="cifra"><strong>-${mayor}%</strong> mayor descuento</span>` : "",
      `<span class="cifra"><strong>${(d.vigiladas || d.tiendas).length}</strong> tiendas vigiladas</span>`,
    ].join("");
  };

  const pintarTodo = () => {
    CP.registrar(d.ofertas);
    CP.marco(d);
    pintarPestanas();
    pintarCategorias();
    pintarOfertas();
    pintarLateral();
    pintarCifras();
    guardarURL();
  };

  const cambiar = (cambios) => {
    Object.assign(estado, cambios, { pagina: 1 });
    pintarTodo();
  };

  $("pestanas").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ver]");
    if (b) cambiar({ ver: b.dataset.ver, cat: "" });
  });
  $("categorias").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (b) cambiar({ cat: b.dataset.cat });
  });
  $("tiendas").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tienda]");
    if (!b) return;
    cambiar({ tienda: b.dataset.tienda === estado.tienda ? "" : b.dataset.tienda });
    $("titulo-feed").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  let espera;
  $("buscar").addEventListener("input", (e) => {
    clearTimeout(espera);
    espera = setTimeout(() => cambiar({ q: e.target.value }), 150);
  });
  $("orden").addEventListener("change", (e) => cambiar({ orden: e.target.value }));
  $("mas").addEventListener("click", () => { estado.pagina += 1; pintarOfertas(); });
  document.addEventListener("cp-guardadas", () => { pintarPestanas(); if (estado.ver === "guardadas") pintarOfertas(); });

  /* En vivo: la página pide los datos de nuevo cada pocos segundos, sin recargar */
  const aviso = $("aviso-nuevas");
  const aplicarPendiente = () => {
    if (!pendiente) return;
    d = pendiente;
    pendiente = null;
    aviso.hidden = true;
    estado.pagina = 1;
    pintarTodo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  aviso.addEventListener("click", aplicarPendiente);

  const refrescar = async () => {
    if (document.hidden) return;
    let nuevo;
    try { nuevo = await CP.datos(); } catch { return; }
    if (nuevo.generado === d.generado) return;
    const conocidas = new Set(d.ofertas.map((o) => o.id));
    const nuevas = nuevo.ofertas.filter((o) => !conocidas.has(o.id) && o.estado === "activa");
    if (nuevas.length && window.scrollY > 300) {
      pendiente = nuevo;  // no movemos la página mientras lees: te avisamos
      aviso.innerHTML = `${CP.icono("flecha")} ${nuevas.length} oferta${nuevas.length === 1 ? " nueva" : "s nuevas"}`;
      aviso.hidden = false;
    } else {
      d = nuevo;
      pintarTodo();
      if (nuevas.length) CP.notita(`${nuevas.length} oferta${nuevas.length === 1 ? " nueva" : "s nuevas"} 🔥`);
    }
  };
  const segundos = Math.max(10, Number(d.refresco_s) || 30);
  setInterval(refrescar, segundos * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refrescar(); });
  setInterval(() => {
    const el = $("hace");
    if (el) el.textContent = CP.haceCuanto((pendiente || d).generado);
  }, 1000);

  pintarTodo();
})();
