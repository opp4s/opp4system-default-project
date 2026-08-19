# Google Analytics 4 — LP Uninter

**Data:** Agosto 2026
**GA4 ID:** `G-EYWM8KFX3D`
**Google Ads ID:** `AW-18340100067`

---

## O que fazer

Em **cada uma das 5 páginas**, localizar o bloco atual do Google tag e substituí-lo pelo código abaixo.

---

## Código para colar

Buscar no HTML por este bloco **ANTIGO**:

```html
<!-- Google tag (gtag.js) --><script async src="https://www.googletagmanager.com/gtag/js?id=AW-18340100067"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-18340100067');
</script>
```

Substituir por este bloco **NOVO**:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18340100067"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-18340100067');
  gtag('config', 'G-EYWM8KFX3D');
</script>
```

---

## Páginas para atualizar

| # | Arquivo | URL |
|---|---------|-----|
| 1 | `index.html` | uninterlondrina.com |
| 2 | `graduacao.html` | uninterlondrina.com/graduacao.html |
| 3 | `pos-graduacao.html` | uninterlondrina.com/pos-graduacao.html |
| 4 | `tecnico.html` | uninterlondrina.com/tecnico.html |
| 5 | `eja.html` | uninterlondrina.com/eja.html |

---

## O que muda

| Item | Antes | Depois |
|------|-------|--------|
| Google Ads | `AW-18340100067` | `AW-18340100067` (mantido) |
| Google Analytics 4 | ❌ Não instalado | ✅ `G-EYWM8KFX3D` |
| Relatórios GA4 | Nenhum | Audience, Acquisition, Engagement, Conversions |
| Eventos automáticos | Nenhum | page_view, scroll, click, etc. |

---

## Após instalar

1. Acessar [analytics.google.com](https://analytics.google.com)
2. Selecionar a propriedade `G-EYWM8KFX3D`
3. Em **Tempo real**, verificar se as visitas estão sendo registradas
4. Em **Admin > Fluxos de dados > Web**, confirmar que a URL `uninterlondrina.com` está ativa

---

## Nota sobre event tracking

O GA4 registra automaticamente:
- `page_view` (cada página visitada)
- `scroll` (quando o usuário rola 90% da página)
- `click` (cliques em links externos)
- `session_start`, `first_visit`

Para eventos customizados (como cliques no WhatsApp), isso será feito pelo sistema de tracking nativo (`js/tracking.js`) que já está documentado.
