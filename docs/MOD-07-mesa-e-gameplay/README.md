# MOD 07 — Mesa e gameplay

**Status:** Planejado  
**User Stories:** 10  
**Produto:** Fodinha / Oh Hell Game V2  
**Fonte:** [PRD mestre](../../PRD-SEPARACAO-WEB-MOBILE.md)

## Objetivo

criar mesas visualmente independentes sobre a mesma máquina de sessão.

## Diretriz técnica do módulo

Separar reducer, controller e view. A UI não interpreta mensagens WebSocket nem acessa timers, storage ou áudio diretamente.

## Dependências

MOD 00 e MOD 06.

## User Stories

| ID | PRD |
|---|---|
| US 040 | [Máquina de estado compartilhada](./US-040-maquina-de-estado-compartilhada.md) |
| US 041 | [Disposição da mesa Web](./US-041-disposicao-da-mesa-web.md) |
| US 042 | [Disposição da mesa Mobile](./US-042-disposicao-da-mesa-mobile.md) |
| US 043 | [Baralho, joker e pilha](./US-043-baralho-joker-e-pilha.md) |
| US 044 | [Mão do jogador Web](./US-044-mao-do-jogador-web.md) |
| US 045 | [Mão do jogador Mobile](./US-045-mao-do-jogador-mobile.md) |
| US 046 | [Bidding](./US-046-bidding.md) |
| US 047 | [Timer de ação](./US-047-timer-de-acao.md) |
| US 048 | [Áudio da partida](./US-048-audio-da-partida.md) |
| US 049 | [Erros de comando](./US-049-erros-de-comando.md) |

## Gate de conclusão do módulo

- [ ] Todas as User Stories do módulo atendem seus critérios e Definition of Done.
- [ ] A experiência é validada em Mobile e Desktop no mesmo site.
- [ ] Não existem efeitos ou regras duplicados entre as apresentações.
- [ ] Testes de regressão dos fluxos relacionados estão verdes.
- [ ] Métricas, acessibilidade, i18n e segurança foram revisadas.
