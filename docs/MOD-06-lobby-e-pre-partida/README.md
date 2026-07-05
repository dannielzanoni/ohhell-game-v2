# MOD 06 — Lobby e pré-partida

**Status:** Planejado  
**User Stories:** 6  
**Produto:** Fodinha / Oh Hell Game V2  
**Fonte:** [PRD mestre](../../PRD-SEPARACAO-WEB-MOBILE.md)

## Objetivo

gerenciar entrada, presença, convite e ready antes do jogo.

## Diretriz técnica do módulo

Usar uma única sessão realtime, aplicar Snapshot como fonte de verdade e impedir sockets ou comandos duplicados.

## Dependências

MOD 00, MOD 03 e contrato HTTP/WebSocket do backend.

## User Stories

| ID | PRD |
|---|---|
| US 034 | [Snapshot inicial](./US-034-snapshot-inicial.md) |
| US 035 | [Presença de jogadores](./US-035-presenca-de-jogadores.md) |
| US 036 | [Ready](./US-036-ready.md) |
| US 037 | [Convite Web](./US-037-convite-web.md) |
| US 038 | [Convite Mobile](./US-038-convite-mobile.md) |
| US 039 | [Falha e reconexão no lobby](./US-039-falha-e-reconexao-no-lobby.md) |

## Gate de conclusão do módulo

- [ ] Todas as User Stories do módulo atendem seus critérios e Definition of Done.
- [ ] A experiência é validada em Mobile e Desktop no mesmo site.
- [ ] Não existem efeitos ou regras duplicados entre as apresentações.
- [ ] Testes de regressão dos fluxos relacionados estão verdes.
- [ ] Métricas, acessibilidade, i18n e segurança foram revisadas.
