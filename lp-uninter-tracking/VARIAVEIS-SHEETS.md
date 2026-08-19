# Planilha de Variáveis — LP Uninter Multi-Polo

**URL:** https://n8n.opp4s.com/workflow/YJRnBmFK5w3vKN0w
**Nome:** Planilha de polos (já existe)
**Status:** ✅ Funcionando ( WF2 sincroniza Sheets → PostgreSQL + Redis)

---

## Estrutura Real do Sheets

A planilha já existe e é consumida pelo workflow n8n. Estes são os campos reais:

### Aba: POLOS (estreal)

| Coluna | Campo | Tipo | Exemplo | Obrigatório |
|--------|-------|------|---------|-------------|
| A | `poloId` | number | `85` | Sim |
| B | `poloSlug` | string | `londrina-centro-calcadao` | Sim |
| C | `poloNome` | string | `PAP LONDRINA (CENTRO CALÇADÃO) - PR` | Sim |
| D | `poloCidade` | string | `Londrina` | Sim |
| E | `poloUf` | string | `PR` | Sim |
| F | `habilitado` | boolean | `true` | Sim |
| G | `marca` | string | `` | Não |
| H | `nomeCompleto` | string | `PAP LONDRINA (CENTRO CALÇADÃO) - PR` | Sim |
| I | `cidade` | string | `Londrina` | Sim |
| J | `uf` | string | `PR` | Sim |
| K | `whatsapp` | number | `5543998540300` | Sim |
| L | `telefone` | number | `4333612040` | Não |
| M | `email` | string | `londrina@pap-uninter.com` | Sim |
| N | `endereco` | string | `Av. Paraná, 646 - Centro, Londrina - PR, 86010-390` | Sim |
| O | `mapsUrl` | string | `https://maps.app.goo.gl/...` | Não |
| P | `horarioAtendimento` | string | `09 as 20h seg a sex` | Não |
| Q | `cnpj` | number | `22797653000186` | Sim |
| R | `logoUrl` | string | `` | Não |
| S | `ga4` | string | `G-EYWM8KFX3D` | **Sim (por polo)** |
| T | `googleAdsId` | string | `AW-18340100067` | **Sim (por polo)** |
| U | `googleAdsLabel` | string | `` | Não |
| V | `clarityId` | string | `xqnghrws2k` | Não |
| W | `instagram` | string | `` | Não |
| X | `facebook` | string | `` | Não |
| Y | `whatsappMsg` | string | `` | Não |

---

## Campos que MUDAM por polo (analytics)

| Campo | Descrição | Exemplo (Londrina) | Exemplo (Rolândia) |
|-------|-----------|--------------------|--------------------|
| `ga4` | Google Analytics 4 | `G-EYWM8KFX3D` | `` (usa global) |
| `googleAdsId` | Google Ads | `AW-18340100067` | `` (usa global) |
| `googleAdsLabel` | Label de conversão | `` | `` |
| `clarityId` | Microsoft Clarity | `xqnghrws2k` | `` |

**Regra:** Se o campo estiver vazio, usa o fallback global de `config/uninter.js`.

---

## Campos que MUDAM por polo (contato)

| Campo | Descrição | Exemplo (Londrina) | Exemplo (Rolândia) |
|-------|-----------|--------------------|--------------------|
| `poloId` | ID numérico | `85` | `57` |
| `poloSlug` | Slug URL | `londrina-centro-calcadao` | `rolandia` |
| `poloNome` | Nome completo | `PAP LONDRINA (CENTRO CALÇADÃO) - PR` | `PAP ROLÂNDIA - PR` |
| `poloCidade` | Cidade | `Londrina` | `Rolândia` |
| `poloUf` | Estado | `PR` | `PR` |
| `whatsapp` | WhatsApp (com 55) | `5543998540300` | `554332564465` |
| `telefone` | Telefone fixo | `4333612040` | `4332564465` |
| `email` | Email do polo | `londrina@pap-uninter.com` | `polorolandia@uninter.com` |
| `endereco` | Endereço completo | `Av. Paraná, 646...` | `R. Santos Dumont, 783...` |
| `mapsUrl` | Link do Google Maps | `https://maps.app.goo.gl/...` | `https://maps.app.goo.gl/...` |
| `horarioAtendimento` | Horário | `09 as 20h seg a sex` | `09:00–12:00, 14:00–20:00 seg a sex` |
| `cnpj` | CNPJ | `22797653000186` | `9309561000141` |

---

## Campos que NÃO mudam (globais)

Estes campos estão em `config/uninter.js` e são usados como fallback:

| Campo | Valor |
|-------|-------|
| `gtmId` | `GTM-52XTDH8D` |
| `googleAdsId` | `AW-18340100067` |
| `ga4Id` | `G-EYWM8KFX3D` |
| `webhookLead` | `https://api.opp4s.com/webhook/leads_lp_polos_uninter_tenant` |
| `webhookTracking` | `https://api.opp4s.com/webhook/uninter-tracking` |

---

## Como funciona o fallback

```javascript
// No polo.js:
ga4: "G-EYWM8KFX3D",              // Polo有自己的GA4
googleAdsId: "AW-18340100067",    // Polo有自己的Google Ads

// Se o polo não tiver GA4:
ga4: "",                          // Campo vazio no Sheets
// → usa UninterConfig.ga4Id como fallback
```

---

## Resumo por polo

### Londrina (poloId: 85)

| Campo | Valor |
|-------|-------|
| `poloSlug` | `londrina-centro-calcadao` |
| `habilitado` | `true` |
| `whatsapp` | `5543998540300` |
| `email` | `londrina@pap-uninter.com` |
| `ga4` | `G-EYWM8KFX3D` |
| `googleAdsId` | `AW-18340100067` |
| `clarityId` | `xqnghrws2k` |

### Rolândia (poloId: 57)

| Campo | Valor |
|-------|-------|
| `poloSlug` | `rolandia` |
| `habilitado` | `false` |
| `whatsapp` | `554332564465` |
| `email` | `polorolandia@uninter.com` |
| `ga4` | `` (usa global) |
| `googleAdsId` | `` (usa global) |
| `clarityId` | `` |

---

## Nota sobre domínios

Cada polo terá um domínio diferente:
- `uninterlondrina.com` → polo Londrina
- `uninterrolandia.com` → polo Rolândia
- etc.

O GA4 e Google Ads de cada polo são independentes porque os domínios são diferentes. O tracking por polo é feito via `poloSlug` no payload.

---

## Workflow n8n

**URL:** https://n8n.opp4s.com/workflow/YJRnBmFK5w3vKN0w

Este workflow:
1. Lê a planilha do Google Sheets
2. Captura os dados de cada polo
3. Gera `config/polo.js` para cada polo ativo
4. Faz deploy no Cloudflare Pages
