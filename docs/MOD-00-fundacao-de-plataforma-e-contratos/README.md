# MOD 00 — Fundação de plataforma e contratos

**Status:** Planejado  
**User Stories:** 7  
**Produto:** Fodinha / Oh Hell Game V2  
**Fonte:** [PRD mestre](../../PRD-SEPARACAO-WEB-MOBILE.md)

## Objetivo

criar a base que impede duplicação de regras entre Web e Mobile.

## Diretriz técnica do módulo

Manter domínio e casos de uso independentes de React e do navegador. Toda dependência externa deve entrar por uma porta testável.

## Dependências

Nenhuma; este módulo é a fundação dos demais.

## User Stories

| ID | PRD |
|---|---|
| US 001 | [Classificador de plataforma](./US-001-classificador-de-plataforma.md) |
| US 002 | [Controller compartilhado por feature](./US-002-controller-compartilhado-por-feature.md) |
| US 003 | [Adaptador de storage](./US-003-adaptador-de-storage.md) |
| US 004 | [Cliente HTTP compartilhado](./US-004-cliente-http-compartilhado.md) |
| US 005 | [Cliente realtime compartilhado](./US-005-cliente-realtime-compartilhado.md) |
| US 006 | [Contratos HTTP e WebSocket verificáveis](./US-006-contratos-http-e-websocket-verificaveis.md) |
| US 007 | [Catálogo de assets compartilhado](./US-007-catalogo-de-assets-compartilhado.md) |

## Gate de conclusão do módulo

- [ ] Todas as User Stories do módulo atendem seus critérios e Definition of Done.
- [ ] A experiência é validada em Mobile e Desktop no mesmo site.
- [ ] Não existem efeitos ou regras duplicados entre as apresentações.
- [ ] Testes de regressão dos fluxos relacionados estão verdes.
- [ ] Métricas, acessibilidade, i18n e segurança foram revisadas.
