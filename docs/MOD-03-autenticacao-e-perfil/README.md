# MOD 03 — Autenticação e perfil

**Status:** Planejado  
**User Stories:** 7  
**Produto:** Fodinha / Oh Hell Game V2  
**Fonte:** [PRD mestre](../../PRD-SEPARACAO-WEB-MOBILE.md)

## Objetivo

preservar identidade guest/Google em ambas as apresentações e alinhar o contrato atual do backend.

## Diretriz técnica do módulo

Centralizar autenticação e perfil no controller, nunca expor tokens em logs e manter renovação de sessão single-flight.

## Dependências

MOD 00 e contrato de autenticação do backend atualizado.

## User Stories

| ID | PRD |
|---|---|
| US 018 | [Cadastro e atualização Guest](./US-018-cadastro-e-atualizacao-guest.md) |
| US 019 | [Seleção de avatar Web](./US-019-selecao-de-avatar-web.md) |
| US 020 | [Seleção de avatar Mobile](./US-020-selecao-de-avatar-mobile.md) |
| US 021 | [Login Google](./US-021-login-google.md) |
| US 022 | [Renovação de sessão](./US-022-renovacao-de-sessao.md) |
| US 023 | [Gate de entrada na sala](./US-023-gate-de-entrada-na-sala.md) |
| US 024 | [Segurança de token](./US-024-seguranca-de-token.md) |

## Gate de conclusão do módulo

- [ ] Todas as User Stories do módulo atendem seus critérios e Definition of Done.
- [ ] A experiência é validada em Mobile e Desktop no mesmo site.
- [ ] Não existem efeitos ou regras duplicados entre as apresentações.
- [ ] Testes de regressão dos fluxos relacionados estão verdes.
- [ ] Métricas, acessibilidade, i18n e segurança foram revisadas.
