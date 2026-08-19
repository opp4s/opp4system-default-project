# Guia de Implementação — LP Uninter Multi-Polo

**Versão:** 2.0
**Data:** Agosto 2026
**Arquitetura:** Multi-polo

---

## Estrutura de arquivos

```
lp-uninter-tracking/
├── config/
│   ├── uninter.js              # Config global (GTM, GA4, Ads, webhooks)
│   └── polo.js                 # Template de config por polo
├── js/
│   └── tracking.js             # Sistema de tracking
├── CODIGO-COMPLETO-HTML.md     # Código completo para cada HTML
├── README.md                   # Documentação principal
├── VARIAVEIS-SHEETS.md         # Estrutura da planilha
├── ALTERACOES-APP-JS.md        # Alterações no app.js
├── ALTERACOES-LEAD-JS.md       # Alterações no lead.js
├── ALTERACOES-HTML.md          # Alterações nos HTMLs
├── GA4-CODIGO.md               # GTM + GA4
└── GUIA-IMPLEMENTACAO.md       # Este arquivo
```

---

## IDs

| Ferramenta | ID |
|------------|-----|
| Google Tag Manager | `GTM-52XTDH8D` |
| Google Analytics 4 | `G-EYWM8KFX3D` |
| Google Ads | `AW-18340100067` |

---

## Ordem de implementação (primeiro polo)

| Passo | Arquivo | Ação | Ref |
|-------|---------|------|-----|
| 1 | Google Sheets | Criar planilha de variáveis | VARIAVEIS-SHEETS.md |
| 2 | `config/uninter.js` | Copiar para repo | config/ |
| 3 | `config/polo.js` | Preencher dados de Londrina | config/ |
| 4 | `js/tracking.js` | Copiar para repo | js/ |
| 5 | 5 HTMLs | Adicionar GTM no `<head>` | CODIGO-COMPLETO-HTML.md |
| 6 | 5 HTMLs | Adicionar GTM no `<body>` | CODIGO-COMPLETO-HTML.md |
| 7 | 5 HTMLs | Adicionar GA4 | CODIGO-COMPLETO-HTML.md |
| 8 | 5 HTMLs | Adicionar scripts LP | CODIGO-COMPLETO-HTML.md |
| 9 | 5 HTMLs | Adicionar `data-track` | CODIGO-COMPLETO-HTML.md |
| 10 | 5 HTMLs | Adicionar `data-wa-pos` | CODIGO-COMPLETO-HTML.md |
| 11 | `js/app.js` | Atualizar (5 trechos) | ALTERACOES-APP-JS.md |
| 12 | `functions/api/lead.js` | Estender payload | ALTERACOES-LEAD-JS.md |
| 13 | n8n | Workflow de tracking (opcional) | README.md |

---

## Passo 5-10: Atualizar HTMLs

Ver `CODIGO-COMPLETO-HTML.md` para o código completo.

Resumo por página:

| Página | GTM head | GTM body | GA4 | Scripts | data-track | data-wa-pos |
|--------|----------|----------|-----|---------|-----------|-------------|
| index.html | ✅ | ✅ | ✅ | ✅ | 5 seções | 5 botões |
| graduacao.html | ✅ | ✅ | ✅ | ✅ | 5 seções | 5 botões |
| pos-graduacao.html | ✅ | ✅ | ✅ | ✅ | 5 seções | 5 botões |
| tecnico.html | ✅ | ✅ | ✅ | ✅ | 5 seções | 5 botões |
| eja.html | ✅ | ✅ | ✅ | ✅ | 5 seções | 5 botões |

---

## Passo 11: Atualizar app.js

Ver `ALTERACOES-APP-JS.md`.

5 alterações:
1. WhatsApp click → adicionar posição
2. Modal curso → adicionar `data-wa-curso`
3. Form submit → enriquecer payload com tracking
4. Busca → rastrear termos (debounce 800ms)
5. Filtros → rastrear filtros usados

---

## Passo 12: Atualizar lead.js

Ver `ALTERACOES-LEAD-JS.md`.

1 alteração: estender payload com UTMs, WhatsApp clicks e journey.

---

## Passo 13: Workflow n8n (opcional)

### Workflow de tracking

Webhook: `POST https://api.opp4s.com/webhook/uninter-tracking`

```
[Webhook Trigger]
      │
      ▼
[Code: Validar Payload]
      │
      ├─→ [PostgreSQL: Insert]
      │
      └─→ [200 OK]
```

### Workflow de config de polos

Webhook: `POST https://api.opp4s.com/webhook/polos-config`

```
[Google Sheets Trigger]
      │
      ▼
[Code: Gerar config/polo.js]
      │
      ├─→ [GitHub: Create/Update File]
      │
      └─→ [Cloudflare Pages: Deploy]
```

---

## Como adicionar novo polo

### Opção A: Manual

1. Copiar `config/polo.js` → preencher dados
2. Deploy no Cloudflare Pages
3. Configurar domínio

### Opção B: Automática (n8n)

1. Preencher Google Sheets com dados do polo
2. Workflow n8n lê o Sheets
3. Gera `config/polo.js`
4. Cria branch e deploy

---

## Checklist de deploy (por polo)

- [ ] Google Sheets preenchido
- [ ] `config/polo.js` gerado/preenchido
- [ ] `config/uninter.js` no repo
- [ ] `js/tracking.js` no repo
- [ ] GTM `<head>` nos 5 HTMLs
- [ ] GTM `<body>` nos 5 HTMLs
- [ ] GA4 nos 5 HTMLs
- [ ] Scripts na ordem correta
- [ ] `data-track` nas seções
- [ ] `data-wa-pos` nos botões
- [ ] `app.js` atualizado
- [ ] `lead.js` atualizado
- [ ] GTM ativado
- [ ] GA4 funcionando
- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] Teste em produção
