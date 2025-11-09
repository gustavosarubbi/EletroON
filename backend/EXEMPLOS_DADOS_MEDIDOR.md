# Exemplos de Dados que Chegam do Medidor ESP8266

Este documento mostra exemplos de como os dados podem chegar do medidor para a API.

## IP: 192.168.15.147 (ID: 1)

### Exemplo 1: Dados em formato JSON com ID no body

**Headers:**
```
POST /api/eletroon/medidor HTTP/1.1
Host: 192.168.15.175:3000
User-Agent: ESP8266HTTPClient
Content-Type: application/json
Content-Length: 586
Connection: keep-alive
Accept-Encoding: identity;q=1,chunked;q=0.1,*;q=0
```

**Body (JSON):**
```json
{
  "id": 1,
  "pa": 1234,
  "pb": 5678,
  "pc": 9012,
  "pt": 16024,
  "qa": 100,
  "qb": 200,
  "qc": 300,
  "qt": 600,
  "epa_c": 1000,
  "epb_c": 2000,
  "epc_c": 3000,
  "ept_c": 6000,
  "epa_g": 500,
  "epb_g": 600,
  "epc_g": 700,
  "ept_g": 1800,
  "iarms": 10,
  "ibrms": 11,
  "icrms": 12,
  "uarms": 220,
  "ubrms": 221,
  "ucrms": 222,
  "pfa": 0.95,
  "pfb": 0.96,
  "pfc": 0.97,
  "pft": 0.96
}
```

### Exemplo 2: Dados em formato JSON com ID no header

**Headers:**
```
POST /api/eletroon/medidor HTTP/1.1
Host: 192.168.15.175:3000
User-Agent: ESP8266HTTPClient
Content-Type: application/json
Content-Length: 550
x-meter-id: 1
Connection: keep-alive
Accept-Encoding: identity;q=1,chunked;q=0.1,*;q=0
```

**Body (JSON - sem campo id):**
```json
{
  "pa": 1234,
  "pb": 5678,
  "pc": 9012,
  "pt": 16024,
  "qa": 100,
  "qb": 200,
  "qc": 300,
  "qt": 600,
  "epa_c": 1000,
  "epb_c": 2000,
  "epc_c": 3000,
  "ept_c": 6000,
  "epa_g": 500,
  "epb_g": 600,
  "epc_g": 700,
  "ept_g": 1800,
  "iarms": 10,
  "ibrms": 11,
  "icrms": 12,
  "uarms": 220,
  "ubrms": 221,
  "ucrms": 222,
  "pfa": 0.95,
  "pfb": 0.96,
  "pfc": 0.97,
  "pft": 0.96
}
```

### Exemplo 3: Dados em formato texto (text/plain)

**Headers:**
```
POST /api/eletroon/medidor HTTP/1.1
Host: 192.168.15.175:3000
User-Agent: ESP8266HTTPClient
Content-Type: text/plain
Content-Length: 200
x-meter-id: 1
Connection: keep-alive
Accept-Encoding: identity;q=1,chunked;q=0.1,*;q=0
```

**Body (texto):**
```
12:30:45:1234:5678:9012:16024:100:200:300:600:1000:2000:3000:6000:500:600:700:1800:10:11:12:220:221:222:0.95:0.96:0.97:0.96
13:30:45:1235:5679:9013:16027:101:201:301:603:1001:2001:3001:6003:501:601:701:1803:10.1:11.1:12.1:220.1:221.1:222.1:0.951:0.961:0.971:0.961
```

### Exemplo 4: Dados sem Content-Type (problema comum)

**Headers:**
```
POST /api/eletroon/medidor HTTP/1.1
Host: 192.168.15.175:3000
User-Agent: ESP8266HTTPClient
Content-Length: 586
Connection: keep-alive
Accept-Encoding: identity;q=1,chunked;q=0.1,*;q=0
```

