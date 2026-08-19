# Alterações nos HTMLs — LP Uninter Tracking

**Instrução:** Em cada uma das 5 páginas, fazer as alterações abaixo.

---

## 1. Google Tag Manager (GTM)

### 1.1 Código no `<head>` (o mais alto possível)

Adicionar no início do `<head>`:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-52XTDH8D');</script>
<!-- End Google Tag Manager -->
```

### 1.2 Código após a abertura `<body>`

Adicionar imediatamente após a tag `<body>`:

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-52XTDH8D"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

---

## 2. Google Analytics 4 (via gtag.js)

> **Nota:** Se o GA4 estiver configurado no GTM, este código pode ser removido.

Adicionar no `<head>` após o GTM:

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-EYWM8KFX3D"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-EYWM8KFX3D');
</script>
```

---

## 3. Scripts da LP

Adicionar no `<head>` após o GA4:

```html
<!-- Scripts da LP (ordem IMPORTANTE) -->
<script defer src="config/uninter.js"></script>
<script defer src="config/polo.js"></script>
<script defer src="js/data-source.js"></script>
<script defer src="js/tracking.js"></script>
<script defer src="js/app.js"></script>
```

**Ordem importante:** `tracking.js` DEVE carregar antes de `app.js` para que `window.Track` esteja disponível.

---

## 4. Adicionar `data-track` nas seções

### index.html

```html
<section class="hero" data-track="hero">
<section class="section vantagens" data-track="vantagens">
<section class="section niveis" data-track="niveis">
<section class="section faq" data-track="faq">
<section class="section cta-final" data-track="cta-final">
```

### graduacao.html / pos-graduacao.html / tecnico.html / eja.html

```html
<section class="hero" data-track="hero">
<div class="toolbar" data-track="toolbar">
<div id="cursos-grid" data-track="catalogo">
<section class="section faq" data-track="faq">
<section class="section cta-final" data-track="cta-final">
```

---

## 5. Adicionar `data-wa-pos` nos botões WhatsApp

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

**Nota:** O botão do modal (`data-wa-pos="modal"`) é injetado por JS no `app.js`, não precisa alterar no HTML.

---

## 6. Código completo do `<head>` (referência)

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uninter - Cursos EAD</title>

  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-52XTDH8D');</script>
  <!-- End Google Tag Manager -->

  <!-- Google Analytics 4 (se não estiver no GTM) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-EYWM8KFX3D"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-EYWM8KFX3D');
  </script>

  <!-- Scripts da LP -->
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

## 7. Código do `<body>` (referência)

```html
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-52XTDH8D"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

  <!-- Conteúdo da página -->
  ...
</body>
```

---

## Resumo por página

| Página | GTM | GA4 | data-track | data-wa-pos | scripts |
|--------|-----|-----|-----------|-------------|---------|
| index.html | ✅ head + body | ✅ | 5 seções | 5 botões | ✅ |
| graduacao.html | ✅ head + body | ✅ | 5 seções | 5 botões | ✅ |
| pos-graduacao.html | ✅ head + body | ✅ | 5 seções | 5 botões | ✅ |
| tecnico.html | ✅ head + body | ✅ | 5 seções | 5 botões | ✅ |
| eja.html | ✅ head + body | ✅ | 5 seções | 5 botões | ✅ |
