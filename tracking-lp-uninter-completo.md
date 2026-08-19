# Sistema de Tracking Nativo — LP Uninter

**Versão:** 2.0
**Data:** Agosto 2026
**Escopo:** Todas as páginas da LP Uninter (multi-polo)
**Arquitetura:** Google Sheets → n8n → PostgreSQL → endpoint JSON → LP

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [O que hoje não funciona](#2-o-que-hoje-não-funciona)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Camada 1 — Captura de UTM + Origem](#4-camada-1--captura-de-utm--origem)
5. [Camada 2 — Rastreamento de WhatsApp](#5-camada-2--rastreamento-de-whatsapp)
6. [Camada 3 — Journey do Usuário](#6-camada-3--journey-do-usuário)
7. [Camada 4 — Enriquecimento do Lead](#7-camada-4--enriquecimento-do-lead)
8. [Guia de Implementação](#8-guia-de-implementação)
9. [Script Completo: js/tracking.js](#9-script-completo-jstrackingjs)
10. [Alterações em js/app.js](#10-alterações-em-jsappjs)
11. [Alterações nos HTMLs](#11-alterações-nos-htmls)
12. [Alterações em functions/api/lead.js](#12-alterações-em-functionsapileadjs)
13. [Webhook n8n — Payload e Contrato](#13-webhook-n8n--payload-e-contrato)
14. [Workflow n8n Template](#14-workflow-n8n-template)
15. [PostgreSQL — Schema e Queries](#15-postgresql--schema-e-queries)
16. [Dashboard de Analytics](#16-dashboard-de-analytics)
17. [Referência Completa de Eventos](#17-referência-completa-de-eventos)
18. [Troubleshooting](#18-troubleshooting)
19. [Checklist de Lançamento](#19-checklist-de-lançamento)

---

## 1. Visão Geral

### O que é

Sistema de tracking **100% vanilla JavaScript** — zero dependências externas, zero ferramentas pagas. Rastreia o comportamento completo do visitante na LP Uninter e envia tudo para o n8n via HTTP POST.

### O que rastreia

| Dado | Como | Por que importa |
|---|---|---|
| **De onde veio o lead** | UTM parameters capturados da URL | Sabe qual canal/.campanha traz leads |
| **Qual botão WhatsApp clicado** | `data-wa-pos` em cada CTA | Sabe qual seção converte mais |
| **Curso de interesse** | Slug do curso no clique do modal | Sabe qual curso gera mais lead |
| **Navegação pela página** | Seções vistas, scroll depth, buscas | Mede engajamento real |
| **Journey completo** | Tudo salvo em localStorage + enviado no clique final | Um payload rico, não N requests |

### Fluxo resumido

```
Visitante abre a URL
        │
        ▼
  tracking.js captura UTMs da URL → salva em localStorage
        │
        ▼
  Visitante navega (scroll, busca, clica em cursos)
        │
        ▼
  Cada interação grava evento no localStorage + dataLayer
        │
        ▼
  Clique no WhatsApp ou envio do form
        │
        ▼
  Payload enriquecido com TUDO (UTMs + journey + cliques) → POST webhook n8n
        │
        ▼
  n8n salva no PostgreSQL + atualiza CRM (opcional)
```

### Por que localStorage e não 1 request por evento

| Abordagem | Requests | Dados | Performance |
|---|---|---|---|
| 1 POST por evento (proposta OPP4S) | ~15-30 por sessão | Granular | Ruim — muitos requests |
| **localStorage + batch (esta proposta)** | **1 POST por sessão** | **Rico e completo** | **Ótimo — mínimo de overhead** |

A LP Uninter tem tráfego pago. Cada request é:
- 1 connnection HTTPS
- 1 payload
- 1 processamento no n8n

**Economia:** ~20 requests viram 1. O visitante nem percebe que está sendo rastreado.

---

## 2. O que hoje não funciona

### Diagnóstico completo

| Área | Estado atual | Problema |
|---|---|---|
| **WhatsApp — qual botão** | `gtag("conversion")` genério em todo `[data-wa]` | Não sabe se foi o hero, nav, footer ou modal |
| **WhatsApp — curso** | Nada | Clique no modal não registra qual curso |
| **UTM parameters** | Zero captura | Não sabe se veio do Google, Facebook, orgânico |
| **Scroll / seções** | Nada | Não sabe se o visitante viu as vantagens, FAQ, etc. |
| **Busca de cursos** | Nada | Não sabe o que o visitante pesquisou |
| **Filtros** | Nada | Não sabe qual filtro usou (área, tipo, preço) |
| **dataLayer** | Só bootstrap do gtag | Nenhum evento customizado |
| **Lead → contexto** | Só manda `origem: location.pathname` | Sem UTMs, sem journey, sem contexto |
| **Google Ads label** | `WHATSAPP_CONVERSION_LABEL` (placeholder) | Conversão do WhatsApp não trackeia de verdade |

### Dados que chegam no webhook de hoje

```json
{
  "nome": "João",
  "whatsapp": "43998540001",
  "curso": "administracao",
  "nivel": "graduacao",
  "polo": "londrina-centro-calcadao",
  "origem": "/graduacao.html",
  "ts": "2026-07-22T14:30:00Z",
  "ip": "189.50.100.20",
  "ua": "Mozilla/5.0..."
}
```

**Falta:** de onde veio, qual botão clicou, quantas vezes buscou, quais cursos viu, quanto scrollou.

### Dados que vão chegar DEPOIS do tracking

```json
{
  "nome": "João",
  "whatsapp": "43998540001",
  "curso": "administracao",
  "nivel": "graduacao",
  "polo": "londrina-centro-calcadao",
  "origem": "/graduacao.html",
  "ts": "2026-07-22T14:30:00Z",
  "ip": "189.50.100.20",
  "ua": "Mozilla/5.0...",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "ead-graduacao-londrina",
  "utm_content": "banner-hero",
  "utm_term": "faculdade-ead-londrina",
  "wa_clicks": [
    {"pos": "hero", "ts": "2026-07-22T14:25:00Z"},
    {"pos": "modal", "curso": "administracao", "ts": "2026-07-22T14:29:00Z"}
  ],
  "scroll_depth": 85,
  "buscas": ["admin", "gestão"],
  "cursos_vistos": ["administracao", "marketing-digital"],
  "filtros_usados": ["area:Gestão e Negócios"],
  "secoes_vistas": ["hero", "vantagens", "catalogo", "faq", "cta-final"],
  "tempo_na_pagina": 187
}
```

---

## 3. Arquitetura do Sistema

### 3.1 Componentes

```
┌─────────────────────────────────────────────────────────┐
│                   LANDING PAGE (HTML)                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              js/tracking.js (NOVO)                │  │
│  │                                                   │  │
│  │  • Captura UTM parameters da URL                  │  │
│  │  • Salva em localStorage (persiste entre páginas) │  │
│  │  • Rastreia cliques WhatsApp com posição          │  │
│  │  • Rastreia busca, filtros, cursos vistos         │  │
│  │  • Mede scroll depth por seção                    │  │
│  │  • Expõe window.Track para app.js chamar          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │           js/app.js (ALTERADO)                    │  │
│  │                                                   │  │
│  │  • Adiciona data-wa-pos nos botões                │  │
│  │  • Chama Track.whatsapp(pos, curso?) no clique    │  │
│  │  • Chama Track.search(termo) na busca             │  │
│  │  • Chama Track.filter(filtro) nos filtros         │  │
│  │  • Enriquece payload do lead com Track.getData()  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │           functions/api/lead.js (ALTERADO)        │  │
│  │                                                   │  │
│  │  • Recebe payload estendido (UTMs + journey)      │  │
│  │  • Repassa TUDO para o webhook n8n                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │  HTTPS POST (1x por sessão)
                        ▼
┌─────────────────────────────────────────────────────────┐
│              API.OPP4S.COM / WEBHOOK                     │
│                                                         │
│  POST /webhook/uninter-tracking                         │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              n8n WORKFLOW                         │  │
│  │                                                   │  │
│  │  1. Recebe payload JSON                          │  │
│  │  2. Valida e sanitiza                            │  │
│  │  3. Insere no PostgreSQL (eventos)               │  │
│  │  4. Enriquece lead no Kommo CRM (opcional)       │  │
│  │  5. Retorna 200 OK                               │  │
│  └───────────────────────────────────────────────────┘  │
│                        │                                 │
│                        ▼                                 │
│              ┌─────────────────┐                         │
│              │   PostgreSQL    │                         │
│              │  (analytics)    │                         │
│              └─────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Fluxo de dados detalhado

```
1. USUÁRIO clica no anúncio (Google Ads com UTMs):
   https://uninterlondrina.com/graduacao.html?utm_source=google&utm_medium=cpc&utm_campaign=ead-grad

2. HTML é servido (estático, Cloudflare Pages — rápido)

3. js/tracking.js executa:
   a) Lê UTMs da URL → salva em localStorage
   b) Marca timestamp de início da sessão
   c) Configura IntersectionObserver nas seções
   d) Configura listeners de busca e filtros
   e) Expõe window.Track para app.js

4. Usuário navega:
   a) Rola a página → IntersectionObserver marca seções vistas
   b) Busca por "admin" → grava em Track._data.buscas
   c) Clica no filtro "Gestão" → grava em Track._data.filtros
   d) Clica em um curso → grava em Track._data.cursosVistos

5. Usuário clica no WhatsApp (hero):
   a) app.js chama Track.whatsapp("hero")
   b) Grava {pos: "hero", ts: "..."} no array waClicks
   c) dataLayer push com posição + contexto

6. Usuário clica em "Chamar no WhatsApp" (footer):
   a) app.js chama Track.whatsapp("footer")
   b) Grava {pos: "footer", ts: "..."} no array waClicks
   c) wa.me abre em nova aba

7. OU: Usuário preenche o form de lead:
   a) app.js chama Track.getData() para montar payload
   b) Payload inclui: dados do form + UTMs + journey + wa_clicks
   c) POST para /api/lead → n8n → PostgreSQL
