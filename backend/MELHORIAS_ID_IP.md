# Melhorias: Padronização de ID e Captura de IP

## Resumo das Alterações

### 1. ✅ Campo IP no Banco de Dados
- Adicionado campo `ipAddress` no modelo `Device`
- Migration criada e aplicada: `20251108022956_add_ip_address_to_device`
- Índice criado para busca por IP

### 2. ✅ Extração Padronizada do ID do Medidor
- Criado método `extractMeterIdStandardized()` que verifica:
  1. Body JSON (campos: `id`, `meterId`, `meter_id`, `deviceId`, `device_id`)
  2. Query parameter (`meterId`)
  3. Headers (`x-meter-id`, `x-device-id`, `meter-id`, `device-id`)
  4. Fallback: campo numérico válido no body (não sendo campo de leitura)

### 3. ✅ Captura de IP do Cliente
- Criado método `extractClientIp()` que tenta obter IP de:
  1. Header `x-forwarded-for` (primeiro IP)
  2. Header `x-real-ip`
  3. `req.ip`
  4. `req.socket.remoteAddress`
  5. `'unknown'` se não conseguir

### 4. ✅ Validação Obrigatória do ID
- **ID do medidor é OBRIGATÓRIO**
- Se não for fornecido, a API **rejeita** a requisição
- Mensagem de erro informa:
  - IP do cliente
  - Formas de enviar o ID
  - Que medidor sem ID não pode enviar dados

### 5. ✅ Endpoint Unificado
- Removidos endpoints duplicados (`/medidor` e `/medidor/texto`)
- Criado endpoint único: `POST /api/eletroon/medidor`
- Aceita dados em formato JSON ou texto (text/plain)
- Detecta automaticamente o formato pelo Content-Type

### 6. ✅ Salvamento do IP
- IP é salvo automaticamente no banco ao processar dados
- IP é atualizado a cada requisição (último IP conhecido)
- IP é retornado nas listagens de dispositivos

## Formas de Enviar o ID do Medidor

### 1. No Body JSON (recomendado)
```json
{
  "id": 438692,
  "pa": 1000,
  "pb": 2000,
  ...
}
```
ou
```json
{
  "meterId": 438692,
  "pa": 1000,
  ...
}
```

### 2. Query Parameter
```
POST /api/eletroon/medidor?meterId=438692
```

### 3. Header HTTP
```
x-meter-id: 438692
```

### 4. Para Dados em Texto
```
POST /api/eletroon/medidor?meterId=438692
Content-Type: text/plain

0:6:16:9:1336:0:1346:...
```

ou

```
POST /api/eletroon/medidor
x-meter-id: 438692
Content-Type: text/plain

0:6:16:9:1336:0:1346:...
```

## Comportamento ao Receber Dados sem ID

### Antes
- Gerava ID automático baseado em hash
- Criava dispositivo offline
- Aceitava dados sem ID

### Agora
- **REJEITA** a requisição
- Retorna erro 500 com mensagem clara
- Informa o IP do cliente
- Lista as formas de enviar o ID
- **NÃO salva dados sem ID**

## Exemplo de Resposta de Erro

```json
{
  "statusCode": 500,
  "message": "❌ ID do medidor é obrigatório! IP: 192.168.1.100. Envie o ID no campo 'id' ou 'meterId' do body (JSON), ou como query parameter 'meterId', ou no header 'x-meter-id'. Medidor sem ID não pode enviar dados."
}
```

## Logs Gerados

### Quando ID não é fornecido:
```
❌ ID do medidor é obrigatório! IP: 192.168.1.100
📡 IP do cliente: 192.168.1.100
📦 Body recebido: {...}
🔍 Query params: {...}
📋 Headers: {...}
```

### Quando dados são recebidos com sucesso:
```
📥 Dados recebidos do medidor:
   📡 IP: 192.168.1.100
   🆔 MeterId: 438692
   📄 Content-Type: application/json
   📏 Formato: JSON
   🔑 Chaves: id, pa, pb, ...
```

## Endpoints Afetados

### Modificados:
- `POST /api/eletroon/medidor` - Agora unificado e com validação obrigatória

### Removidos:
- `POST /api/eletroon/medidor/texto` - Funcionalidade movida para endpoint único

### Não Afetados:
- `GET /api/eletroon/devices` - Agora retorna `ipAddress`
- `GET /api/eletroon/my-devices` - Agora retorna `ipAddress`
- Outros endpoints GET permanecem inalterados

## Migration Aplicada

```sql
-- AlterTable
ALTER TABLE "Device" ADD COLUMN "ipAddress" TEXT;

-- CreateIndex
CREATE INDEX "Device_ipAddress_idx" ON "Device"("ipAddress");
```

## Próximos Passos (Opcional)

- [ ] Adicionar validação de formato de IP
- [ ] Adicionar histórico de mudanças de IP
- [ ] Adicionar busca de dispositivos por IP
- [ ] Adicionar alertas quando IP muda

