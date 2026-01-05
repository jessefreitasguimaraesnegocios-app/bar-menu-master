# Decisões Técnicas - OAuth Refatoração

## 🏗️ Arquitetura

### Clean Architecture Layers

```
┌─────────────────────────────────────┐
│   index.ts (Entry Point)           │  ← Camada de Apresentação
│   - Handler HTTP                   │
│   - CORS                           │
│   - Error handling global          │
└──────────────┬────────────────────┘
               │
┌──────────────▼────────────────────┐
│   oauthService.ts                  │  ← Camada de Aplicação
│   - Orquestração do fluxo         │
│   - Validações de negócio         │
│   - Coordenação entre camadas     │
└──────────────┬────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼──────────┐  ┌──────▼──────────┐
│ mpClient.ts  │  │ barRepository.ts │  ← Camada de Domínio
│              │  │                  │
│ - API MP     │  │ - Persistência   │
│ - OAuth      │  │ - Supabase       │
└──────────────┘  └──────────────────┘
```

## 🔐 Segurança

### Por que função pública?

1. **OAuth Redirect**: Mercado Pago redireciona sem `Authorization` header
2. **Padrão OAuth**: Callbacks são sempre públicos
3. **Validação interna**: Validamos `code`, `state` e `bar_id` internamente

### Proteções implementadas

- ✅ Validação de `code` OAuth (temporário, único)
- ✅ Validação de `state` (bar_id)
- ✅ Verificação de existência do bar
- ✅ Tokens salvos apenas após validação completa
- ✅ Service Role Key usado apenas internamente

## 📦 Separação de Responsabilidades

### `mpClient.ts`
**Responsabilidade única**: Comunicação com API do Mercado Pago
- Troca de code por tokens
- Busca de informações do usuário
- Parse de erros da API

### `barRepository.ts`
**Responsabilidade única**: Persistência de dados
- Atualização de tokens OAuth
- Verificação de existência de bar
- Isolamento de lógica de banco

### `oauthService.ts`
**Responsabilidade única**: Orquestração do fluxo
- Validações de negócio
- Coordenação entre client e repository
- Geração de URLs de resposta

### `config.ts`
**Responsabilidade única**: Configuração
- Centralização de env vars
- Validação de configuração
- Type safety

### `types.ts`
**Responsabilidade única**: Contratos
- TypeScript types
- Interfaces compartilhadas
- Documentação implícita

## 🎯 Princípios Aplicados

### SOLID

- **S**ingle Responsibility: Cada módulo tem uma única responsabilidade
- **O**pen/Closed: Fácil extensão sem modificar código existente
- **L**iskov Substitution: Interfaces claras e substituíveis
- **I**nterface Segregation: Types específicos por contexto
- **D**ependency Inversion: Dependências injetadas via constructor

### Clean Code

- ✅ Funções pequenas e focadas
- ✅ Nomes descritivos
- ✅ Sem código duplicado
- ✅ Tratamento de erros explícito
- ✅ Comentários apenas onde agregam valor

### Clean Architecture

- ✅ Separação de camadas
- ✅ Independência de frameworks
- ✅ Testabilidade
- ✅ Manutenibilidade

## 🚀 Benefícios

1. **Manutenibilidade**: Código organizado e fácil de entender
2. **Testabilidade**: Cada módulo pode ser testado isoladamente
3. **Escalabilidade**: Fácil adicionar novos recursos
4. **Debugging**: Erros mais fáceis de rastrear
5. **Type Safety**: TypeScript em todas as camadas

## 🔄 Fluxo de Execução

```
1. Mercado Pago → index.ts (redirect com code + state)
2. index.ts → oauthService.processCallback()
3. oauthService → validateParams()
4. oauthService → validateBarExists() → barRepository
5. oauthService → exchangeCodeForTokens() → mpClient
6. oauthService → updateOAuthTokens() → barRepository
7. oauthService → return successUrl
8. index.ts → redirect para frontend
```

## 📝 Notas de Implementação

- **Deno**: Usa imports com extensão `.ts` (requisito do Deno)
- **Error Handling**: Todos os erros são capturados e redirecionados
- **Logging**: Logs estruturados para debugging
- **CORS**: Headers configurados para OAuth callbacks

