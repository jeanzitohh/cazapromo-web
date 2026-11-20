/* CazaPromo · ficha de producto con historial de precio */
(async () => {
  const $ = (id) => document.getElementById(id);
  const id = new URLSearchParams(location.search).get("id");
  const contenedor = $("producto");
  const fallo = (msg) => {
    contenedor.innerHTML = `<div class="vacio"><img src="assets/marca/mascota.webp" alt="" width="150" height="112"><p>${CP.esc(msg)}</p><a class="boton boton-marca" href="./">Ver todas las ofertas</a></div>`;
  };

  let d, o, h;
  try {
    d = await CP.datos();
    CP.marco(d);
    CP.registrar(d.ofertas);
    o = d.ofertas.find((x) => x.id === id);
    if (!o) return fallo("Esta oferta ya no está en portada. Mira las que siguen activas.");
    h = { puntos: [], minimo: o.precio, maximo: o.precio, promedio: o.precio };
    if (!o.sin_historial) {
      const r = await fetch(`datos/historial/${encodeURIComponent(id)}.json?t=${Date.now()}`, { cache: "no-store" });
      if (r.ok) h = await r.json();
    }
  } catch (e) {
    return fallo("No pudimos cargar esta oferta.");
  }

  document.title = `${o.titulo} · ${o.oculta_precio ? o.tienda_nombre : o.gratis ? "Gratis" : CP.cop(o.precio)} · CazaPromo`;
  $("miga-titulo").textContent = o.titulo;
  if (o.grupo) $("miga-grupo").innerHTML = `› <a href="./?cat=${encodeURIComponent(o.grupo)}">${CP.esc(o.grupo)}</a>`;

  const dias = h.puntos.length;
  let veredicto;
  if (o.estado === "expirada") {
    veredicto = { clase: "caro", texto: "⌛ Esta oferta expiró: el precio subió o se agotó." };
  } else if (o.sin_historial) {
    veredicto = null;
  } else if (dias < 3) {
    veredicto = { clase: "midiendo", texto: `⏳ Estamos midiendo este precio desde el ${h.desde ? CP.fecha(h.desde) : "hoy"}. La gráfica se llena con cada revisión.` };
  } else if (o.precio <= h.minimo) {
    veredicto = { clase: "bueno", texto: "🟢 Es el precio más bajo que hemos visto: buen momento para comprar." };
  } else if (o.precio <= h.promedio * 0.95) {
    veredicto = { clase: "bueno", texto: "🟢 Está por debajo de su precio promedio." };
  } else if (o.precio <= h.promedio * 1.05) {
    veredicto = { clase: "normal", texto: "🟡 Está en su precio de siempre." };
  } else {
    veredicto = { clase: "caro", texto: "🔴 Está más caro que su promedio: vale la pena esperar una bajada." };
  }

  const sitio = d.sitio || {};
  let avisame = "";
  if (!o.sin_historial && sitio.numero_bot_whatsapp) {
    avisame = `<a class="boton boton-wa" href="https://wa.me/${encodeURIComponent(sitio.numero_bot_whatsapp)}?text=${encodeURIComponent(o.url)}" target="_blank" rel="noopener">${CP.icono("campana")}Avísame si baja</a>`;
  }
  const carrito = o.carrito && o.estado === "activa"
    ? `<a class="boton boton-sec" href="${CP.esc(CP.urlSegura(o.carrito))}" target="_blank" rel="${CP.rel(o)}">${CP.icono("carrito")}Directo al carrito</a>` : "";
  const revisado = o.verificado || o.en_web;
  const nota = o.sin_historial
    ? `Precio y disponibilidad a ${CP.fechaHora(revisado)}; pueden cambiar. El precio que vale es el que muestra la tienda al pagar.`
    : `Precio revisado ${CP.haceCuanto(revisado)}. Confírmalo en la tienda antes de pagar.`;

  contenedor.innerHTML = `
    <section class="ficha">
      <div class="ficha-img">${CP.imagen(o)}${CP.insignias(o)}
        <button class="guardar" type="button" data-guardar="${CP.esc(o.id)}" aria-pressed="${CP.guardadas.tiene(o.id)}" aria-label="Guardar oferta">${CP.icono("corazon")}</button>
      </div>
      <div class="ficha-info">
        <div class="fila-tienda"><span class="tienda-chip">${CP.logoTienda(o.tienda_nombre)}<span>${CP.esc(o.tienda_nombre)}</span></span><span>Publicada ${CP.esc(CP.haceCuanto(o.en_web))}</span></div>
        <h1>${CP.esc(o.titulo)}</h1>
        ${CP.precioHTML(o)}
        ${CP.datosExtra(o)}
        ${CP.cupon(o)}
        ${o.nota ? `<p class="estado">📝 ${CP.esc(o.nota)}</p>` : ""}
        ${veredicto ? `<p class="veredicto ${veredicto.clase}">${veredicto.texto}</p>` : ""}
        <div class="acciones">
          <a class="boton boton-marca" href="${CP.esc(CP.urlSegura(o.url))}" target="_blank" rel="${CP.rel(o)}">Ver oferta en ${CP.esc(o.tienda_nombre)} ${CP.icono("externo")}</a>
          ${carrito}
          ${avisame}
          <button class="boton boton-sec" type="button" data-compartir="${CP.esc(o.id)}">${CP.icono("compartir")}Compartir</button>
        </div>
        <p class="verificado" style="display:block">${CP.esc(nota)}${o.afiliado ? " Enlace de afiliado." : ""}</p>
      </div>
    </section>
    ${o.sin_historial ? "" : `
    <section class="panel">
      <h2>Historial de precio</h2>
      <p class="ayuda">Precio más bajo de cada día en pesos colombianos${o.aproximado ? ", convertido con la TRM del día" : ""}.</p>
      <div class="estadisticas">
        <div class="estadistica"><span>Hoy</span><strong>${o.gratis ? "Gratis" : CP.cop(o.precio)}</strong></div>
        <div class="estadistica min"><span>Mínimo</span><strong>${CP.cop(h.minimo)}</strong></div>
        <div class="estadistica"><span>Máximo</span><strong>${CP.cop(h.maximo)}</strong></div>
        <div class="estadistica"><span>Promedio</span><strong>${CP.cop(h.promedio)}</strong></div>
      </div>
      <div class="grafica">${grafica(h.puntos, h.minimo) || `<p class="ayuda">La gráfica aparece cuando tengamos al menos dos días de precios.</p>`}</div>
    </section>`}`;

  const parecidas = d.ofertas
    .filter((x) => x.id !== o.id && x.estado === "activa" && (x.grupo === o.grupo || x.tienda_nombre === o.tienda_nombre))
    .sort((a, b) => (b.grupo === o.grupo) - (a.grupo === o.grupo) || (b.descuento || 0) - (a.descuento || 0))
    .slice(0, 4);
  if (parecidas.length) {
    $("parecidas").hidden = false;
    $("parecidas-lista").innerHTML = parecidas.map((x) => CP.tarjeta(x)).join("");
  }

  function grafica(puntos, minimo) {
    if (!puntos || puntos.length < 2) return "";
    const W = 720, H = 260, m = { izq: 70, der: 18, arr: 18, aba: 34 };
    const ts = puntos.map((p) => Date.parse(p[0] + "T12:00:00"));
    const vs = puntos.map((p) => p[1]);
    let lo = Math.min(...vs), hi = Math.max(...vs);
    const margen = (hi - lo) * 0.12 || hi * 0.05 || 1;
    lo = Math.max(0, lo - margen);
    hi = hi + margen;
    const t0 = ts[0], t1 = ts[ts.length - 1];
    const x = (t) => m.izq + ((t - t0) / (t1 - t0 || 1)) * (W - m.izq - m.der);
    const y = (v) => m.arr + ((hi - v) / (hi - lo)) * (H - m.arr - m.aba);
    let ruta = `M${x(ts[0]).toFixed(1)},${y(vs[0]).toFixed(1)}`;
    for (let i = 1; i < ts.length; i++) ruta += ` H${x(ts[i]).toFixed(1)} V${y(vs[i]).toFixed(1)}`;
    const area = `${ruta} V${H - m.aba} H${x(ts[0]).toFixed(1)} Z`;
    const marcas = [lo, (lo + hi) / 2, hi].map((v) =>
      `<line class="rejilla-linea" x1="${m.izq}" x2="${W - m.der}" y1="${y(v)}" y2="${y(v)}"/>` +
      `<text class="eje" x="${m.izq - 8}" y="${y(v) + 4}" text-anchor="end">${CP.copCorto(v)}</text>`).join("");
    const ultimo = ts.length - 1;
    return `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Historial de precio: mínimo ${CP.cop(minimo)}, hoy ${CP.cop(vs[ultimo])}">
        <defs><linearGradient id="degradado" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#fc8201" stop-opacity=".35"/><stop offset="1" stop-color="#a815f9" stop-opacity="0"/>
        </linearGradient></defs>
        ${marcas}
        <path class="area" d="${area}"/>
        <path class="linea" d="${ruta}"/>
        <line class="minimo" x1="${m.izq}" x2="${W - m.der}" y1="${y(minimo)}" y2="${y(minimo)}"/>
        <text class="etiqueta-minimo" x="${W - m.der}" y="${y(minimo) - 6}" text-anchor="end">Mínimo ${CP.cop(minimo)}</text>
        <circle class="punto" cx="${x(ts[ultimo])}" cy="${y(vs[ultimo])}" r="6"/>
        <text class="eje" x="${m.izq}" y="${H - 10}">${CP.fecha(puntos[0][0])}</text>
        <text class="eje" x="${W - m.der}" y="${H - 10}" text-anchor="end">${CP.fecha(puntos[ultimo][0])}</text>
      </svg>`;
  }
})();
