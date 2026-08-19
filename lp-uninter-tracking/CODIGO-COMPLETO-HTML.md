# Código Completo para HTMLs — LP Uninter

**Versão:** 2.0
**Data:** Agosto 2026
**Páginas:** 5 (index, graduacao, pos-graduacao, tecnico, eja)

---

## Instrução

Em **cada uma das 5 páginas**, fazer estas 4 alterações:

1. **`<head>`** — Adicionar GTM + GA4 + scripts (no início)
2. **`<body>`** — Adicionar GTM noscript (logo após `<body>`)
3. **Seções** — Adicionar `data-track` em cada seção
4. **Botões WhatsApp** — Adicionar `data-wa-pos` em cada botão

---

## 1. Código do `<head>` (completo)

Adicionar **no início do `<head>`**, antes de qualquer outro `<script>`:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uninter - Cursos EAD</title>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- GOOGLE TAG MANAGER (o mais alto possível no head) -->
  <!-- ═══════════════════════════════════════════════════ -->
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-52XTDH8D');</script>
  <!-- End Google Tag Manager -->

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- GOOGLE ANALYTICS 4 (se não estiver no GTM)        -->
  <!-- ═══════════════════════════════════════════════════ -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-EYWM8KFX3D"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-EYWM8KFX3D');
  </script>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- SCRIPTS DA LP (ordem IMPORTANTE)                   -->
  <!-- ═══════════════════════════════════════════════════ -->
  <script defer src="config/uninter.js"></script>
  <script defer src="config/polo.js"></script>
  <script defer src="js/data-source.js"></script>
  <script defer src="js/tracking.js"></script>
  <script defer src="js/app.js"></script>

  <!-- CSS -->
  <link rel="stylesheet" href="css/style.css">
</head>
```

---

## 2. Código do `<body>` (GTM noscript)

Adicionar **imediatamente após a tag `<body>`**:

```html
<body>
  <!-- ═══════════════════════════════════════════════════ -->
  <!-- GOOGLE TAG MANAGER (noscript)                      -->
  <!-- ═══════════════════════════════════════════════════ -->
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-52XTDH8D"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- CONTEÚDO DA PÁGINA                                 -->
  <!-- ═══════════════════════════════════════════════════ -->

  <!-- ... resto do conteúdo ... -->

</body>
```

---

## 3. `data-track` nas seções

### index.html

```html
<section class="hero" data-track="hero">
  <!-- ... conteúdo do hero ... -->
</section>

<section class="section vantagens" data-track="vantagens">
  <!-- ... conteúdo de vantagens ... -->
</section>

<section class="section niveis" data-track="niveis">
  <!-- ... conteúdo de níveis ... -->
</section>

<section class="section faq" data-track="faq">
  <!-- ... conteúdo do FAQ ... -->
</section>

<section class="section cta-final" data-track="cta-final">
  <!-- ... conteúdo do CTA final ... -->
</section>
```

### graduacao.html / pos-graduacao.html / tecnico.html / eja.html

```html
<section class="hero" data-track="hero">
  <!-- ... conteúdo do hero ... -->
</section>

<div class="toolbar" data-track="toolbar">
  <!-- ... busca e filtros ... -->
</div>

<div id="cursos-grid" data-track="catalogo">
  <!-- ... grid de cursos ... -->
</div>

<section class="section faq" data-track="faq">
  <!-- ... conteúdo do FAQ ... -->
</section>

<section class="section cta-final" data-track="cta-final">
  <!-- ... conteúdo do CTA final ... -->
</section>
```

---

## 4. `data-wa-pos` nos botões WhatsApp

Em **TODAS as 5 páginas**, atualizar cada `<a data-wa>`:

```html
<!-- Navbar (todas as páginas) -->
<a class="btn btn--sm btn--wa nav-cta" data-wa="" data-wa-pos="nav" target="_blank" rel="noopener">
  WhatsApp
</a>

<!-- Hero (todas as páginas) -->
<a class="btn btn--wa" data-wa="" data-wa-pos="hero" target="_blank" rel="noopener">
  Chamar no WhatsApp
</a>