**Body (JSON sem Content-Type):**
```json
{
  "id": 1,
  "pa": 1234,
  "pb": 5678,
  "pc": 9012,
  "pt": 16024,
  "qa": 100,
  "qb": 200,
  "qc": 300,
  "qt": 600,
  "epa_c": 1000,
  "epb_c": 2000,
  "epc_c": 3000,
  "ept_c": 6000,
  "epa_g": 500,
  "epb_g": 600,
  "epc_g": 700,
  "ept_g": 1800,
  "iarms": 10,
  "ibrms": 11,
  "icrms": 12,
  "uarms": 220,
  "ubrms": 221,
  "ucrms": 222,
  "pfa": 0.95,
  "pfb": 0.96,
  "pfc": 0.97,
  "pft": 0.96
}
```

### Exemplo 5: ID no query parameter

**Headers:**
```
POST /api/eletroon/medidor?meterId=1 HTTP/1.1
Host: 192.168.15.175:3000
User-Agent: ESP8266HTTPClient
Content-Type: application/json
Content-Length: 550
Connection: keep-alive
Accept-Encoding: identity;q=1,chunked;q=0.1,*;q=0
```

**Body (JSON - sem campo id):**
```json
{
  "pa": 1234,
  "pb": 5678,
  "pc": 9012,
  "pt": 16024,
  "qa": 100,
  "qb": 200,
  "qc": 300,
  "qt": 600,
  "epa_c": 1000,
  "epb_c": 2000,
  "epc_c": 3000,
  "ept_c": 6000,
  "epa_g": 500,
  "epb_g": 600,
  "epc_g": 700,
  "ept_g": 1800,
  "iarms": 10,
  "ibrms": 11,
  "icrms": 12,
  "uarms": 220,
  "ubrms": 221,
  "ucrms": 222,
  "pfa": 0.95,
  "pfb": 0.96,
  "pfc": 0.97,
  "pft": 0.96
}
```

## Variações de Headers para ID

O sistema aceita o ID em várias variações de headers (case-insensitive):

- `x-meter-id: 1`
- `X-Meter-Id: 1`
- `X-METER-ID: 1`
- `meter-id: 1`
- `Meter-Id: 1`
- `x-device-id: 1`
- `X-Device-Id: 1`
- `device-id: 1`
- `Device-Id: 1`
- `x-meterid: 1`
- `meterid: 1`

## Formato de Dados de Texto

O formato de texto esperado é:
```
hora:minuto:segundo:pa:pb:pc:pt:qa:qb:qc:qt:epa_c:epb_c:epc_c:ept_c:epa_g:epb_g:epc_g:ept_g:iarms:ibrms:icrms:uarms:ubrms:ucrms:pfa:pfb:pfc:pft
```

Cada linha representa uma leitura. Valores devem ser divididos por 100 (duas casas decimais de precisão).

## Problemas Comuns

1. **Body undefined mas há Content-Length**: Isso acontece quando o Content-Type não é reconhecido pelo parser padrão do NestJS. A solução é configurar o body parser para aceitar qualquer Content-Type (já implementado).

2. **ID não encontrado**: O sistema procura o ID em:
   - Campo `id` ou `meterId` no body JSON
   - Query parameter `meterId`
   - Headers `x-meter-id`, `x-device-id`, etc. (case-insensitive)

3. **Dados não processados**: Se os dados não estão sendo processados, verifique:
   - Se o Content-Type está correto
   - Se o body está sendo enviado
   - Se há algum middleware bloqueando a requisição

## Logs Esperados

Quando os dados chegam corretamente, você deve ver logs como:

```
📥 DADOS RECEBIDOS DO MEDIDOR
🌐 IP do Cliente: ::ffff:192.168.15.147
📦 Tipo do Body: object
📋 Body completo: { "id": 1, "pa": 1234, ... }
🔍 Query Params: {}
📨 Headers (RAW): { "host": "...", "content-type": "application/json", ... }
🔍 Iniciando extração do ID do medidor...
✅✅✅ ID VÁLIDO EXTRAÍDO: 1
🆔 RESULTADO FINAL - ID Extraído: ✅ 1
```

Se o ID não for encontrado, você verá:

```
❌ ERRO: ID DO MEDIDOR NÃO ENCONTRADO APÓS TODAS AS TENTATIVAS
```

E todos os detalhes do que foi recebido serão logados para debug.

