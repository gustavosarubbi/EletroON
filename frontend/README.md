# Frontend EletroON

Frontend da aplicação EletroON desenvolvido com React, TypeScript e Vite, gerenciado com **pnpm**.

> ⚠️ **IMPORTANTE**: Este projeto usa pnpm para gerenciamento de pacotes

## 🚀 Tecnologias

- **React 19** - Biblioteca para interfaces de usuário
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Vite** - Build tool rápida e moderna
- **pnpm** - Gerenciador de pacotes rápido e eficiente
- **React Router DOM** - Roteamento para aplicações React
- **Axios** - Cliente HTTP para requisições à API
- **Lucide React** - Ícones SVG para React

## 📋 Pré-requisitos

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0

## 🛠️ Instalação

1. **Instalar pnpm globalmente** (se não estiver instalado):
   ```bash
   npm install -g pnpm
   ```

2. **Instalar dependências**:
   ```bash
   pnpm install
   ```

## 🚀 Scripts Disponíveis

- **`pnpm dev`** - Inicia o servidor de desenvolvimento na porta 3001
- **`pnpm build`** - Gera build de produção
- **`pnpm preview`** - Visualiza o build de produção
- **`pnpm lint`** - Executa o linter ESLint
- **`pnpm type-check`** - Verifica tipos TypeScript

## 🌐 Desenvolvimento

O servidor de desenvolvimento roda na **porta 3001** para evitar conflitos com o backend (porta 3000).

```bash
pnpm dev
```

## 🏗️ Build

Para gerar o build de produção:

```bash
pnpm build
```

O build será gerado no diretório `dist/` com:
- Chunking inteligente (vendor, router, utils)
- Source maps para debugging
- Otimizações de produção

## 📁 Estrutura do Projeto

```
front-eletroon/
├── src/                    # Código fonte
├── public/                 # Arquivos estáticos
├── dist/                   # Build de produção
├── package.json            # Configurações e dependências
├── pnpm-lock.yaml         # Lock file do pnpm
├── tsconfig.json          # Configuração TypeScript
├── vite.config.ts         # Configuração Vite
└── .npmrc                 # Configurações do pnpm
```

## ⚙️ Configurações

### pnpm (.npmrc)
- Auto-instalação de peer dependencies
- Cache local no diretório `.pnpm-store`
- Configurações de rede otimizadas

### Vite
- Porta 3001 para desenvolvimento
- Alias `@` para diretório `src/`
- Chunking otimizado para produção

### TypeScript
- Configuração estrita para qualidade de código
- Path mapping para imports limpos
- Suporte a módulos ES

## 🔧 Comandos Úteis

```bash
# Verificar versão do pnpm
pnpm --version

# Limpar cache do pnpm
pnpm store prune

# Atualizar dependências
pnpm update

# Adicionar nova dependência
pnpm add <pacote>

# Adicionar dependência de desenvolvimento
pnpm add -D <pacote>

# Remover dependência
pnpm remove <pacote>
```

## 🚨 Solução de Problemas

### Erro de Build
```bash
pnpm clean
pnpm install
pnpm build
```

### Problemas de Dependências
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Verificação de Tipos
```bash
pnpm type-check
```

## 📚 Documentação

- [pnpm](https://pnpm.io/)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## 🤝 Contribuição

1. Instale as dependências com `pnpm install`
2. Execute `pnpm dev` para desenvolvimento
3. Use `pnpm lint` para verificar qualidade do código
4. Use `pnpm type-check` para verificar tipos

---

**Desenvolvido com ❤️ usando pnpm para máxima eficiência!**

**Desenvolvido com ❤️ usando pnpm para máxima eficiência!**

**Desenvolvido com ❤️ usando pnpm para máxima eficiência!**

**Desenvolvido com ❤️ usando pnpm para máxima eficiência!**
