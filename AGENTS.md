# Instruções para agentes

Este arquivo se aplica a todo o repositório.

## Leitura obrigatória

Antes de implementar qualquer feature, correção estrutural ou refatoração:

1. Leia `docs/architecture.md` por completo.
2. Identifique o módulo proprietário da mudança antes de criar ou mover arquivos.
3. Verifique as regras de fronteira existentes em `eslint.config.js`.

`docs/architecture.md` é a fonte principal para estrutura, dependências permitidas, rotas e convenções dos jogos. Se uma decisão aprovada alterar essas regras, atualize o documento na mesma mudança.

## Regras arquiteturais

- Mantenha o projeto em JavaScript; não introduza TypeScript sem autorização explícita.
- Use o alias `@/` nos imports entre módulos. Imports relativos são adequados para arquivos próximos dentro do mesmo módulo.
- Código exclusivo do Classic deve ficar em `src/games/classic`.
- Código exclusivo do Hell Hand deve ficar em `src/games/hell-hand`.
- Contratos e protocolo realmente compartilhados pelos jogos ficam em `src/games/core`.
- Composição da sessão que conhece as duas variantes fica em `src/games/session`.
- Funcionalidades globais com fluxo ou estado próprio ficam em `src/features`.
- UI, configuração e utilitários independentes de negócio ficam em `src/shared`.
- Providers, layouts e composição de rotas ficam em `src/app`.
- Editores, playgrounds e ferramentas de autoria/debug ficam em `src/devtools` e usam rotas `/dev/*`.
- Não mova código específico de um jogo para `shared` apenas para facilitar imports.
- Classic e Hell Hand não podem importar um ao outro. A integração entre variantes deve acontecer pela sessão ou pela composição da aplicação.

## Identificadores e rotas

- Hell Hand internamente: `hell_hand`.
- Hell Hand nas URLs: `hell-hand`.
- Hell Hand no contrato legado do backend: `fodinha_power`.
- Classic internamente e nas URLs: `classic`.
- Classic no contrato legado do backend: `fodinha_classic`.
- Rotas de produção devem permanecer sob `/classic/*` ou `/hell-hand/*`.
- Preserve redirects legados ao alterar URLs públicas, salvo decisão explícita para removê-los.
- Não altere valores enviados ao backend apenas para igualá-los aos nomes internos.

## Assets

- Assets exclusivos devem ficar em `src/games/<jogo>/assets`.
- Somente fontes, ícones, avatares e outros recursos verdadeiramente globais ficam em `src/shared/assets`.
- Ao mover assets, atualize imports estáticos, `import.meta.glob`, CSS e caminhos usados por plugins do Vite.

## Implementação

- Prefira módulos coesos e componentes pequenos com responsabilidade clara.
- Evite adicionar novas responsabilidades ao `GameSessionPage.jsx`; extraia regras ou componentes para o módulo proprietário quando possível.
- Preserve contratos públicos existentes durante refatorações e adicione adapters ou redirects quando necessário.
- Não crie barrels globais que escondam dependências entre camadas; prefira imports explícitos.
- Não desative regras de lint globalmente para contornar uma violação. Corrija a dependência ou use uma exceção local, restrita e justificada.
- Ferramentas de desenvolvimento não podem ser importadas por código de produção.

## Testes e entrega

Para features e refatorações, execute antes de concluir:

```bash
npm run lint
npm test
npm run format:check
npm run build
```

Execute também `npm run test:e2e` quando houver mudança em rotas, navegação, autenticação, carregamento lazy ou fluxos principais dos jogos.

- Adicione ou atualize testes para regras, paths, redirects e comportamentos alterados.
- Não considere a tarefa concluída enquanto houver erro de lint, teste ou build causado pela mudança.
- Informe claramente qualquer fluxo que não pôde ser validado por depender de backend, WebSocket ou dados externos.
