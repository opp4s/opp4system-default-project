# LP Uninter Multi-Polo — Documentação do Projeto

**Versão:** 2.0
**Data:** Agosto 2026
**Arquitetura:** Multi-polo (mesma LP, configurações por polo)

---

## 1. Visão Geral

### O que é

Landing Page da Uninter para captação de leads de cursos EAD. **Arquitetura multi-polo**: um único repositório serve vários polos, com configurações variáveis por polo gerenciadas via Google Sheets.

### Domínio

- **Principal:** uninterlondrina.com (polo Londrina)
- **Preview:** uninterlondrina-lp.pages.dev

### Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML + JavaScript vanilla (zero dependências) |
| Deploy | Cloudflare Pages |
| API | n8n webhook (`/uninter-cursos?polo={slug}`) |
| Automação | n8n (WF2, W5, W6) |
| Banco | PostgreSQL + Redis |
| Analytics | GA4 (`G-EYWM8KFX3D`) + Google Ads (`AW-18340100067`) + Clarity (`xqnghrws2k`) |
| Dados | Google Sheets → n8n → PostgreSQL → endpoint JSON |

---

## 2. Arquitetura Multi-Polo

### Princípio

```
┌─────────────────────────────────────────────────────────┐
│                   REPOSITÓRIO ÚNICO                     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  config/uninter.js          (GLOBAL - não muda)   │  │
│  │  • GTM ID                   GTM-52XTDH8D          │  │
│  │  • Google Ads ID            AW-18340100067        │  │
│  │  • GA4 ID                   G-EYWM8KFX3D          │  │
│  │  • Webhook URLs                                    │  │
│  │  • Níveis de curso                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  config/polo.js             (POR POLO - muda)     │  │
│  │  • poloId                   85                     │  │
│  │  • poloSlug                 londrina-centro        │  │
│  │  • poloNome                 PAP LONDRINA...        │  │
│  │  • whatsapp                 5543998540300          │  │
│  │  • email                    londrina@pap...        │  │
│  │  • ga4                      G-EYWM8KFX3D          │  │
│  │  • googleAdsId              AW-18340100067         │  │
│  │  • clarityId                xqnghrws2k             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  js/tracking.js             (COMUM - usa configs)  │  │
│  │  js/app.js                  (COMUM - usa configs)  │  │
│  │  functions/api/lead.js      (COMUM - usa configs)  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de dados por polo

```
Google Sheets (Planilha de Variáveis)
        │
        ▼
n8n Workflow (lê abas, gera JSON)
        │
        ├─→ config/polo.js (gerado automaticamente)
        │
        └─→ Cloudflare Pages (deploy automático)
```

---

## 3. Estrutura de Arquivos

```
lp-uninter/
├── config/
│   ├── uninter.js          # Config global (não muda)
│   └── polo.js             # Config do polo (gerado pelo n8n)
├── js/
│   ├── tracking.js         # Sistema de tracking
│   ├── app.js              # Lógica da LP
│   └── data-source.js      # Fonte de dados dos cursos
├── functions/
│   └── api/
│       └── lead.js         # API de captação de leads
├── index.html              # Home
├── graduacao.html          # Catálogo graduação
├── pos-graduacao.html      # Catálogo pós-graduação
├── tecnico.html            # Catálogo técnico
└── eja.html                # Catálogo EJA
```

---

## 4. Variáveis por Polo

### 4.1 Variáveis que MUDAM por polo

| Variável | Campo no Sheets | Exemplo (Londrina) |
|----------|----------------|---------------------|
| `id` | A (POLOS) | `londrina-centro-calcadao` |
| `nome` | B (POLOS) | `Londrina Centro - Calçadão` |
| `cidade` | C (POLOS) | `Londrina` |
| `estado` | D (POLOS) | `PR` |
| `whatsapp` | F (POLOS) | `43998540001` |
| `email` | I (POLOS) | `londrina@pap-uninter.com` |
| `endereco` | J (POLOS) | `Rua Example, 123` |
| `instagram` | K (POLOS) | `instagram.com/uninterlondrina` |
| `facebook` | L (POLOS) | `facebook.com/uninterlondrina` |
| `horario` | M-O (POLOS) | `08:00 - 18:00` |
| `cursos` | CURSOS POR POLO | Lista de cursos do polo |
| `polosVizinhos` | POLOS VIZINHOS | Polos para indicação |

### 4.2 Variáveis que NÃO mudam (globais)

| Variável | Campo no Sheets | Valor |
|----------|----------------|-------|
| `marca` | CONFIG GLOBAL | `Uninter` |
| `googleAdsId` | CONFIG GLOBAL | `AW-18340100067` |
| `ga4Id` | CONFIG GLOBAL | `G-EYWM8KFX3D` |
| `webhookLead` | CONFIG GLOBAL | `api.opp4s.com/...` |
| `webhookTracking` | CONFIG GLOBAL | `api.opp4s.com/...` |

---

## 5. Google Sheets — Estrutura Real

### Aba: POLOS (já existe)

| Coluna | Campo | Tipo | Exemplo |
|--------|-------|------|---------|
| A | `poloId` | number | `85` |
| B | `poloSlug` | string | `londrina-centro-calcadao` |
| C | `poloNome` | string | `PAP LONDRINA (CENTRO CALÇADÃO) - PR` |
| D | `poloCidade` | string | `Londrina` |
| E | `poloUf` | string | `PR` |
| F | `habilitado` | boolean | `true` |
| G | `marca` | string | `` |
| H | `nomeCompleto` | string | `PAP LONDRINA (CENTRO CALÇADÃO) - PR` |
| I | `cidade` | string | `Londrina` |
| J | `uf` | string | `PR` |
| K | `whatsapp` | number | `5543998540300` |
| L | `telefone` | number | `4333612040` |
| M | `email` | string | `londrina@pap-uninter.com` |
| N | `endereco` | string | `Av. Paraná, 646 - Centro, Londrina - PR, 86010-390` |
| O | `mapsUrl` | string | `https://maps.app.goo.gl/...` |
| P | `horarioAtendimento` | string | `09 as 20h seg a sex` |
| Q | `cnpj` | number | `22797653000186` |
| R | `logoUrl` | string | `` |
| S | `ga4` | string | `G-EYWM8KFX3D` |
| T | `googleAdsId` | string | `AW-18340100067` |
| U | `googleAdsLabel` | string | `` |
| V | `clarityId` | string | `xqnghrws2k` |
| W | `instagram` | string | `` |
| X | `facebook` | string | `` |
| Y | `whatsappMsg` | string | `` |

