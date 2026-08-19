# Alterações em js/app.js — LP Uninter Tracking

**Instrução:** Localizar cada trecho ANTIGO no seu `app.js` atual e substituir pelo trecho NOVO.

---

## 1. WhatsApp click — adicionar posição

Buscar este trecho:

```javascript
/* Google Ads — WhatsApp click conversion */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-wa]") && typeof gtag === "function") {
    gtag("event", "conversion", { send_to: "AW-18340100067/WHATSAPP_CONVERSION_LABEL" });
  }
});
```

Substituir por:

```javascript
/* Tracking — WhatsApp click com posição */
document.addEventListener("click", (e) => {
  const waEl = e.target.closest("[data-wa]");
  if (!waEl) return;

  const pos = waEl.getAttribute("data-wa-pos") || "unknown";
  const curso = waEl.getAttribute("data-wa-curso") || null;

  // Tracking nativo
  if (window.Track) {
    Track.whatsapp(pos, curso);
  }

  // Google Ads conversion (manter existente)
  if (typeof gtag === "function") {
    gtag("event", "conversion", {
      send_to: "AW-18340100067/WHATSAPP_CONVERSION_LABEL",
      event_callback: undefined
    });
  }
});
```

---

## 2. Modal de curso — adicionar tracking ao WhatsApp

Buscar este trecho (dentro da função que abre o modal do curso):

```javascript
$("#cd-wa").href = waLink(`Olá! Tenho interesse no curso ${c.nome}...`);
```

Substituir por:

```javascript
$("#cd-wa").href = waLink(`Olá! Tenho interesse no curso ${c.nome}...`);
$("#cd-wa").setAttribute("data-wa-curso", c.slug);

// Tracking: curso foi visualizado
if (window.Track) {
  Track.cursoVisto(c.slug);
}
```

---

## 3. Lead form submit — enriquecer payload

Buscar este trecho (dentro da função de envio do form):

```javascript
const payload = {
  ...data,
  nivel: form.dataset.nivel || "",
  polo: P.id,
  origem: location.pathname,
  ts: new Date().toISOString(),
};
```

Substituir por:

```javascript
const trackingData = (window.Track) ? Track.getData() : {};
const payload = {
  ...data,
  nivel: form.dataset.nivel || "",
  polo: P.id,
  origem: location.pathname,
  ts: new Date().toISOString(),
  ...trackingData
};
```

---

## 4. Busca — rastrear termos buscados

Adicionar este código **após** a lógica de filtro/busca existente (dentro do `DOMContentLoaded` ou função de init):

```javascript
// Tracking: busca
const searchInput = document.querySelector('#busca, [type=search]');
if (searchInput) {
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (window.Track && e.target.value.trim().length >= 2) {
        Track.search(e.target.value.trim().toLowerCase());
      }
    }, 800);
  });
}
```

---

## 5. Filtros — rastrear filtros usados

Adicionar este código **após** os listeners de filtro existentes:

```javascript
// Tracking: filtros
document.querySelectorAll('#f-area button, #f-tipo button, #f-preco button').forEach(btn => {
  btn.addEventListener('click', () => {
    if (window.Track) {
      Track.filter(btn.textContent.trim());
    }
  });
});
```

---

## Resumo das alterações

| # | Local | O que faz |
|---|-------|-----------|
| 1 | Listener de clique WhatsApp | Rastreia posição (nav/hero/footer/modal) + curso |
| 2 | Modal de curso | Adiciona `data-wa-curso` + registra curso visualizado |
| 3 | Form submit | Enriquece payload com UTMs + journey |
| 4 | Input de busca | Rastreia termos buscados (debounce 800ms) |
| 5 | Botões de filtro | Rastreia filtros utilizados |
