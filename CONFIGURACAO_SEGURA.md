# 🔐 Guia de Configuração Segura - EletroON

## ⚠️ **ALERTA DE SEGURANÇA**

**NUNCA** commite credenciais reais no Git! Este guia mostra como configurar o projeto de forma segura.

## 🚀 **Configuração Rápida**

### 1. **Copie o arquivo de exemplo**
```bash
cp env.example .env
```

### 2. **Configure suas credenciais no .env**
```bash
# Edite o arquivo .env com suas credenciais reais
nano .env
# ou
code .env
```

### 3. **Configure as variáveis obrigatórias**
```env
# Senha do banco de dados
POSTGRES_PASSWORD=MinhaSenhaSuperSegura123!

# JWT Secret (use um gerador online)
JWT_SECRET=meu-jwt-secret-super-seguro-e-unico-123456789

# Usuários padrão
DEFAULT_ADMIN_EMAIL=admin@meudominio.com
DEFAULT_ADMIN_PASSWORD=Admin123!@#
DEFAULT_USER_EMAIL=usuario@meudominio.com
DEFAULT_USER_PASSWORD=User123!@#
```

## 🔒 **Boas Práticas de Segurança**

### ✅ **O que FAZER:**
- Use senhas fortes (mínimo 12 caracteres)
- Combine letras, números e símbolos
- Use senhas diferentes para cada ambiente
- Mantenha o arquivo `.env` local apenas
- Use variáveis de ambiente em produção

### ❌ **O que NÃO FAZER:**
- Commitar arquivos `.env` no Git
- Usar senhas simples como "123456"
- Reutilizar senhas entre projetos
- Deixar credenciais em comentários de código
- Compartilhar arquivos `.env` por email

## 🛠️ **Configuração por Ambiente**

### **Desenvolvimento Local**
```bash
# 1. Configure o .env
cp env.example .env

# 2. Edite com suas credenciais
nano .env

# 3. Execute o projeto
docker-compose up -d
```

### **Produção**
```bash
# 1. Configure variáveis de ambiente no servidor
export POSTGRES_PASSWORD="senha-super-segura"
export JWT_SECRET="jwt-secret-unico"
export DEFAULT_ADMIN_EMAIL="admin@empresa.com"
export DEFAULT_ADMIN_PASSWORD="SenhaAdmin123!@#"

# 2. Execute o projeto
docker-compose up -d
```

## 🔧 **Troubleshooting**

### **Erro: "Environment variable not found"**
- Verifique se o arquivo `.env` existe
- Confirme se as variáveis estão definidas corretamente
- Reinicie o Docker após alterar o `.env`

### **Erro: "Database connection failed"**
- Verifique se `POSTGRES_PASSWORD` está correto
- Confirme se o banco está rodando
- Teste a conexão manualmente

### **Erro: "JWT Secret not configured"**
- Defina uma `JWT_SECRET` forte e única
- Use pelo menos 32 caracteres
- Gere uma nova secret para cada ambiente

## 📋 **Checklist de Segurança**

- [ ] Arquivo `.env` criado e configurado
- [ ] Senhas fortes definidas (12+ caracteres)
- [ ] JWT_SECRET único e seguro
- [ ] Arquivo `.env` não está no Git
- [ ] Credenciais diferentes para cada ambiente
- [ ] Documentação atualizada sem senhas reais

## 🆘 **Em Caso de Vazamento**

Se você acidentalmente commitou credenciais:

1. **IMEDIATAMENTE:**
   - Altere todas as senhas comprometidas
   - Revogue tokens e chaves
   - Remova o commit do histórico (se possível)

2. **DEPOIS:**
   - Configure o `.env` corretamente
   - Force push para limpar o histórico
   - Monitore logs por atividade suspeita

## 📞 **Suporte**

Se precisar de ajuda com a configuração:
- Verifique este guia primeiro
- Consulte a documentação do projeto
- Entre em contato com a equipe de desenvolvimento
