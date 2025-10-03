# CSS Architecture - EletroON

Este diretório contém a arquitetura modular de estilos do projeto EletroON, organizada de forma escalável e manutenível.

## 📁 Estrutura de Arquivos

```
src/styles/
├── index.css              # Ponto de entrada principal
├── colors.css             # Sistema de cores
├── typography.css         # Sistema de tipografia
├── animations.css         # Animações globais
├── components/            # Estilos específicos de componentes
│   ├── Modal.css         # Estilos de modais
│   ├── Buttons.css       # Estilos de botões
│   ├── UserMeters.css    # Estilos do modal de medidores
│   ├── StatsCard.css     # Estilos dos cards de estatísticas
│   ├── Header.css        # Estilos do cabeçalho
│   ├── Dashboard.css     # Estilos da página principal
│   ├── UserManager.css   # Estilos do gerenciador de usuários
│   ├── LoginForm.css     # Estilos do formulário de login
│   ├── Title.css         # Estilos dos títulos
│   ├── Toast.css         # Estilos das notificações
│   ├── ToastContainer.css # Container de notificações
│   ├── Sidebar.css       # Estilos da barra lateral
│   ├── LoginCard.css     # Estilos do card de login
│   └── Background.css    # Estilos de fundo
└── README.md             # Esta documentação
```

## 🎨 Sistema de Cores

O arquivo `colors.css` define um sistema completo de cores baseado em variáveis CSS:

- **Cores Primárias**: Azul (#3b82f6)
- **Cores de Status**: Verde (sucesso), Vermelho (erro), Amarelo (aviso)
- **Cores Neutras**: Escala de cinzas
- **Cores de Fundo**: Tons escuros para tema dark
- **Gradientes**: Combinações pré-definidas

### Uso:
```css
.element {
  background: var(--primary-500);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}
```

## 📝 Sistema de Tipografia

O arquivo `typography.css` define:

- **Famílias de Fonte**: Inter (sans-serif), Fira Code (monospace)
- **Tamanhos**: Escala de 12px a 60px
- **Pesos**: De 100 a 900
- **Alturas de Linha**: De 1 a 2
- **Espaçamento de Letras**: De -0.05em a 0.1em

### Uso:
```css
.title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}
```

## ✨ Animações

O arquivo `animations.css` contém:

- **Animações de Entrada**: fadeIn, slideInUp, scaleIn
- **Animações de Interação**: pulse, bounce, shake, glow
- **Classes Utilitárias**: Para aplicar animações facilmente

### Uso:
```css
.element {
  animation: fadeIn 0.3s ease-out;
}

.animated {
  @apply animate-fade-in hover-lift;
}
```

## 🧩 Componentes Modulares

Cada componente tem seu próprio arquivo CSS com:

- **Estilos Base**: Layout e estrutura
- **Estados**: Hover, focus, active, disabled
- **Variantes**: Diferentes tamanhos e cores
- **Responsividade**: Media queries para diferentes telas

### Exemplo - Botões:
```css
.btn {
  /* Estilos base */
}

.btn-primary {
  /* Variante primária */
}

.btn:hover {
  /* Estado hover */
}

@media (max-width: 768px) {
  /* Responsividade */
}
```

## 🔧 Como Usar

### 1. Importação Automática
Todos os estilos são importados automaticamente via `index.css`:

```tsx
// App.tsx
import './styles/index.css';
```

### 2. Classes Utilitárias
Use as classes utilitárias para estilização rápida:

```tsx
<div className="flex items-center gap-4 p-4 rounded-lg shadow">
  <h2 className="text-xl font-semibold text-primary">Título</h2>
  <button className="btn btn-primary">Ação</button>
</div>
```

### 3. Variáveis CSS
Use as variáveis para consistência:

```css
.custom-element {
  background: var(--gradient-primary);
  color: var(--text-primary);
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-lg);
}
```

## 📱 Responsividade

O sistema é totalmente responsivo com breakpoints:

- **Mobile**: < 480px
- **Tablet**: < 768px
- **Desktop**: ≥ 768px

### Uso:
```css
.element {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .element {
    font-size: 0.875rem;
  }
}
```

## 🎯 Boas Práticas

1. **Use Variáveis**: Sempre prefira variáveis CSS a valores hardcoded
2. **Componentes Modulares**: Mantenha estilos específicos em seus respectivos arquivos
3. **Classes Utilitárias**: Use para estilização rápida e consistente
4. **Responsividade**: Sempre considere diferentes tamanhos de tela
5. **Performance**: Evite seletores muito específicos ou aninhados
6. **Manutenibilidade**: Use nomes descritivos e organize por funcionalidade

## 🚀 Adicionando Novos Componentes

1. Crie um novo arquivo em `components/`
2. Adicione a importação em `index.css`
3. Use as variáveis do sistema de cores e tipografia
4. Siga o padrão de nomenclatura existente
5. Adicione responsividade quando necessário

## 📊 Benefícios da Arquitetura

- ✅ **Escalabilidade**: Fácil adicionar novos componentes
- ✅ **Manutenibilidade**: Código organizado e modular
- ✅ **Consistência**: Sistema unificado de design
- ✅ **Performance**: Imports otimizados
- ✅ **Reutilização**: Componentes e utilitários reutilizáveis
- ✅ **Responsividade**: Design adaptável
- ✅ **Acessibilidade**: Foco em usabilidade
