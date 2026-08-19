# Alterações em functions/api/lead.js — LP Uninter Tracking

**Instrução:** Localizar o bloco de construção do payload e substituir pelo código estendido.

---

## Payload estendido

Buscar este trecho (linhas ~35-45 do lead.js atual):

```javascript
const payload = {
  nome,
  whatsapp,
  curso: (body.curso || "").toString().trim(),
  nivel: (body.nivel || "").toString().trim(),
  polo: (body.polo || "").toString().trim(),
  origem: (body.origem || "").toString().trim(),
  ts: body.ts || new Date().toISOString(),
  ip: request.headers.get("CF-Connecting-IP") || "",
  ua: request.headers.get("User-Agent") || "",
};
```

Substituir por:

```javascript
const payload = {
  // Dados do form
  nome,
  whatsapp,
  curso: (body.curso || "").toString().trim(),
  nivel: (body.nivel || "").toString().trim(),
  polo: (body.polo || "").toString().trim(),
  origem: (body.origem || "").toString().trim(),
  ts: body.ts || new Date().toISOString(),
  ip: request.headers.get("CF-Connecting-IP") || "",
  ua: request.headers.get("User-Agent") || "",

  // Tracking — UTMs
  utm_source: (body.utm_source || "").toString().substring(0, 100) || null,
  utm_medium: (body.utm_medium || "").toString().substring(0, 100) || null,
  utm_campaign: (body.utm_campaign || "").toString().substring(0, 200) || null,
  utm_content: (body.utm_content || "").toString().substring(0, 200) || null,
  utm_term: (body.utm_term || "").toString().substring(0, 200) || null,
  referrer: (body.referrer || "").toString().substring(0, 500) || null,

  // Tracking — WhatsApp
  wa_clicks: Array.isArray(body.wa_clicks) ? body.wa_clicks.slice(0, 20) : [],

  // Tracking — Journey
  scroll_depth: Number(body.scroll_depth) || 0,
  buscas: Array.isArray(body.buscas) ? body.buscas.slice(0, 20) : [],
  cursos_vistos: Array.isArray(body.cursos_vistos) ? body.cursos_vistos.slice(0, 30) : [],
  filtros_usados: Array.isArray(body.filtros_usados) ? body.filtros_usados.slice(0, 20) : [],
  secoes_vistas: Array.isArray(body.secoes_vistas) ? body.secoes_vistas.slice(0, 20) : [],
  tempo_na_pagina: Number(body.tempo_na_pagina) || 0
};
```

---

## Validação de segurança

Todos os campos de tracking passam por sanitização:
- Strings: `substring()` limita tamanho
- Arrays: `.slice()` limita quantidade de itens
- Numbers: `Number()` com fallback para 0
- Nullables: `|| null` para campos opcionais

---

## Compatibilidade

O payload antigo (sem tracking) continua funcionando. Se o frontend não enviar dados de tracking, os campos virão como `null`, `[]` ou `0`. Não quebra nada.
