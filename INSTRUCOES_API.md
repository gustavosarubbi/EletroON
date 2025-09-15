# 🚀 Como Iniciar o EletroON com Dados da API

## ✅ Problema Resolvido

Agora o site **não mostra mais dados mockados**! Ele só exibe dados reais da API.

## 🎯 Como Iniciar

### Opção 1: Script Recomendado (API Primeiro)
```powershell
.\start-api-first.ps1
```

Este script:
- ✅ Inicia a API primeiro
- ✅ Aguarda a API ficar disponível
- ✅ Só então inicia o frontend
- ✅ Garante que você veja apenas dados reais

### Opção 2: Scripts Manuais

**1. Iniciar API:**
```powershell
cd api-eletroon
pnpm run start:dev
```

**2. Em outro terminal, iniciar Frontend:**
```powershell
cd front-eletroon
pnpm run dev
```

### Opção 3: Script Original
```powershell
.\start-dev.ps1
```

## 🔍 O que Mudou

### ❌ Antes (com dados mockados):
- Site mostrava dados falsos mesmo sem API
- Dificultava identificar problemas de conexão
- Dados não refletiam a realidade

### ✅ Agora (apenas dados reais):
- Site só mostra dados da API
- Se API não estiver rodando, mostra erro claro
- Botão "Tentar Novamente" para reconectar
- Dados sempre atualizados e reais

## 🚨 O que Acontece se a API Não Estiver Rodando

### Dashboard:
- Mostra mensagem: "❌ Erro ao conectar com a API"
- Instruções para verificar se API está em `http://localhost:3000`
- Botão "🔄 Tentar Novamente"

### Gerenciamento de Usuários:
- Mostra mensagem: "❌ Erro ao carregar usuários"
- Instruções para verificar API
- Botão "🔄 Tentar Novamente"

## 🌐 URLs Importantes

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api

## 💡 Dicas

1. **Sempre inicie a API primeiro** - use o script `start-api-first.ps1`
2. **Verifique os logs** - se algo der errado, olhe o terminal da API
3. **Aguarde a API carregar** - pode levar alguns segundos
4. **Use o botão "Tentar Novamente"** - se houver problemas de conexão

## 🔧 Troubleshooting

### API não inicia:
```powershell
cd api-eletroon
pnpm install
pnpm run start:dev
```

### Frontend não conecta:
1. Verifique se API está rodando em http://localhost:3000
2. Aguarde alguns segundos
3. Use o botão "Tentar Novamente"

### Dados não aparecem:
- Verifique se há dados no banco de dados
- Verifique se a API está retornando dados
- Olhe o console do navegador (F12) para erros

## 🎉 Resultado

Agora você tem um sistema que:
- ✅ Só mostra dados reais da API
- ✅ Indica claramente quando há problemas
- ✅ Permite reconectar facilmente
- ✅ Reflete o estado real do sistema

