# Instalação de Dependências para Funcionalidades Adicionais

## Dependências Opcionais

Algumas funcionalidades foram configuradas mas requerem instalação de dependências adicionais.

### 1. Swagger/OpenAPI

**Status:** ✅ Configurado e funcional (se dependência estiver instalada)

**Instalação:**
```bash
cd backend
npm install @nestjs/swagger@latest --legacy-peer-deps
```

**Uso:**
- Acesse: `http://localhost:3000/api/docs`
- Documentação interativa de todos os endpoints

### 2. Rate Limiting

**Status:** ⚠️ Configurado mas comentado

**Instalação:**
```bash
cd backend
npm install @nestjs/throttler@latest --legacy-peer-deps
```

**Ativação:**
1. Descomentar em `app.module.ts`:
   ```typescript
   import { ThrottlerModule } from '@nestjs/throttler';
   
   ThrottlerModule.forRoot([{
     ttl: 60000, // 1 minuto
     limit: 100, // 100 requisições por minuto
   }]),
   ```

2. Aplicar guard no controller (opcional):
   ```typescript
   import { ThrottlerGuard } from '@nestjs/throttler';
   
   @UseGuards(ThrottlerGuard)
   @Post('medidor')
   ```

### 3. Cache

**Status:** ⚠️ Configurado mas comentado

**Instalação:**
```bash
cd backend
npm install @nestjs/cache-manager@latest cache-manager@latest --legacy-peer-deps
```

**Ativação:**
1. Descomentar em `app.module.ts`:
   ```typescript
   import { CacheModule } from '@nestjs/cache-manager';
   
   CacheModule.register({
     isGlobal: true,
     ttl: 300, // 5 minutos
     max: 100, // máximo de 100 itens no cache
   }),
   ```

2. Usar no service ou aplicar interceptor global

### 4. Helmet

**Status:** ✅ Configurado com fallback

**Instalação:**
```bash
cd backend
npm install helmet@latest --legacy-peer-deps
```

**Uso:**
- Já configurado em `main.ts`
- Funciona automaticamente se instalado
- Fallback se não estiver disponível

---

## Instalação Completa (Todas as Dependências)

```bash
cd backend
npm install @nestjs/swagger@latest @nestjs/throttler@latest @nestjs/cache-manager@latest cache-manager@latest helmet@latest --legacy-peer-deps
```

---

## Verificação

Após instalar as dependências, verifique:

1. **Swagger:**
   - Acesse: `http://localhost:3000/api/docs`
   - Deve mostrar documentação interativa

2. **Rate Limiting:**
   - Faça muitas requisições rapidamente
   - Deve retornar 429 (Too Many Requests) após o limite

3. **Cache:**
   - Faça a mesma requisição GET duas vezes
   - Segunda requisição deve ser mais rápida (cache hit)

4. **Helmet:**
   - Verifique headers de resposta
   - Deve incluir headers de segurança

---

## Notas

- Use `--legacy-peer-deps` se houver conflitos de dependências
- Todas as funcionalidades são opcionais
- A API funciona normalmente sem essas dependências
- Essas são melhorias de performance e segurança