### Aba: CURSOS POR POLO

| Coluna | Campo | Tipo | Exemplo |
|--------|-------|------|---------|
| A | `polo_id` | string | `londrina-centro-calcadao` |
| B | `curso_slug` | string | `administracao` |
| C | `curso_nome` | string | `Administração` |
| D | `nivel` | string | `graduacao` |
| E | `modalidade` | string | `ead` |
| F | `duracao` | string | `4 anos` |
| G | `mensalidade` | string | `R$ 299,00` |
| H | `status` | string | `disponivel` |

### Aba: POLOS VIZINHOS

| Coluna | Campo | Tipo | Exemplo |
|--------|-------|------|---------|
| A | `polo_origem` | string | `londrina-centro-calcadao` |
| B | `polo_destino` | string | `curitiba-centro` |
| C | `polo_destino_nome` | string | `Curitiba Centro` |
| D | `polo_destino_whatsapp` | string | `41999998888` |

### Aba: CONFIGURAÇÃO GLOBAL

| Coluna | Campo | Valor |
|--------|-------|-------|
| A | `marca` | Uninter |
| B | `nome_completo` | Universidade Interamericana |
| C | `gtm_id` | GTM-52XTDH8D |
| D | `google_ads_id` | AW-18340100067 |
| E | `ga4_id` | G-EYWM8KFX3D |
| F | `webhook_lead` | https://api.opp4s.com/webhook/leads_lp_polos_uninter_tenant |
| G | `webhook_tracking` | https://api.opp4s.com/webhook/uninter-tracking |

---

## 6. Sistema de Tracking

### O que rastreia

| Dado | Como | Por que importa |
|------|------|-----------------|
| **Polo de origem** | `config/polo.js` | Sabe qual polo converte mais |
| **De onde veio o lead** | UTM parameters | Sabe qual canal/campanha traz leads |
| **Qual botão WhatsApp** | `data-wa-pos` | Sabe qual seção converte mais |
| **Curso de interesse** | Slug no clique | Sabe qual curso gera mais lead |
| **Navegação** | Scroll, buscas, filtros | Mede engajamento real |

### Payload enriquecido

```json
{
  "poloId": 85,
  "poloSlug": "londrina-centro-calcadao",
  "poloNome": "PAP LONDRINA (CENTRO CALÇADÃO) - PR",
  "poloCidade": "Londrina",
  "poloUf": "PR",
  "habilitado": true,
  "email": "londrina@pap-uninter.com",
  "telefone": 4333612040,
  "endereco": "Av. Paraná, 646 - Centro, Londrina - PR, 86010-390",
  "cnpj": 22797653000186,
  "nome": "João",
  "whatsapp": "5543998540300",
  "curso": "administracao",
  "utm_source": "google",
  "utm_medium": "cpc",
  "wa_clicks": [{"pos": "hero", "ts": "..."}],
  "scroll_depth": 85,
  "buscas": ["admin"],
  "secoes_vistas": ["hero", "vantagens"],
  "tempo_na_pagina": 187
}
```

---

## 7. Como Adicionar um Novo Polo

### Passo 1: Preencher o Google Sheets

1. Aba POLOS: adicionar linha com dados do novo polo
2. Campos obrigatórios: `poloId`, `poloSlug`, `poloNome`, `poloCidade`, `poloUf`, `habilitado`, `whatsapp`, `email`, `endereco`, `cnpj`
3. Campos de analytics: `ga4`, `googleAdsId` (cada polo tem os seus!)

### Passo 2: Deploy automático

Workflow n8n: https://n8n.opp4s.com/workflow/YJRnBmFK5w3vKN0w

1. Lê o Google Sheets
2. Gera `config/polo.js` para o novo polo
3. Cria branch `polo/{slug}` no repositório
4. Deploy automático no Cloudflare Pages

### Passo 3: Configurar domínio

1. Adicionar domínio no Cloudflare Pages
2. Configurar DNS para apontar para o deploy
3. Cada polo tem domínio próprio: `uninter{cidade}.com`

---

## 8. Arquivos de Referência

| Arquivo | Conteúdo |
|---------|----------|
| `config/uninter.js` | Configuração global |
| `config/polo.js` | Configuração do polo (template) |
| `js/tracking.js` | Sistema de tracking |
| `VARIAVEIS-SHEETS.md` | Estrutura da planilha |
| `ALTERACOES-APP-JS.md` | Alterações no app.js |
| `ALTERACOES-LEAD-JS.md` | Alterações no lead.js |
| `ALTERACOES-HTML.md` | Alterações nos HTMLs |
| `GA4-CODIGO.md` | Instalação do GA4 |
| `GUIA-IMPLEMENTACAO.md` | Passo a passo |

---

*Documentação atualizada em Agosto 2026 — Arquitetura Multi-Polo*
