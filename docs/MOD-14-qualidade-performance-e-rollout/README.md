# MOD 14 — Qualidade, performance e rollout

**Status:** Planejado  
**User Stories:** 9  
**Produto:** Fodinha / Oh Hell Game V2  
**Fonte:** [PRD mestre](../../PRD-SEPARACAO-WEB-MOBILE.md)

## Objetivo

provar paridade e lançar sem interromper partidas.

## Diretriz técnica do módulo

Transformar o requisito em gate automatizado de qualidade, performance, acessibilidade ou rollout sempre que possível.

## Dependências

Transversal; acompanha todos os módulos e seus gates.

## User Stories

| ID | PRD |
|---|---|
| US 073 | [Testes unitários de domínio/frontend](./US-073-testes-unitarios-de-dominio-frontend.md) |
| US 074 | [Testes de integração dos controllers](./US-074-testes-de-integracao-dos-controllers.md) |
| US 075 | [E2E Web e Mobile](./US-075-e2e-web-e-mobile.md) |
| US 076 | [Lazy loading por rota e plataforma](./US-076-lazy-loading-por-rota-e-plataforma.md) |
| US 077 | [Otimização de mídia](./US-077-otimizacao-de-midia.md) |
| US 078 | [Acessibilidade e motion](./US-078-acessibilidade-e-motion.md) |
| US 079 | [CI de qualidade](./US-079-ci-de-qualidade.md) |
| US 080 | [Feature flag e rollout](./US-080-feature-flag-e-rollout.md) |
| US 081 | [Observabilidade de frontend](./US-081-observabilidade-de-frontend.md) |

## Gate de conclusão do módulo

- [ ] Todas as User Stories do módulo atendem seus critérios e Definition of Done.
- [ ] A experiência é validada em Mobile e Desktop no mesmo site.
- [ ] Não existem efeitos ou regras duplicados entre as apresentações.
- [ ] Testes de regressão dos fluxos relacionados estão verdes.
- [ ] Métricas, acessibilidade, i18n e segurança foram revisadas.