```

---

## 4. Camada 1 — Captura de UTM + Origem

### O que são UTM parameters

Parâmetros na URL que identificam de onde veio o tráfego:

```
https://uninterlondrina.com/graduacao.html
  ?utm_source=google          ← plataforma (google, facebook, instagram)
  &utm_medium=cpc             ← tipo de tráfego (cpc, social, email, organic)
  &utm_campaign=ead-grad      ← campanha específica
  &utm_content=banner-hero    ← variante do anúncio
  &utm_term=faculdade+ead     ← palavra-chave (Google Ads)
```

### Como funciona

1. No **page view**, `tracking.js` lê todos os `utm_*` da URL
2. Salva em `localStorage` com chave `uninter_utm`
3. TTL de **30 dias** (atualiza se vierem novos UTMs)
4. Quando o lead converte (WhatsApp ou form), inclui no payload

### Por que persistir em localStorage

- Visitante clica no anúncio → entra na home → navega para graduação → converte
- Sem localStorage: `origem` só mostra `/graduacao.html` (não sabe que veio do Google)
- Com localStorage: payload inclui `utm_source=google&utm_medium=cpc` mesmo em outra página

### Código (em `js/tracking.js`)

```javascript
function captureUTMs() {
  var params = new URLSearchParams(window.location.search);
  var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var utm = {};
  var hasUTM = false;

  utmKeys.forEach(function(key) {
    var val = params.get(key);
    if (val) {
      utm[key] = val;
      hasUTM = true;
    }
  });

  // Sempre lê o referrer como fallback
  utm.referrer = document.referrer || '';

  if (hasUTM) {
    utm.capturedAt = new Date().toISOString();
    localStorage.setItem('uninter_utm', JSON.stringify(utm));
  }

  // Retorna UTMs salvas (pode ser de sessão anterior)
  var saved = localStorage.getItem('uninter_utm');
  return saved ? JSON.parse(saved) : utm;
}
```

---

## 5. Camada 2 — Rastreamento de WhatsApp

### O problema original

> "Hoje recebemos um lead que clicou em um dos botões do WhatsApp. Não sabemos qual botão, em que parte da página, por onde o lead navegou."

### A solução

Cada botão WhatsApp ganha um **identificador de posição** via atributo `data-wa-pos`:

| Posição | Onde está | Quando aparece |
|---|---|---|
| `nav` | Barra de navegação (topo) | Sempre visível (sticky) |
| `hero` | Seção hero (topo da página) | Primeira doctype que o visitante vê |
| `final-cta` | Seção "Sua nova carreira começa com um oi" | Depois de rolar até o final |
| `footer` | Rodapé, ao lado do email/telefone | Sempre visível |
| `mobile-bar` | Barra fixa no mobile (bottom) | Só em telas < 768px |
| `modal` | Modal de detalhe do curso | Ao clicar em um card do catálogo |

### Como funciona

1. No HTML, cada `<a data-wa>` ganha `data-wa-pos="hero"` (etc.)
2. No JS, o listener de clique em `[data-wa]` captura a posição
3. Se for o modal, captura também o `data-wa-curso` (slug do curso)
4. Grava no array `waClicks` do localStorage
5. Faz `dataLayer.push` para Google Ads / analytics

### Código (em `js/tracking.js`)

```javascript
function trackWhatsAppClick(pos, curso) {
  var data = getOrCreateSession();
  if (!data.waClicks) data.waClicks = [];

  var click = { pos: pos, ts: new Date().toISOString() };
  if (curso) click.curso = curso;

  data.waClicks.push(click);
  saveSession(data);

  // dataLayer para Google Analytics / Ads
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'whatsapp_click',
      wa_position: pos,
      wa_curso: curso || null
    });
  }

  return click;
}
```

### Atributos HTML resultantes

```html
<!-- Navbar -->
<a class="btn btn--sm btn--wa nav-cta" data-wa="" data-wa-pos="nav" target="_blank">

