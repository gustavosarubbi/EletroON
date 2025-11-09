# 📊 Resumo: IPs de Origem dos Medidores

## 🌐 Como os IPs são Capturados

Os IPs listados abaixo são os **IPs de origem** das requisições HTTP que os medidores fazem ao servidor quando enviam dados.

O sistema captura o IP na seguinte ordem de prioridade:
1. **Header `x-forwarded-for`** (quando há proxy/load balancer)
2. **Header `x-real-ip`** (quando há nginx como proxy reverso)
3. **`req.ip`** (IP direto da conexão)
4. **`socket.remoteAddress`** (IP do socket)

---

## 📋 Lista de Medidores e seus IPs de Origem

| ID | IP de Origem | Nome | Status | Última Comunicação |
|---|---|---|---|---|
| 1 | **192.168.15.147** | Medidor 1 | ONLINE | 08/11/2025, 20:46:08 |
| 2 | **192.168.15.70** | Medidor 2 | ONLINE | 08/11/2025, 20:45:14 |
| 3 | **192.168.15.45** | Medidor 3 | ONLINE | 08/11/2025, 20:45:37 |
| 4 | **192.168.15.161** | Medidor 4 | ONLINE | 08/11/2025, 20:45:17 |
| 5 | **192.168.15.8** | Medidor 5 | ONLINE | 08/11/2025, 20:46:01 |
| 6 | **192.168.15.66** | Medidor 6 | ONLINE | 08/11/2025, 20:46:10 |
| 7 | **192.168.15.53** | Medidor 7 | ONLINE | 08/11/2025, 20:45:42 |
| 8 | **192.168.15.146** | Medidor 8 | ONLINE | 08/11/2025, 20:46:10 |
| 9 | **192.168.15.200** | Medidor 9 | ONLINE | 08/11/2025, 20:46:07 |
| 10 | **192.168.15.85** | Medidor 10 | ONLINE | 08/11/2025, 20:46:02 |
| 11 | **192.168.15.12** | Medidor 11 | ONLINE | 08/11/2025, 20:45:46 |
| 13 | **192.168.15.103** | Medidor 13 | ONLINE | 08/11/2025, 20:46:12 |
| 14 | **192.168.15.165** | Medidor 14 | ONLINE | 08/11/2025, 20:45:50 |
| 34 | **N/A** | Medidor 34 | ONLINE | 07/11/2025, 17:46:35 |
| 438692 | **N/A** | Medidor 438692 | ONLINE | 07/11/2025, 22:28:15 |

---

## 📊 Estatísticas

- **Total de Medidores:** 15
- **IPs Únicos:** 14 (13 com IP, 2 sem IP)
- **Rede:** Todos os medidores estão na rede `192.168.15.0/24`
- **Status:** Todos estão ONLINE

---

## 🔍 Observações Importantes

1. **Rede Local:** Todos os medidores estão na mesma rede local (`192.168.15.x`)
2. **IP Único por Medidor:** Cada medidor tem seu próprio IP único
3. **Medidores sem IP:** 
   - Medidor 34: Última comunicação em 07/11/2025
   - Medidor 438692: Última comunicação em 07/11/2025
4. **Atualização Automática:** Os IPs são atualizados automaticamente sempre que um medidor envia dados
5. **Formato IPv6 Mapeado:** Os IPs são armazenados no formato `::ffff:192.168.15.x` no banco, mas são exibidos como IPv4 (`192.168.15.x`)

---

## 🛠️ Scripts Disponíveis

- **`list-meters.js`** - Lista todos os medidores (ID, IP, Nome)
- **`list-meter-ips.js`** - Lista medidores com detalhes de IP de origem e última comunicação
- **`query-medidores.sql`** - Query SQL para consulta direta no banco

---

## 📝 Notas Técnicas

- Os IPs são capturados pelo serviço `IpExtractorService`
- Os IPs são salvos no campo `ipAddress` da tabela `Device`
- Os IPs são atualizados a cada requisição do medidor
- Se o IP não puder ser determinado, o valor será `null` ou `'unknown'`

