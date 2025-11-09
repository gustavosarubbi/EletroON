# Melhorias no Backend - Leitura de Dados do Medidor

## Resumo das Melhorias

Este documento descreve as melhorias implementadas no backend para processar dados do medidor no formato texto separado por dois pontos (`:`).

## Formato dos Dados

### Estrutura
Os dados são salvos no formato:
```
hora:minuto:segundo:pa:pb:pc:pt:qa:qb:qc:qt:epa_c:epb_c:epc_c:ept_c:epa_g:epb_g:epc_g:ept_g:iarms:ibrms:icrms:uarms:ubrms:ucrms:pfa:pfb:pfc:pft
```

### Características Importantes
- **29 campos no total**: 3 para tempo (hora:minuto:segundo) + 26 para dados
- **Precisão**: Todos os valores são registrados com duas casas decimais de precisão
- **Divisão por 100**: É necessário dividir todos os valores por 100 para obter os valores reais
- **Valores negativos**: Potências (pa, pb, pc, pt, qa, qb, qc, qt) podem ser negativas (geração)
- **Valores sempre positivos**: Energia, corrente e tensão nunca podem ser negativas

## Implementações

### 1. Parser de Linha de Dados (`parseTextLineData`)
- ✅ Processa uma linha de dados no formato texto
- ✅ Extrai hora, minuto e segundo e cria timestamp
- ✅ Divide todos os valores por 100 conforme a legenda
- ✅ Valida valores negativos (corrige valores inválidos)
- ✅ Retorna dados parseados no formato `ReadingData`

### 2. Processamento em Lote (`processarDadosTexto`)
- ✅ Processa múltiplas linhas de dados
- ✅ Usa transações do Prisma para melhor performance
- ✅ Processa dados em lotes de 100 registros
- ✅ Gera ID do medidor automaticamente se não fornecido
- ✅ Retorna estatísticas de processamento

### 3. Novo Endpoint (`POST /api/eletroon/medidor/texto`)
- ✅ Aceita dados em formato texto (text/plain)
- ✅ Aceita dados em formato JSON com campo `data` ou `textData`
- ✅ Aceita `meterId` como query parameter ou no body
- ✅ Aceita `baseDate` como query parameter ou no body
- ✅ Processa múltiplas linhas de uma vez

## Uso da API

### Exemplo 1: Enviar dados em formato texto (text/plain)
```bash
curl -X POST http://localhost:3000/api/eletroon/medidor/texto?meterId=1 \
  -H "Content-Type: text/plain" \
  -d "0:6:16:9:1336:0:1346:-1:-484:0:-486:458:203:0:665:0:0:0:0:0:9:0:22080:22101:17:99:94:99:94"
```

### Exemplo 2: Enviar múltiplas linhas
```bash
curl -X POST http://localhost:3000/api/eletroon/medidor/texto?meterId=1 \
  -H "Content-Type: text/plain" \
  -d "0:6:16:9:1336:0:1346:-1:-484:0:-486:458:203:0:665:0:0:0:0:0:9:0:22080:22101:17:99:94:99:94
0:36:17:4:1047:-1:1052:5:-455:0:-450:458:203:0:665:0:0:0:0:1:7:0:22102:22134:17:50:91:100:92"
```

### Exemplo 3: Enviar dados em formato JSON
```bash
curl -X POST http://localhost:3000/api/eletroon/medidor/texto \
  -H "Content-Type: application/json" \
  -d '{
    "data": "0:6:16:9:1336:0:1346:-1:-484:0:-486:458:203:0:665:0:0:0:0:0:9:0:22080:22101:17:99:94:99:94",
    "meterId": 1,
    "baseDate": "2024-01-01T00:00:00Z"
  }'
```

### Exemplo 4: Enviar arquivo completo
```bash
curl -X POST http://localhost:3000/api/eletroon/medidor/texto?meterId=1 \
  -H "Content-Type: text/plain" \
  --data-binary "@dados/exemplodados.txt"
```

## Validações Implementadas

### Valores de Tempo
- ✅ Hora: 0-23
- ✅ Minuto: 0-59
- ✅ Segundo: 0-59
- ✅ Se inválido, usa hora atual

### Valores de Potência (pa, pb, pc, pt, qa, qb, qc, qt)
- ✅ Podem ser negativos (geração)
- ✅ Limitados a ±1MW para evitar valores extremos

### Valores de Energia (epa_c, epb_c, epc_c, ept_c, epa_g, epb_g, epc_g, ept_g)
- ✅ Nunca podem ser negativos
- ✅ Valores negativos são corrigidos para 0

### Valores de Corrente (iarms, ibrms, icrms)
- ✅ Nunca podem ser negativos
- ✅ Valores negativos são corrigidos para 0

### Valores de Tensão (uarms, ubrms, ucrms)
- ✅ Nunca podem ser negativos
- ✅ Valores negativos são corrigidos para 0

### Fator de Potência (pfa, pfb, pfc, pft)
- ✅ Deve estar entre -1 e 1
- ✅ Valores fora do range são limitados

## Tratamento de Timestamps

- ✅ Cria timestamp a partir de hora:minuto:segundo
- ✅ Usa data atual como base
- ✅ Se a hora da leitura for maior que a atual, assume que é do dia anterior
- ✅ Permite especificar `baseDate` para definir a data base

## Performance

- ✅ Processamento em transações para melhor performance
- ✅ Inserção em lotes de 100 registros
- ✅ Skip de duplicatas (se houver constraints únicas)
- ✅ Logs detalhados para debug

## Logs

O sistema gera logs detalhados incluindo:
- ✅ Número de linhas processadas
- ✅ Número de linhas válidas/inválidas
- ✅ ID do medidor detectado/gerado
- ✅ Erros encontrados (se houver)
- ✅ Estatísticas de processamento

## Exemplo de Resposta

```json
{
  "message": "Processados 48 de 48 linhas",
  "processed": 48,
  "errors": 0,
  "meterId": 1,
  "errorDetails": []
}
```

## Arquivos Modificados

1. `backend/src/eletroon/eletroon.service.ts`
   - Adicionado método `parseTextLineData()`
   - Adicionado método `processarDadosTexto()`
   - Melhorias na validação de dados

2. `backend/src/eletroon/eletroon.controller.ts`
   - Adicionado endpoint `POST /medidor/texto`
   - Suporte para texto plano e JSON
   - Suporte para query parameters

## Próximos Passos (Opcional)

- [ ] Adicionar validação de duplicatas baseada em timestamp + meterId
- [ ] Adicionar endpoint para upload de arquivo
- [ ] Adicionar suporte para compressão de dados
- [ ] Adicionar métricas de performance
- [ ] Adicionar testes unitários para o parser

