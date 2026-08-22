# Projeto Monitoramento E2E - ZavyCRM

## Visão Geral

Sistema automatizado de monitoramento que valida continuamente a saúde dos serviços do ZavyCRM. Executa testes a cada 30 minutos e envia alerta no WhatsApp **apenas quando uma falha é detectada**.

| Campo | Valor |
|-------|-------|
| **Workflow ID** | `cPTqqBJSbI1kQNB4` |
| **URL n8n** | https://n8n.opp4s.com/workflow/cPTqqBJSbI1kQNB4 |
| **VPS** | 185.209.228.202 (alias `vps`) |
| **Frequência** | A cada 30 minutos |
| **Status** | ✅ Ativo |
| **Canal de Alerta** | WhatsApp (Evolution API → 554199953255) |

---

## Fluxo do Workflow

```
Schedule (30min)
    │
    ▼
Testar OpenAI API ──────── salva em static data
    │
    ▼
Edit Fields (conta principal)
    │
    ▼
Call Gerar Link (impersonação)
    │
    ▼
Testar Endpoints (5 endpoints Supabase)
    │
    ▼
Tem falha?
    │
    ├── NÃO ──→ Montar Mensagem ──→ Tem Falha? ──→ (não envia, encerra)
    │                                         │
    └── SIM ──→ Extrair Usuários              │
                  │                           │
                  ▼                           │
              Filtrar Contas                  │
                  │                           │
                  ▼                           │
              Sortear 2 contas                │
                  │                           │
                  ▼                           │
              Loop Over Items                 │
                  │                           │
                  ▼                           │
              Testar Conta Secundária         │
                  │                           │
                  ▼                           │
              Comparar Resultados ────────────┘
                  │
                  ▼
              Montar Mensagem
                  │
                  ▼
              Tem Falha? (boolean)
                  │
                  ├── true ──→ Enviar WhatsApp
                  └── false ──→ (encerra)
```

---

## Nodes do Workflow

| # | Node | Tipo | Função |
|---|------|------|--------|
| 1 | **A cada 30 minutos** | Schedule Trigger | Dispara o workflow a cada 30min |
| 2 | **Testar OpenAI API** | Code | Testa integração OpenAI (conta superadmin) |
| 3 | **Edit Fields** | Set | Define email da conta principal |
| 4 | **Call Gerar Link** | Execute Workflow | Gera token via impersonação (WF: `X4UN0lV4ezFWcYR3`) |
| 5 | **Testar Endpoints** | Code | Testa 5 endpoints da conta principal |
| 6 | **Falha?** | If | Verifica se houve falha nos endpoints |
| 7 | **Call Extrair Usuarios** | Execute Workflow | Busca todas as contas ativas (WF: `6EJ1gp2MS4ESsq7P`) |
| 8 | **Filtrar Contas** | Code | Remove conta testada, mantém 1 por contaId |
| 9 | **Sortear 2** | Code | Embaralha e seleciona 2 contas |
| 10 | **Loop Over Items** | Split In Batches | Itera sobre contas sorteadas |
| 11 | **Testar Conta Secundaria** | Code | Testa endpoints em cada conta secundária |
| 12 | **Comparar Resultados** | Code | Verifica se erro persiste em múltiplas contas |
| 13 | **Montar Mensagem** | Code | Formata relatório de monitoramento |
| 14 | **Tem Falha?** | If | Decide se envia alerta (boolean `temFalha`) |
| 15 | **Enviar texto** | Evolution API | Envia mensagem via WhatsApp |

---

## Serviços Monitorados

### 1. Endpoints Supabase (conta principal)

| Endpoint | Tabela | O que valida |
|----------|--------|--------------|
| Conversas - Aberto | `SAAS_Conversas_Agentes` | Acesso a conversas com status "Aberto" |
| Conversas - IA | `SAAS_Conversas_Agentes` | Acesso a conversas com status "IA" |
| Contatos | `SAAS_Contatos` | Acesso à tabela de contatos |
| Conexões | `SAAS_Conexões` | Acesso à tabela de conexões WhatsApp |
| Agentes IA | `SAAS_AgentesIA` | Acesso à tabela de agentes IA |

### 2. Integração OpenAI (conta superadmin)

| Campo | Valor |
|-------|-------|
| Tabela | `SAAS_Config_IA` (id=1) |
| Endpoint | `api.openai.com/v1/chat/completions` |
| Modelos testados | `gpt-4.1-mini` → `gpt-4o-mini` (fallback) |
| Timeout | 30s por chamada |

---

## Lógica de Verificação

### Fluxo Normal (sem falha)

