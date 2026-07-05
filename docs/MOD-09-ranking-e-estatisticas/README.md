# MOD 09 — Ranking e estatísticas

**Status:** Planejado  
**User Stories:** 5  
**Produto:** Fodinha / Oh Hell Game V2  
**Fonte:** [PRD mestre](../../PRD-SEPARACAO-WEB-MOBILE.md)

## Objetivo

apresentar a mesma informação em densidades apropriadas.

## Diretriz técnica do módulo

Centralizar formatação, resolução de avatar/cartas e estados da consulta; evitar lógica duplicada entre cards e tabela.

## Dependências

MOD 00 e contratos de estatísticas.

## User Stories

| ID | PRD |
|---|---|
| US 054 | [Carregamento do ranking](./US-054-carregamento-do-ranking.md) |
| US 055 | [Tabela Web](./US-055-tabela-web.md) |
| US 056 | [Cards Mobile](./US-056-cards-mobile.md) |
| US 057 | [Avatar e carta favorita](./US-057-avatar-e-carta-favorita.md) |
| US 058 | [Minhas estatísticas](./US-058-minhas-estatisticas.md) |

## Gate de conclusão do módulo

- [ ] Todas as User Stories do módulo atendem seus critérios e Definition of Done.
- [ ] A experiência é validada em Mobile e Desktop no mesmo site.
- [ ] Não existem efeitos ou regras duplicados entre as apresentações.
- [ ] Testes de regressão dos fluxos relacionados estão verdes.
- [ ] Métricas, acessibilidade, i18n e segurança foram revisadas.