<!-- Hero -->
<a class="btn btn--wa" data-wa="" data-wa-pos="hero" target="_blank">

<!-- Final CTA -->
<a class="btn btn--wa" data-wa="" data-wa-pos="final-cta" target="_blank">

<!-- Footer -->
<a data-wa="" data-wa-pos="footer" target="_blank">

<!-- Mobile bar -->
<a class="btn btn--wa" data-wa="" data-wa-pos="mobile-bar" target="_blank">

<!-- Modal (injetado por JS) -->
<a class="btn btn--wa btn--block" id="cd-wa" data-wa-pos="modal"
   data-wa-curso="${slug}" target="_blank">
```

---

## 6. Camada 3 — Journey do Usuário

### O que é

Rastreia **toda a jornada** do visitante na página antes de converter.

### Dados coletados

| Dado | Como | Exemplo |
|---|---|---|
| **Seções vistas** | IntersectionObserver (threshold 30%) | `["hero", "vantagens", "catalogo", "faq"]` |
| **Scroll depth** | Listener de scroll (throttle 500ms) | `75` (% mais profundo atingido) |
| **Buscas feitas** | Listener no input de busca | `["admin", "marketing"]` |
| **Filtros usados** | Listener nos botões de filtro | `["area:Gestão e Negócios", "tipo:Tecnólogo"]` |
| **Cursos clicados** | Listener nos cards do catálogo | `["administracao", "marketing-digital"]` |
| **Tempo na página** | Timestamp final - inicial | `187` (segundos) |

### Seções da LP Uninter (com `data-track`)

| Seção | `data-track` | Páginas |
|---|---|---|
| Hero | `hero` | Todas |
| Vantagens do EAD | `vantagens` | Home |
| Níveis (bento) | `niveis` | Home |
| FAQ | `faq` | Home, Catálogo |
| CTA final | `cta-final` | Todas |
| Toolbar (filtros/busca) | `toolbar` | Catálogo |
| Grid de cursos | `catalogo` | Catálogo |

### Código (em `js/tracking.js`)

```javascript
function initScrollObserver() {
  var sections = document.querySelectorAll('[data-track]');
  var data = getOrCreateSession();
  if (!data.secoesVistas) data.secoesVistas = [];

  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var tag = entry.target.getAttribute('data-track');
        if (tag && data.secoesVistas.indexOf(tag) === -1) {
          data.secoesVistas.push(tag);
          saveSession(data);
        }
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(function(el) { obs.observe(el); });
}

