# 🎨 Sistema de Design EletroON

## 📋 Visão Geral

Este documento define o sistema de design consistente para o projeto EletroON, garantindo uniformidade visual e melhor experiência do usuário.

## 🎯 Princípios de Design

### **Consistência**
- Uso consistente de cores, espaçamentos e tipografia
- Padrões visuais unificados em todo o projeto
- Componentes reutilizáveis com comportamento previsível

### **Acessibilidade**
- Contraste adequado para legibilidade
- Tamanhos de fonte mínimos para leitura
- Suporte a navegação por teclado

### **Responsividade**
- Design mobile-first
- Breakpoints consistentes
- Adaptação para diferentes dispositivos

## 🌈 Sistema de Cores

### **Cores Primárias (EletroON)**
- **Brand**: `#002495` - Cor principal da marca
- **Dark**: `#020a29` - Azul muito escuro
- **Accent**: `#0066cc` - Azul médio
- **Light**: `#1e88e5` - Azul claro
- **Bright**: `#42a5f5` - Azul muito claro

### **Cores Neutras**
- **50-100**: Fundos e superfícies
- **200-300**: Bordas e divisores
- **400-500**: Textos secundários
- **600-700**: Textos principais
- **800-950**: Textos de destaque

### **Cores Semânticas**
- **Success**: Verde para confirmações
- **Warning**: Amarelo para avisos
- **Error**: Vermelho para erros

## 📏 Sistema de Espaçamento

### **Base de 4px**
- **1**: 4px (espaçamento mínimo)
- **2**: 8px (espaçamento pequeno)
- **3**: 12px (espaçamento médio)
- **4**: 16px (espaçamento padrão)
- **5**: 20px (espaçamento grande)
- **6**: 24px (espaçamento extra grande)

### **Uso Recomendado**
- **Componentes**: Espaçamento 4 (16px) entre elementos
- **Seções**: Espaçamento 6 (24px) entre seções
- **Margens**: Espaçamento 2-3 (8-12px) para elementos internos

## 🔤 Sistema de Tipografia

### **Família Principal**
- **Fonte**: Nunito (Google Fonts)
- **Fallbacks**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto

### **Escala de Tamanhos**
- **xs**: 12px (textos pequenos)
- **sm**: 14px (textos secundários)
- **base**: 16px (texto padrão)
- **lg**: 18px (textos destacados)
- **xl**: 20px (subtítulos)
- **2xl**: 24px (títulos pequenos)
- **3xl**: 30px (títulos médios)
- **4xl**: 36px (títulos grandes)

### **Pesos de Fonte**
- **300**: Light (textos sutis)
- **400**: Normal (texto padrão)
- **500**: Medium (textos destacados)
- **600**: Semibold (títulos pequenos)
- **700**: Bold (títulos médios)
- **800**: Extrabold (títulos grandes)
- **900**: Black (títulos principais)

## 🎭 Sistema de Sombras

### **Hierarquia Visual**
- **xs**: Sombras sutis para elementos básicos
- **sm**: Sombras leves para cards
- **md**: Sombras médias para elementos elevados
- **lg**: Sombras fortes para modais
- **xl**: Sombras extra fortes para overlays
- **2xl**: Sombras máximas para elementos principais

## 🔄 Sistema de Transições

### **Velocidades**
- **fast**: 150ms (interações rápidas)
- **normal**: 250ms (transições padrão)
- **slow**: 350ms (animações suaves)
- **slower**: 500ms (transições lentas)

### **Curvas de Easing**
- **linear**: Movimento constante
- **ease-in**: Aceleração no início
- **ease-out**: Desaceleração no final
- **ease-in-out**: Aceleração e desaceleração

## 🧩 Componentes Base

### **Botões**
```css
.btn {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-normal);
}
```

### **Inputs**
```css
.input {
  padding: var(--spacing-3) var(--spacing-4);
  border: var(--border-width-2) solid var(--color-neutral-200);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
}
```

### **Cards**
```css
.card {
  background: var(--color-neutral-50);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-4);
}
```

## 📱 Breakpoints Responsivos

### **Mobile First**
- **xs**: 0px - 480px (mobile pequeno)
- **sm**: 480px - 768px (mobile grande)
- **md**: 768px - 1024px (tablet)
- **lg**: 1024px - 1280px (desktop pequeno)
- **xl**: 1280px+ (desktop grande)

## 🎨 Uso das Classes Utilitárias

### **Espaçamento**
```html
<div class="mt-4 mb-6 p-4">
  <!-- Conteúdo com margem top 16px, bottom 24px, padding 16px -->
</div>
```

### **Cores**
```html
<button class="bg-primary text-white">
  <!-- Botão com fundo azul e texto branco -->
</button>
```

### **Sombras e Bordas**
```html
<div class="shadow-lg border-radius-xl">
  <!-- Card com sombra forte e bordas arredondadas -->
</div>
```

## 🔧 Implementação

### **1. Importar Tokens**
```css
@import './styles/design-tokens.css';
```

### **2. Usar Variáveis CSS**
```css
.my-component {
  color: var(--color-eletroon-brand);
  margin: var(--spacing-4);
  border-radius: var(--border-radius-md);
}
```

### **3. Usar Classes Utilitárias**
```html
<div class="bg-neutral p-4 border-radius-lg shadow-md">
  <!-- Componente com estilo consistente -->
</div>
```

## 📚 Recursos Adicionais

- **Figma**: Link para design system no Figma
- **Storybook**: Componentes interativos
- **Chromatic**: Testes visuais automatizados

## 🤝 Contribuição

Para manter a consistência:
1. Use sempre as variáveis CSS definidas
2. Siga o sistema de espaçamento de 4px
3. Aplique as classes utilitárias quando apropriado
4. Documente novos componentes
5. Teste em diferentes dispositivos

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0  
**Mantido por**: Equipe de Design EletroON
