# Fix W5 - Uninter Endpoint LP (cursos por polo)

**Workflow ID:** `bqcFBkTFajRFSXZx`
**Problema:** Campos `ga4`, `googleAdsId`, `clarityId` retornam `null` mesmo tendo valores no Sheets
**Causa:** SQL não seleciona campos de analytics da tabela `polos`
**Status:** ✅ Aplicado e testado (18/08/2026)
**Resultado:** Endpoint agora retorna `poloInfo.ga4`, `poloInfo.googleAdsId`, `poloInfo.clarityId`

---

## Node 1: "Valida polo"

### Código ATUAL

```javascript
const bruto = ($json.query && $json.query.polo) || '';
const poloSlug = String(bruto).toLowerCase().trim().replace(/[^a-z0-9-]/g, '');

if (!poloSlug) {
  return [{ json: { poloSlug: '', query: 'SELECT NULL WHERE false;' } }];
}

const query = `
SELECT lp.polo_slug, lp.polo_nome, lp.payload, lp.publicado_em
FROM lp_publicado lp
JOIN polos pl ON pl.slug = lp.polo_slug AND pl.habilitado = true
WHERE lp.polo_slug = '${poloSlug}'
   OR lp.polo_slug LIKE '${poloSlug}-%'
   OR lower(lp.cidade) = '${poloSlug}';`;

return [{ json: { poloSlug, query } }];
```

### Código CORRIGIDO

```javascript
// Sanitiza o slug ANTES de tocar no SQL. So [a-z0-9-] sobrevive: isso elimina injecao
// (o valor vem da querystring publica) e permite embutir o slug direto no SQL.
//
// POR QUE NAO USAR queryReplacement: nao lida com $1 REPETIDO (o WHERE usa 3 vezes) e,
// quando o valor resolve vazio, manda ZERO valores e o Postgres reclama do $1.
// Mesma familia do bug "$13" do W4b. O SQL e montado aqui.
//
// BASE BLINDADA: le de lp_publicado (a foto aprovada pelo W6 Guardiao), NAO mais de
// cursos+precos. Uma coleta ruim nao chega mais na LP sem passar pelo gate.
//
// FIX 2026-08-18: Seleciona campos de analytics (ga4, google_ads_id, etc.) da tabela
// polos para que a LP saiba quais IDs de tracking usar por polo.
const bruto = ($json.query && $json.query.polo) || '';
const poloSlug = String(bruto).toLowerCase().trim().replace(/[^a-z0-9-]/g, '');

if (!poloSlug) {
  // Sem slug nao ha o que consultar. A query no-op mantem o fluxo vivo ate o transform,
  // que devolve 400 -- o node de Postgres precisa emitir algo pro Respond chegar a rodar.
  return [{ json: { poloSlug: '', query: 'SELECT NULL WHERE false;' } }];
}

// O JOIN com polos mantem o desligamento na Sheet valendo na hora: despublicar um polo
// derruba o endpoint dele mesmo com a foto ainda gravada em lp_publicado.
// SELECT inclui campos de analytics da tabela polos para a LP configurar tracking.
const query = `
SELECT lp.polo_slug, lp.polo_nome, lp.payload, lp.publicado_em,
       pl.ga4, pl.google_ads_id, pl.google_ads_label, pl.clarity_id
FROM lp_publicado lp
JOIN polos pl ON pl.slug = lp.polo_slug AND pl.habilitado = true
WHERE lp.polo_slug = '${poloSlug}'
   OR lp.polo_slug LIKE '${poloSlug}-%'
   OR lower(lp.cidade) = '${poloSlug}';`;

return [{ json: { poloSlug, query } }];
```

---

## Node 2: "Entrega foto publicada"

### Código ATUAL

```javascript
const rows = $input.all().map((i) => i.json).filter((r) => r && r.payload);
const poloSlug = $('Valida polo').first().json.poloSlug;

if (!poloSlug) {
  return [{ json: { statusCode: 400, body: { erro: 'parametro polo ausente', exemplo: '/uninter-cursos?polo=londrina' } } }];
}
if (!rows.length) {
  return [{ json: { statusCode: 404, body: { erro: 'polo nao encontrado', polo: poloSlug } } }];
}

if (rows.length > 1) {
  return [{ json: { statusCode: 409, body: {
    erro: 'slug ambiguo: mais de um polo habilitado corresponde',
    polo: poloSlug, candidatos: rows.map((r) => r.polo_slug).sort(),
    solucao: 'chame o endpoint com o slug exato do polo desejado'
  } } }];
}

const raw = rows[0].payload;
const body = typeof raw === 'string' ? JSON.parse(raw) : raw;

return [{ json: { statusCode: 200, body } }];
```

