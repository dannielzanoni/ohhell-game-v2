# MOD 08 — Rodada, vidas e fim de jogo

**Status:** Planejado  
**User Stories:** 4  
**Produto:** Fodinha / Oh Hell Game V2  
**Fonte:** [PRD mestre](../../PRD-SEPARACAO-WEB-MOBILE.md)

## Objetivo

comunicar transições importantes sem duplicar animação e regra.

## Diretriz técnica do módulo

Manter transições e filas de mensagens no controller compartilhado; animações são responsabilidade exclusiva da view.

## Dependências

MOD 07.

## User Stories

| ID | PRD |
|---|---|
| US 050 | [Fim de rodada](./US-050-fim-de-rodada.md) |
| US 051 | [Perda de vidas](./US-051-perda-de-vidas.md) |
| US 052 | [Resultado com vencedor](./US-052-resultado-com-vencedor.md) |
| US 053 | [Resultado sem vencedor](./US-053-resultado-sem-vencedor.md) |

## Gate de conclusão do módulo

- [ ] Todas as User Stories do módulo atendem seus critérios e Definition of Done.
- [ ] A experiência é validada em Mobile e Desktop no mesmo site.
- [ ] Não existem efeitos ou regras duplicados entre as apresentações.
- [ ] Testes de regressão dos fluxos relacionados estão verdes.
- [ ] Métricas, acessibilidade, i18n e segurança foram revisadas.