function initScrollDepth() {
  var maxDepth = 0;
  var ticking = false;

  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var depth = Math.round((scrollTop / docHeight) * 100);
        if (depth > maxDepth) {
          maxDepth = depth;
          var data = getOrCreateSession();
          data.scrollDepth = maxDepth;
          saveSession(data);
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function trackSearch(termo) {
  if (!termo || termo.length < 2) return;
  var data = getOrCreateSession();
  if (!data.buscas) data.buscas = [];
  // Dedup — não repete termo idêntico
  if (data.buscas.indexOf(termo) === -1) {
    data.buscas.push(termo);
    saveSession(data);
  }
}

function trackFilter(filtro) {
  var data = getOrCreateSession();
  if (!data.filtrosUsados) data.filtrosUsados = [];
  if (data.filtrosUsados.indexOf(filtro) === -1) {
    data.filtrosUsados.push(filtro);
    saveSession(data);
  }
}

function trackCursoVisto(slug) {
  var data = getOrCreateSession();
  if (!data.cursosVistos) data.cursosVistos = [];
  if (data.cursosVistos.indexOf(slug) === -1) {
    data.cursosVistos.push(slug);
    saveSession(data);
  }
}
```

---

## 7. Camada 4 — Enriquecimento do Lead

### Payload final do webhook (n8n recebe)

```json
{
  "nome": "João Silva",
  "whatsapp": "43998540001",
  "curso": "administracao",
  "nivel": "graduacao",
  "polo": "londrina-centro-calcadao",
  "origem": "/graduacao.html",
  "ts": "2026-07-22T14:30:00Z",
  "ip": "189.50.100.20",
  "ua": "Mozilla/5.0...",

  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "ead-graduacao-londrina",
  "utm_content": "banner-hero",
  "utm_term": "faculdade ead londrina",

  "wa_clicks": [
    {"pos": "hero", "ts": "2026-07-22T14:25:00Z"},
    {"pos": "modal", "curso": "administracao", "ts": "2026-07-22T14:29:00Z"}
  ],
  "scroll_depth": 85,
  "buscas": ["admin", "gestão"],
  "cursos_vistos": ["administracao", "marketing-digital"],
  "filtros_usados": ["area:Gestão e Negócios"],
  "secoes_vistas": ["hero", "vantagens", "catalogo", "faq", "cta-final"],
  "tempo_na_pagina": 187
}
```

### Definição dos campos

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | string | Sim | Nome do lead (do form) |
| `whatsapp` | string | Sim | WhatsApp do lead (do form) |
| `curso` | string | Não | Curso de interesse (do form ou modal) |
| `nivel` | string | Não | Nível (graduação/pós/técnico/EJA) |
| `polo` | string | Sim | ID do polo (slug) |
| `origem` | string | Sim | Path da página onde converteu |
| `ts` | string | Sim | Timestamp ISO 8601 |
| `ip` | string | Sim | IP do visitante (via Cloudflare) |
| `ua` | string | Sim | User-Agent |
| `utm_source` | string | Não | Plataforma (google, facebook, instagram) |
| `utm_medium` | string | Não | Tipo de tráfego (cpc, social, email) |
| `utm_campaign` | string | Não | Nome da campanha |
| `utm_content` | string | Não | Variante do anúncio |
| `utm_term` | string | Não | Palavra-chave |
| `wa_clicks` | array | Não | Histórico de cliques WhatsApp |
| `wa_clicks[].pos` | string | Sim | Posição: nav/hero/final-cta/footer/mobile-bar/modal |
| `wa_clicks[].curso` | string | Não | Slug do curso (só no modal) |
| `wa_clicks[].ts` | string | Sim | Timestamp do clique |
| `scroll_depth` | number | Não | % mais profundo scrollado (0-100) |
| `buscas` | array | Não | Termos buscados no campo de busca |
| `cursos_vistos` | array | Não | Slugs dos cursos clicados no catálogo |
| `filtros_usados` | array | Não | Filtros aplicados |
| `secoes_vistas` | array | Não | Seções da página que ficaram visíveis |
| `tempo_na_pagina` | number | Não | Segundos entre page view e conversão |

---

## 8. Guia de Implementação

### 8.1 Ordem de implementação

| Passo | Arquivo | Ação | Dependência |
|---|---|---|---|
| 1 | `js/tracking.js` | Criar novo arquivo | Nenhuma |
| 2 | HTMLs (5 páginas) | Adicionar `data-track` nas seções | Nenhuma |
| 3 | HTMLs (5 páginas) | Adicionar `data-wa-pos` nos botões WhatsApp | Nenhuma |
| 4 | HTMLs (5 páginas) | Incluir `<script src="js/tracking.js">` | Passo 1 |
| 5 | `js/app.js` | Adicionar chamadas `Track.whatsapp()`, `Track.search()`, etc. | Passo 1 |
| 6 | `functions/api/lead.js` | Estender payload para incluir dados de tracking | Passo 1 |
| 7 | n8n | Criar workflow de tracking (opcional — analytics separado) | Passos 1-6 |

### 8.2 Variante de deploy

Para testar sem impactar o site no ar:

1. Criar branch `feat/tracking`
2. Implementar tudo na branch
3. Testar via `uninterlondrina-lp.pages.dev` (domínio .pages.dev)
4. Merge no `main` quando validado

---

## 9. Script Completo: js/tracking.js

```javascript
/* =========================================================================
 * js/tracking.js — Sistema de tracking nativo da LP Uninter.
 * Zero dependências externas. 100% vanilla JS.
 *
 * Captura: UTMs, cliques WhatsApp (posição + curso), scroll depth,
 * seções vistas, buscas, filtros, cursos clicados, tempo na página.
 *
 * Expõe window.Track para app.js usar.
 *
 * Ordem de carga: config/uninter.js → config/polo.js →
 *                 js/data-source.js → js/tracking.js → js/app.js
 * ========================================================================= */
(function () {
  "use strict";

  var SESSION_KEY = "uninter_session";
  var UTM_KEY = "uninter_utm";
  var UTM_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

  // ═══════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════

  function getOrCreateSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      pageViewAt: new Date().toISOString(),
      pagina: location.pathname,
      waClicks: [],
      secoesVistas: [],
      buscas: [],
      filtrosUsados: [],
      cursosVistos: [],
      scrollDepth: 0
    };
  }

  function saveSession(data) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  // ═══════════════════════════════════════════════════
  // CAMADA 1: UTM CAPTURE
  // ═══════════════════════════════════════════════════

  function captureUTMs() {
    var params = new URLSearchParams(window.location.search);
    var utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    var utm = {};
    var hasNew = false;

    utmKeys.forEach(function (key) {
      var val = params.get(key);
      if (val) {
        utm[key] = val;
        hasNew = true;
      }
    });

    utm.referrer = document.referrer || "";

    if (hasNew) {
      utm.capturedAt = new Date().toISOString();
      try {
        localStorage.setItem(UTM_KEY, JSON.stringify(utm));
      } catch (_) {}
    }

    // Retorna UTMs salvas (pode ser de sessão anterior)
    try {
      var saved = localStorage.getItem(UTM_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        // Expira após 30 dias
        if (parsed.capturedAt && Date.now() - new Date(parsed.capturedAt).getTime() > UTM_TTL_MS) {
          localStorage.removeItem(UTM_KEY);
          return utm;
        }
        return parsed;
      }
    } catch (_) {}

    return utm;
  }

  function getUTMs() {
    try {
      var raw = localStorage.getItem(UTM_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  // ═══════════════════════════════════════════════════
  // CAMADA 2: WHATSAPP TRACKING
  // ═══════════════════════════════════════════════════

  function trackWhatsApp(pos, curso) {
    var data = getOrCreateSession();

    var click = { pos: pos, ts: new Date().toISOString() };
    if (curso) click.curso = curso;

    data.waClicks.push(click);
    saveSession(data);

    // dataLayer para Google Analytics / Ads
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "whatsapp_click",
        wa_position: pos,
        wa_curso: curso || null
      });
    }

    return click;
  }

  // ═══════════════════════════════════════════════════
  // CAMADA 3: JOURNEY TRACKING
  // ═══════════════════════════════════════════════════

  function initScrollObserver() {
    var sections = document.querySelectorAll("[data-track]");
    if (!sections.length) return;

    var data = getOrCreateSession();

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var tag = entry.target.getAttribute("data-track");
            if (tag && data.secoesVistas.indexOf(tag) === -1) {
              data.secoesVistas.push(tag);
              saveSession(data);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach(function (el) {
      obs.observe(el);
    });
  }

  function initScrollDepth() {
    var maxDepth = 0;
    var ticking = false;

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
              var depth = Math.round((scrollTop / docHeight) * 100);
              if (depth > maxDepth) {
                maxDepth = depth;
                var data = getOrCreateSession();
                data.scrollDepth = maxDepth;
                saveSession(data);
              }
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  function trackSearch(termo) {
    if (!termo || termo.length < 2) return;
    var data = getOrCreateSession();
    if (!data.buscas) data.buscas = [];
    if (data.buscas.indexOf(termo) === -1) {
      data.buscas.push(termo);
      saveSession(data);
    }
  }

  function trackFilter(filtro) {
    var data = getOrCreateSession();
    if (!data.filtrosUsados) data.filtrosUsados = [];
    if (data.filtrosUsados.indexOf(filtro) === -1) {
      data.filtrosUsados.push(filtro);
      saveSession(data);
    }
  }

  function trackCursoVisto(slug) {
    var data = getOrCreateSession();
    if (!data.cursosVistos) data.cursosVistos = [];
    if (data.cursosVistos.indexOf(slug) === -1) {
      data.cursosVistos.push(slug);
      saveSession(data);
    }
  }

  // ═══════════════════════════════════════════════════
  // CAMADA 4: PAYLOAD COMPLETO
  // ═══════════════════════════════════════════════════

  function getData() {
    var data = getOrCreateSession();
    var utms = getUTMs();

    // Calcula tempo na página
    var tempoNaPagina = 0;
    if (data.pageViewAt) {
      tempoNaPagina = Math.round(
        (Date.now() - new Date(data.pageViewAt).getTime()) / 1000
      );
    }

    return {
      // UTMs
      utm_source: utms.utm_source || null,
      utm_medium: utms.utm_medium || null,
      utm_campaign: utms.utm_campaign || null,
      utm_content: utms.utm_content || null,
      utm_term: utms.utm_term || null,
      referrer: utms.referrer || null,

      // WhatsApp
      wa_clicks: data.waClicks || [],

      // Journey
      scroll_depth: data.scrollDepth || 0,
      buscas: data.buscas || [],
      cursos_vistos: data.cursosVistos || [],
      filtros_usados: data.filtrosUsados || [],
      secoes_vistas: data.secoesVistas || [],
      tempo_na_pagina: tempoNaPagina
    };
  }

  // ═══════════════════════════════════════════════════
  // INICIALIZAÇÃO
  // ═══════════════════════════════════════════════════

  function init() {
    captureUTMs();
    initScrollObserver();
    initScrollDepth();

    // Marca page view
    var data = getOrCreateSession();
    saveSession(data);

    // dataLayer push inicial
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "page_view_custom",
        pagina: location.pathname
      });
    }
  }

  // Expõe API pública para app.js
  window.Track = {
    whatsapp: trackWhatsApp,
    search: trackSearch,
    filter: trackFilter,
    cursoVisto: trackCursoVisto,
    getData: getData,
    getUTMs: getUTMs
  };

  // Auto-inicializa
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
```

---

## 10. Alterações em js/app.js

### 10.1 WhatsApp click — adicionar posição (substituir linhas 394-399)

**ANTES (atual):**
```javascript
/* Google Ads — WhatsApp click conversion */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-wa]") && typeof gtag === "function") {
    gtag("event", "conversion", { send_to: "AW-18340100067/WHATSAPP_CONVERSION_LABEL" });
  }
});
```

**DEPOIS:**
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

### 10.2 Modal de curso — adicionar tracking ao WhatsApp (linha ~156)

**ANTES:**
```javascript
$("#cd-wa").href = waLink(`Olá! Tenho interesse no curso ${c.nome}...`);
```

**DEPOIS:**
```javascript
$("#cd-wa").href = waLink(`Olá! Tenho interesse no curso ${c.nome}...`);
$("#cd-wa").setAttribute("data-wa-curso", c.slug);