### Código CORRIGIDO

```javascript
// LEITOR FINO da base blindada. Toda a regra de transformacao mora no W6 Guardiao —
// aqui nao ha transform nenhum, so entrega da foto ja aprovada. Fonte unica de verdade:
// se a regra mudar, muda no W6 e nada aqui precisa acompanhar.
//
// alwaysOutputData no node de Postgres faz 0 linhas virar 1 item vazio; por isso filtro
// por `payload` em vez de confiar na contagem de itens.
//
// FIX 2026-08-18: Inclui campos de analytics (ga4, googleAdsId, clarityId) no poloInfo
// da resposta para que a LP saiba quais IDs de tracking usar.
const rows = $input.all().map((i) => i.json).filter((r) => r && r.payload);
const poloSlug = $('Valida polo').first().json.poloSlug;

if (!poloSlug) {
  return [{ json: { statusCode: 400, body: { erro: 'parametro polo ausente', exemplo: '/uninter-cursos?polo=londrina' } } }];
}
if (!rows.length) {
  // Sem linhas = polo inexistente/desabilitado, ou ainda nunca publicado pelo W6 -> 404.
  return [{ json: { statusCode: 404, body: { erro: 'polo nao encontrado', polo: poloSlug } } }];
}

// AMBIGUIDADE: o slug curto ('londrina') casa por prefixo/cidade e pode pegar MAIS DE UM
// polo publicado (ex.: londrina-centro-calcadao + londrina-shopping). Servir um dos dois
// em silencio publicaria um preco que o outro polo nao pratica. Falhar alto (409) e melhor.
if (rows.length > 1) {
  return [{ json: { statusCode: 409, body: {
    erro: 'slug ambiguo: mais de um polo habilitado corresponde',
    polo: poloSlug, candidatos: rows.map((r) => r.polo_slug).sort(),
    solucao: 'chame o endpoint com o slug exato do polo desejado'
  } } }];
}

// jsonb pode voltar como objeto OU string dependendo do driver/versao — aceitar os dois.
const raw = rows[0].payload;
const body = typeof raw === 'string' ? JSON.parse(raw) : raw;

// Enriquece o poloInfo com campos de analytics vindos da tabela polos.
// A LP usa esses IDs para configurar GA4, Google Ads e Clarity por polo.
if (body.poloInfo) {
  body.poloInfo.ga4 = rows[0].ga4 || null;
  body.poloInfo.googleAdsId = rows[0].google_ads_id || null;
  body.poloInfo.googleAdsLabel = rows[0].google_ads_label || null;
  body.poloInfo.clarityId = rows[0].clarity_id || null;
}

return [{ json: { statusCode: 200, body } }];
```

---

## Resposta esperada após o fix

```json
{
  "polo": "PAP LONDRINA (CENTRO CALÇADÃO) - PR",
  "totais": { ... },
  "poloInfo": {
    "slug": "londrina-centro-calcadao",
    "nomeCompleto": "PAP LONDRINA (CENTRO CALÇADÃO) - PR",
    "cidade": "Londrina",
    "uf": "PR",
    "whatsapp": "5543998540300",
    "telefone": "4333612040",
    "email": "londrina@pap-uninter.com",
    "endereco": "Av. Paraná, 646 - Centro, Londrina - PR, 86010-390",
    "ga4": "G-EYWM8KFX3D",              // ← AGORA COM VALOR
    "googleAdsId": "AW-18340100067",    // ← AGORA COM VALOR
    "googleAdsLabel": null,
    "clarityId": "xqnghrws2k",
    "mapsUrl": "https://maps.app.goo.gl/PCukMkvgiDBn2mBLA",
    "horarioAtendimento": "09 as 20h seg a sex",
    "cnpj": "22797653000186"
  },
  "cursos": [ ... ]
}
```

---

## Como aplicar

1. Acessar n8n: https://n8n.opp4s.com/workflow/bqcFBkTFajRFSXZx
2. Node **"Valida polo"** → substituir código pelo "Código CORRIGIDO"
3. Node **"Entrega foto publicada"** → substituir código pelo "Código CORRIGIDO"
4. Salvar e ativar
5. Testar: `GET https://api.opp4s.com/webhook/uninter-cursos?polo=londrina-centro-calcadao`
6. Verificar que `poloInfo.ga4` retorna `G-EYWM8KFX3D`
