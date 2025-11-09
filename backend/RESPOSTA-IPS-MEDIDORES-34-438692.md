# 🔍 Resposta: IPs dos Medidores 34 e 438692

## 📊 Situação Atual

**Medidor 34:**
- ❌ **IP: NÃO REGISTRADO (NULL)**
- Status: ONLINE
- Última comunicação: 07/11/2025, 17:46:35 (há ~27 horas)
- Total de leituras: 1

**Medidor 438692:**
- ❌ **IP: NÃO REGISTRADO (NULL)**
- Status: ONLINE  
- Última comunicação: 07/11/2025, 22:28:15 (há ~22 horas)
- Total de leituras: 6.405

---

## 🔍 Por que os IPs não foram registrados?

O sistema só salva o IP no banco de dados quando consegue extraí-lo corretamente da requisição HTTP. Se o IP for `"unknown"`, ele **não é salvo**.

Quando esses medidores enviaram dados, o servidor não conseguiu determinar o IP de origem, resultando em `"unknown"`, que não foi salvo no banco.

### Possíveis Causas:

1. **Proxy/Load Balancer**: As requisições podem ter vindo através de um proxy que não passou os headers corretos (`x-forwarded-for`, `x-real-ip`)
2. **Configuração de Rede**: Os medidores podem estar usando uma configuração de rede que oculta o IP de origem
3. **Nginx/Reverse Proxy**: Se houver nginx na frente, ele pode não estar configurado para passar os headers de IP
4. **Conexão Indireta**: Os medidores podem estar se conectando através de um gateway ou roteador que não expõe o IP real

---

## 💡 Como Descobrir os IPs

### 1. Verificar Logs do Servidor NestJS ⭐ (MAIS IMPORTANTE)

Os logs do servidor devem conter o IP mesmo quando é "unknown". Procure por:

```bash
# Nos logs do servidor, procure por:
"IP do cliente: <IP>"
"MeterId: 34"
"MeterId: 438692"
```

**Onde procurar:**
- Console onde o servidor NestJS está rodando
- Arquivos de log do servidor (se houver)
- Logs do Docker (se estiver usando Docker)
- Logs do sistema (systemd, PM2, etc.)

**Comando para verificar logs recentes:**
```bash
# Se usar PM2
pm2 logs

# Se usar Docker
docker logs <container-name>

# Se usar systemd
journalctl -u <service-name> -f
```

### 2. Verificar Logs do Nginx (se houver)

Se houver nginx como reverse proxy, verifique os logs de acesso:

```bash
# Verificar logs do nginx
tail -f /var/log/nginx/access.log | grep "medidor"

# Ou procurar por requisições POST
grep "POST /api/eletroon/medidor" /var/log/nginx/access.log
```

Os logs do nginx devem mostrar o IP de origem real nas requisições.

### 3. Monitorar em Tempo Real

Quando os medidores enviarem dados novamente, monitore os logs em tempo real:

```bash
# Monitorar logs do servidor
tail -f <caminho-do-log> | grep -E "34|438692"

# Ou monitorar via console do servidor
```

O sistema tentará capturar o IP novamente quando os medidores enviarem dados.

### 4. Verificar Configuração do Nginx

Se houver nginx, verifique se está configurado para passar os headers de IP:

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

### 5. Consultar Banco de Dados Diretamente

Execute a query SQL para verificar o estado atual:

```sql
SELECT 
    "meterId",
    name,
    "ipAddress",
    status,
    "updatedAt"
FROM "Device"
WHERE "meterId" IN (34, 438692);
```

### 6. Verificar Configuração de Rede dos Medidores

- Verificar a configuração de rede dos medidores físicos
- Verificar se estão conectados diretamente à rede ou através de gateway
- Verificar configurações de firewall ou NAT que possam ocultar o IP

---

## 🛠️ Scripts Disponíveis

1. **`investigate-meter-ips.js`** - Investigação detalhada dos medidores
2. **`monitor-meter-ips.js`** - Monitoramento dos medidores
3. **`query-ips-medidores.sql`** - Queries SQL para verificar no banco

Execute:
```bash
cd backend
node investigate-meter-ips.js
node monitor-meter-ips.js
```

---

## 📋 Próximos Passos Recomendados

1. ✅ **Verificar logs do servidor** quando os medidores enviarem dados
2. ✅ **Verificar configuração do nginx** (se houver)
3. ✅ **Aguardar próxima requisição** dos medidores e monitorar logs em tempo real
4. ✅ **Verificar configuração de rede** dos medidores físicos
5. ✅ **Melhorar captura de IP** adicionando mais fontes de IP ou logging adicional

---

## 🔧 Melhoria Sugerida

Para evitar esse problema no futuro, você pode:

1. **Adicionar logging mais detalhado** mesmo quando o IP for "unknown"
2. **Salvar "unknown" no banco** para rastreamento (ao invés de NULL)
3. **Adicionar histórico de IPs** para rastrear mudanças
4. **Melhorar extração de IP** adicionando mais fontes (ex: Cloudflare headers, etc.)

---

## 📝 Resumo

**Resposta Direta:**
- **Medidor 34**: IP não registrado (NULL) - precisa verificar logs do servidor
- **Medidor 438692**: IP não registrado (NULL) - precisa verificar logs do servidor

**Para descobrir os IPs:**
1. Verificar logs do servidor NestJS no momento em que os medidores enviaram dados
2. Verificar logs do nginx (se houver)
3. Aguardar próxima requisição e monitorar logs em tempo real
4. Verificar configuração de rede dos medidores

Os IPs devem aparecer nos logs do servidor mesmo que não tenham sido salvos no banco, pois o sistema tenta extrair o IP e loga o resultado (incluindo "unknown").

