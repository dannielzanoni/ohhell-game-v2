# Arquitetura do frontend

## Objetivo

A organização segue módulos por domínio. Cada jogo possui páginas, assets e integrações próprias; somente contratos realmente comuns ficam em `games/core`, `features` ou `shared`.

```text
src/
├── app/                 # composição, providers, layouts e router
├── devtools/            # ferramentas em /dev/*
├── features/            # auth, settings, theme e notifications
├── games/
│   ├── classic/         # módulo do jogo Classic
│   ├── core/            # contratos e protocolo compartilhados
│   ├── hell-hand/       # módulo do jogo Hell Hand
│   └── session/         # orquestra a sessão das duas variantes
└── shared/              # api base, config, i18n, lib e UI genérica
```

## Dependências permitidas

- `shared` não importa `app`, `features`, `games` ou `devtools`.
- `features` pode usar `shared` e contratos de `games/core`, mas não `app` ou `devtools`.
- `games/core` não conhece Classic, Hell Hand, sessão, app ou devtools.
- `games/classic` e `games/hell-hand` podem usar `shared`, `features`, `games/core` e `games/session`, mas não importam um ao outro.
- `games/session` é a camada explícita de composição entre core e variantes.
- `app` compõe todas as camadas; `devtools` pode reutilizar componentes dos jogos.

Essas fronteiras são verificadas por `no-restricted-imports` no ESLint.

## Identificadores do Hell Hand

Cada contexto usa o formato adequado:

| Contexto                           | Valor           |
| ---------------------------------- | --------------- |
| Identificador interno do módulo    | `hell_hand`     |
| URL pública                        | `hell-hand`     |
| Tipo enviado/recebido pelo backend | `fodinha_power` |

O Classic usa `classic` internamente e nas URLs; o contrato legado do backend continua `fodinha_classic`.

## Rotas principais

- `/`: seleção de modo.
- `/classic/*`: home, criação, sala, ranking, regras e preferências do Classic.
- `/hell-hand/*`: home, criação, sala, regras e mercenários do Hell Hand.
- `/dev/classic/*`: ferramentas do Classic.
- `/dev/hell-hand/*`: workshop, playground, editor de cartas e decks de poder.

As URLs antigas permanecem como redirects de compatibilidade no router da aplicação.

## Onde colocar código novo

1. Código exclusivo de uma variante fica dentro do módulo daquele jogo.
2. Código usado por ambos os jogos, mas ligado ao protocolo da partida, fica em `games/core`.
3. Composição visual que conhece as duas variantes fica em `games/session`.
4. Funcionalidade global com estado ou fluxo próprio fica em `features`.
5. UI e utilitários independentes de negócio ficam em `shared`.
6. Ferramentas de autoria, debug e playground ficam em `devtools`.

Assets seguem a mesma regra: assets específicos ficam em `games/<jogo>/assets`; fontes, ícones e avatares verdadeiramente globais ficam em `shared/assets`.

## Estrutura interna dos módulos de jogo

Os módulos podem usar as seguintes pastas conforme a responsabilidade:

| Pasta          | Responsabilidade                                                 |
| -------------- | ---------------------------------------------------------------- |
| `api`          | Chamadas HTTP e integrações externas exclusivas do domínio.      |
| `assets`       | Imagens, sons, vídeos e catálogos que resolvem esses recursos.   |
| `components`   | Componentes visuais exclusivos do módulo.                        |
| `config`       | Limites, durações e parâmetros ajustáveis sem regra algorítmica. |
| `model`        | Regras de domínio, normalização e decisões de negócio puras.     |
| `presentation` | Labels, formatação e adaptação de dados para exibição.           |
| `pages`        | Pontos de entrada das rotas do módulo.                           |

Configuração não deve ser usada como depósito genérico. Mapas que determinam força de cartas pertencem ao `model`; resolução de arquivos pertence a `assets`; cores e geometria da mesa pertencem à apresentação da sessão.

## Estrutura interna da sessão

`games/session/GameSessionPage.jsx` é o orquestrador da partida. Código novo não deve voltar a concentrar regras, efeitos ou componentes específicos nessa página:

| Pasta/arquivo                   | Responsabilidade                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `flow/`                         | Fluxo compartilhado da partida: lobby, snapshots, jogadores, timers e controles de sessão. |
| `sounds/`                       | Reprodução, seleção e ciclo de vida dos sons usados durante a sessão.                      |
| `animations/`                   | Componentes animados e detecção de eventos que disparam animações.                         |
| `classic/components/session/`   | UI de sessão exclusiva do Classic.                                                         |
| `classic/model/`                | Regras puras de cartas e turnos do Classic.                                                |
| `hell-hand/components/session/` | UI de sessão exclusiva do Hell Hand.                                                       |
| `hell-hand/model/`              | Regras puras de cartas de poder do Hell Hand.                                              |

Quando um comportamento for exclusivo de um jogo, ele deve ser implementado no módulo da variante e apenas composto pela sessão. `games/session` só deve conhecer ambas as variantes quando a coordenação entre elas for realmente necessária.