<!-- Final CTA (todas as páginas) -->
<a class="btn btn--wa" data-wa="" data-wa-pos="final-cta" target="_blank" rel="noopener">
  Chamar no WhatsApp
</a>

<!-- Footer (todas as páginas) -->
<a data-wa="" data-wa-pos="footer" target="_blank" rel="noopener">
  WhatsApp
</a>

<!-- Mobile bar (todas as páginas) -->
<a class="btn btn--wa" data-wa="" data-wa-pos="mobile-bar" target="_blank" rel="noopener" aria-label="WhatsApp">
  <svg>...</svg>
</a>
```

**Nota:** O botão do modal (`data-wa-pos="modal"`) é injetado por JS no `app.js`, não precisa alterar no HTML.

---

## 5. Referência por página

### index.html

| Item | Código | Local |
|------|--------|-------|
| GTM head | `GTM-52XTDH8D` | `<head>` — início |
| GTM body | `noscript iframe` | Após `<body>` |
| GA4 | `G-EYWM8KFX3D` | `<head>` — após GTM |
| Scripts | config + tracking + app | `<head>` — após GA4 |
| data-track | hero, vantagens, niveis, faq, cta-final | Seções |
| data-wa-pos | nav, hero, final-cta, footer, mobile-bar | Botões WhatsApp |

### graduacao.html

| Item | Código | Local |
|------|--------|-------|
| GTM head | `GTM-52XTDH8D` | `<head>` — início |
| GTM body | `noscript iframe` | Após `<body>` |
| GA4 | `G-EYWM8KFX3D` | `<head>` — após GTM |
| Scripts | config + tracking + app | `<head>` — após GA4 |
| data-track | hero, toolbar, catalogo, faq, cta-final | Seções |
| data-wa-pos | nav, hero, final-cta, footer, mobile-bar | Botões WhatsApp |

### pos-graduacao.html

| Item | Código | Local |
|------|--------|-------|
| GTM head | `GTM-52XTDH8D` | `<head>` — início |
| GTM body | `noscript iframe` | Após `<body>` |
| GA4 | `G-EYWM8KFX3D` | `<head>` — após GTM |
| Scripts | config + tracking + app | `<head>` — após GA4 |
| data-track | hero, toolbar, catalogo, faq, cta-final | Seções |
| data-wa-pos | nav, hero, final-cta, footer, mobile-bar | Botões WhatsApp |

### tecnico.html

| Item | Código | Local |
|------|--------|-------|
| GTM head | `GTM-52XTDH8D` | `<head>` — início |
| GTM body | `noscript iframe` | Após `<body>` |
| GA4 | `G-EYWM8KFX3D` | `<head>` — após GTM |
| Scripts | config + tracking + app | `<head>` — após GA4 |
| data-track | hero, toolbar, catalogo, faq, cta-final | Seções |
| data-wa-pos | nav, hero, final-cta, footer, mobile-bar | Botões WhatsApp |

### eja.html

| Item | Código | Local |
|------|--------|-------|
| GTM head | `GTM-52XTDH8D` | `<head>` — início |
| GTM body | `noscript iframe` | Após `<body>` |
| GA4 | `G-EYWM8KFX3D` | `<head>` — após GTM |
| Scripts | config + tracking + app | `<head>` — após GA4 |
| data-track | hero, toolbar, catalogo, faq, cta-final | Seções |
| data-wa-pos | nav, hero, final-cta, footer, mobile-bar | Botões WhatsApp |

---

## 6. Checklist de implementação

### Por página

- [ ] GTM `<head>` adicionado (GTM-52XTDH8D)
- [ ] GTM `<body>` adicionado (noscript iframe)
- [ ] GA4 adicionado (G-EYWM8KFX3D)
- [ ] Scripts na ordem correta (uninter → polo → data-source → tracking → app)
- [ ] `data-track` em todas as seções
- [ ] `data-wa-pos` em todos os botões WhatsApp

### Geral

- [ ] 5 páginas atualizadas
- [ ] GTM ativado no tagmanager.google.com
- [ ] GA4 funcionando no analytics.google.com
- [ ] Teste: `Track.getData()` retorna dados no console
- [ ] Teste: clique WhatsApp grava posição
- [ ] Teste: scroll grava profundidade