1. Testa OpenAI API → salva resultado em static data
2. Testa 5 endpoints na conta principal (`atendimento@opp4s.com`)
3. Se todos OK → encerra sem enviar mensagem

### Fluxo de Falha

1. Testa 5 endpoints na conta principal
2. Se algum falhar → busca outras contas ativas
3. Remove conta já testada
4. Mantém apenas 1 login por contaId
5. Sorteia 2 contas aleatoriamente
6. Testa cada uma
7. Compara se erro persiste
8. Se persiste → monta alerta e envia WhatsApp

### Decisão de Envio

O node **"Tem Falha?"** verifica o campo booleano `temFalha`:
- `true` → envia WhatsApp (falha confirmada)
- `false` → não envia nada (tudo operacional)

---

## Mensagem de Alerta

Enviada apenas quando há falha:

```
MONITORAMENTO E2E - ZAVYCRM
22/08/2026, 01:41:34

=== ENDPOINTS SUPABASE ===
Status: FALHA
Contas testadas: 3
Falha confirmada: SIM

Principal-Conversas-Aberto FAIL(400)
Principal-AgentesIA FAIL(500)

=== INTEGRACAO OPENAI ===
Status: FALHA
Modelo: gpt-4.1-mini
Latencia: 895ms
Erro: Rate limit exceeded

ACAO: Verificar servicos com falha
```

---

## Contas de Teste

| Conta | ContaID | Uso |
|-------|---------|-----|
| atendimento@opp4s.com | `9bd98a38-b867-42a7-8fad-546970beb161` | Conta principal (sempre testada) |
| Outras contas ativas | Variável | Sorteadas aleatoriamente (2 por ciclo) |

---

## Arquivos na VPS

| Caminho | Descrição |
|---------|-----------|
| `/opt/e2e-tests/test_endpoints.js` | Lógica de teste dos endpoints Supabase |
| `/opt/e2e-tests/test_openai_api.js` | Teste da integração OpenAI |
| `/opt/e2e-tests/node_filtrar.js` | Filtragem de contas |
| `/opt/e2e-tests/node_sortear.js` | Sorteio de contas |
| `/opt/e2e-tests/node_testar_conta.js` | Teste de conta secundária |
| `/opt/e2e-tests/node_comparar.js` | Comparação de resultados |
| `/opt/e2e-tests/alert.js` | Formatação da mensagem de alerta |
| `/opt/e2e-tests/config.env` | Variáveis de ambiente |

---

## Workflows Relacionados

| Workflow | ID | Função |
|----------|-----|--------|
| Gerar Link de Acesso | `X4UN0lV4ezFWcYR3` | Gera token via impersonação |
| Extrair Usuários por Conta | `6EJ1gp2MS4ESsq7P` | Lista contas ativas |

---

## Credenciais

| Serviço | Valor | Local |
|---------|-------|-------|
| Supabase URL | `yjnewkgajycamdbzhjnn.supabase.co` | Configurado no WF |
| Supabase Service Key | `sb_secret_ubw4C...` | Configurado no WF |
| Evolution API | Instancia: `3255_pessoal`, Numero: `554199953255` | Credencial n8n |
| n8n API Key | - | `/root/.ssh/` na VPS |

---

## Execução Manual

```bash
# Via CLI
ssh vps "node /opt/e2e-tests/test_openai_api.js"
ssh vps "node /opt/e2e-tests/test_endpoints.js"

# Via n8n
# Acessar https://n8n.opp4s.com/workflow/cPTqqBJSbI1kQNB4
# Clicar em "Execute Workflow"
```

---

## Monitamento

| Serviço | URL |
|---------|-----|
| Uptime Kuma | http://172.18.0.1:3001 |
| n8n Dashboard | https://n8n.opp4s.com |
| Execuções | https://n8n.opp4s.com/executions |

---

## Histórico de Problemas Corrigidos

### Foreign Key ausente no Supabase

```sql
ALTER TABLE "public"."SAAS_Conversas_Agentes"
ADD CONSTRAINT "SAAS_Conversas_Agentes_idAgente_fkey"
FOREIGN KEY ("idAgente")
REFERENCES "public"."SAAS_AgentesIA"("id")
ON DELETE SET NULL;
```

Causava erro 400 ao consultar conversas com status "Aberto" e "IA".

### Merge Resultados com campos obrigatórios

O node Merge do n8n exigia "Fields to Match" mesmo em modo append. Solução: substituído por Code node que repassa inputs.

### Mensagem enviada mesmo sem falha

O node "Tem Falha?" comparava texto na mensagem (instável). Solução: usar campo booleano `temFalha` retornado pelo node Montar Mensagem.

---

*Última atualização: 22/08/2026*