// Tracking: curso foi visualizado
if (window.Track) {
  Track.cursoVisto(c.slug);
}
```

### 10.3 Lead form submit — enriquecer payload (linhas 290-300)

**ANTES:**
```javascript
const payload = {
  ...data,
  nivel: form.dataset.nivel || "",
  polo: P.id,
  origem: location.pathname,
  ts: new Date().toISOString(),
};
```

**DEPOIS:**
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

### 10.4 Busca — rastrear termos buscados (na função de filtro, ~linha 200)

Adicionar após a lógica de filtro existente:

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

### 10.5 Filtros — rastrear filtros usados

Adicionar após os listeners de filtro existentes:

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

## 11. Alterações nos HTMLs

### 11.1 Adicionar `data-track` nas seções

**index.html:**
```html
<section class="hero" data-track="hero">
<section class="section vantagens" data-track="vantagens">
<section class="section niveis" data-track="niveis">
<section class="section faq" data-track="faq">
<section class="section cta-final" data-track="cta-final">
```

**graduacao.html / pos-graduacao.html / tecnico.html / eja.html:**
```html
<section class="hero" data-track="hero">
<div class="toolbar" data-track="toolbar">
<div id="cursos-grid" data-track="catalogo">
<section class="section faq" data-track="faq">
<section class="section cta-final" data-track="cta-final">
```

### 11.2 Adicionar `data-wa-pos` nos botões WhatsApp

Em **TODAS as 5 páginas**, atualizar cada `<a data-wa>`:

```html
<!-- Navbar (todas as páginas) -->
<a class="btn btn--sm btn--wa nav-cta" data-wa="" data-wa-pos="nav" target="_blank" rel="noopener">

<!-- Hero (todas as páginas) -->
<a class="btn btn--wa" data-wa="" data-wa-pos="hero" target="_blank" rel="noopener">

<!-- Final CTA (todas as páginas) -->
<a class="btn btn--wa" data-wa="" data-wa-pos="final-cta" target="_blank" rel="noopener">

<!-- Footer (todas as páginas) -->
<a data-wa="" data-wa-pos="footer" target="_blank" rel="noopener">

<!-- Mobile bar (todas as páginas) -->
<a class="btn btn--wa" data-wa="" data-wa-pos="mobile-bar" target="_blank" rel="noopener" aria-label="WhatsApp">
```

### 11.3 Incluir tracking.js

Em **TODAS as 5 páginas**, adicionar antes de `app.js`:

```html
  <script defer src="config/uninter.js"></script>
  <script defer src="config/polo.js"></script>
  <script defer src="js/data-source.js"></script>
  <script defer src="js/tracking.js"></script>   <!-- NOVO -->
  <script defer src="js/app.js"></script>
```

### 11.4 Botões de filtro (catálogo) — adicionar identificadores

Se os filtros ainda não têm IDs, adicionar:

```html
<div class="toolbar" data-track="toolbar">
  <input id="busca" type="search" placeholder="Buscar curso..." />
  <div id="f-area" class="filters">
    <!-- botões de área -->
  </div>
  <div id="f-tipo" class="filters">
    <!-- botões de tipo -->
  </div>
</div>
```

---

## 12. Alterações em functions/api/lead.js

### Payload estendido (substituir bloco do payload, linhas 35-45)

**ANTES:**
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

**DEPOIS:**
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

## 13. Webhook n8n — Payload e Contrato

### 13.1 Endpoint

```
POST https://api.opp4s.com/webhook/uninter-tracking
Content-Type: application/json
```

> **Nota:** Este é o webhook de **analytics** (eventos de comportamento). O webhook de **lead** continua sendo `/webhook/leads_lp_polos_uninter_tenant`. Podem ser o mesmo workflow se preferir enriquecer o lead existente.

### 13.2 Contrato simplificado

Todos os campos são `string` ou `array` exceto `scroll_depth` (number), `tempo_na_pagina` (number) e `total_paginas` (number).

| Campo | Tipo | Obrigatório | Tamanho máx |
|---|---|---|---|
| `nome` | string | Sim | 200 |
| `whatsapp` | string | Sim | 20 |
| `polo` | string | Sim | 100 |
| `origem` | string | Sim | 500 |
| `ts` | string | Sim | ISO 8601 |
| `utm_source` | string | Não | 100 |
| `utm_medium` | string | Não | 100 |
| `utm_campaign` | string | Não | 200 |
| `utm_content` | string | Não | 200 |
| `utm_term` | string | Não | 200 |
| `referrer` | string | Não | 500 |
| `wa_clicks` | array | Não | 20 itens |
| `scroll_depth` | number | Não | 0-100 |
| `buscas` | array | Não | 20 itens |
| `cursos_vistos` | array | Não | 30 itens |
| `filtros_usados` | array | Não | 20 itens |
| `secoes_vistas` | array | Não | 20 itens |
| `tempo_na_pagina` | number | Não | segundos |

---

## 14. Workflow n8n Template

### 14.1 Estrutura do workflow

```
[Webhook Trigger: POST /webhook/uninter-tracking]
        │
        ▼
[Code: Validar e Sanitizar Payload]
        │
        ├─→ [PostgreSQL: Insert Event]
        │
        └─→ [Respond to Webhook: 200 OK]
