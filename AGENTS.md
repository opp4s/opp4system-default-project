# AGENTS.md - Instruções para Agentes de IA

Este arquivo contém instruções para agentes de IA que trabalham neste projeto.

---

## Localização dos Documentos de Infraestrutura

### Documentação da VPS

**Localização local:**
```
docs/infra/VPS-185-209-228-202.md
```

**Localização na VPS:**
```
/opt/scripts/VPS-DOCUMENTATION.md
```

**Localização no GitHub:**
```
docs/infra/VPS-185-209-228-202.md
```

---

## Regras de Sincronização

### AO LER documentação de infraestrutura:
1. **SEMPRE** ler primeiro o arquivo local: `docs/infra/VPS-185-209-228-202.md`
2. Se precisar de informações atualizadas, conectar na VPS via SSH
3. **NUNCA** assumir que o arquivo local está 100% atualizado

### AO ATUALIZAR documentação de infraestrutura:
1. Atualizar o arquivo local: `docs/infra/VPS-185-209-228-202.md`
2. Atualizar o arquivo na VPS: `/opt/scripts/VPS-DOCUMENTATION.md`
3. Fazer commit e push para o GitHub
4. **CONFIRMAR** que ambas as localizações foram atualizadas

### Fluxo de atualização:
```
1. Editar docs/infra/VPS-185-209-228-202.md (local)
2. scp docs/infra/VPS-185-209-228-202.md vps:/opt/scripts/VPS-DOCUMENTATION.md
3. git add docs/infra/VPS-185-209-228-202.md
4. git commit -m "docs: atualiza documentação VPS"
5. git push
```

---

## Estrutura de Documentação

```
docs/
└── infra/
    └── VPS-185-209-228-202.md    # Documentação completa da VPS
```

---

## Informações da VPS

| Campo | Valor |
|-------|-------|
| **IP** | 185.209.228.202 |
| **SSH Alias** | vps |
| **SO** | Ubuntu 24.04.4 LTS |
| **RAM** | 23GB |
| **Disco** | 193GB |
| **Principal** | n8n, Evolution API, Agents SaaS |

---

## Comandos de Acesso

```bash
# Conectar na VPS
ssh vps

# Ver status geral
ssh vps "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Ver logs importantes
ssh vps "cat /var/log/docker-restart.log"
ssh vps "cat /var/log/n8n-prune.log"

# Verificar cron
ssh vps "crontab -l"

# Verificar timers
ssh vps "systemctl list-timers --all"
```

---

## Monitoramento

### Uptime Kuma
- **URL:** http://172.18.0.1:3001
- **Credenciais:** admin / A305740a@
- **Notificação:** Telegram (@OPP4S_Monitor_bot)

### Scripts de Notificação
- `/opt/apps/multica-notify.sh` - Envia mensagens Telegram
- `/opt/scripts/restart-docker.sh` - Restart semanal com notificação

---

## Credenciais

**Localização:** `/etc/opp4s/keychain.env` (na VPS)

| Variável | Uso |
|----------|-----|
| TELEGRAM_BOT_TOKEN | Bot Telegram |
| TELEGRAM_CHAT_ID | Chat de destino |

---

## Importante

- **NUNCA** expor credenciais em logs ou mensagens
- **SEMPRE** usar o SSH alias `vps` para conexão
- **SEMPRE** sincronizar documentação entre local, VPS e GitHub
- **VERIFICAR** antes de fazer mudanças na VPS (ler documentação primeiro)
