# Debug: Extração de ID do Medidor

## Como a API busca o ID do medidor:

1. **Body JSON**: Campos `id`, `meterId`, `meter_id`, `deviceId`, `device_id`
2. **Query Parameter**: `?meterId=3`
3. **Headers** (ordem de prioridade):
   - `x-meter-id`, `x-device-id`, `meter-id`, `device-id`
   - `x-meterid`, `x-deviceid`, `meterid`, `deviceid`
   - Qualquer header que contenha "id" no nome
   - Qualquer header com valor numérico válido (último recurso)

## Logs para verificar:

Quando um medidor envia dados, os logs devem mostrar:
- Todos os headers recebidos
- Todas as tentativas de encontrar o ID
- Resultado final (encontrado ou não)

## Se o ID não for encontrado:

Os logs mostrarão:
- Todos os headers disponíveis
- Onde procurou
- O que encontrou em cada tentativa

## Headers aceitos pelo CORS:

- `x-meter-id`
- `x-device-id`
- `meter-id`
- `device-id`
- E todas as variações em maiúsculas/minúsculas

