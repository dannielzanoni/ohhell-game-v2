# Oh Hell Game v2

Frontend React/Vite para dois modos de jogo: Classic e Hell Hand.

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação local:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

O projeto permanece em JavaScript. Testes unitários usam Vitest e os fluxos de navegador usam Playwright.

## Estrutura

- `src/app`: composição da aplicação, providers, layouts e router.
- `src/features`: funcionalidades globais, como autenticação, preferências, tema e notificações.
- `src/games/core`: protocolo, modelos e configuração compartilhados pelos jogos.
- `src/games/session`: composição da mesa e da sessão usada pelas duas variantes.
- `src/games/classic`: páginas, serviços e assets exclusivos do Classic.
- `src/games/hell-hand`: páginas, serviços e assets exclusivos do Hell Hand.
- `src/shared`: infraestrutura e UI sem dependência de regras de negócio.
- `src/devtools`: playgrounds, editores e ferramentas acessíveis somente em rotas `/dev/*`.
- `tests/e2e`: testes Playwright.

Veja [docs/architecture.md](docs/architecture.md) para rotas, regras de dependência e convenções.
