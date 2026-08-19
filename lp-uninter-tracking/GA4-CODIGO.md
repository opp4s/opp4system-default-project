# Google Tag Manager + Analytics — LP Uninter

**GTM ID:** `GTM-52XTDH8D`
**GA4 ID:** `G-EYWM8KFX3D`
**Google Ads ID:** `AW-18340100067`

---

## 1. Google Tag Manager (GTM)

### Código 1 — No `<head>` (o mais alto possível)

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-52XTDH8D');</script>
<!-- End Google Tag Manager -->
```

### Código 2 — Logo após a tag de abertura `<body>`

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-52XTDH8D"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

---

## 2. Google Analytics 4 (via gtag.js)

> **Nota:** Se o GTM estiver configurado para disparar o GA4, este código pode ser removido. Mantenha apenas se preferir o gtag.js direto.

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

## 3. Código completo para colar no `<head>`

```html
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
```

---

## 4. Código para colar após `<body>`

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-52XTDH8D"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->

<!-- Restante do conteúdo da página -->
```

---

## 5. Páginas para atualizar

| # | Arquivo | `<head>` | Após `<body>` |
|---|---------|----------|---------------|
| 1 | `index.html` | ✅ GTM + GA4 | ✅ noscript |
| 2 | `graduacao.html` | ✅ GTM + GA4 | ✅ noscript |
| 3 | `pos-graduacao.html` | ✅ GTM + GA4 | ✅ noscript |
| 4 | `tecnico.html` | ✅ GTM + GA4 | ✅ noscript |
| 5 | `eja.html` | ✅ GTM + GA4 | ✅ noscript |

---

## 6. Configurar no GTM

Acessar [tagmanager.google.com](https://tagmanager.google.com) → Container `GTM-52XTDH8D`:

### Tags a criar

| Tag | Tipo | Trigger |
|-----|------|---------|
| GA4 - Page View | Google Analytics: GA4 Configuration | All Pages |
| Google Ads - Conversion | Google Ads Conversion Tracking | WhatsApp Click |
| Custom Events | GA4 Event | whatsapp_click, lead_submit |

### Variáveis dataLayer

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `polo` | Custom Event | ID do polo |
| `cidade` | Custom Event | Cidade do polo |
| `wa_position` | Custom Event | Posição do botão WhatsApp |
| `wa_curso` | Custom Event | Curso clicado |

---

## 7. Após instalar

1. Ativar o container `GTM-52XTDH8D` no GTM
2. Publicar as tags
3. Acessar [analytics.google.com](https://analytics.google.com) → propriedade `G-EYWM8KFX3D`
4. Em **Tempo real**, verificar se as visitas são registradas
5. No GTM, usar o **Preview** para testar as tags

---

## 8. Eventos automáticos

| Evento | Fonte | Quando dispara |
|--------|-------|----------------|
| `page_view` | GTM/GA4 | Cada página visitada |
| `scroll` | GA4 | Usuário rola 90% |
| `click` | GTM | Clques em links externos |
| `session_start` | GA4 | Início de sessão |
| `whatsapp_click` | tracking.js → dataLayer | Clique no WhatsApp |
| `lead_submit` | tracking.js → dataLayer | Envio do form |