```

### 14.2 Webhook Trigger

| Configuração | Valor |
|---|---|
| HTTP Method | POST |
| Path | `uninter-tracking` |
| Response Mode | `Last Node` |

### 14.3 Code Node — Validar Payload

```javascript
const body = $input.first().json.body;

// Campos obrigatórios
const required = ['nome', 'whatsapp', 'polo', 'origem', 'timestamp'];
for (const field of required) {
  if (!body[field] && body[field] !== 0) {
    throw new Error(`Campo obrigatório ausente: ${field}`);
  }
}

// Sanitizar strings
const str = (v, max = 200) => String(v || '').substring(0, max);

// Sanitizar arrays
const arr = (v, max = 20) => {
  if (!Array.isArray(v)) return [];
  return v.slice(0, max).map(item => {
    if (typeof item === 'object') {
      return {
        pos: str(item.pos, 50),
        curso: str(item.curso, 100),
        ts: str(item.ts, 30)
      };
    }
    return str(item, 100);
  });
};

return {
  json: {
    nome: str(body.nome, 200),
    whatsapp: str(body.whatsapp, 20),
    curso: str(body.curso, 100),
    nivel: str(body.nivel, 50),
    polo: str(body.polo, 100),
    origem: str(body.origem, 500),
    ts: str(body.ts, 30),
    ip: str(body.ip, 50),
    ua: str(body.ua, 500),

    utm_source: body.utm_source ? str(body.utm_source, 100) : null,
    utm_medium: body.utm_medium ? str(body.utm_medium, 100) : null,
    utm_campaign: body.utm_campaign ? str(body.utm_campaign, 200) : null,
    utm_content: body.utm_content ? str(body.utm_content, 200) : null,
    utm_term: body.utm_term ? str(body.utm_term, 200) : null,
    referrer: body.referrer ? str(body.referrer, 500) : null,

    wa_clicks: arr(body.wa_clicks, 20),
    scroll_depth: Number(body.scroll_depth) || 0,
    buscas: arr(body.buscas, 20),
    cursos_vistos: arr(body.cursos_vistos, 30),
    filtros_usados: arr(body.filtros_usados, 20),
    secoes_vistas: arr(body.secoes_vistas, 20),
    tempo_na_pagina: Number(body.tempo_na_pagina) || 0,

    received_at: new Date().toISOString()
  }
};
```

---

## 15. PostgreSQL — Schema e Queries

### 15.1 Schema da tabela

```sql
CREATE TABLE IF NOT EXISTS uninter_lp_events (
  id              SERIAL PRIMARY KEY,
  -- Dados do lead
  nome            VARCHAR(200) NOT NULL,
  whatsapp        VARCHAR(20) NOT NULL,
  curso           VARCHAR(100),
  nivel           VARCHAR(50),
  polo            VARCHAR(100) NOT NULL,
  origem          VARCHAR(500),
  ts              TIMESTAMPTZ,
  ip              VARCHAR(50),
  ua              VARCHAR(500),

  -- UTM parameters
  utm_source      VARCHAR(100),
  utm_medium      VARCHAR(100),
  utm_campaign    VARCHAR(200),
  utm_content     VARCHAR(200),
  utm_term        VARCHAR(200),
  referrer        VARCHAR(500),

  -- WhatsApp clicks
  wa_clicks       JSONB DEFAULT '[]',

  -- Journey
  scroll_depth    INTEGER DEFAULT 0,
  buscas          JSONB DEFAULT '[]',
  cursos_vistos   JSONB DEFAULT '[]',
  filtros_usados  JSONB DEFAULT '[]',
  secoes_vistas   JSONB DEFAULT '[]',
  tempo_na_pagina INTEGER DEFAULT 0,

  -- Meta
  received_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas comuns
CREATE INDEX idx_lp_events_polo ON uninter_lp_events (polo);
CREATE INDEX idx_lp_events_ts ON uninter_lp_events (ts DESC);
CREATE INDEX idx_lp_events_utm_source ON uninter_lp_events (utm_source);
CREATE INDEX idx_lp_events_utm_campaign ON uninter_lp_events (utm_campaign);
CREATE INDEX idx_lp_events_wa_clicks ON uninter_lp_events USING GIN (wa_clicks);
```

### 15.2 Insert

```sql
INSERT INTO uninter_lp_events
  (nome, whatsapp, curso, nivel, polo, origem, ts, ip, ua,
   utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer,
   wa_clicks, scroll_depth, buscas, cursos_vistos, filtros_usados,
   secoes_vistas, tempo_na_pagina)
VALUES
  ($1, $2, $3, $4, $5, $6, $7, $8, $9,
   $10, $11, $12, $13, $14, $15,
   $16, $17, $18, $19, $20,
   $21, $22);
```

### 15.3 Queries de análise

```sql
-- ═══════════════════════════════════════════════════
-- 1. QUAL BOTÃO WHATSAPP GERA MAIS LEADS?
-- ═══════════════════════════════════════════════════
SELECT
  (click->>'pos') AS posicao,
  COUNT(*) AS total_cliques,
  COUNT(DISTINCT nome) AS leads_unicos
FROM uninter_lp_events,
     jsonb_array_elements(wa_clicks) AS click
GROUP BY 1
ORDER BY 2 DESC;

-- ═══════════════════════════════════════════════════
-- 2. DE ONDE VEM OS LEADS? (UTM Source)
-- ═══════════════════════════════════════════════════
SELECT
  COALESCE(utm_source, 'orgânico/direto') AS fonte,
  COALESCE(utm_medium, '-') AS medio,
  COUNT(*) AS total_leads,
  ROUND(AVG(scroll_depth)) AS scroll_medio,
  ROUND(AVG(tempo_na_pagina)) AS tempo_medio_seg
FROM uninter_lp_events
GROUP BY 1, 2
ORDER BY 3 DESC;

-- ═══════════════════════════════════════════════════
-- 3. QUAL CAMPANHA TRAZ LEADS DE MELhor QUALIDADE?
-- ═══════════════════════════════════════════════════
SELECT
  COALESCE(utm_campaign, 'sem campanha') AS campanha,
  COUNT(*) AS leads,
  ROUND(AVG(scroll_depth)) AS scroll_medio,
  ROUND(AVG(tempo_na_pagina)) AS tempo_medio,
  COUNT(CASE WHEN scroll_depth >= 70 THEN 1 END) AS leads_engajados
FROM uninter_lp_events
GROUP BY 1
ORDER BY leads_engajados DESC;

-- ═══════════════════════════════════════════════════
-- 4. QUAIS CURSOS GERAM MAIS INTERESSE?
-- ═══════════════════════════════════════════════════
SELECT
  (c->>'slug') AS curso_slug,
  COUNT(*) AS vezes_clicado
FROM uninter_lp_events,
     jsonb_array_elements(cursos_vistos) AS c
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════
-- 5. O QUE O PÚBLICO BUSCA NO SITE?
-- ═══════════════════════════════════════════════════
SELECT
  b AS termo_busca,
  COUNT(*) AS vezes_buscou
FROM uninter_lp_events,
     jsonb_array_elements_text(buscas) AS b
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════
-- 6. TAXA DE CONVERSÃO POR PÁGINA
-- ═══════════════════════════════════════════════════
SELECT
  origem,
  COUNT(*) AS leads,
  ROUND(AVG(scroll_depth)) AS scroll_medio,
  ROUND(AVG(CASE WHEN jsonb_array_length(wa_clicks) > 0 THEN 100.0 ELSE 0 END)) AS pct_com_whatsapp
FROM uninter_lp_events
GROUP BY 1
ORDER BY 2 DESC;

-- ═══════════════════════════════════════════════════
-- 7. FUNIL: SEÇÕES VISTAS → CONVERSÃO
-- ═══════════════════════════════════════════════════
SELECT
  s AS secao,
  COUNT(*) AS vezes_vista,
  COUNT(DISTINCT nome) AS leads_que_viram
FROM uninter_lp_events,
     jsonb_array_elements_text(secoes_vistas) AS s
GROUP BY 1
ORDER BY 2 DESC;

-- ═══════════════════════════════════════════════════
-- 8. ENGAJAMENTO: SCROLL DEPTH vs CONVERSÃO
-- ═══════════════════════════════════════════════════
SELECT
  CASE
    WHEN scroll_depth < 25 THEN '0-24%'
    WHEN scroll_depth < 50 THEN '25-49%'
    WHEN scroll_depth < 75 THEN '50-74%'
    ELSE '75-100%'
  END AS faixa_scroll,
  COUNT(*) AS total,
  COUNT(CASE WHEN jsonb_array_length(wa_clicks) > 0 THEN 1 END) AS com_whatsapp,
  ROUND(
    COUNT(CASE WHEN jsonb_array_length(wa_clicks) > 0 THEN 1 END)::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS taxa_whatsapp
FROM uninter_lp_events
GROUP BY 1
ORDER BY 1;

-- ═══════════════════════════════════════════════════
-- 9. QUAL CURSO × QUAL POLO × QUAL UTM?
-- ═══════════════════════════════════════════════════
SELECT
  curso,
  polo,
  COALESCE(utm_source, 'orgânico') AS fonte,
  COUNT(*) AS leads
FROM uninter_lp_events
WHERE curso IS NOT NULL AND curso != ''
GROUP BY 1, 2, 3
ORDER BY 4 DESC;

-- ═══════════════════════════════════════════════════
-- 10. DASHBOARD RESUMIDO (hoje / 7d / 30d)
-- ═══════════════════════════════════════════════════
SELECT
  DATE(ts) AS data,
  COUNT(*) AS leads,
  COUNT(CASE WHEN utm_source IS NOT NULL THEN 1 END) AS com_utm,
  ROUND(AVG(scroll_depth)) AS scroll_medio,
  ROUND(AVG(tempo_na_pagina)) AS tempo_medio,
  COUNT(CASE WHEN jsonb_array_length(wa_clicks) > 0 THEN 1 END) AS via_whatsapp
FROM uninter_lp_events
WHERE ts >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;
```

---

## 16. Dashboard de Analytics

### 16.1 Métricas principais

| Métrica | O que responde | Query SQL |
|---|---|---|
| **Leads por dia** | Volume de conversão | Query 10 |
| **Leads por canal** | De onde vem o tráfego | Query 2 |
| **Leads por campanha** | Qual campanha performa | Query 3 |
| **Botão WhatsApp mais clicado** | Qual CTA converte | Query 1 |
| **Cursos mais buscados** | Interesse do público | Query 5 |
| **Cursos mais clicados** | Qual curso atrai | Query 4 |
| **Scroll depth vs conversão** | Engajamento → resultado | Query 8 |
| **Seções mais vistas** | Conteúdo que prende | Query 7 |
| **Tempo médio na página** | Qualidade do tráfego | Query 10 |

### 16.2 KPIs sugeridos

| KPI | Meta | Como medir |
|---|---|---|
| **Taxa de conversão** | > 2% | `leads / acessos_unicos` |
| **Scroll depth médio** | > 60% | `AVG(scroll_depth)` |
| **WhatsApp click rate** | > 15% | `leads com wa_clicks / total leads` |
| **Busca → Conversão** | > 5% | `leads que buscaram / total que buscou` |
| **Tempo médio** | > 120s | `AVG(tempo_na_pagina)` |

---

## 17. Referência Completa de Eventos

### 17.1 Eventos rastreados

| Evento | Quando | Dados extras | O que mede |
|---|---|---|---|
| `page_view_custom` | Ao carregar a página (1x) | `pagina` | Abertura |
| `whatsapp_click` | Clique em qualquer `[data-wa]` | `wa_position`, `wa_curso` | Intenção de conversão |
| `lead_submit` | Envio do form de lead | Payload completo + UTMs + journey | Conversão efetiva |
| *(implícito)* scroll depth | A cada 500ms de scroll | `scroll_depth` | Engajamento visual |
| *(implícito)* seção vista | Seção com `data-track` fica 30%+ visível | `secoes_vistas` | Conteúdo consumido |
| *(implícito)* busca | Input de busca com 2+ caracteres | `buscas` | Interesse específico |
| *(implícito)* filtro | Clique em botão de filtro | `filtros_usados` | Interesse segmentado |
| *(implícito)* curso visto | Clique em card do catálogo | `cursos_vistos` | Interesse em curso |

### 17.2 Resumo dos atributos HTML

| Atributo | Onde | Exemplo |
|---|---|---|
| `data-wa-pos` | Botões WhatsApp | `nav`, `hero`, `final-cta`, `footer`, `mobile-bar`, `modal` |
| `data-wa-curso` | WhatsApp do modal | `administracao` (slug) |
| `data-track` | Seções da página | `hero`, `vantagens`, `catalogo`, `faq`, `cta-final` |

---

## 18. Troubleshooting

### 18.1 UTMs não estão sendo capturadas

| Verificar | Como |
|---|---|
| URL tem `utm_*`? | Abra no navegador e verifique na barra de endereço |
| `localStorage` está preenchido? | Console: `JSON.parse(localStorage.getItem('uninter_utm'))` |
| 30 dias expiraram? | `capturedAt` mais antigo que 30 dias → limpa automático |

### 18.2 WhatsApp click não registra posição

| Verificar | Como |
|---|---|
| `data-wa-pos` existe no HTML? | Inspect element no botão |
| `tracking.js` carregou antes de `app.js`? | Verificar ordem dos `<script>` |
| `window.Track` existe? | Console: `typeof window.Track` deve ser `"object"` |

### 18.3 Lead não inclui dados de tracking

| Verificar | Como |
|---|---|
| `Track.getData()` retorna dados? | Console: `Track.getData()` |
| `functions/api/lead.js` foi atualizado? | Verificar deploy da Cloudflare Function |
| Payload está completo? | Network tab → ver POST `/api/lead` → Response body |

### 18.4 Eventos não chegam no n8n

| Verificar | Como |
|---|---|
| Webhook URL está correto? | Console: ver URL no `fetch()` |
| CORS aceita POST? | Webhook n8n deve aceitar de qualquer origem |
| Workflow está ativo? | n8n → toggle verde no workflow |
| Payload é válido? | n8n → Executions → ver request body |

### 18.5 Scroll depth sempre mostra 0

| Verificar | Como |
|---|---|
| Página tem scroll? | Se `scrollHeight <= innerHeight`, não há o que scrollar |
| `sessionStorage` funciona? | Console: `sessionStorage.setItem('test', '1')` |

---

## 19. Checklist de Lançamento

### Código

- [ ] `js/tracking.js` criado e testado localmente
- [ ] `data-wa-pos` adicionado em todos os 6 botões WhatsApp (5 fixos + modal)
- [ ] `data-track` adicionado nas seções de todas as 5 páginas
- [ ] `tracking.js` incluído nos 5 HTMLs (antes de `app.js`)
- [ ] `app.js` atualizado com chamadas `Track.whatsapp()`, `Track.search()`, etc.
- [ ] `functions/api/lead.js` atualizado com payload estendido
- [ ] Teste: `Track.getData()` retorna dados no console
- [ ] Teste: clique no WhatsApp grava `wa_clicks` no sessionStorage
- [ ] Teste: scroll grava `scroll_depth` no sessionStorage

### n8n

- [ ] Workflow criado com Webhook Trigger (`uninter-tracking`)
- [ ] Code Node de validação implementado
- [ ] PostgreSQL conectado e tabela `uninter_lp_events` criada
- [ ] Índices criados
- [ ] Workflow ativado

### Google Ads

- [ ] `WHATSAPP_CONVERSION_LABEL` substituído pelo label real
- [ ] Teste: clique no WhatsApp dispara conversão no Google Ads

### Deploy

- [ ] Branch `feat/tracking` criada
- [ ] Deploy via Cloudflare Pages (testar em `.pages.dev` primeiro)
- [ ] Merge no `main` quando validado
- [ ] Verificar em produção: Network tab → 1 POST para webhook (se houver conversão)

---

## Referências

- **IntersectionObserver API:** https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- **localStorage:** https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- **UTM Parameters:** https://ga-dev-tools.google/ga4/campaign-url-builder/
- **n8n Docs:** https://docs.n8n.io/
- **PostgreSQL JSONB:** https://www.postgresql.org/docs/current/functions-json.html

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [O que hoje não funciona](#2-o-que-hoje-não-funciona)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Camada 1 — Captura de UTM + Origem](#4-camada-1--captura-de-utm--origem)
5. [Camada 2 — Rastreamento de WhatsApp](#5-camada-2--rastreamento-de-whatsapp)
6. [Camada 3 — Journey do Usuário](#6-camada-3--journey-do-usuário)
7. [Camada 4 — Enriquecimento do Lead](#7-camada-4--enriquecimento-do-lead)
8. [Guia de Implementação](#8-guia-de-implementação)
9. [Script Completo: js/tracking.js](#9-script-completo-jstrackingjs)
10. [Alterações em js/app.js](#10-alterações-em-jsappjs)
11. [Alterações nos HTMLs](#11-alterações-nos-htmls)
12. [Alterações em functions/api/lead.js](#12-alterações-em-functionsapileadjs)
13. [Webhook n8n — Payload e Contrato](#13-webhook-n8n--payload-e-contrato)
14. [Workflow n8n Template](#14-workflow-n8n-template)
15. [PostgreSQL — Schema e Queries](#15-postgresql--schema-e-queries)
16. [Dashboard de Analytics](#16-dashboard-de-analytics)
17. [Referência Completa de Eventos](#17-referência-completa-de-eventos)
18. [Troubleshooting](#18-troubleshooting)
19. [Checklist de Lançamento](#19-checklist-de-lançamento)
20. [Status Atual (Agosto 2026)](#20-status-atual-agosto-2026)

---

## 20. Status Atual (Agosto 2026)

### O que está funcionando

| Componente | Status | Detalhes |
|------------|--------|----------|
| **WF2 - Sync Polos** | ✅ | Sheets → PostgreSQL (`polos` table) + Redis |
| **W5 - Endpoint LP** | ✅ | Retorna `poloInfo` com `ga4`, `googleAdsId`, `clarityId` |
| **W6 - Guardião** | ✅ | Publica dados aprovados para `lp_publicado` |
| **Google Ads** | ✅ | `AW-18340100067` |
| **GA4** | ✅ | `G-EYWM8KFX3D` (por polo) |
| **GTM** | ✅ | `GTM-52XTDH8D` |
| **Microsoft Clarity** | ✅ | `xqnghrws2k` (por polo) |

### Endpoint atual

```
GET https://api.opp4s.com/webhook/uninter-cursos?polo=londrina-centro-calcadao
```

Resposta:
```json
{
  "polo": "PAP LONDRINA (CENTRO CALÇADÃO) - PR",
  "poloInfo": {
    "slug": "londrina-centro-calcadao",
    "ga4": "G-EYWM8KFX3D",
    "googleAdsId": "AW-18340100067",
    "googleAdsLabel": null,
    "clarityId": "xqnghrws2k",
    "whatsapp": "5543998540300",
    "email": "londrina@pap-uninter.com"
  },
  "cursos": [ ... ]
}
```

### Workflows n8n

| Workflow | ID | Função | Status |
|----------|-----|--------|--------|
| WF2 - Sync Polos | `YJRnBmFK5w3vKN0w` | Sheets → polos + Redis | ✅ Ativo |
| W5 - Endpoint LP | `bqcFBkTFajRFSXZx` | polos + lp_publicado → JSON | ✅ Ativo |
| W6 - Guardião | `5aCqUzC53c4ESOLQ` | Publica dados aprovados | ✅ Ativo |

### Fix aplicado (18/08/2026)

O W5 foi atualizado para selecionar campos de analytics da tabela `polos`:

```sql
SELECT lp.polo_slug, lp.polo_nome, lp.payload, lp.publicado_em,
       pl.ga4, pl.google_ads_id, pl.google_ads_label, pl.clarity_id
FROM lp_publicado lp
JOIN polos pl ON pl.slug = lp.polo_slug AND pl.habilitado = true
```

Documentação do fix: `lp-uninter-tracking/FIX-W5-ANALYTICS.md`

---

*Documento gerado para LP Uninter — uninterlondrina.com*
*Versão 2.0 — Agosto 2026*
